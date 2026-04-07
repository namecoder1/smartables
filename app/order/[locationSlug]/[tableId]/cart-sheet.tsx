"use client";

import { useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { ShoppingCart, Minus, Plus, Trash2, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CartItem {
  id: string; // menu item id
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  image_url?: string;
  menuItem?: any;
}

interface CartSheetProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onPlaceOrder: () => void;
  isOrdering: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branding?: { primaryColor: string; secondaryColor: string; logoUrl: string | null };
}

export function CartSheet({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  isOrdering,
  open,
  onOpenChange,
  branding
}: CartSheetProps) {

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [items]);

  const primaryColor = branding?.primaryColor || "#000000";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-w-3xl mx-auto h-[85vh] md:h-[50vh] flex flex-col rounded-[20px] mb-4 p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <SheetTitle className="text-xl font-bold text-slate-900">Il tuo ordine</SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 max-h-[280px] bg-slate-50/50">
          <div className="px-5 py-6 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4" data-testid="cart-empty">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                  <ShoppingCart className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Il carrello è vuoto</h3>
                <p className="text-slate-500 max-w-[200px]">Aggiungi dei piatti deliziosi dal menu per iniziare il tuo ordine.</p>
                <Button
                  variant="outline"
                  className="mt-4 border-slate-200 text-slate-700"
                  onClick={() => onOpenChange(false)}
                >
                  Torna al Menu
                </Button>
              </div>
            ) : (
              items.map(item => (
                <div
                  key={item.id}
                  data-testid={`cart-item-${item.id}`}
                  className="group bg-white rounded-2xl p-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 flex gap-4 transition-all hover:shadow-md"
                >
                  {/* Image Thumbnail (if available) */}
                  {item.image_url ? (
                    <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-100">
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 shrink-0 rounded-xl bg-slate-50 flex items-center justify-center p-2 text-center text-[10px] text-slate-300 font-medium uppercase leading-tight border border-slate-100">
                      No Img
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between py-1 min-h-[96px]">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">{item.name}</h4>
                        <span className="font-semibold text-slate-900 text-sm whitespace-nowrap">
                          €{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">€{item.price.toFixed(2)} cad.</p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Trash / Controls */}
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`cart-remove-${item.id}`}
                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full -ml-2"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>

                      {/* Quantity Stepper */}
                      <div className="flex items-center bg-slate-100 rounded-full p-1 h-9 shadow-inner">
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`cart-minus-${item.id}`}
                          className="h-7 w-7 rounded-full bg-white shadow-sm hover:shadow text-slate-700 active:scale-90 transition-all"
                          onClick={() => {
                            if (item.quantity === 1) onRemoveItem(item.id);
                            else onUpdateQuantity(item.id, -1);
                          }}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span data-testid={`cart-qty-${item.id}`} className="w-8 text-center text-sm font-bold text-slate-800 tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`cart-plus-${item.id}`}
                          className="h-7 w-7 rounded-full text-white shadow-sm hover:opacity-90 active:scale-90 transition-all"
                          style={{ backgroundColor: primaryColor }}
                          onClick={() => onUpdateQuantity(item.id, 1)}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Spacing for footer */}
            <div className="h-4" />
          </div>
        </ScrollArea>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 bg-white border-t border-slate-100 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)] z-20">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Totale ({items.reduce((acc, i) => acc + i.quantity, 0)} articoli)</span>
                <span data-testid="cart-total" className="text-xl font-bold text-slate-900">€{total.toFixed(2)}</span>
              </div>

              <Button
                data-testid="cart-place-order"
                className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-slate-200 active:scale-[0.98] transition-all"
                onClick={onPlaceOrder}
                disabled={isOrdering}
                style={{ backgroundColor: primaryColor }}
              >
                {isOrdering ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Invio ordine...
                  </span>
                ) : (
                  'Conferma Ordine'
                )}
              </Button>
              <p className="text-[10px] text-center text-slate-400 font-medium">
                Il pagamento avverrà alla cassa
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
