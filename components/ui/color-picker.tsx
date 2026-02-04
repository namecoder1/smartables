'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Sketch } from '@uiw/react-color'
import { cn } from '@/lib/utils'
import { ColorPickerProps } from '@/types/components'

const ColorPicker = ({ color, onChange, label, shape = 'square' }: ColorPickerProps) => {
  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "padding-0 border flex items-center justify-between flex-1 w-full min-w-28 text-right font-normal",
              !color && "text-muted-foreground"
            )}
            style={shape === 'circle' ? { backgroundColor: color, borderColor: color } : {}}
          >
            <div
              className="w-5 h-5 mr-2 border-r p-4"
              style={{ backgroundColor: color }}
            />
            <span className="truncate flex-1 pr-2">{color}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start">
          <div className="rounded-xl overflow-hidden shadow-2xl bg-white dark:bg-zinc-950 p-2 border">
            <Sketch
              color={color}
              onChange={(color) => onChange(color.hex)}
              style={{
                width: '300px',
                background: 'transparent',
                boxShadow: 'none'
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default ColorPicker
