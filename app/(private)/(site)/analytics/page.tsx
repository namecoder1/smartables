import { DonutPie } from '@/components/charts/donut-pie';
import { SimpleLine } from '@/components/charts/simple-line'
import { AreaChart } from '@/components/charts/area-chart';
import { ChartBar } from '@/components/charts/chart-bar';
import { getAnalyticsData } from './actions';
import PageWrapper from '@/components/private/page-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Visualizza le statistiche dei tuoi clienti e delle tue prenotazioni.',
}

export default async function AnalyticsPage() {
  const {
    sources,
    hottestDays,
    hottestHours,
    weeklyTrends,
    longTermTrends
  } = await getAnalyticsData()

  return (
    <PageWrapper>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Visualizza le statistiche dei tuoi clienti e delle tue prenotazioni.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="col-span-1 border p-4">
          <h2 className="text-lg font-semibold mb-2">Booking Source</h2>
          <DonutPie data={sources} />
        </div>
        <div className="col-span-1 lg:col-span-2 border p-4">
          <h2 className="text-lg font-semibold mb-2">Weekly Trends</h2>
          {weeklyTrends && weeklyTrends.length > 0 ? (
            <SimpleLine data={weeklyTrends} />
          ) : (
            <div className="h-[200px] flex items-center justify-center border rounded-lg bg-muted/10 text-muted-foreground">
              No data for this week
            </div>
          )}
        </div>
      </div>


      <AreaChart data={longTermTrends} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartBar
          data={hottestDays}
          title="Busiest Days"
          description="Total bookings by day of week"
          dataKeyX="day"
          dataKeyY="bookings"
          config={{
            bookings: {
              label: "Bookings",
              color: "var(--chart-1)"
            }
          }}
        />

        <ChartBar
          data={hottestHours}
          title="Busiest Hours"
          description="Total bookings by hour of day"
          dataKeyX="hour"
          dataKeyY="bookings"
          config={{
            bookings: {
              label: "Bookings",
              color: "var(--chart-2)"
            }
          }}
          fill="var(--chart-2)"
        />
      </div>
    </PageWrapper>
  )
}