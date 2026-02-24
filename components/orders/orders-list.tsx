"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { getLocationOrders, updateOrderStatus } from '@/app/actions/order-actions'
import { OrderStatus } from '@/types/general'
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Loader2, Check, ChefHat, BellRing, Clock, AlertTriangle, Users, MessageSquare, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import NoItems from '../utility/no-items'
import OverviewCards from '../private/overview-cards'

interface OrdersListProps {
  locationId: string
}

const getElapsedMinutes = (dateString: string, nowMs: number) => {
  const diff = nowMs - new Date(dateString).getTime()
  return Math.max(0, Math.floor(diff / 60000))
}

const formatElapsed = (dateString: string, nowMs: number) => {
  const mins = getElapsedMinutes(dateString, nowMs)
  if (mins < 1) return 'Adesso'
  return `${mins} min`
}

export default function OrdersList({ locationId }: OrdersListProps) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const int = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(int)
  }, [])

  const fetchOrders = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLocationOrders(locationId)
      setOrders(data || [])
    } catch (e) {
      console.error(e)
      toast.error("Errore nel caricamento ordini")
    } finally {
      setLoading(false)
    }
  }, [locationId])

  useEffect(() => {
    if (locationId) {
      fetchOrders()
    }
  }, [fetchOrders, locationId])

  useRealtimeRefresh('orders', {
    filter: locationId ? `location_id=eq.${locationId}` : undefined,
    onUpdate: () => fetchOrders()
  })

  const columns = useMemo(() => {
    return [
      {
        id: 'new',
        title: 'Nuovi Ordini',
        bg: 'bg-[#fdf2f8] dark:bg-rose-950/20',
        headerText: 'text-rose-900 dark:text-rose-100',
        badgeBg: 'bg-[#fce7f3] text-rose-800 dark:bg-rose-900 dark:text-rose-200',
        orders: orders.filter(o => o.status === 'pending' || o.status === 'confirmed')
      },
      {
        id: 'preparing',
        title: 'In Preparazione',
        bg: 'bg-[#fffbeb] dark:bg-amber-950/20',
        headerText: 'text-amber-900 dark:text-amber-100',
        badgeBg: 'bg-[#fef3c7] text-amber-800 dark:bg-amber-900 dark:text-amber-200',
        orders: orders.filter(o => o.status === 'preparing')
      },
      {
        id: 'ready',
        title: 'Pronti da Servire',
        bg: 'bg-[#f0fdf4] dark:bg-emerald-950/20',
        headerText: 'text-emerald-900 dark:text-emerald-100',
        badgeBg: 'bg-[#dcfce7] text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
        orders: orders.filter(o => o.status === 'ready')
      }
    ]
  }, [orders])

  const metrics = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== 'served').length
    const activeOrderTimes = orders
      .filter(o => o.status !== 'served')
      .map(o => getElapsedMinutes(o.created_at, now))

    const avgTime = activeOrderTimes.length
      ? Math.round(activeOrderTimes.reduce((a, b) => a + b, 0) / activeOrderTimes.length)
      : 0

    const completedToday = orders.filter(o => o.status === 'served').length
    const delayed = activeOrderTimes.filter(t => t > 30).length

    return [
      {
        title: 'Ordini attivi',
        value: activeOrders,
        description: 'da preparare o servire'
      },
      {
        title: 'Tempo medio',
        value: `${avgTime} min`,
        description: 'attesa attuale'
      },
      {
        title: 'Completati',
        value: completedToday,
        description: 'oggi'
      }
    ]
  }, [orders, now])

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus)
      toast.success(`Stato aggiornato`)
      fetchOrders()
    } catch (e) {
      toast.error("Errore nell'aggiornamento")
    }
  }

  if (loading && orders.length === 0) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>
  }

  return (
    <div className='flex flex-col h-[calc(100vh-220px)] space-y-6'>
      <div className="shrink-0">
        <OverviewCards data={metrics} />
      </div>

      {orders.filter(o => o.status !== 'served').length === 0 && orders.length > 0 ? (
        <div className="flex-1">
          <NoItems
            icon={<Check className='w-10 h-10 text-emerald-500' />}
            title='Tutti gli ordini sono stati serviti'
            description='Ottimo lavoro! La cucina e la sala sono perfettamente allineate.'
          />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex-1">
          <NoItems
            icon={<ChefHat className='w-10 h-10 text-foreground' />}
            title='Nessun ordine attivo'
            description='Gli ordini appariranno qui quando i clienti invieranno le richieste'
          />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 flex-1 items-start snap-x">
          {columns.map(col => (
            <div key={col.id} className={cn("flex flex-col shrink-0 w-80 md:w-96 rounded-2xl p-4 h-full snap-start border border-zinc-100 dark:border-zinc-800", col.bg)}>
              <div className="flex justify-between items-center mb-4 px-1 shrink-0">
                <h3 className={cn("font-bold text-lg", col.headerText)}>{col.title}</h3>
                <span className={cn("text-sm font-bold px-3 py-1 rounded-full", col.badgeBg)}>
                  {col.orders.length}
                </span>
              </div>

              <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="space-y-4 pb-4">
                  {col.orders.map(order => (
                    <Card key={order.id} className="border-0 py-0 shadow-sm overflow-hidden bg-white dark:bg-zinc-950 hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
                              ORD-{order.id.slice(0, 4).toUpperCase()}
                            </span>
                            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                              <Users className="w-4 h-4 text-zinc-400" />
                              <span>
                                Tavolo {order.table?.table_number || '?'}
                                {order.booking?.guest_name ? ` • ${order.booking.guest_name}` : ''}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center text-zinc-500 dark:text-zinc-400 text-sm font-medium gap-1.5 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-md">
                              <Clock className="w-3.5 h-3.5" />
                              {formatElapsed(order.created_at, now)}
                            </div>
                            {getElapsedMinutes(order.created_at, now) > 30 && col.id !== 'ready' && (
                              <Badge variant="destructive" className="text-[10px] h-5 px-1.5 font-bold animate-pulse">
                                RITARDO
                              </Badge>
                            )}
                          </div>
                        </div>

                        {order.notes && (
                          <div className="flex items-start gap-1.5 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 p-2 rounded-md border border-blue-100 dark:border-blue-800/50">
                            <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                            <span className="font-medium">{order.notes}</span>
                          </div>
                        )}

                        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-3 border border-zinc-100 dark:border-zinc-800 space-y-3">
                          {order.items?.map((item: any) => (
                            <div key={item.id} className="flex flex-col gap-1.5">
                              <div className="flex justify-between items-start">
                                <div className="flex gap-2.5 text-zinc-800 dark:text-zinc-200">
                                  <span className="font-semibold text-zinc-400 dark:text-zinc-500 w-5">{item.quantity}x</span>
                                  <span className="font-medium">{item.name} {item.price}</span>
                                </div>
                              </div>
                              {item.notes && (
                                <div className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/50 p-1.5 rounded-md ml-7">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                                  <span className="font-medium">{item.notes}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="pt-2">
                          {col.id === 'new' && (
                            <Button
                              className="w-full text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900 border border-blue-100 dark:border-blue-900 shadow-sm font-semibold justify-between group h-11"
                              size="sm"
                              onClick={() => handleStatusUpdate(order.id, 'preparing')}
                            >
                              <span className="flex items-center gap-2"><ChefHat className="w-4 h-4" /> Inizia Preparazione</span>
                              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-transform group-hover:translate-x-1" />
                            </Button>
                          )}
                          {col.id === 'preparing' && (
                            <Button
                              className="w-full text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900 border border-amber-100 dark:border-amber-900 shadow-sm font-semibold justify-between group h-11"
                              size="sm"
                              onClick={() => handleStatusUpdate(order.id, 'ready')}
                            >
                              <span className="flex items-center gap-2"><BellRing className="w-4 h-4" /> Segna come Pronto</span>
                              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-transform group-hover:translate-x-1" />
                            </Button>
                          )}
                          {col.id === 'ready' && (
                            <Button
                              className="w-full text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 border border-emerald-100 dark:border-emerald-900 shadow-sm font-semibold justify-between group h-11"
                              size="sm"
                              onClick={() => handleStatusUpdate(order.id, 'served')}
                            >
                              <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Servi Ordine</span>
                              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-transform group-hover:translate-x-1" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {col.orders.length === 0 && (
                    <div className="text-center py-10 bg-white/40 dark:bg-zinc-950/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                      <p className="text-zinc-400 dark:text-zinc-500 text-sm font-medium">
                        Nessun ordine
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

