"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { TimePicker } from "@/components/ui/time-picker"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { WeeklyHours } from "@/types/general"

const DAYS = [
  "lunedì",
  "martedì",
  "mercoledì",
  "giovedì",
  "venerdì",
  "sabato",
  "domenica",
]

interface WeeklyHoursSelectorProps {
  initialData?: WeeklyHours
  context: 'onboarding' | 'settings'
  onChange?: (hours: WeeklyHours) => void
}

export function WeeklyHoursSelector({ initialData, context, onChange }: WeeklyHoursSelectorProps) {
  // Initial state: empty slots for all days or use initialData
  const [schedule, setSchedule] = useState<WeeklyHours>(
    initialData || DAYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {})
  )

  // Use ref to capture latest onChange without causing re-renders
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (onChangeRef.current) {
      onChangeRef.current(schedule)
    }
  }, [schedule])


  const addSlot = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: [
        ...(prev[day] || []),
        { id: crypto.randomUUID(), open: "09:00", close: "17:00" },
      ],
    }))
  }

  const removeSlot = (day: string, slotId: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].filter((slot) => slot.id !== slotId),
    }))
  }

  const updateSlot = (
    day: string,
    index: number,
    field: "open" | "close",
    value: string
  ) => {
    setSchedule((prev) => {
      const newSlots = [...prev[day]]
      newSlots[index] = { ...newSlots[index], [field]: value }
      return { ...prev, [day]: newSlots }
    })
  }

  if (context === 'settings') {
    return (
      <div className="space-y-4">
        <input type="hidden" name="openingHours" value={JSON.stringify(schedule)} />

        <div className="rounded-xl dark:bg-input/30 bg-background border p-4">
          {DAYS.map((day) => (
            <div
              key={day}
              className="mb-4 flex flex-col gap-2 border-b pb-4 last:mb-0 last:border-0 last:pb-0"
            >
              <div className="flex items-center justify-between">
                <span className="w-24 font-medium capitalize">{day}</span>
                <div className="flex items-center gap-2">
                  {schedule[day]?.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSchedule((prev) => ({ ...prev, [day]: [] }))}
                      className="h-7 text-xs text-muted-foreground hover:text-destructive"
                    >
                      Segna chiuso
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSlot(day)}
                    className="h-7 text-xs"
                  >
                    <Plus className="mr-1 h-3 w-3" /> Aggiungi Orari
                  </Button>
                </div>
              </div>

              {schedule[day]?.length === 0 && (
                <span className="text-sm italic text-muted-foreground">Chiuso</span>
              )}

              <AnimatePresence initial={false}>
                {schedule[day]?.map((slot, index) => (
                  <motion.div
                    key={slot.id}
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-end gap-2 overflow-hidden px-1"
                  >
                    <div className="flex flex-1 items-end gap-2 py-1">
                      <TimePicker
                        value={slot.open}
                        onChange={(val) => updateSlot(day, index, "open", val)}
                        label="Apertura"
                        context={context}
                        className="flex-1"
                      />
                      <TimePicker
                        value={slot.close}
                        onChange={(val) => updateSlot(day, index, "close", val)}
                        label="Chiusura"
                        context={context}
                        className="flex-1"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mb-1.5 text-destructive hover:text-destructive/90"
                      onClick={() => removeSlot(day, slot.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 border-2 bg-white rounded-xl border-neutral-200">
      <input type="hidden" name="openingHours" value={JSON.stringify(schedule)} />

      <ScrollArea className="h-[400px] px-4">
        {DAYS.map((day) => (
          <div
            key={day}
            className="mb-4 flex flex-col gap-2 border-b border-neutral-200 first:pt-4 pb-4 last:mb-0 last:border-0 last:pb-4 p-1"
          >
            <div className="flex items-center justify-between">
              <span className="w-24 font-medium capitalize text-black">{day}</span>
              <div className="flex items-center gap-2">
                {schedule[day]?.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setSchedule((prev) => ({ ...prev, [day]: [] }))}
                    className="h-7 text-xs bg-destructive hover:bg-destructive/90"
                  >
                    Segna Chiuso
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addSlot(day)}
                  className="h-7 text-xs border border-neutral-200! text-black hover:text-black"
                >
                  <Plus className="h-3 w-3" /> Aggiungi Orari
                </Button>
              </div>
            </div>

            {schedule[day]?.length === 0 && (
              <span className="text-sm italic text-muted-foreground">Chiuso</span>
            )}

            <AnimatePresence initial={false}>
              {schedule[day]?.map((slot, index) => (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-end gap-2 overflow-hidden px-1"
                >
                  <div className="flex flex-1 items-end gap-2 py-1">
                    <TimePicker
                      value={slot.open}
                      onChange={(val) => updateSlot(day, index, "open", val)}
                      label="Apertura"
                      context="onboarding"
                      className="flex-1"
                    />
                    <TimePicker
                      value={slot.close}
                      onChange={(val) => updateSlot(day, index, "close", val)}
                      label="Chiusura"
                      context="onboarding"
                      className="flex-1"
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    className="mb-1 bg-destructive hover:bg-destructive/90"
                    onClick={() => removeSlot(day, slot.id)}
                  >
                    <Trash2 className="h-4 w-4" color="white" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </ScrollArea>
    </div>
  )
}
