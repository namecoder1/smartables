'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { trackStorageUpload, deleteStorageFileAndTrack } from '@/app/actions/storage'
import { createPromotion, updatePromotion, deletePromotion } from '../../actions'
import type { Promotion, Menu, MenuCategory, PromotionType } from '@/types/general'
import type { EditableItem } from './promotion-types'

interface UsePromotionFormParams {
  promotion: Promotion | null
  menus: Menu[]
  organizationId: string
  isNew: boolean
}

export function usePromotionForm({
  promotion,
  menus,
  organizationId,
  isNew,
}: UsePromotionFormParams) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [name, setName] = useState(promotion?.name || '')
  const [description, setDescription] = useState(promotion?.description || '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    promotion?.image_url || null,
  )
  const [type, setType] = useState<PromotionType>(
    promotion?.type || 'percentage',
  )
  const [value, setValue] = useState<number | undefined>(
    promotion?.value ?? undefined,
  )
  const [allLocations, setAllLocations] = useState(
    promotion?.all_locations ?? true,
  )
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>(
    promotion?.target_location_ids || [],
  )
  const [allMenus, setAllMenus] = useState(promotion?.all_menus ?? true)
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>(
    promotion?.target_menu_ids || [],
  )
  const [startsAt, setStartsAt] = useState<Date | undefined>(
    promotion?.starts_at ? new Date(promotion.starts_at) : undefined,
  )
  const [endsAt, setEndsAt] = useState<Date | undefined>(
    promotion?.ends_at ? new Date(promotion.ends_at) : undefined,
  )
  const [visitThreshold, setVisitThreshold] = useState<number | undefined>(
    promotion?.visit_threshold ?? undefined,
  )
  const [isActive, setIsActive] = useState(promotion?.is_active ?? true)
  const [priority, setPriority] = useState<number | undefined>(
    promotion?.priority ?? 0,
  )
  const [stackable, setStackable] = useState(promotion?.stackable ?? false)
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(
    promotion?.notify_via_whatsapp ?? false,
  )

  const allCategories = useMemo(() => {
    const cats: { id: string; name: string; menuName: string }[] = []
    menus.forEach((menu) => {
      const content = (menu.content || []) as MenuCategory[]
      content.forEach((cat) => {
        cats.push({ id: cat.id, name: cat.name, menuName: menu.name })
      })
    })
    return cats
  }, [menus])

  const allMenuItems = useMemo(() => {
    const items: {
      id: string
      name: string
      price: number
      categoryName: string
      menuName: string
    }[] = []
    menus.forEach((menu) => {
      const content = (menu.content || []) as MenuCategory[]
      content.forEach((cat) => {
        ;(cat.items || []).forEach((item) => {
          items.push({
            id: item.id,
            name: item.name,
            price: item.price,
            categoryName: cat.name,
            menuName: menu.name,
          })
        })
      })
    })
    return items
  }, [menus])

  const [items, setItems] = useState<EditableItem[]>(
    (promotion as Promotion & { promotion_items?: EditableItem[] })?.promotion_items?.map(
      (item) => ({
        _key: item._key || crypto.randomUUID(),
        target_type: item.target_type,
        target_ref: item.target_ref,
        role: item.role,
        override_value: item.override_value,
        override_type: item.override_type,
      }),
    ) || [],
  )

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        _key: crypto.randomUUID(),
        target_type: 'menu_item' as const,
        target_ref: '',
        role: 'target' as const,
        override_value: null,
        override_type: null,
      },
    ])
  }

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((i) => i._key !== key))
  }

  const updateItem = (key: string, field: string, val: unknown) => {
    setItems((prev) =>
      prev.map((i) => (i._key === key ? { ...i, [field]: val } : i)),
    )
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Il nome della promozione è obbligatorio')
      return
    }

    setSaving(true)
    try {
      let finalImageUrl: string | null = promotion?.image_url || null
      const supabase = createClient()

      if (imageFile) {
        const timestamp = Date.now()
        const cleanName = imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')
        const filePath = `${organizationId}/${timestamp}-${cleanName}`

        const { error: uploadError } = await supabase.storage
          .from('promotion-images')
          .upload(filePath, imageFile)

        if (uploadError) {
          console.error(uploadError)
          toast.error("Errore durante il caricamento dell'immagine")
          setSaving(false)
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('promotion-images').getPublicUrl(filePath)

        finalImageUrl = publicUrl
        await trackStorageUpload(imageFile.size)

        if (promotion?.image_url) {
          await deleteStorageFileAndTrack(promotion.image_url, 'promotion-images')
        }
      } else if (!imagePreview && promotion?.image_url) {
        await deleteStorageFileAndTrack(promotion.image_url, 'promotion-images')
        finalImageUrl = null
      }

      const payload = {
        name,
        description: description || undefined,
        image_url: finalImageUrl,
        type,
        value: value ?? null,
        all_locations: allLocations,
        all_menus: allMenus,
        starts_at: startsAt ? startsAt.toISOString() : null,
        ends_at: endsAt ? endsAt.toISOString() : null,
        visit_threshold: visitThreshold ?? null,
        is_active: isActive,
        priority: priority ?? 0,
        stackable,
        notify_via_whatsapp: notifyWhatsapp,
        location_ids: allLocations ? [] : selectedLocationIds,
        menu_ids: allMenus ? [] : selectedMenuIds,
        items: items.map(({ _key, ...rest }) => ({
          ...rest,
          target_ref: rest.target_ref || null,
        })),
      }

      if (isNew) {
        const result = await createPromotion(organizationId, payload)
        if (!result.success) {
          toast.error(result.error)
          return
        }
      } else {
        const result = await updatePromotion(promotion!.id, payload)
        if (!result.success) {
          toast.error(result.error)
          return
        }
      }

      toast.success(
        isNew ? 'Promozione creata con successo!' : 'Promozione aggiornata',
      )
      router.push('/promotions')
      router.refresh()
    } catch {
      toast.error('Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!promotion) return
    setDeleting(true)
    try {
      const result = await deletePromotion(promotion.id)
      if (!result.success) {
        toast.error("Errore nell'eliminazione")
      } else {
        toast.success('Promozione eliminata')
        router.push('/promotions')
        router.refresh()
      }
    } catch {
      toast.error("Errore nell'eliminazione")
    } finally {
      setDeleting(false)
    }
  }

  return {
    // Router (for direct navigation in the component)
    router,
    // Form state
    name, setName,
    description, setDescription,
    imageFile, setImageFile,
    imagePreview, setImagePreview,
    type, setType,
    value, setValue,
    allLocations, setAllLocations,
    selectedLocationIds, setSelectedLocationIds,
    allMenus, setAllMenus,
    selectedMenuIds, setSelectedMenuIds,
    startsAt, setStartsAt,
    endsAt, setEndsAt,
    visitThreshold, setVisitThreshold,
    isActive, setIsActive,
    priority, setPriority,
    stackable, setStackable,
    notifyWhatsapp, setNotifyWhatsapp,
    // Items
    items,
    addItem,
    removeItem,
    updateItem,
    // Computed
    allCategories,
    allMenuItems,
    // Actions
    saving,
    deleting,
    handleSave,
    handleDelete,
  }
}
