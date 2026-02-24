'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface RushHoursChartProps {
  data: {
    hour: string
    current: number
    previous: number
  }[]
  showComparison: boolean
}

const chartConfig = {
  current: {
    label: "Mese corrente",
    color: "#FE950F",
  },
  previous: {
    label: "Mese scorso",
    color: "#FE950F",
  },
} satisfies ChartConfig

const RushHoursChart = ({ data, showComparison }: RushHoursChartProps) => {
  return (
    <div className="h-[300px] pb-8 w-full">
      <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
        <BarChart
          data={data}
          margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
          barGap={4}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="hour"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            interval={0}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey="current"
            fill="var(--color-current)"
            radius={[4, 4, 0, 0]}
            barSize={12}
          />
          {showComparison && (
            <Bar
              dataKey="previous"
              fill="var(--color-previous)"
              radius={[4, 4, 0, 0]}
              barSize={12}
            />
          )}
        </BarChart>
      </ChartContainer>

      <div className="flex items-center gap-6 my-4 pb-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FE950F]" />
          <span className="text-sm text-muted-foreground font-medium">Mese corrente</span>
        </div>
        {showComparison && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FE950F]" />
            <span className="text-sm text-muted-foreground font-medium">Mese scorso</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default RushHoursChart
