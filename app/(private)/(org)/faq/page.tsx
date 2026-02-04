import PageWrapper from "@/components/private/page-wrapper"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Domande frequenti su Smartables.',
}

export default function FaqPage() {
  return (
    <PageWrapper>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Guida veloce</h1>
        <p className="text-muted-foreground">Trova risposte alle domande più comuni su Smartables.</p>
      </div>
    </PageWrapper>
  )
}
