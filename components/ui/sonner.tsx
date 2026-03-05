"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5" />,
        error: <OctagonXIcon className="size-5" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "rgb(34 197 94)",
          "--success-text": "#fff",
          "--success-border": "rgb(34 197 94)",
          "--error-bg": "var(--destructive)",
          "--error-text": "#fff",
          "--error-border": "var(--destructive)",
          "--info-bg": "rgb(59 130 246)",
          "--info-text": "#fff",
          "--info-border": "rgb(59 130 246)",
          "--warning-bg": "rgb(249 115 22)",
          "--warning-text": "#fff",
          "--warning-border": "rgb(249 115 22)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
