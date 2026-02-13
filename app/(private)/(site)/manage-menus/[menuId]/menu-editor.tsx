'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Plus, Trash, Edit, Globe, MoreVertical, GripVertical } from 'lucide-react'
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
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 w-full border-b bg-[#fffaef] dark:bg-[#1a1813]">
        <div className=" flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="-ml-2 text-muted-foreground hover:text-foreground">
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
            <Button variant="outline" size="sm" onClick={handleOpenPublicLink} className="hidden sm:flex">
              <Globe className="w-4 h-4 mr-2" />
              Dettagli Pubblici
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenPublicLink} className="sm:hidden">
                  <Globe className="w-4 h-4 mr-2" />
                  Vedi Pubblico
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteMenu} className="text-red-600 focus:text-red-600">
                  <Trash className="w-4 h-4 mr-2" />
                  Elimina Menu
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="sm" onClick={openNewCategory}>
              <Plus className="w-4 h-4 mr-2" />
              Categoria
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1  p-4 md:p-8 space-y-8">
        {menu.pdf_url ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="bg-white p-8 rounded-xl border shadow-sm text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Menu PDF</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Questo è un menu basato su file PDF. Non puoi modificare le singole voci qui.
              </p>
              <Button asChild variant="outline" className="w-full">
                <a href={menu.pdf_url} target="_blank" rel="noopener noreferrer">Apri PDF Originale</a>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {sortedCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-white text-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Menu Vuoto</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Inizia aggiungendo la tua prima categoria di prodotti (es. Antipasti, Primi, Drink).
                </p>
                <Button onClick={openNewCategory}>Aggiungi Categoria</Button>
              </div>
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
                          className="group relative flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer overflow-hidden"
                          onClick={() => openEditItem(item.id, category.id)}
                        >
                          {/* Image Aspect Ratio Container 16:9 or 4:3 */}
                          <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <div className="text-center">
                                  <span className="text-4xl">🍽️</span>
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
                            <h4 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                              {item.name}
                            </h4>
                            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                              {item.description || <span className="italic text-slate-300">Nessuna descrizione</span>}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Add Item Button (Card Style) */}
                      <button
                        onClick={() => openNewItem(category.id)}
                        className="flex flex-col items-center justify-center min-h-[250px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-100/80 hover:border-slate-300 transition-all gap-3 group"
                      >
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                          <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-500 group-hover:text-slate-700">Aggiungi Piatto</span>
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
    </div>
  )
}
