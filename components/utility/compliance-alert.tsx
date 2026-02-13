'use client'

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CircleQuestionMark, FileText } from "lucide-react"
import Link from "next/link"

interface ComplianceAlertProps {
  context: 'sidebar' | 'page'
  status: string
  managedAccountId: string | null
}

export default function ComplianceAlert({ context = 'sidebar', status, managedAccountId }: ComplianceAlertProps) {


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
