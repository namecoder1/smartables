"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ResponsiveDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function ResponsiveDialog({
  isOpen,
  setIsOpen,
  title,
  description,
  children,
  className,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={cn("sm:max-w-[425px]", className)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent className="pb-4 max-h-[96vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description && (
            <DrawerDescription>
              {description}
            </DrawerDescription>
          )}
        </DrawerHeader>
        <ScrollArea className="px-4 overflow-y-auto">
          {children}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  )
}
