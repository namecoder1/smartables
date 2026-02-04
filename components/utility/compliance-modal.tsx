"use client"

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DocumentForm } from "@/app/(private)/(site)/compliance/document-form"

interface ComplianceModalProps {
  locationId: string
  trigger?: React.ReactNode
}

export const ComplianceModal = ({ locationId, trigger }: ComplianceModalProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verifica Aziendale</DialogTitle>
          <DialogDescription>
            Carica i documenti necessari per attivare le funzionalità avanzate.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <DocumentForm locationId={locationId} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
