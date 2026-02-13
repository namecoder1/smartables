"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "./switch"
import { cn } from "@/lib/utils"

export function ModeToggle({
  variant = 'default',
  className
}: {
  variant?: 'default' | 'mini',
  className?: string
}) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" className="w-1/2 opacity-0">
        {/* Placeholder to prevent layout shift */}
        <span className="sr-only">Loading theme toggle</span>
      </Button>
    )
  }
  
  if (variant === 'mini') {
    return (
      <div className={cn("flex items-center gap-2 p-2 justify-between", className)} >
        <p className="text-sm text-foreground">Dark mode</p>
        <Switch checked={theme === 'dark'} onCheckedChange={(value) => setTheme(value ? 'dark' : 'light')} />
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn(className)}>
          <div className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90 flex items-center gap-2">
            <Sun className="h-[1.2rem] w-[1.2rem]" />
            <p>Light</p>
          </div>
          <div className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0 flex items-center gap-2">
            <Moon className="h-[1.2rem] w-[1.2rem]" />
            <p>Dark</p>
          </div>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
