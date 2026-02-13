'use client'

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, CircleQuestionMark, FileText } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"

interface ComplianceAlertProps {
  context: 'sidebar' | 'page'
  status: string
  managedAccountId: string | null
}

export default function ComplianceAlert({ context = 'sidebar', status, managedAccountId }: ComplianceAlertProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Logic: Show alert if Organization is ACTIVE (phone verified) but no Managed Account/Docs yet.

  // NOTE: In a real scenario, we would check the 'telnyx_regulatory_requirements' table status.
  // For now, if 'managedAccountId' is null, it means we haven't started the process.
  // OR we can pass a specific 'complianceStatus' prop.

  if (status !== 'active' && status !== 'verified' && status !== 'pending') return null // Updated to allow pending for MVP

  // If already has managed account (and presumably docs), don't show prompt.
  // Refine this logic based on actual DB status passed from parent.
  if (managedAccountId) return null

  if (context === 'sidebar') {
    return (
      <Alert
        variant="destructive"
        className="bg-card/10 dark:bg-card border-2 border-border/20 dark:border-border rounded-xl"
      >
        <AlertTitle className="mb-2 text-white dark:text-foreground font-bold! text-xl tracking-tighter">
          Documenti richiesti
        </AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <span className="text-white/70 dark:text-foreground">
            Per acquistare il tuo numero locale e attivare l'assistente AI,
            devi caricare i documenti aziendali richiesti dalla normativa vigente.
          </span>
          <Button asChild size="sm" className="w-fit ml-auto text-foreground">
            <Link href="/compliance" className="flex items-center gap-2 text-white">
              <FileText className="h-4 w-4" />
              Carica Documenti
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert
      variant="destructive"
      className="bg-orange-500/10 border-orange-500/50 text-orange-700 dark:text-orange-400 rounded-xl"
    >
      <AlertTitle
        className="mb-1 flex flex-col items-start"
      >
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-lg tracking-tight text-foreground">
            Verifica il tuo Numero Locale
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button>
                <CircleQuestionMark className="text-foreground" size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href="/compliance" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Carica Documenti
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-muted-foreground text-base font-medium">
          Carica i documenti aziendali per collegare un indirizzo fisico al tuo numero.
        </p>
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-2 ml-auto">
        <Button asChild size="sm" className="w-fit mt-2 bg-orange-600 hover:bg-orange-700 text-white border-none shadow-sm">
          <Link href="/compliance" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Carica Documenti
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
