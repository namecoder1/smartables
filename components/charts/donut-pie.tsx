"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "A donut chart with text"

interface Booking {
  source: string
  [key: string]: any
}

interface Props {
  data: Booking[]
}

export function DonutPie({ data }: Props) {

  const processedData = React.useMemo(() => {
    const counts = {
      manual: 0,
      whatsapp_auto: 0,
    }

    if (data) {
      data.forEach(b => {
        if (b.source === 'manual') counts.manual++
        else if (b.source === 'whatsapp_auto') counts.whatsapp_auto++
      })
    }

    return [
      {
        browser: "manual",
        visitors: counts.manual,
        fill: "var(--chart-1)",
        label: "Manuali"
      },
      {
        browser: "whatsapp_auto",
        visitors: counts.whatsapp_auto,
        fill: "var(--chart-2)",
        label: "WhatsApp"
      }
    ]
  }, [data])

  const totalVisitors = React.useMemo(() => {
    return processedData.reduce((acc, curr) => acc + curr.visitors, 0)
  }, [processedData])

  const chartConfig = React.useMemo(() => {
    return {
      visitors: { label: "Bookings" },
      manual: {
        label: "Manuali",
        color: "var(--chart-1)"
      },
      whatsapp_auto: {
        label: "WhatsApp",
        color: "var(--chart-2)"
      }
    } satisfies ChartConfig
  }, [])

  if (processedData.length === 0) {
    return <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">No data</div>
  }

  return (
    <Card className="flex flex-col border-none shadow-none rounded-3xl pt-0">
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[200px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={processedData}
              dataKey="visitors"
              nameKey="browser"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          prenotazion{totalVisitors === 1 ? "e" : "i"}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="grid grid-cols-2 items-center text-sm gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-chart-1" />
              <p className="text-muted-foreground">Manuali</p>
            </div>
            <p className="font-medium text-lg">
              {processedData.find(b => b.browser === "manual")?.visitors || 0}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-chart-2" />
              <p className="text-muted-foreground">WhatsApp</p>
            </div>
            <p className="font-medium text-lg">
              {processedData.find(b => b.browser === "whatsapp_auto")?.visitors || 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
