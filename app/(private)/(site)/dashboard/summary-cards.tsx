import { Card } from "@/components/ui/card"
import { CalendarCheck, Users, CalendarDays, TrendingUp } from "lucide-react"

interface SummaryCardsProps {
  reservationsToday: number
  reservationsWeek: number
  coversToday: number
}

export function SummaryCards({
  reservationsToday,
  reservationsWeek,
  coversToday,
}: SummaryCardsProps) {
  return (
    <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Prenotazioni Oggi"
        value={reservationsToday}
        icon={CalendarCheck}
        trend="Oggi"
      />
      <StatCard
        label="Coperti Attesi"
        value={coversToday}
        icon={Users}
        trend="Ospiti totali"
      />
      <StatCard
        label="Questa Settimana"
        value={reservationsWeek}
        icon={CalendarDays}
        trend="Ultimi 7 giorni"
      />
      <StatCard
        label="Tasso Occupazione"
        value="0%"
        icon={TrendingUp}
        trend="Dati insufficienti"
        isPlaceholder
      />
    </div>
  )
}

function StatCard({ label, value, icon: Icon, trend, isPlaceholder }: { label: string, value: string | number, icon: any, trend: string, isPlaceholder?: boolean }) {
  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden rounded-3xl p-6 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <span className="text-lg font-semibold tracking-tight">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {value}
        </div>
        <p className="mt-1 text-base font-medium text-zinc-400 dark:text-zinc-500">
          {trend}
        </p>
      </div>
    </Card>
  )
}