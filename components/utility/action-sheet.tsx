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
      <SheetContent className="w-full sm:max-w-xl bg-background dark:bg-[#1a1813] flex flex-col gap-0 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {description}
          </SheetDescription>
        </SheetHeader>

        <ContentWrapper {...contentProps} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {children}
          </div>

          <div className="flex justify-end gap-2 p-4 border-t mt-auto">
            {formAction && (
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            )}
            {actionButtons}
          </div>
        </ContentWrapper>
      </SheetContent>
    </Sheet>
  )
}

export default ActionSheet