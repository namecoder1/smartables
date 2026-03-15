"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format, addDays, subDays } from "date-fns"
import { it } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateNavigatorProps {
  date: Date
  setDate: (date: Date) => void,
  variant: 'areas' | 'reservations'
}

export function DateNavigator({ date, setDate, variant }: DateNavigatorProps) {
  const [open, setOpen] = React.useState(false)

  if (variant === 'reservations') {
    return (
      <div className="gap-1 flex items-center">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setDate(subDays(date, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-fit justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: it }) : <span>Seleziona una data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                if (newDate) {
                  setDate(newDate)
                  setOpen(false)
                }
              }}
              initialFocus
              locale={it}
            />
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setDate(addDays(date, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center bg-[#ffffff] justify-between gap-2  p-2 pr-3 rounded-t-3xl border-2 border-b-0">
      <div className="border-2 p-1 rounded-xl bg-muted/50 gap-1 flex items-center">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setDate(subDays(date, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-fit justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: it }) : <span>Seleziona una data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                if (newDate) {
                  setDate(newDate)
                  setOpen(false)
                }
              }}
              initialFocus
              locale={it}
            />
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setDate(addDays(date, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Button
        onClick={() => setDate(new Date())}
      >
        Oggi
      </Button>
    </div>
  )
}
