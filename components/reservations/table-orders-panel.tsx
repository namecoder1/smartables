"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Order, OrderItem, OrderStatus, OrderItemStatus } from '@/types/general';
import { format } from 'date-fns';
import { Loader2, Search, Plus, Minus, Send, X, ShoppingCart, UtensilsCrossed, ReceiptEuro, Clock, ArrowLeft, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { getActiveMenus } from '@/app/actions/order-actions';
import Image from 'next/image';
import { useLocationStore } from '@/store/location-store';

interface TableOrdersPanelProps {
  tableId: string;
  tableName: string;
  locationId: string;
  refreshTrigger: number;
  guestCount: number;
  initialMode?: 'view' | 'add';
  onOrderSubmit?: () => void;
}

export function TableOrdersPanel({ tableId, tableName, locationId, refreshTrigger, guestCount, initialMode = 'view', onOrderSubmit }: TableOrdersPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { getSelectedLocation } = useLocationStore()
  const location = getSelectedLocation();

  // Quick Add State
  const [isAdding, setIsAdding] = useState(initialMode === 'add');
  const [availableMenus, setAvailableMenus] = useState<any[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<any | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Tutti');
  const [draftItems, setDraftItems] = useState<any[]>([]); // Items to add
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMenuSelection, setShowMenuSelection] = useState(false);

  const supabase = createClient();

  // Fetch Orders
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { getTableOrders } = await import('@/app/actions/order-actions');
        const data = await getTableOrders(tableId);
        setOrders(data as any);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [tableId, refreshTrigger, isAdding]);

  // Fetch Menus on Open Add
  useEffect(() => {
    if (!isAdding || availableMenus.length > 0) return;

    const fetchMenus = async () => {
      setLoadingMenu(true);
      try {
        const menus = await getActiveMenus(locationId);

        if (!menus || menus.length === 0) {
          toast.error("Nessun menu attivo");
          setLoadingMenu(false);
          return;
        }

        setAvailableMenus(menus);

        // If only one menu, auto-select it
        if (menus.length === 1) {
          setSelectedMenu(menus[0]);
          processMenuContent(menus[0]);
        } else {
          setShowMenuSelection(true);
        }
      } catch (e) {
        console.error(e);
        toast.error("Errore caricamento menu");
      } finally {
        setLoadingMenu(false);
      }
    };
    fetchMenus();
  }, [isAdding, locationId, availableMenus.length]);

  const processMenuContent = (menu: any) => {
    if (menu?.content) {
      // Flatten items for search
      const allItems: any[] = [];
      menu.content.forEach((cat: any) => {
        if (cat.items) {
          cat.items.forEach((item: any) => {
            allItems.push({ ...item, categoryName: cat.name });
          });
        }
      });
      setMenuItems(allItems);
      setActiveCategory('Tutti');
    }
  };

  const handleMenuSelect = (menu: any) => {
    setSelectedMenu(menu);
    processMenuContent(menu);
    setShowMenuSelection(false);
  };

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map(item => item.categoryName));
    return ['Tutti', ...Array.from(cats)];
  }, [menuItems]);

  // Filter Items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'Tutti' || item.categoryName === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, activeCategory]);

  const addToDraft = (item: any) => {
    setDraftItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1, notes: '' }];
    });
  };

  const addCustomItemToDraft = () => {
    const customId = `custom-${Date.now()}`;
    setDraftItems(prev => [
      ...prev,
      {
        id: customId,
        name: 'Prodotto personalizzato',
        price: 0,
        quantity: 1,
        notes: '',
        isCustom: true
      }
    ]);
  };

  const updateDraftItem = (itemId: string, field: string, value: any) => {
    setDraftItems(prev => prev.map(i => i.id === itemId ? { ...i, [field]: value } : i));
  };

  const updateDraftQuantity = (itemId: string, delta: number) => {
    setDraftItems(prev => {
      return prev.map(i => {
        if (i.id === itemId) {
          const newQty = Math.max(0, i.quantity + delta);
          return { ...i, quantity: newQty };
        }
        return i;
      }).filter(i => i.quantity > 0);
    });
  };

  const updateDraftNotes = (itemId: string, notes: string) => {
    setDraftItems(prev => prev.map(i => i.id === itemId ? { ...i, notes } : i));
  };

  const submitOrder = async () => {
    if (draftItems.length === 0) return;
    setIsSubmitting(true);

    try {
      const { createOrder } = await import('@/app/actions/order-actions');
      const { data: loc } = await supabase.from('locations').select('organization_id').eq('id', locationId).single();

      await createOrder({
        organization_id: loc?.organization_id,
        location_id: locationId,
        table_id: tableId,
        items: draftItems.map(i => ({
          menu_item_id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          notes: i.notes || ''
        }))
      });

      toast.success("Ordine inviato con successo!");
      setIsAdding(false);
      setDraftItems([]);
      if (onOrderSubmit) {
        onOrderSubmit();
      }
    } catch (e) {
      toast.error("Errore durante l'invio dell'ordine");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = (orders: Order[]) => {
    return orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  };

  const draftTotal = draftItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const draftCount = draftItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading && !isAdding) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (isAdding) {
    return (
      <div className="flex flex-col h-[70vh] max-h-[750px] relative sm:my-0 sm:h-[650px] overflow-hidden bg-background">
        <div className="flex flex-col gap-3 border-b bg-card z-10 shrink-0">
          <div className="flex items-center gap-2 relative pb-2 pt-1">
            <Button variant="outline" size="icon" className="shrink-0 text-muted-foreground h-9 w-9" onClick={() => {
              if (availableMenus.length > 1 && !showMenuSelection) {
                setShowMenuSelection(true);
              } else {
                setIsAdding(false);
              }
            }}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="relative flex-1">
              {selectedMenu && !showMenuSelection && (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca piatto..."
                      className="pl-9 bg-muted/50 border-none h-10 rounded-xl w-full"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              )}
              {(!selectedMenu || showMenuSelection) && (
                <div className="h-10 flex items-center px-2 font-bold text-lg">
                  Seleziona Menu
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" className="h-10 rounded-xl px-3 shrink-0" onClick={addCustomItemToDraft}>
              <Plus className="w-4 h-4" />
              Libero
            </Button>
          </div>

          {!showMenuSelection && selectedMenu && (
            <ScrollArea className="w-full whitespace-nowrap -mx-4 px-4 pb-2">
              <div className="flex w-max space-x-2">
                {categories.map(cat => (
                  <Badge
                    key={cat}
                    variant={activeCategory === cat ? 'default' : 'secondary'}
                    className="cursor-pointer px-3 py-1 text-sm rounded-full transition-all"
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex-1 overflow-y-auto bg-muted/10 py-4" data-vaul-no-drag>
          {loadingMenu ? (
            <div className="flex flex-col items-center justify-center p-10 h-full text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Caricamento menu...</p>
            </div>
          ) : showMenuSelection ? (
            <div className="space-y-3">
              {availableMenus.map(menu => (
                <Card
                  key={menu.id}
                  className={`cursor-pointer transition-all py-0 hover:border-primary/50 overflow-hidden ${selectedMenu?.id === menu.id ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : ''}`}
                  onClick={() => handleMenuSelect(menu)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{menu.name}</h3>
                      {menu.description && <p className="text-sm text-muted-foreground line-clamp-1">{menu.description}</p>}
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 h-full text-muted-foreground text-center">
              <UtensilsCrossed className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium text-lg">Nessun prodotto trovato</p>
              <p className="text-sm opacity-70">Prova a cercare con un altro termine.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-4">
              {filteredItems.map(item => {
                const inCartQty = draftItems.find(i => i.id === item.id)?.quantity || 0;
                return (
                  <div
                    key={item.id}
                    className={`group relative flex flex-col justify-between border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-95 select-none ${inCartQty > 0 ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20' : 'bg-card hover:border-primary/50 text-card-foreground'}`}
                    onClick={() => addToDraft(item)}
                  >
                    {item.image_url ? (
                      <div className="relative h-28 w-full bg-muted/50 border-b">
                        <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
                      </div>
                    ) : (
                      <div className="h-24 w-full bg-muted/30 flex items-center justify-center border-b">
                        <UtensilsCrossed className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="p-3">
                      <div className="font-semibold text-sm leading-tight line-clamp-2 mb-[2px]">{item.name}</div>
                      <div className="text-xs text-muted-foreground truncate mb-2">{item.categoryName}</div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">€{item.price.toFixed(2)}</span>
                        <div className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${inCartQty > 0 ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    {inCartQty > 0 && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-background">
                        {inCartQty}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {draftItems.length > 0 && (
          <div className="shrink-0 h-56 overflow-y-auto bg-background border rounded-xl  z-20">
            <div className="p-3 border-b flex justify-between items-center bg-card">
              <div className="font-semibold text-sm flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" /> Riepilogo {draftCount} {draftCount === 1 ? 'prodotto' : 'prodotti'}
              </div>
              <div className="font-bold text-lg text-primary">€{draftTotal.toFixed(2)}</div>
            </div>

            <div className="max-h-[30vh] overflow-y-auto px-2 py-1 bg-background/50 backdrop-blur" data-vaul-no-drag>
              <div className="divide-y w-full">
                {draftItems.map(item => (
                  <div key={item.id} className="flex justify-between items-start py-2 px-1 w-full">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className="flex items-center bg-muted/80 rounded-lg p-0.5 border shadow-sm shrink-0 mt-0.5">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-background cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                          onClick={(e) => { e.stopPropagation(); updateDraftQuantity(item.id, -1); }}
                        >
                          {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-destructive" /> : <Minus className="w-3.5 h-3.5" />}
                        </div>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-background cursor-pointer text-foreground transition-colors"
                          onClick={(e) => { e.stopPropagation(); updateDraftQuantity(item.id, 1); }}
                        >
                          <Plus className="w-3.5 h-3.5 text-primary" />
                        </div>
                      </div>
                      <div className="flex flex-col flex-1 pr-2 min-w-0">
                        {item.isCustom ? (
                          <Input
                            value={item.name}
                            onChange={(e) => updateDraftItem(item.id, 'name', e.target.value)}
                            className="h-7 text-sm font-medium px-2 py-0 border-dashed border-muted-foreground/30 hover:border-border focus:border-primary transition-colors bg-background"
                            placeholder="Nome prodotto"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium text-sm leading-tight truncate pt-1.5">{item.name}</span>
                        )}
                        <Input
                          placeholder="Aggiungi note (es. ben cotto, senza cipolla...)"
                          value={item.notes || ''}
                          onChange={(e) => updateDraftNotes(item.id, e.target.value)}
                          className="h-7 text-xs px-2 mt-1.5 -ml-1 bg-transparent border-dashed border-muted-foreground/30 hover:border-border focus:border-primary transition-colors w-full placeholder:text-muted-foreground/60 shadow-none focus-visible:ring-1"
                        />
                      </div>
                    </div>
                    {item.isCustom ? (
                      <div className="shrink-0 flex items-center gap-1 pl-2 pt-0.5">
                        <span className="text-sm font-medium">€</span>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          value={item.price || ''}
                          onChange={(e) => updateDraftItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="h-7 w-16 text-sm font-semibold px-2 border-dashed border-muted-foreground/30 hover:border-border focus:border-primary text-right bg-background"
                          placeholder="0.00"
                        />
                      </div>
                    ) : (
                      <div className="font-semibold text-sm shrink-0 pl-2 pt-1.5">€{(item.price * item.quantity).toFixed(2)}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 pt-2 bg-card">
              <Button className="w-full rounded-xl h-12 font-bold text-base shadow-sm active:scale-[0.98] transition-all" onClick={submitOrder} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                Invia Ordine
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-fit overflow-hidden relative">
      <div className="flex-1 overflow-y-auto" data-vaul-no-drag>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center bg-muted/20 rounded-2xl border-2 border-dashed mb-4">
            <div className="bg-background p-4 rounded-full shadow-sm border mb-4">
              <UtensilsCrossed className="w-8 h-8 text-muted-foreground opacity-70" />
            </div>
            <p className="font-semibold text-lg text-foreground">Nessun ordine qui</p>
            <p className="text-sm text-muted-foreground max-w-[250px] mt-1">Non ci sono ordini per questo tavolo o sono stati già incassati.</p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {orders.map((order) => {
              const coverPrice = (location?.cover_price || 0) * guestCount;
              const orderTotal = order.total_amount + coverPrice || 0;
              const isPending = order.status === 'pending';
              const isCompleted = order.status === 'completed';

              return (
                <div key={order.id} className="border border-border/60 rounded-xl overflow-hidden shadow-sm bg-card group transition-all hover:border-border">
                  <div className="bg-muted/40 px-4 py-3 border-b flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm tracking-tight text-foreground/80">Od. #{order.id.slice(0, 4).toUpperCase()}</span>
                      <div className="h-1 w-1 rounded-full bg-border" />
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 bg-background px-2 py-0.5 rounded-md border shadow-sm">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(order.created_at), 'HH:mm')}
                      </span>
                    </div>
                    <Badge
                      variant={isPending ? 'secondary' : isCompleted ? 'default' : 'outline'}
                      className={`capitalize text-xs px-2 py-0.5 h-5 ${isPending ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 shadow-none' : ''}`}
                    >
                      {isPending ? 'In attesa' : isCompleted ? 'Completato' : order.status}
                    </Badge>
                  </div>

                  <div className="px-1 py-1">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-border/40">
                        {order.items?.map((item: any, idx) => (
                          <tr key={item.id || idx} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 pl-3 pr-2 w-10 text-center font-bold text-foreground/70">{item.quantity}x</td>
                            <td className="py-2.5 px-2">
                              <div className="font-medium text-foreground leading-tight">{item.name}</div>
                              {item.notes && <div className="text-[11px] text-muted-foreground italic mt-0.5 max-w-[150px] truncate leading-tight">Note: {item.notes}</div>}
                            </td>
                            <td className="py-2.5 px-2 text-right font-medium text-muted-foreground">€{(item.price * item.quantity).toFixed(2)}</td>
                            <td className="py-2.5 pl-2 pr-3 w-8 text-right">
                              <div
                                className={`inline-block w-2.5 h-2.5 rounded-full ring-2 ring-background ${item.status === 'served' ? 'bg-green-500' : 'bg-orange-400 animate-pulse'}`}
                                title={item.status}
                              />
                            </td>
                          </tr>
                        ))}
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 pl-3 pr-2 w-10 text-center font-bold text-foreground/70">x{guestCount}</td>
                          <td className="py-2.5 px-2">
                            <div className="font-medium text-foreground leading-tight">Coperto</div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-medium text-muted-foreground">€{(location?.cover_price || 0).toFixed(2)}</td>
                          <td className="py-2.5 pl-2 pr-3 w-8 text-right">
                            <div
                              className={`inline-block w-2.5 h-2.5 rounded-full ring-2 ring-background bg-orange-400 animate-pulse`}
                              title='ciao'
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-muted/60 px-4 py-2 flex justify-between items-center border-t text-sm">
                    <span className="text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">Totale di questo ordine</span>
                    <span className="font-bold text-base">€{orderTotal.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 h-12 rounded-xl border border-dashed font-semibold active:scale-[0.98] transition-transform" onClick={() => toast.info("Funzionalità in arrivo")}>
            <ReceiptEuro className="w-4 h-4 mr-2 text-muted-foreground" /> Incassa
          </Button>
          <Button variant="default" className="flex-1 h-12 rounded-xl font-bold shadow-md active:scale-[0.98] transition-transform" onClick={() => setIsAdding(true)}>
            <Plus className="w-5 h-5 mr-1" /> Nuovo Ordine
          </Button>
        </div>
      </div>
    </div>
  );
}
