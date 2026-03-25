'use client'

import React, { useTransition } from 'react'
import { useLocationStore } from '@/store/location-store'
import { Customer } from '@/types/general'
import { Search, ArrowUp, ArrowDown, Minus, Plus, Loader2, User, Phone } from 'lucide-react'
import ClientsTable from '@/components/private/clients-table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh'
import { LineChart, Line } from 'recharts'
import { subDays, startOfMonth, subMonths, format } from 'date-fns'
import PageWrapper from '@/components/private/page-wrapper'
import { ButtonGroup } from '@/components/ui/button-group'
import { Button } from '@/components/ui/button'
import ActionSheet from '@/components/utility/action-sheet'
import { PhoneInput } from '@/components/ui/phone-input'
import { NumberInput } from '@/components/ui/number-input'
import { createCustomer } from '@/app/actions/customers'
import { getUserRole } from '@/app/actions/profile'
import { FaqContent } from '@/components/private/faq-section'
import { SanityFaq } from '@/utils/sanity/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ClientsView = ({
  faqs
} : {
  faqs: SanityFaq[]
}) => {
  const [data, setData] = React.useState<Customer[] | null>(null)
  const [search, setSearch] = React.useState('')
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [phoneNumber, setPhoneNumber] = React.useState('')
  const [totalVisits, setTotalVisits] = React.useState<number | undefined>(undefined)
  const [isPending, startTransition] = useTransition()
  const { selectedLocationId } = useLocationStore()

  const handleOpenAdd = () => {
    setPhoneNumber('')
    setTotalVisits(undefined)
    setSheetOpen(true)
  }

  const handleSubmit = async (formData: FormData) => {
    if (!selectedLocationId) return
    formData.set('phone_number', phoneNumber)

    startTransition(async () => {
      const result = await createCustomer(selectedLocationId, formData)
      if (result.success) {
        setData(prev => prev ? [result.data, ...prev] : [result.data])
        setSheetOpen(false)
      } else {
        alert('Creazione cliente fallita')
      }
    })
  }

  React.useEffect(() => {
    getUserRole().then(role => setIsAdmin(role === 'admin' || role === 'owner'))
  }, [])

  const fetchData = React.useCallback(async () => {
    if (!selectedLocationId) return

    const params = new URLSearchParams()
    params.append('location_id', selectedLocationId)

    const response = await fetch(`/api/supabase/customers?${params.toString()}`)
    const customers = await response.json()
    setData(customers)
  }, [selectedLocationId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  useRealtimeRefresh('customers', {
    filter: selectedLocationId ? `location_id=eq.${selectedLocationId}` : undefined,
    onUpdate: fetchData
  })

  const filteredData = React.useMemo(() => {
    if (!data) return []
    return data.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone_number.includes(search)
    )
  }, [data, search])

  const stats = React.useMemo(() => {
    const now = new Date()

    if (!data) return {
      total: { value: 0, trend: 0, series: [], type: 'neutral' as const },
      new: { value: 0, trend: 0, series: [], type: 'neutral' as const },
      top: { value: 0, trend: 0, series: [], type: 'neutral' as const }
    }

    const thirtyDaysAgo = subDays(now, 30)
    const sixtyDaysAgo = subDays(now, 60)

    const thisMonthStart = startOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))

    // Helper to process trend
    const getTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0
      return ((curr - prev) / prev) * 100
    }

    const getTrendType = (val: number) => {
      if (val > 0.1) return 'positive' as const
      if (val < -0.1) return 'negative' as const
      return 'neutral' as const
    }

    // Totale Clienti Trend (last 30 days growth)
    const totalNow = data.length
    const total30DaysAgo = data.filter(c => new Date(c.created_at) < thirtyDaysAgo).length
    const total60DaysAgo = data.filter(c => new Date(c.created_at) < sixtyDaysAgo).length

    const growthThisPeriod = totalNow - total30DaysAgo
    const growthPrevPeriod = total30DaysAgo - total60DaysAgo
    const totalTrend = getTrend(growthThisPeriod, growthPrevPeriod)

    // Nuovi Mese Trend
    const countThisMonth = data.filter(c => new Date(c.created_at) >= thisMonthStart).length
    const countLastMonth = data.filter(c => {
      const d = new Date(c.created_at)
      return d >= lastMonthStart && d < thisMonthStart
    }).length
    const newTrend = getTrend(countThisMonth, countLastMonth)

    // Top Clienti (No historical data for visits in this view, so neutral trend or simplified)
    const topClients = data.filter(c => c.total_visits >= 5).length

    // Series Data (last 30 days)
    const seriesData = (filterFn: (c: Customer, d: Date) => boolean) => {
      const days = []
      for (let i = 29; i >= 0; i--) {
        const d = subDays(now, i)
        const dateStr = format(d, 'yyyy-MM-dd')
        const count = data.filter(c => {
          const created = new Date(c.created_at)
          return format(created, 'yyyy-MM-dd') === dateStr && filterFn(c, created)
        }).length
        days.push({ x: dateStr, y: count })
      }
      return days
    }

    const totalSeries = []
    let runningTotal = total30DaysAgo
    for (let i = 29; i >= 0; i--) {
      const d = subDays(now, i)
      const dateStr = format(d, 'yyyy-MM-dd')
      runningTotal += data.filter(c => format(new Date(c.created_at), 'yyyy-MM-dd') === dateStr).length
      totalSeries.push({ x: dateStr, y: runningTotal })
    }

    return {
      total: {
        value: totalNow,
        trend: totalTrend,
        type: getTrendType(totalTrend),
        series: totalSeries
      },
      new: {
        value: countThisMonth,
        trend: newTrend,
        type: getTrendType(newTrend),
        series: seriesData((c) => true)
      },
      top: {
        value: topClients,
        trend: 0,
        type: 'neutral' as const,
        series: seriesData((c) => c.total_visits >= 5)
      }
    }
  }, [data])

  const getLineColor = (type: string) => {
    if (type === 'positive') return '#287907'
    if (type === 'negative') return '#E53935'
    return '#A3A3A3'
  }

  const getTrendIcon = (type: string) => {
    if (type === 'positive') return <ArrowUp size={16} />
    if (type === 'negative') return <ArrowDown size={16} />
    return <Minus size={16} />
  }

  return (
    <PageWrapper>
      <div className='header-container'>
        <div className='items-start flex-col flex gap-1'>
          <h3 className="text-3xl font-bold tracking-tight">Clienti</h3>
          <p className="text-muted-foreground">Panoramica completa dei tuoi clienti</p>
        </div>
        <ButtonGroup>
          <FaqContent
            variant='minimized'
            title='Aiuto'
            faqs={faqs}
          />
          <Button onClick={handleOpenAdd}>
            <Plus />
            Aggiungi
          </Button>
        </ButtonGroup>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <StatCard
          title="Totale Clienti"
          value={stats.total.value}
          subvalue={`${stats.total.trend > 0 ? '+' : ''}${stats.total.trend.toFixed(0)}%`}
          icon={getTrendIcon(stats.total.type)}
          trend="Rispetto al mese scorso"
          color={stats.total.type}
          chartData={stats.total.series}
          lineColor={getLineColor(stats.total.type)}
        />
        <StatCard
          title="Nuovi Mese"
          value={stats.new.value}
          subvalue={`${stats.new.trend > 0 ? '+' : ''}${stats.new.trend.toFixed(0)}%`}
          icon={getTrendIcon(stats.new.type)}
          trend="Rispetto al mese scorso"
          color={stats.new.type}
          chartData={stats.new.series}
          lineColor={getLineColor(stats.new.type)}
        />
        <StatCard
          title="Top Clienti"
          value={stats.top.value}
          subvalue={`${stats.top.trend > 0 ? '+' : ''}${stats.top.trend.toFixed(0)}%`}
          icon={<Minus size={16} />}
          trend="Fedeltà: >5 visite"
          color="neutral"
          chartData={stats.top.series}
          lineColor={getLineColor('neutral')}
        />
      </div>


          <Card className='pt-0 gap-0'>
            <CardHeader className="border-b-2 py-5 gap-x-10 gap-y-3 flex flex-wrap items-center justify-between">
              <CardTitle className="text-lg font-bold tracking-tight">
                Lista Clienti
              </CardTitle>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per nome o telefono..."
                  className="pl-10 h-10 rounded-xl border-2 bg-card!"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                <ClientsTable
                  data={filteredData}
                  isAdmin={isAdmin}
                  onDelete={(ids) => setData(prev => prev?.filter(c => !ids.includes(c.id)) ?? null)}
                />
              </div>
            </CardContent>
          </Card>


      <ActionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Aggiungi Cliente"
        description="Inserisci i dati del nuovo cliente."
        formAction={handleSubmit}
        actionButtons={
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crea Cliente
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-foreground" />
              <Input
                id="name"
                name="name"
                placeholder="es: Mario Rossi"
                className="pl-9 w-full"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Numero di telefono</Label>
            <PhoneInput
              id="phone_number"
              defaultCountry="IT"
              className="h-9 border-2 rounded-xl shadow-xs"
              value={phoneNumber}
              onChange={(value) => setPhoneNumber(value || '')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_visits">Visite totali <span className="text-muted-foreground">(opzionale)</span></Label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-foreground" />
              <NumberInput
                id="total_visits"
                name="total_visits"
                placeholder="es: 5"
                className="pl-9 w-full h-8.5"
                buttonHeight='3!'
                value={totalVisits}
                context="default"
                onValueChange={setTotalVisits}
              />
            </div>
          </div>
        </div>
      </ActionSheet>
    </PageWrapper>
  )
}

const StatCard = ({
  title,
  value,
  subvalue,
  icon,
  trend,
  color,
  chartData,
  lineColor
}: {
  title: string
  value: string | number
  subvalue?: string | number
  icon?: React.ReactNode
  trend: string
  color: 'positive' | 'negative' | 'neutral'
  chartData: { x: string, y: number }[]
  lineColor: string
}) => {

  const colorClasses = {
    positive: 'bg-[#cdf1bf] text-[#287907]',
    negative: 'bg-red-100 text-red-800',
    neutral: 'bg-gray-100 text-gray-800'
  }

  return (
    <div className='bg-card text-card-foreground rounded-3xl flex items-start gap-2 border-2 py-5 px-4 shadow-sm min-h-35'>
      <div className='flex flex-col justify-between h-full flex-1'>
        <h2 className='text-md sm:text-lg text-muted-foreground font-semibold tracking-tight'>{title}</h2>
        <div>
          <p className='text-xl sm:text-2xl font-bold tracking-tight'>{value}</p>
          <div className='mt-2 flex flex-wrap items-center gap-2 sm:gap-3'>
            <div className={`flex items-center gap-1 ${colorClasses[color]} w-fit py-1 px-2 rounded-xl`}>
              <p className='text-[10px] sm:text-xs font-bold'>{subvalue}</p>
              {icon}
            </div>
            <p className='text-[10px] sm:text-xs text-muted-foreground font-medium'>{trend}</p>
          </div>
        </div>
      </div>
      <div className='flex items-center justify-end'>
        <LineChart width={80} height={50} data={chartData} className="sm:w-25 sm:h-15">
          <Line
            type="monotone"
            dataKey="y"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </div>
    </div>
  )
}

export default ClientsView