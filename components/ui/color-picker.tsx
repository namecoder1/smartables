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
            <Button 
                variant="outline" 
                className={cn(
                    "padding-0 border-2",
                    shape === 'circle' ? "w-10 h-10 rounded-full" : "w-full justify-start text-left font-normal px-2",
                    !color && "text-muted-foreground"
                )}
                style={shape === 'circle' ? { backgroundColor: color, borderColor: color } : {}}
            >
                {shape === 'square' && (
                    <>
                        <div 
                            className="w-5 h-5 rounded-md mr-2 border border-border" 
                            style={{ backgroundColor: color }}
                        />
                        <span className="truncate flex-1">{color}</span>
                    </>
                )}
            </Button>
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
