import { Progress } from '@/components/ui/progress'
import { MessageCircle } from 'lucide-react'
import type { WhatsAppStats } from '@/lib/analytics/types'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

interface WhatsAppUsageBarProps {
  stats: WhatsAppStats
  detailed?: boolean
}

export function WhatsAppUsageBar({ stats, detailed = false }: WhatsAppUsageBarProps) {
  const { usageCount, usageCap, usagePercentage, billingCycleStart } = stats

  const color =
    usagePercentage >= 90
      ? 'text-red-600'
      : usagePercentage >= 75
        ? 'text-amber-600'
        : 'text-foreground'

  return (
    <Card className='pt-0 gap-4'>
      <CardHeader className="border-b-2 py-5 flex items-center gap-3">
        <CardTitle className="text-lg font-bold tracking-tight">
          Conversazioni Whatsapp
        </CardTitle>
        {billingCycleStart && (
          <span className="ml-auto text-sm text-muted-foreground">
            Dal {format(new Date(billingCycleStart), 'd MMM', { locale: it })}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <Progress value={usagePercentage} className="h-2 mb-2" />
        <div className="flex items-center justify-between text-xs mb-4">
          <span className={`font-bold ${color}`}>{usageCount} usate</span>
          <span className="text-muted-foreground">di {usageCap} incluse nel piano</span>
        </div>
        {detailed && (
          <div className="grid grid-cols-3 gap-2 border-t pt-3 mt-1">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-bold">{stats.inbound}</span>
              <span className="text-xs text-muted-foreground text-center">In entrata</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-bold">{stats.outboundBot}</span>
              <span className="text-xs text-muted-foreground text-center">Bot</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-bold">{stats.outboundHuman}</span>
              <span className="text-xs text-muted-foreground text-center">Umano</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
