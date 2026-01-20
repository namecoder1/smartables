
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CalendarCheck, CalendarDays } from "lucide-react"

interface DashboardSummaryCardsProps {
  reservationsToday: number
  reservationsWeek: number
  coversToday: number
}

export function DashboardSummaryCards({
  reservationsToday,
  reservationsWeek,
  coversToday,
}: DashboardSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Prenotazioni oggi"
        value={reservationsToday}
        description="Prenotazioni oggi"
        icon={<CalendarCheck size={24} className="text-white" />}
      />
      <SummaryCard
        title="Prenotazioni settimana"
        value={reservationsWeek}
        description="Prenotazioni totali della settimana"
        icon={<CalendarCheck size={24} className="text-white" />}
      />
      <SummaryCard
        title="Coperti oggi"
        value={coversToday}
        description="Coperti totali occupati oggi"
        icon={<CalendarCheck size={24} className="text-white" />}
      />
      <SummaryCard
        title="Prenotazioni oggi"
        value={reservationsToday}
        description="Prenotazioni oggi"
        icon={<CalendarCheck size={24} className="text-white" />}
      />
    </div>
  )
}

function SummaryCard({ title, value, description, icon }: any) {
  return (
    <div className="flex flex-row items-start justify-between space-y-0 bg-card border p-6 pb-6 gap-4">
      <div className="space-y-2">
        <h2 className="text-sm font-medium">
          {title}
        </h2>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="bg-[#ff960c] dark:bg-[#ff960c90] p-3"> 
        {icon}
      </div>
    </div>
  )
}