"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  label?: string
  className?: string
}

export function TimePicker({ value, onChange, label = "Time", className }: TimePickerProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <Label className="px-1 text-xs text-muted-foreground">{label}</Label>}
      <Input
        type="time"
        step="60" // 1 minute precision usually enough
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full bg-background"
      />
    </div>
  )
}
