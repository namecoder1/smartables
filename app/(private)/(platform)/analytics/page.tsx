import { DonutPie } from '@/components/charts/donut-pie';
import { SimpleLine } from '@/components/charts/simple-line'
import { AreaChart } from '@/components/charts/area-chart';
import { ChartBar } from '@/components/charts/chart-bar';
import { getAnalyticsData } from './actions';

export default async function AnalyticsPage() {
  const {
    sources,
    hottestDays,
    hottestHours,
    weeklyTrends,
    longTermTrends
  } = await getAnalyticsData()

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>

      {/* Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-1">
          <h2 className="text-lg font-semibold mb-2">Booking Source</h2>
          <DonutPie data={sources} />
        </div>
        <div className="col-span-1 lg:col-span-2">
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

      {/* 3 Month Trend */}
      <div>
        <h2 className="text-lg font-semibold mb-2">3 Month Trend</h2>
        <AreaChart data={longTermTrends} />
      </div>

      {/* Hottest Times Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Busiest Days</h2>
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
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Busiest Hours</h2>
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
      </div>
    </div>
  )
}