"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  label?: string
  className?: string,
  context: 'onboarding' | 'settings'
}

export function TimePicker({ value, onChange, label = "Time", className, context }: TimePickerProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <Label className={context === 'onboarding' ? 'px-1 text-xs text-black' : 'px-1 text-xs text-foreground/80'}>{label}</Label>}
      <Input
        type="time"
        step="60" // 1 minute precision usually enough
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn("w-full", context === 'onboarding' ? 'text-black! border-neutral-200 bg-[#f4f4f480]!' : 'bg-background')}
      />
    </div>
  )
}
