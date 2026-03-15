import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import type { PeriodComparison } from '@/lib/analytics/types'

interface PeriodStatCardProps {
  title: string
  comparison: PeriodComparison
  formatValue?: (n: number) => string
  description?: string
}

const trendColors = {
  positive: 'bg-green-100 text-green-700',
  negative: 'bg-red-100 text-red-800',
  neutral: 'bg-muted text-muted-foreground',
}

const trendIcons = {
  positive: ArrowUp,
  negative: ArrowDown,
  neutral: Minus,
}

export function PeriodStatCard({
  title,
  comparison,
  formatValue = n => String(n),
  description,
}: PeriodStatCardProps) {
  const { currentTotal, trendType, trendValue } = comparison
  const Icon = trendIcons[trendType]
  const colorClass = trendColors[trendType]
  const sign = trendValue > 0 ? '+' : ''

  return (
    <div className="border-2 p-4 rounded-3xl bg-card text-card-foreground shadow-sm flex flex-col gap-2">
      <p className="text-md font-medium text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">{formatValue(currentTotal)}</p>
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 text-xs font-bold py-0.5 px-2 rounded-full ${colorClass}`}>
          <Icon size={12} />
          {sign}{trendValue.toFixed(1)}%
        </div>
        <span className="text-xs text-muted-foreground">
          {description ?? 'vs periodo precedente'}
        </span>
      </div>
    </div>
  )
}
