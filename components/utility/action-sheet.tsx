'use client'

import React from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet'
import { Button } from '../ui/button'

const ActionSheet = ({
  title,
  description,
  children,
  formAction,
  submitButton,
  open,
  onOpenChange
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  formAction: (formData: FormData) => void;
  submitButton: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col gap-0 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {description}
          </SheetDescription>
        </SheetHeader>

        <form action={formAction} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {children}
          </div>

          <div className="flex justify-end gap-2 p-4 border-t bg-background mt-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            {submitButton}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default ActionSheet