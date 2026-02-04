'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Plus, Trash, Edit2, Edit, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { deleteMenu, deleteCategory, deleteMenuItem } from '@/app/actions/settings'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { CategoryDialog } from '@/components/private/category-dialog'
import { MenuItemDialog } from '@/components/private/menu-item-dialog'
import GroupedActions from '@/components/utility/grouped-actions'
import { ButtonGroup } from '@/components/ui/button-group'

interface MenuEditorProps {
  menu: any
  organizationId: string
}

export default function MenuEditor({ menu: initialMenu, organizationId }: MenuEditorProps) {
  const router = useRouter()
  const menu = initialMenu

  // State
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)

  // Use IDs to derive state so updates from router.refresh() are reflected
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)


  const handleDeleteMenu = async () => {
    if (confirm('Are you sure you want to delete this menu? This cannot be undone.')) {
      try {
        await deleteMenu(menu.id)
        toast.success('Menu deleted')
        router.push('/settings')
      } catch (error) {
        toast.error('Failed to delete menu')
      }
    }
  }

  // --- Category Handlers ---
  const openNewCategory = () => {
    setEditingCategory(null)
    setCategoryDialogOpen(true)
  }

  const openEditCategory = (cat: any) => {
    setEditingCategory(cat)
    setCategoryDialogOpen(true)
  }

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Delete this category and all its items?')) {
      try {
        await deleteCategory(menu.id, id)
        toast.success('Category deleted')
        router.refresh()
      } catch (e) { toast.error('Failed to delete category') }
    }
  }

  // --- Item Handlers ---
  const openNewItem = (categoryId: string) => {
    setEditingItemId(null)
    setActiveCategoryId(categoryId)
    setItemDialogOpen(true)
  }

  const openEditItem = (itemId: string, categoryId: string) => {
    setEditingItemId(itemId)
    setActiveCategoryId(categoryId)
    setItemDialogOpen(true)
  }

  const copyPublicLink = async (id: string) => {
    const url = `${window.location.origin}/m/${publicLocations[0].slug}/${menu.id}`
    navigator.clipboard.writeText(url)
    toast.success('Public link copied to clipboard')
  }

  // Derived state for editing item
  const categories = Array.isArray(menu.content) ? menu.content : []

  const editingItem = editingItemId
    ? categories.flatMap((c: any) => c.items || []).find((i: any) => i.id === editingItemId)
    : null

  const sortedCategories = [...categories].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))

  // Public Locations Logic
  const publicLocations = menu.menu_locations?.filter((ml: any) => ml.locations).map((ml: any) => ml.locations) || []

  const handleOpenPublicLink = () => {
    if (publicLocations.length === 0) {
      toast.error('Questo menu non è assegnato a nessuna sede')
    } else if (publicLocations.length === 1) {
      const url = `${window.location.origin}/m/${publicLocations[0].slug}/${menu.id}`
      window.open(url, '_blank')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 w-full border-b bg-background backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex py-2.5 max-w-screen-2xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild >
              <Link href="/manage-menus">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Indietro</span>
              </Link>
            </Button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  {menu.name}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground hidden sm:block">Gestisci il contenuto del menù</p>
            </div>
          </div>

          <GroupedActions
            items={[
              {
                label: 'Aggiungi categoria',
                icon: <Plus className="h-4 w-4" />,
                action: openNewCategory,
              },
              {
                label: 'Vedi menu pubblico',
                icon: <Globe className="h-4 w-4" />,
                action: handleOpenPublicLink,
              },
              {
                label: 'Elimina menù',
                icon: <Trash className="h-4 w-4 group-hover:text-red-500 dark:group-hover:text-white/80" />,
                variant: 'destructive',
                action: handleDeleteMenu,
              }
            ]}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {menu.pdf_url ? (
          <div className="flex flex-col h-full items-center justify-center">
            <div className="w-full h-[70vh] min-h-[70vh] border rounded-lg overflow-hidden bg-muted ">
              <iframe
                src={menu.pdf_url}
                title="PDF Preview"
                height={850}
                className='w-full'
              />
            </div>
          </div>
        ) : (
          <>
            {sortedCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-lg bg-muted/50">
                <p className="text-muted-foreground mb-4">Nessuna categoria per questo menù</p>
                <Button onClick={openNewCategory}>Aggiungi la prima categoria</Button>
              </div>
            ) : (
              <div className="grid gap-8">
                {sortedCategories.map((category: any) => (
                  <div key={category.id} className="space-y-4">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold tracking-tight">{category.name}</h3>
                        {!category.is_visible && <Badge variant="outline" className="text-xs">Hidden</Badge>}
                      </div>
                      <GroupedActions
                        side='bottom'
                        items={[
                          {
                            label: 'Modifica',
                            action: () => openEditCategory(category),
                            icon: <Edit className="h-3 w-3 mr-1" />,
                          },
                          {
                            label: 'Elimina',
                            action: () => handleDeleteCategory(category.id),
                            variant: 'destructive',
                            icon: <Trash className="h-3 w-3 mr-1 group-hover:text-red-500 dark:group-hover:text-white/80" />,
                          }
                        ]}
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {category.items?.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)).map((item: any) => (
                        <div
                          key={item.id}
                          className="group relative h-full min-h-[100px] flex flex-row overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-primary/40"
                          onClick={() => openEditItem(item.id, category.id)}
                        >
                          {/* Image Section */}
                          <div className="relative w-40 shrink-0 border-r bg-muted">
                            <Image
                              src={item.image_url || ''}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                            {!item.is_available && (
                              <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-[1px]">
                                <Badge variant="secondary" className="scale-75">Non Disponibile</Badge>
                              </div>
                            )}
                          </div>

                          {/* Content Section */}
                          <div className="flex flex-col flex-1 p-3 gap-2.5">
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="font-semibold leading-tight line-clamp-1" title={item.name}>{item.name}</h4>
                              <span className="font-medium text-sm whitespace-nowrap">€{item.price.toFixed(2)}</span>
                            </div>
                            {item.description && <p className="text-xs text-muted-foreground line-clamp-2" title={item.description}>{item.description}</p>}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => openNewItem(category.id)}
                        className="flex flex-col py-4 items-center justify-center rounded-lg border border-dashed hover:bg-accent/50 transition-colors gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="h-6 w-6" />
                        <span className="text-sm font-medium">Aggiungi articolo</span>
                      </button>
                    </div>
                    <Separator className="mt-8 opacity-50" />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {categories.length > 0 && (
        <div className="flex items-center justify-center mb-4">
          <Button variant="outline" size='sm' onClick={openNewCategory}>Aggiungi categoria</Button>
        </div>
      )}

      {/* Dialogs */}
      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        organizationId={organizationId}
        menuId={menu.id}
        category={editingCategory}
        onSuccess={router.refresh}
      />

      {activeCategoryId && (
        <MenuItemDialog
          open={itemDialogOpen}
          onOpenChange={setItemDialogOpen}
          organizationId={organizationId}
          menuId={menu.id}
          categoryId={activeCategoryId}
          item={editingItem}
          onSuccess={router.refresh}
        />
      )}
    </div>
  )
}
