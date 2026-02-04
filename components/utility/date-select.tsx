"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { it } from "date-fns/locale"

export function DateSelect({ value, onValueChange }: { value: Date | undefined; onValueChange: (value: Date) => void }) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(value ? new Date(value) : undefined)


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id="date-picker-simple"
          className="justify-start font-normal w-full"
        >
          {date ? format(date, "PPP", { locale: it }) : <span>Seleziona una data</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => {
            setDate(date)
            setOpen(false)
            onValueChange(date || new Date())
          }}
          defaultMonth={date}
          locale={it}
        />
      </PopoverContent>
    </Popover>
  )
}
