'use client'

import React from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet'
import { Button } from '../ui/button'

const ActionSheet = ({
  title,
  description,
  children,
  formAction,
  actionButtons,
  open,
  onOpenChange
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  formAction?: (formData: FormData) => void;
  actionButtons?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {

  const ContentWrapper = formAction ? 'form' : 'div';
  const contentProps = formAction ? { action: formAction } : {};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-background flex flex-col gap-0 p-0 overflow-hidden">
        <SheetHeader className="p-6 border-b bg-white">
          <SheetTitle className='text-2xl font-bold tracking-tight text-foreground'>{title}</SheetTitle>
          <SheetDescription className='text-muted-foreground font-medium'>
            {description}
          </SheetDescription>
        </SheetHeader>

        <ContentWrapper {...contentProps} className="flex flex-col flex-1 overflow-hidden bg-zinc-50/50">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {children}
          </div>

          <div className="flex justify-end gap-3 p-6 border-t mt-auto bg-white">
            {formAction && (
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl px-6">Annulla</Button>
            )}
            {actionButtons}
          </div>
        </ContentWrapper>
      </SheetContent>
    </Sheet>
  )
}

export default ActionSheet