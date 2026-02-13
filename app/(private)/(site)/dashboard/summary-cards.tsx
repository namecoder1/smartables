
import { CalendarCheck } from "lucide-react"

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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
    <div className="flex hover:scale-105 transition-all duration-300 cursor-pointer flex-row items-start justify-between rounded-xl space-y-0 bg-card border-2 p-4 pb-4 gap-4">
      <div className="space-y-2">
        <h2 className="text-md font-semibold tracking-tighter">
          {title}
        </h2>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="bg-[#ff960c] dark:bg-[#ff960c90] rounded-lg p-2">
        {icon}
      </div>
    </div>
  )
}