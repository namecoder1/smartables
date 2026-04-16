'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import {
  createMenu,
  deleteMenu,
  updateMenu,
  assignMenuToLocations,
  updateMenuLocationAvailability,
} from '@/app/actions/menus'
import {
  trackStorageUpload,
  deleteStorageFileAndTrack,
} from '@/app/actions/storage'
import type { Menu } from '@/types/general'

type MenuDialogMode = 'create' | 'edit' | null

export interface MenuDialogState {
  mode: MenuDialogMode
  menuId: string | null
  name: string
  description: string
  isActive: boolean
  isPdf: boolean
  pdfFile: File | null
  pdfUrl: string
  startsAt: string
  endsAt: string
  isSpecial: boolean
}

const initialDialogState: MenuDialogState = {
  mode: null,
  menuId: null,
  name: '',
  description: '',
  isActive: true,
  isPdf: false,
  pdfFile: null,
  pdfUrl: '',
  startsAt: '',
  endsAt: '',
  isSpecial: false,
}

interface UseMenuDialogsParams {
  menus: Menu[]
  organizationId: string
  workingLocationId: string
  currentWorkingLocationName?: string
}

export function useMenuDialogs({
  menus,
  organizationId,
  workingLocationId,
  currentWorkingLocationName,
}: UseMenuDialogsParams) {
  const router = useRouter()

  // Menu create/edit dialog
  const [menuDialog, setMenuDialog] =
    useState<MenuDialogState>(initialDialogState)
  const [isSavingMenu, setIsSavingMenu] = useState(false)

  // Manage locations dialog
  const [managingMenuId, setManagingMenuId] = useState<string | null>(null)
  const [tempSelectedLocations, setTempSelectedLocations] = useState<string[]>(
    [],
  )
  const [tempDailySettings, setTempDailySettings] = useState<
    Record<string, { daily_from: string; daily_until: string }>
  >({})
  const [isSavingLocations, setIsSavingLocations] = useState(false)

  // Dialog helpers
  const openCreateDialog = () => {
    setMenuDialog({
      mode: 'create',
      menuId: null,
      name: '',
      description: '',
      isActive: true,
      isPdf: false,
      pdfFile: null,
      pdfUrl: '',
      startsAt: '',
      endsAt: '',
      isSpecial: false,
    })
  }

  const openEditDialog = (menu: Menu) => {
    setMenuDialog({
      mode: 'edit',
      menuId: menu.id,
      name: menu.name,
      description: menu.description || '',
      isActive: menu.is_active ?? true,
      isPdf: !!menu.pdf_url,
      pdfFile: null,
      pdfUrl: menu.pdf_url || '',
      startsAt: menu.starts_at
        ? new Date(menu.starts_at).toISOString().slice(0, 16)
        : '',
      endsAt: menu.ends_at
        ? new Date(menu.ends_at).toISOString().slice(0, 16)
        : '',
      isSpecial: !!(menu.starts_at || menu.ends_at),
    })
  }

  const closeMenuDialog = () => {
    setMenuDialog(initialDialogState)
  }

  const handleSaveMenu = async () => {
    if (!menuDialog.name.trim()) {
      toast.error('Il nome è obbligatorio')
      return
    }

    if (menuDialog.mode === 'create' && !workingLocationId) {
      toast.error('Seleziona una sede di lavoro prima di creare un menu')
      return
    }

    setIsSavingMenu(true)
    try {
      let finalPdfUrl: string | null = null
      const supabase = createClient()

      if (menuDialog.isPdf) {
        if (menuDialog.pdfFile) {
          const timestamp = Date.now()
          const cleanName = menuDialog.pdfFile.name.replace(
            /[^a-zA-Z0-9.]/g,
            '_',
          )
          const filePath = `${organizationId}/${timestamp}-${cleanName}`

          const { error: uploadError } = await supabase.storage
            .from('menu-files')
            .upload(filePath, menuDialog.pdfFile)

          if (uploadError) {
            console.error(uploadError)
            toast.error('Errore durante il caricamento del file')
            return
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from('menu-files').getPublicUrl(filePath)

          finalPdfUrl = publicUrl
          await trackStorageUpload(menuDialog.pdfFile.size)
        } else if (menuDialog.pdfUrl) {
          finalPdfUrl = menuDialog.pdfUrl
        } else if (menuDialog.mode === 'create') {
          toast.error('Carica un file PDF o inserisci un link')
          return
        } else {
          finalPdfUrl = menuDialog.pdfUrl || null
        }
      }

      if (menuDialog.mode === 'create') {
        await createMenu(organizationId, {
          name: menuDialog.name,
          description: menuDialog.description,
          pdf_url: finalPdfUrl || undefined,
          location_ids: [workingLocationId],
          is_active: menuDialog.isActive,
          starts_at: menuDialog.startsAt
            ? new Date(menuDialog.startsAt).toISOString()
            : null,
          ends_at: menuDialog.endsAt
            ? new Date(menuDialog.endsAt).toISOString()
            : null,
        })
        toast.success(`Menu creato per ${currentWorkingLocationName}`)
        router.refresh()
      } else if (menuDialog.mode === 'edit' && menuDialog.menuId) {
        const currentMenu = menus.find((m) => m.id === menuDialog.menuId)

        if (
          (!menuDialog.isPdf ||
            (menuDialog.isPdf && menuDialog.pdfFile)) &&
          currentMenu?.pdf_url
        ) {
          await deleteStorageFileAndTrack(currentMenu.pdf_url, 'menu-files')
        }

        await updateMenu(menuDialog.menuId, {
          name: menuDialog.name,
          description: menuDialog.description,
          pdf_url: finalPdfUrl,
          is_active: menuDialog.isActive,
          starts_at: menuDialog.startsAt
            ? new Date(menuDialog.startsAt).toISOString()
            : null,
          ends_at: menuDialog.endsAt
            ? new Date(menuDialog.endsAt).toISOString()
            : null,
        })
        toast.success('Menu aggiornato')
        router.refresh()
      }

      closeMenuDialog()
    } catch (error) {
      console.error(error)
      toast.error(
        menuDialog.mode === 'create'
          ? 'Errore durante la creazione del menu'
          : 'Errore aggiornamento menu',
      )
    } finally {
      setIsSavingMenu(false)
    }
  }

  const handleDeleteMenu = async (id: string) => {
    try {
      await deleteMenu(id)
      toast.success('Menu eliminato')
      router.refresh()
    } catch {
      toast.error("Errore durante l'eliminazione")
    }
  }

  const openManageLocations = (menu: Menu & { menu_locations?: Array<{ location_id: string; daily_from?: string; daily_until?: string }> }) => {
    const currentIds =
      menu.menu_locations?.map((ml) => ml.location_id) || []
    const dailyMap: Record<
      string,
      { daily_from: string; daily_until: string }
    > = {}
    menu.menu_locations?.forEach((ml) => {
      if (ml.daily_from || ml.daily_until) {
        dailyMap[ml.location_id] = {
          daily_from: ml.daily_from || '',
          daily_until: ml.daily_until || '',
        }
      }
    })
    setTempSelectedLocations(currentIds)
    setTempDailySettings(dailyMap)
    setManagingMenuId(menu.id)
  }

  const handleSaveLocations = async () => {
    if (!managingMenuId) return
    setIsSavingLocations(true)
    try {
      await assignMenuToLocations(managingMenuId, tempSelectedLocations)
      await Promise.all(
        tempSelectedLocations.map((locId) => {
          const settings = tempDailySettings[locId]
          return updateMenuLocationAvailability(
            managingMenuId,
            locId,
            settings?.daily_from || null,
            settings?.daily_until || null,
          )
        }),
      )
      toast.success('Disponibilità sedi aggiornata')
      setManagingMenuId(null)
    } catch {
      toast.error('Errore aggiornamento sedi')
    } finally {
      setIsSavingLocations(false)
    }
  }

  return {
    // Menu dialog
    menuDialog,
    setMenuDialog,
    isSavingMenu,
    openCreateDialog,
    openEditDialog,
    closeMenuDialog,
    handleSaveMenu,
    handleDeleteMenu,
    // Locations dialog
    managingMenuId,
    setManagingMenuId,
    tempSelectedLocations,
    setTempSelectedLocations,
    tempDailySettings,
    setTempDailySettings,
    isSavingLocations,
    openManageLocations,
    handleSaveLocations,
  }
}
