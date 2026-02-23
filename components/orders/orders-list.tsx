"use client"

import React, { useEffect, useState } from 'react'
import { getLocationOrders, updateOrderStatus } from '@/app/actions/order-actions'
import { Order, OrderStatus } from '@/types/general' // Verify types
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Loader2, Check, ChefHat, BellRing } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import NoItems from '../utility/no-items'

interface OrdersListProps {
  locationId: string
}

const statusOrder: Record<string, number> = {
  'pending': 0,
  'confirmed': 1,
  'preparing': 2,
  'ready': 3,
  'served': 4
}

export default function OrdersList({ locationId }: OrdersListProps) {
  const [orders, setOrders] = useState<any[]>([]) // Using any for now to handle Joined types
  const [loading, setLoading] = useState(true)

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
    fetchOrders()
  }, [fetchOrders])

  useRealtimeRefresh('orders', {
    filter: locationId ? `location_id=eq.${locationId}` : undefined,
    onUpdate: () => fetchOrders()
  })

  // Group by Table ID
  const tables = React.useMemo(() => {
    const grouped: Record<string, {
      tableNumber: string,
      tableName: string, // fallback
      guestName: string,
      guestsCount: number,
      orders: any[],
      firstOrderTime: Date,
      totalAmount: number,
      items: any[]
    }> = {}

    orders.forEach(order => {
      const tableId = order.table_id || 'unknown'
      if (!grouped[tableId]) {
        grouped[tableId] = {
          tableNumber: order.table?.table_number || '?',
          tableName: order.table?.table_number || '?',
          guestName: order.booking?.guest_name || order.notes?.replace('Guest: ', '') || 'Cliente',
          guestsCount: order.booking?.guests_count || 0,
          orders: [],
          firstOrderTime: new Date(order.created_at),
          totalAmount: 0,
          items: []
        }
      }

      // Update earliest time
      const orderTime = new Date(order.created_at)
      if (orderTime < grouped[tableId].firstOrderTime) {
        grouped[tableId].firstOrderTime = orderTime
      }

      grouped[tableId].orders.push(order)
      grouped[tableId].totalAmount += order.total_amount

      // Flatten items
      if (order.items) {
        grouped[tableId].items.push(...order.items.map((i: any) => ({ ...i, orderId: order.id, orderStatus: order.status })))
      }
    })

    return Object.values(grouped).sort((a, b) => a.firstOrderTime.getTime() - b.firstOrderTime.getTime())
  }, [orders])

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
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
  }

  if (orders.length === 0) {
    return (
      <NoItems
        icon={<ChefHat className='w-10 h-10 text-foreground' />}
        title='Nessun ordine attivo'
        description='Gli ordini appariranno qui quando i clienti invieranno le richieste'
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
      {tables.map((table) => (
        <Card key={table.tableNumber} className="flex flex-col shadow-sm border-t-4 border-t-primary">
          <CardHeader className="p-4 pb-2 bg-muted/20">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-lg px-2 h-8 font-bold">
                    Tavolo {table.tableNumber}
                  </Badge>
                  {table.guestsCount > 0 && (
                    <Badge variant="outline" className="h-6">
                      {table.guestsCount} <span className="ml-1 text-xs">pers.</span>
                    </Badge>
                  )}
                </div>
                <div className="mt-1 font-medium text-base truncate">{table.guestName}</div>
                <div className="text-xs text-muted-foreground">
                  In attesa da: {format(table.firstOrderTime, 'HH:mm')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">€{table.totalAmount.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">{table.items.length} articoli</div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 flex flex-col">
            <ScrollArea className="flex-1 max-h-[300px]">
              <div className="divide-y divide-border/50">
                {/* Group items by original order to keep context / time? Or just flat? */}
                {/* Let's group by Order to show distinct batches/rounds if needed, or flat.
                     User said "ogni ordine aperto". Let's show separate blocks for valid orders. 
                 */}
                {table.orders.map(order => (
                  <div key={order.id} className={cn("p-3",
                    order.status === 'ready' ? "bg-green-50/50 dark:bg-green-950/10" : ""
                  )}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        {format(new Date(order.created_at), 'HH:mm')} - {order.status}
                      </span>
                      {/* Order Level Actions */}
                      {order.status === 'pending' && (
                        <Button size="sm" variant="outline" className="h-6 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-200" onClick={() => handleStatusUpdate(order.id, 'preparing')}>
                          <ChefHat className="w-3 h-3 mr-1" /> Prepara
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button size="sm" variant="outline" className="h-6 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-200" onClick={() => handleStatusUpdate(order.id, 'ready')}>
                          <BellRing className="w-3 h-3 mr-1" /> Pronto
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button size="sm" variant="outline" className="h-6 text-xs bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200" onClick={() => handleStatusUpdate(order.id, 'served')}>
                          <Check className="w-3 h-3 mr-1" /> Servi
                        </Button>
                      )}
                    </div>
                    {order.notes && (
                      <div className="text-xs italic text-amber-600 mb-2 bg-amber-50 p-1 rounded">
                        Note: {order.notes}
                      </div>
                    )}
                    <div className="space-y-1">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <div className="flex gap-2">
                            <span className="font-bold">{item.quantity}x</span>
                            <span>{item.name}</span>
                            {item.notes && <span className="text-xs italic text-muted-foreground">- {item.notes}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
