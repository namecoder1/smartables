'use client'

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CircleQuestionMark, FileText } from "lucide-react"
import Link from "next/link"

interface ComplianceAlertProps {
  context: 'sidebar' | 'page'
  status: string
  managedAccountId: string | null
  complianceStatus?: string
}

export default function ComplianceAlert({ context = 'sidebar', status, managedAccountId, complianceStatus }: ComplianceAlertProps) {


  // Logic: Show alert if Organization is ACTIVE (phone verified) but no Managed Account/Docs yet.

  if (status !== 'active' && status !== 'verified' && status !== 'pending' && status !== 'pending_verification') return null // Updated to allow pending states for MVP

  // If already has managed account (and presumably docs), don't show prompt.
  if (managedAccountId) return null

  // If regulatory requirements are approved, don't show prompt.
  if (complianceStatus === 'approved') return null

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
    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900/50 dark:bg-orange-950/20">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary dark:bg-primary/50 dark:text-primary">
          <CircleQuestionMark className="h-5 w-5" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-bold tracking-tight text-lg text-foreground">
            Verifica il tuo Numero Locale
          </h3>
          <p className="text-sm text-muted-foreground">
            Carica i documenti aziendali per collegare un indirizzo fisico al tuo numero.
          </p>
        </div>
      </div>

      <Button asChild size="sm" className="w-full sm:w-auto">
        <Link href="/compliance" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Carica Documenti
        </Link>
      </Button>
    </div>
  )
}
