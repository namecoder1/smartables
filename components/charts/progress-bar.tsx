"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format, parseISO } from "date-fns"

interface Booking {
  booking_time: string
  guests_count: number
}

interface Props {
  data: Booking[]
}

export function BookingProgressChart({ data }: Props) {
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    const groups: Record<string, { count: number; guests: number; date: Date }> = {}
    let totalBookings = 0

    // 1. Group by "Day-Hour" (e.g. "5-20" for Friday 20:00)
    data.forEach((booking) => {
      const date = parseISO(booking.booking_time)
      // Key: DayOfWeek-Hour (0-23)
      const key = `${date.getDay()}-${date.getHours()}`

      if (!groups[key]) {
        groups[key] = { count: 0, guests: 0, date }
      }
      groups[key].count += 1
      groups[key].guests += booking.guests_count
      totalBookings += 1
    })

    // 2. Convert to array and sort
    const sortedGroups = Object.values(groups)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5

    // 3. Assign colors and calculate stats
    // Colors from dark to light
    const colors = [
      "bg-primary",
      "bg-primary/80",
      "bg-primary/60",
      "bg-primary/40",
      "bg-primary/20",
    ]

    return sortedGroups.map((group, index) => {
      return {
        id: `${index}`,
        label: format(group.date, "EEEE"), // Day name
        subLabel: format(group.date, "HH:mm"), // Time (e.g. 20:00)
        // Let's use specific format.
        displayTime: format(group.date, "HH:00"),
        count: group.count,
        guests: group.guests,
        percentage: Math.round((group.count / totalBookings) * 100),
        color: colors[index] || "bg-muted",
      }
    })
  }, [data])

  const daysOfWeek = {
    'Monday': 'Lunedì',
    'Tuesday': 'Martedì',
    'Wednesday': 'Mercoledì',
    'Thursday': 'Giovedì',
    'Friday': 'Venerdì',
    'Saturday': 'Sabato',
    'Sunday': 'Domenica',
  }

  return (
    <Card className="border-none bg-transparent shadow-none py-0 mt-0">
      {/* Top Segmented Bar */}
      <div className="flex h-4 w-full overflow-hidden rounded-full">
        {processedData.map((item) => (
          <div
            key={item.id}
            className={`${item.color}`}
            style={{ width: `${item.percentage}%` }}
          />
        ))}
        {/* Remainder (gray) if needed, but usually top 5 won't cover 100% of all bookings. 
            The design shows 100% width filled. 
            If we want to show relative to TOTAL, we need a gray "other" filler.
            If we want to represent just the distribution among these top ones, it changes logic.
            Ref image: "Sales Pipeline" often sums to 100% of the pipeline.
            Here "Top 5" might only be 30% of total bookings.
            I will add a filler for the remaining % to make it realistic 100% bar.
        */}
        {processedData.reduce((acc, item) => acc + item.percentage, 0) < 100 && (
          <div className="bg-muted flex-1" />
        )}
      </div>

      {/* List */}
      <div className="space-y-4 border-t pt-6">
        {processedData.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            {/* Left Label */}
            <div className="flex items-start gap-3">
              <div
                className={`mt-1.5 h-3 w-3 rounded-full ${item.color}`}
              />
              <div className="space-y-0.5">
                <p className="text-sm font-medium leading-none">
                  {daysOfWeek[item.label as keyof typeof daysOfWeek]} <span className="text-muted-foreground font-normal">alle {item.displayTime}</span>
                </p>
                <p className="text-muted-foreground text-xs">
                  {item.count} prenotazion{item.count === 1 ? "e" : "i"} ({item.guests} ospit{item.guests === 1 ? "o" : "i"})
                </p>
              </div>
            </div>

            {/* Right Progress */}
            <div className="flex items-center gap-3">
              <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${item.color}`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="text-muted-foreground text-sm w-8 text-right">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}

        {processedData.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-4">
            No booking data available.
          </div>
        )}
      </div>
    </Card>
  )
}