'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Plus, Trash, Edit, Globe, MoreVertical, GripVertical, UtensilsCrossed } from 'lucide-react'
import { toast } from 'sonner'
import { deleteMenu, deleteCategory } from '@/app/actions/settings'
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
import NoItems from '@/components/utility/no-items'
import ConfirmDialog from '@/components/utility/confirm-dialog'

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

  // Delete Dialog States
  const [deleteMenuOpen, setDeleteMenuOpen] = useState(false)
  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)

  const handleDeleteMenu = () => {
    setDeleteMenuOpen(true)
  }

  const onConfirmDeleteMenu = async () => {
    try {
      await deleteMenu(menu.id)
      toast.success('Menu deleted')
      router.push('/settings')
    } catch (error) {
      toast.error('Failed to delete menu')
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

  const handleDeleteCategory = (id: string) => {
    setCategoryToDelete(id)
    setDeleteCategoryOpen(true)
  }

  const onConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return
    try {
      await deleteCategory(menu.id, categoryToDelete)
      toast.success('Category deleted')
      router.refresh()
    } catch (e) { toast.error('Failed to delete category') }
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
      const url = `${window.location.origin}/m/${publicLocations[0].slug}`
      window.open(url, '_blank')
    }
  }

  return (
    <div className={`flex flex-col ${menu.pdf_url ? 'h-[calc(100vh-100px)]' : 'min-h-screen'}`}>
      {/* Header */}
      <div className="sticky top-0 z-30 w-full border-b bg-card dark:bg-[#1a1813]">
        <div className=" flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/manage-menus">
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Indietro</span>
              </Link>
            </Button>
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold flex items-center gap-2">
                {menu.name}
              </h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={menu.is_active ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                  {menu.is_active ? 'Attivo' : 'Bozza'}
                </span>
                <span>•</span>
                <span>{categories.length} Categorie</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <GroupedActions
              side='bottom'
              items={[
                {
                  label: 'Guarda',
                  icon: <Globe />,
                  action: handleOpenPublicLink
                },
                {
                  label: 'Elimina Menu',
                  icon: <Trash className='group-hover:text-red-500 dark:group-hover:text-white/80' />,
                  action: handleDeleteMenu,
                  variant: 'destructive'
                }
              ]}
            />

            <Button size="sm" onClick={openNewCategory}>
              <Plus className="w-4 h-4" />
              Categoria
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${menu.pdf_url ? 'overflow-hidden' : 'p-4 md:p-8 space-y-8'}`}>
        {menu.pdf_url ? (
          <iframe
            src={`${menu.pdf_url}#view=FitH`}
            className="w-full h-full border-0 bg-transparent block"
            title="Menu PDF"
          />
        ) : (
          <>
            {sortedCategories.length === 0 ? (
              <NoItems
                title="Menu Vuoto"
                description="Inizia aggiungendo la tua prima categoria di prodotti (es. Antipasti, Primi, Drink)."
                icon={<Plus className="w-8 h-8" />}
                button={<Button onClick={openNewCategory}>
                  <Plus className="w-4 h-4" />
                  Aggiungi Categoria
                </Button>}
              />
            ) : (
              <div className="space-y-10">
                {sortedCategories.map((category: any) => (
                  <div key={category.id} className="space-y-4">
                    {/* Category Header */}
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold tracking-tight">{category.name}</h3>
                          {category.description && <p className="text-sm">{category.description}</p>}
                        </div>
                        {!category.is_visible && (
                          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-100">Nascondi</Badge>
                        )}
                      </div>

                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => openEditCategory(category)} className="h-8 w-8 p-0">
                          <Edit className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)} className="h-8 w-8 p-0 hover:text-red-600">
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.items?.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)).map((item: any) => (
                        <div
                          key={item.id}
                          className="group relative flex flex-col bg-card rounded-xl border-2 shadow-sm hover:shadow-md hover:border-input transition-all cursor-pointer overflow-hidden"
                          onClick={() => openEditItem(item.id, category.id)}
                        >
                          {/* Image Aspect Ratio Container 16:9 or 4:3 */}
                          <div className="relative aspect-4/3 h-40 w-full bg-card border-b overflow-hidden">
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                  <span className="text-4xl"><UtensilsCrossed /></span>
                                </div>
                              </div>
                            )}

                            {!item.is_available && (
                              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                                <Badge variant="secondary" className="font-semibold">Non Disponibile</Badge>
                              </div>
                            )}

                            {/* Price Tag Overlay */}
                            <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur shadow-sm px-2 py-1 rounded-md text-sm font-semibold text-slate-900 border border-black/5">
                              € {item.price.toFixed(2)}
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col gap-1">
                            <h4 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                              {item.name}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                              {item.description || <span className="italic text-slate-300">Nessuna descrizione</span>}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Add Item Button (Card Style) */}
                      <button
                        onClick={() => openNewItem(category.id)}
                        className="flex flex-col items-center justify-center min-h-[250px] bg-card border-2 border-dashed border-border rounded-xl hover:bg-input/30 hover:border-border transition-all gap-3 group"
                      >
                        <div className="w-12 h-12 bg-background/20 rounded-full flex items-center justify-center shadow-sm border border-border group-hover:scale-110 transition-transform">
                          <Plus className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground">Aggiungi Piatto</span>
                      </button>
                    </div>
                    {/* <Separator className="my-8 opacity-50" /> */}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {
        categories.length > 0 && !menu.pdf_url && (
          <div className="sticky bottom-6 left-0 right-0 flex justify-center pointer-events-none z-20">
            <Button size='lg' onClick={openNewCategory} className="pointer-events-auto shadow-lg shadow-blue-900/10 rounded-full px-6">
              <Plus className="w-5 h-5 mr-2" />
              Nuova Categoria
            </Button>
          </div>
        )
      }

      {/* Dialogs */}
      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        organizationId={organizationId}
        menuId={menu.id}
        category={editingCategory}
        onSuccess={router.refresh}
      />

      {
        activeCategoryId && (
          <MenuItemDialog
            open={itemDialogOpen}
            onOpenChange={setItemDialogOpen}
            organizationId={organizationId}
            menuId={menu.id}
            categoryId={activeCategoryId}
            item={editingItem}
            onSuccess={router.refresh}
          />
        )
      }

      <ConfirmDialog
        open={deleteMenuOpen}
        onOpenChange={setDeleteMenuOpen}
        title="Elimina Menu"
        description="Sei sicuro di voler eliminare questo menu? Questa azione non può essere annullata."
        confirmLabel="Elimina Menu"
        cancelLabel="Annulla"
        onConfirm={onConfirmDeleteMenu}
        variant="destructive"
      />

      <ConfirmDialog
        open={deleteCategoryOpen}
        onOpenChange={setDeleteCategoryOpen}
        title="Elimina Categoria"
        description="Sei sicuro di voler eliminare questa categoria e tutti i suoi piatti?"
        confirmLabel="Elimina Categoria"
        cancelLabel="Annulla"
        onConfirm={onConfirmDeleteCategory}
        variant="destructive"
      />
    </div>
  )
}
