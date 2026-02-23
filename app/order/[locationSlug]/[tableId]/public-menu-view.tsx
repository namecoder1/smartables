"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

import { ResponsiveDialog } from '@/components/utility/responsive-dialog';

interface PublicMenuViewProps {
  menu: any; // Type this properly
  cart: any[];
  onAddToCart: (item: any, quantity: number, notes?: string) => void;
  primaryColor?: string;
}

export function PublicMenuView({ menu, cart, onAddToCart, primaryColor = "#3b82f6" }: PublicMenuViewProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(
    menu.content?.[0]?.id || null
  );

  const [scrollPosition, setScrollPosition] = useState(0);

  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const categories = menu.content || [];

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (menu.type === 'pdf' || menu.pdf_url) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 pb-20 pt-4">
        <div className="text-center space-y-2 px-4">
          <h2 className="text-2xl font-bold text-slate-900">{menu.name}</h2>
          <p className="text-sm text-slate-500">Sfoglia il nostro menu in formato digitale.</p>
        </div>

        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
          <iframe
            src={`${menu.pdf_url}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full flex-1 border-0"
            title={`Menu ${menu.name}`}
            style={{ backgroundColor: '#f8fafc' }}
          />
        </div>

        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-center max-w-md mx-4 mt-6">
          <p className="text-slate-600 font-medium">Hai scelto cosa ordinare?</p>
          <p className="text-sm text-slate-500 mt-1">Attendi o chiama un membro dello staff al tuo tavolo per prendere la tua ordinazione.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Category Tabs */}
      <div className={`sticky top-[60px] ${scrollPosition > 20 ? 'rounded-b-2xl' : 'rounded-2xl'} px-2 z-30 bg-white backdrop-blur-md border-b border-slate-200/50 py-3  mb-6 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar`}>
        {categories.map((cat: any) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveCategory(cat.id);
              // Offset for the sticky header + sticky tabs
              const element = document.getElementById(`cat-${cat.id}`);
              if (element) {
                const headerOffset = 140; // Approx header + tabs height
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.scrollY - headerOffset;
                window.scrollTo({
                  top: offsetPosition,
                  behavior: "smooth"
                });
              }
            }}
            className={
              `whitespace-nowrap h-8 px-4 text-xs font-medium transition-all duration-300 ${activeCategory === cat.id
                ? 'shadow-md shadow-slate-200'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`
            }
            style={activeCategory === cat.id ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Menu Items */}
      <div className="space-y-10">
        {categories.map((cat: any) => (
          <div key={cat.id} id={`cat-${cat.id}`} className="space-y-4 scroll-mt-36">
            <div className="flex items-baseline justify-between border-b border-slate-200 pb-2 mb-4">
              <h2 className="text-xl font-bold text-slate-900">{cat.name}</h2>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{cat.items?.length || 0} Prodotti</span>
            </div>

            {cat.description && <p className="text-slate-500 text-sm -mt-2 mb-4 leading-relaxed">{cat.description}</p>}

            {cat.items?.length === 0 ? (
              <p className="text-slate-400 text-sm italic py-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                Nessun prodotto disponibile in questa categoria.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {cat.items?.map((item: any) => (
                  <MenuItemCard
                    cartQuantity={cart.find((i: any) => i.id === item.id)?.quantity || 0}
                    key={item.id}
                    item={item}
                    onAdd={onAddToCart}
                    primaryColor={primaryColor}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <ResponsiveDialog
        isOpen={!!selectedItem}
        setIsOpen={(open) => !open && setSelectedItem(null)}
        title={selectedItem?.name || ""}
      >
        <div className="space-y-4">
          {selectedItem?.image_url && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-100">
              <Image
                src={selectedItem.image_url}
                alt={selectedItem.name}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xl font-bold text-slate-900">€{selectedItem?.price.toFixed(2)}</p>
            <p className="text-slate-600 text-sm leading-relaxed">
              {selectedItem?.description || "Nessuna descrizione disponibile."}
            </p>
          </div>

          <Button
            className="w-full text-white font-bold h-12 rounded-xl mt-4"
            style={{ backgroundColor: primaryColor }}
            onClick={() => {
              if (selectedItem) {
                onAddToCart(selectedItem, 1);
                setSelectedItem(null);
              }
            }}
          >
            Aggiungi all'ordine
          </Button>
        </div>
      </ResponsiveDialog>
    </div>
  );
}

function MenuItemCard({ item, cartQuantity, onAdd, primaryColor, onClick }: {
  item: any;
  cartQuantity: number;
  onAdd: (item: any, q: number) => void;
  primaryColor: string;
  onClick: () => void
}) {
  return (
    <div
      className={`group relative flex overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition-all active:scale-[0.99] cursor-pointer hover:shadow-md ${cartQuantity > 0 ? 'ring-2 ring-opacity-50' : ''}`}
      style={cartQuantity > 0 ? { borderColor: primaryColor, boxShadow: `0 0 0 1px ${primaryColor}20` } : {}}
      onClick={onClick}
    >
      {cartQuantity > 0 && (
        <div
          className="absolute top-3 left-3 z-10 px-2 py-1 rounded-full text-xs font-bold text-white shadow-sm"
          style={{ backgroundColor: primaryColor }}
        >
          {cartQuantity}x
        </div>
      )}

      <div className="absolute top-3 right-3 z-10">
        <Button
          size="icon"
          className="h-8 w-8 rounded-full shadow-lg transition-transform active:scale-90"
          style={{ backgroundColor: 'white', color: primaryColor }}
          onClick={(e) => {
            e.stopPropagation();
            onAdd(item, 1);
          }}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Image Section */}
      {item.image_url ? (
        <div className="w-32 sm:w-40 shrink-0 relative bg-slate-100">
          <Image src={item.image_url} alt={item.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
      ) : (
        <div className="w-0" /> /* No image layout */
      )}

      {/* Content Section */}
      <div className="flex-1 p-4 flex flex-col min-h-[120px]">
        <div className="flex-1">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-bold text-slate-900 leading-tight pr-8">{item.name}</h3>
          </div>
          <p className="font-semibold text-slate-800 text-sm mb-2">€{item.price.toFixed(2)}</p>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
        </div>
      </div>
    </div>
  );
}
