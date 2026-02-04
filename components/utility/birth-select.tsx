import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { it } from "date-fns/locale"
import { format } from "date-fns"

export function BirthSelect({
  value,
  onChange,
  fromYear = 1900,
  toYear = new Date().getFullYear()
}: {
  value: string;
  onChange: (value: string) => void;
  fromYear?: number;
  toYear?: number;
}) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(value ? new Date(value) : undefined)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id="date"
          className="justify-start font-normal w-full"
        >
          {value ? format(new Date(value), "PPP", { locale: it }) : "Seleziona una data"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          captionLayout="dropdown"
          fromYear={fromYear}
          toYear={toYear}
          locale={it}
          onSelect={(date) => {
            setDate(date)
            setOpen(false)
            onChange(date?.toISOString() || "")
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
