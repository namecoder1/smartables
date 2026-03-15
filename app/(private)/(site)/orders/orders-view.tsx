'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { useLocationStore } from '@/store/location-store'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { getLocationOrders } from '@/app/actions/order-actions'
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh'

import { updateOrderStatus } from '@/app/actions/order-actions'
import { OrderStatus } from '@/types/general'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, ChefHat, BellRing, Clock, AlertTriangle, Users, MessageSquare, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import NoItems from '@/components/utility/no-items'
import OverviewCards from '@/components/private/overview-cards'

import { FaListCheck } from "react-icons/fa6";
import { RxLapTimer } from "react-icons/rx";
import { LuNotebookPen } from "react-icons/lu";

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

const OrdersView = () => {
  const { selectedLocationId } = useLocationStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const int = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(int)
  }, [])

  const fetchOrders = React.useCallback(async () => {
    if (!selectedLocationId) return
    setLoading(true)
    try {
      const data = await getLocationOrders(selectedLocationId)
      setOrders(data || [])
    } catch (e) {
      console.error(e)
      toast.error("Errore nel caricamento ordini")
    } finally {
      setLoading(false)
    }
  }, [selectedLocationId])

  useEffect(() => {
    if (selectedLocationId) {
      fetchOrders()
    }
  }, [fetchOrders, selectedLocationId])

  useRealtimeRefresh('orders', {
    filter: selectedLocationId ? `location_id=eq.${selectedLocationId}` : undefined,
    onUpdate: () => fetchOrders()
  })

  const columns = useMemo(() => {
    return [
      {
        id: 'new',
        title: 'Nuovi Ordini',
        bg: 'border-t-blue-500',
        badgeBg: 'bg-blue-100 text-blue-800',
        orders: orders.filter(o => o.status === 'pending' || o.status === 'confirmed')
      },
      {
        id: 'preparing',
        title: 'In Preparazione',
        bg: 'border-t-amber-500',
        badgeBg: 'bg-amber-100 text-amber-800',
        orders: orders.filter(o => o.status === 'preparing')
      },
      {
        id: 'ready',
        title: 'Pronti da Servire',
        bg: 'border-t-emerald-500',
        badgeBg: 'bg-emerald-100 text-emerald-800',
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
        description: `ordin${activeOrders === 1 ? 'e' : 'i'}`,
        icon: <LuNotebookPen className='text-primary size-6 2xl:size-8' />
      },
      {
        title: 'Tempo medio',
        value: `${(avgTime / 60).toFixed(0)}`,
        description: 'ore di attesa',
        icon: <RxLapTimer className='text-primary size-6 2xl:size-8' />
      },
      {
        title: 'Completati',
        value: completedToday,
        description: '',
        icon: <FaListCheck className='text-primary size-6 2xl:size-8' />
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

  if (!selectedLocationId) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
  }

  if (loading && orders.length === 0) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>
  }

  return (
    <div className='flex flex-col h-[calc(100vh-250px)] space-y-6'>
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
        <div className="flex gap-4 pb-2 overflow-x-auto flex-1 items-start snap-x">
          {columns.map(col => (
            <div key={col.id} className={cn("flex flex-col shrink-0 w-80 md:w-96 rounded-3xl shadow-sm p-4 h-full bg-card snap-start border-2 border-t-4 rounded-t-none", col.bg)}>
              <div className="flex justify-between items-center mb-4 px-1 shrink-0">
                <h3 className='font-bold text-lg tracking-tight'>{col.title}</h3>
                <span className={cn("text-sm font-bold px-3 py-1 rounded-full", col.badgeBg)}>
                  {col.orders.length}
                </span>
              </div>

              <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="space-y-4 pb-4">
                  {col.orders.map(order => (
                    <Card key={order.id} className="border-2 py-0 shadow-none overflow-hidden bg-white transition-shadow">
                      <CardContent className="p-4 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-lg tracking-tight text-zinc-900">
                              ORD-{order.id.slice(0, 4).toUpperCase()}
                            </span>
                            <div className="flex items-center gap-2 text-sm text-zinc-600 font-medium">
                              <Users className="w-4 h-4 text-zinc-400" />
                              <span>
                                Tavolo {order.table?.table_number || '?'}
                                {order.booking?.guest_name ? ` • ${order.booking.guest_name}` : ''}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center text-zinc-500 text-sm font-medium gap-1.5 bg-zinc-100 px-2 py-1 rounded-md">
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
                          <div className="flex items-start gap-1.5 text-xs text-blue-700 bg-blue-50 p-2 rounded-md border border-blue-100">
                            <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                            <span className="font-medium">{order.notes}</span>
                          </div>
                        )}

                        <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 space-y-3">
                          {order.items?.map((item: any) => (
                            <div key={item.id} className="flex flex-col gap-1.5">
                              <div className="flex justify-between items-start">
                                <div className="flex gap-2.5 text-zinc-800">
                                  <span className="font-semibold text-zinc-400 w-5">{item.quantity}x</span>
                                  <span className="font-medium">{item.name} {item.price}</span>
                                </div>
                              </div>
                              {item.notes && (
                                <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50/80 p-1.5 rounded-md ml-7">
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
                              className="w-full text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-100 shadow-sm font-semibold justify-between group h-11"
                              size="sm"
                              onClick={() => handleStatusUpdate(order.id, 'preparing')}
                            >
                              <span className="flex items-center gap-2"><ChefHat className="w-4 h-4" /> Inizia Preparazione</span>
                              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-transform group-hover:translate-x-1" />
                            </Button>
                          )}
                          {col.id === 'preparing' && (
                            <Button
                              className="w-full text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-100 shadow-sm font-semibold justify-between group h-11"
                              size="sm"
                              onClick={() => handleStatusUpdate(order.id, 'ready')}
                            >
                              <span className="flex items-center gap-2"><BellRing className="w-4 h-4" /> Segna come Pronto</span>
                              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-transform group-hover:translate-x-1" />
                            </Button>
                          )}
                          {col.id === 'ready' && (
                            <Button
                              className="w-full text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 shadow-sm font-semibold justify-between group h-11"
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
                    <div className="text-center py-10 bg-white/40 rounded-xl border-2 border-dashed border-zinc-200">
                      <p className="text-zinc-400 text-sm font-medium">
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

export default OrdersView