"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DateTimePicker({ value, onChange }: { value?: Date, onChange?: (date?: Date) => void }) {
  const [open, setOpen] = React.useState(false)

  // Helper to handle time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange) return
    const timeValue = e.target.value
    if (!timeValue) return

    const [hours, minutes] = timeValue.split(':').map(Number)
    const newDate = value ? new Date(value) : new Date()
    newDate.setHours(hours)
    newDate.setMinutes(minutes)
    onChange(newDate)
  }

  // Helper to handle date change
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!onChange || !selectedDate) return
    
    const newDate = new Date(selectedDate)
    if (value) {
        // Preserve time from existing value
        newDate.setHours(value.getHours())
        newDate.setMinutes(value.getMinutes())
    } else {
        // Default to 10:30 if no previous time
        newDate.setHours(10)
        newDate.setMinutes(30)
    }
    onChange(newDate)
    setOpen(false)
  }

  return (
    <div className="flex w-full items-center justify-center gap-4">
      <div className="flex w-full flex-1 flex-col gap-3">
        <Label htmlFor="date-picker" className="px-1">
          Data
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker"
              className="w-full flex-1 justify-between font-normal"
            >
              {value ? value.toLocaleDateString() : "Select date"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              captionLayout="dropdown"
              onSelect={handleDateSelect}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex w-full flex-1 flex-col gap-3">
        <Label htmlFor="time-picker" className="px-1">
          Ora
        </Label>
        <Input
          type="time"
          id="time-picker"
          step="60"
          value={value ? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}` : "10:30"}
          onChange={handleTimeChange}
          className="bg-background appearance-none w-full [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  )
}
