import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, FileText } from "lucide-react"
import Link from "next/link"

interface ComplianceAlertProps {
  organizationId: string
  status: string
  managedAccountId: string | null
}

export default function ComplianceAlert({ organizationId, status, managedAccountId }: ComplianceAlertProps) {
  // Logic: Show alert if Organization is ACTIVE (phone verified) but no Managed Account/Docs yet.

  // NOTE: In a real scenario, we would check the 'telnyx_regulatory_requirements' table status.
  // For now, if 'managedAccountId' is null, it means we haven't started the process.
  // OR we can pass a specific 'complianceStatus' prop.

  if (status !== 'active') return null // Still needs to verify phone number first

  // If already has managed account (and presumably docs), don't show prompt. 
  // Refine this logic based on actual DB status passed from parent.
  if (managedAccountId) return null

  return (
    <Alert variant="destructive" className="bg-orange-50 text-orange-900 border-orange-200 dark:bg-orange-950 dark:text-orange-50 dark:border-orange-800">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="mb-2">Documenti richiesti per l'attivazione del numero</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Per acquistare il tuo numero locale e attivare l'assistente AI,
          devi caricare i documenti aziendali richiesti dalla normativa vigente.
        </span>
        <Button asChild size="sm" variant="outline" className="whitespace-nowrap bg-white text-orange-900 border-orange-300 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-50 dark:border-orange-700">
          <Link href="/compliance" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Carica Documenti
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
