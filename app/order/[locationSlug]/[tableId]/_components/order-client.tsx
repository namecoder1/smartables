"use client";

import { PublicMenuView } from "@/app/order/[locationSlug]/[tableId]/public-menu-view";
import { CartSheet } from "@/app/order/[locationSlug]/[tableId]/cart-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { createOrder } from "@/app/actions/order-actions";
import { toast } from "sonner";
import { CircleQuestionMark, ShoppingCart } from "lucide-react";
import Image from "next/image";

type OrderData = {
  location: {
    id: string;
    organization_id: string;
    name: string;
    slug: string;
    active_menu_id: string | null;
    branding: {
      colors?: { primary?: string; secondary?: string };
      logo_url?: string | null;
    } | null;
  };
  table: { id: string; table_number: number };
  menus: {
    id: string;
    name: string;
    description?: string | null;
    pdf_url?: string | null;
    categories?: unknown[];
  }[];
  bookingName: string | null;
};

export function OrderClient({ location, table, menus, bookingName }: OrderData) {
  const branding = location.branding;
  const primaryColor = branding?.colors?.primary ?? "#3b82f6";
  const secondaryColor = branding?.colors?.secondary ?? "#a855f7";
  const logoUrl = branding?.logo_url ?? null;
  const brandingConfig = { primaryColor, secondaryColor, logoUrl };

  const defaultName =
    bookingName ||
    (typeof window !== "undefined"
      ? localStorage.getItem(`smartables-guest-${table.id}`)
      : null) ||
    `Tavolo ${table.table_number}`;

  const [guestName, setGuestName] = useState(defaultName);
  const [cart, setCart] = useState<
    { id: string; name: string; price: number; quantity: number; notes?: string }[]
  >([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<(typeof menus)[0] | null>(
    menus.length === 1 ? menus[0] : null,
  );

  useEffect(() => {
    localStorage.setItem(`smartables-guest-${table.id}`, guestName);
  }, [guestName, table.id]);

  const addToCart = (item: { id: string; name: string; price: number }, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [...prev, { ...item, quantity }];
    });
    toast.success("Aggiunto al carrello");
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.id === itemId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const placeOrder = async () => {
    if (!guestName) return;
    setIsOrdering(true);
    try {
      const result = await createOrder({
        organization_id: location.organization_id,
        location_id: location.id,
        table_id: table.id,
        guest_name: guestName,
        items: cart.map((i) => ({
          menu_item_id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          notes: i.notes ?? undefined,
        })),
      });

      if (!result.success) throw new Error(result.error);

      toast.success("Ordine inviato con successo!");
      setCart([]);
      setCartOpen(false);
    } catch (e) {
      toast.error("Errore nell'invio dell'ordine");
      console.error(e);
    } finally {
      setIsOrdering(false);
    }
  };

  if (!menus || menus.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-4" data-testid="no-menu-message">
        <CircleQuestionMark color={primaryColor} size={48} />
        <h1 className="text-2xl font-bold">Nessun menu attivo</h1>
        <p>Non c'è un menu attivo collegato a questa sede.</p>
      </div>
    );
  }

  if (!selectedMenu) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-slate-50 font-sans">
        <div
          className="relative w-full text-white pb-12 pt-16 px-6 overflow-hidden transition-all duration-700 ease-in-out"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          }}
        >
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none mix-blend-overlay" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-black/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-md mx-auto text-center space-y-6">
            {logoUrl && (
              <div className="mx-auto w-24 h-24 relative mb-4 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20 bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt={`${location.name} Logo`}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="space-y-2">
              {!logoUrl && (
                <div className="inline-block border border-white/20 px-3 py-1 rounded-full backdrop-blur-md bg-white/10 text-white/90 text-sm">
                  {location.name}
                </div>
              )}
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight drop-shadow-sm">
                Benvenuto
              </h1>
              <p className="text-white/80">Scegli un menu per iniziare</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md px-4 -mt-8 z-20 pb-20 space-y-4" data-testid="menu-selection">
          {menus.map((menu) => (
            <Card
              key={menu.id}
              data-testid={`menu-card-${menu.id}`}
              className="p-6 cursor-pointer hover:shadow-lg transition-all border-slate-100 hover:border-primary active:scale-[0.98] bg-white rounded-xl shadow-md"
              style={{ borderColor: "transparent" }}
              onClick={() => setSelectedMenu(menu)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{menu.name}</h3>
                  {menu.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 mt-1">{menu.description}</p>
                  )}
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ color: primaryColor, backgroundColor: `${primaryColor}15` }}
                >
                  <ShoppingCart className="w-5 h-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-slate-50">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm transition-all">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <div
            className="flex items-center gap-2 cursor-pointer flex-1"
            onClick={() => menus.length > 1 && setSelectedMenu(null)}
          >
            <Image
              src={logoUrl || ""}
              alt={`${location.name} Logo`}
              width={40}
              height={40}
              className="rounded-lg border-2"
            />
            <div>
              <h1 className="font-bold text-lg text-slate-800 leading-none">{location.name}</h1>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <span className="font-medium text-slate-700">{guestName}</span>
                <span className="opacity-50">•</span>
                <span>{selectedMenu.name}</span>
              </p>
            </div>
          </div>

          {!selectedMenu.pdf_url && (
            <div
              data-testid="cart-open-button"
              className="w-9 h-9 rounded-full flex relative items-center justify-center bg-slate-100 text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="w-4 h-4" />
              {cart.length > 0 && (
                <span className="absolute -top-0.5 -right-1.5 w-4 h-4 bg-red-500 border-2 border-white rounded-full" />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-6 max-w-3xl mx-auto">
        <PublicMenuView
          menu={selectedMenu}
          cart={cart}
          onAddToCart={addToCart}
          primaryColor={primaryColor}
        />
      </div>

      {cart.length > 0 && !selectedMenu.pdf_url && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl z-50 animate-in slide-in-from-bottom-4 duration-500 ease-out">
          <Button
            size="lg"
            data-testid="view-order-button"
            className="w-full h-16 rounded-4xl shadow-2xl shadow-slate-900/20 flex items-center justify-between px-6 text-base font-bold text-white transition-transform active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            }}
            onClick={() => setCartOpen(true)}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 px-3 py-1.5 rounded-xl text-sm backdrop-blur-sm font-mono">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </div>
              <span className="tracking-wide">Vedi Ordine</span>
            </div>
            <span className="font-mono text-lg">
              €{cart.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)}
            </span>
          </Button>
        </div>
      )}

      <CartSheet
        items={cart}
        open={cartOpen}
        onOpenChange={setCartOpen}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onPlaceOrder={placeOrder}
        isOrdering={isOrdering}
        branding={brandingConfig}
      />
    </div>
  );
}
