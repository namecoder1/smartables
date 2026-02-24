"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { addDays, format } from "date-fns"
import { CalendarIcon, RotateCcw } from "lucide-react"
import { type DateRange } from "react-day-picker"

export function RangePicker({
  date,
  onChange,
  onReset,
}: {
  date: DateRange | undefined
  onChange: (date: DateRange | undefined) => void
  onReset?: () => void
}) {

  return (
    <Field className="mx-auto w-fit">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date-picker-range"
            className="justify-between px-2.5 font-normal gap-2"
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL")} -{" "}
                    {format(date.to, "LLL y")}
                  </>
                ) : (
                  format(date.from, "LLL y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex flex-col" align="end">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onChange}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
          />
          {onReset && (
            <div className="p-3 border-t bg-muted/20">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8 text-xs font-medium"
                onClick={onReset}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Ripristina default (Ultimi 30gg)
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </Field>
  )
}
