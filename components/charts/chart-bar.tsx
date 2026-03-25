"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "A stacked bar chart with a legend"

interface ChartBarProps {
  data: any[]
  title?: string
  config: ChartConfig
  dataKeyX: string
  dataKeyY: string
  fill?: string
}

export function ChartBar({ data, title, config, dataKeyX, dataKeyY, fill = "var(--chart-1)" }: ChartBarProps) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b-2 py-5 flex items-center gap-3">
        <CardTitle className="text-lg font-bold tracking-tight">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={dataKeyX}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar
              dataKey={dataKeyY}
              fill={fill}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>

    </Card>
  )
}
