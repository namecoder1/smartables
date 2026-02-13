import PageWrapper from "@/components/private/page-wrapper"
import { Metadata } from "next"
import { HelpCircle } from "lucide-react"
import { getAllFaqsGroupedByTopic } from "@/utils/sanity/queries"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: "FAQ",
  description: "Risposte alle domande più frequenti su Smartables.",
}

export const revalidate = 60

export default async function FaqsPage() {
  const topicGroups = await getAllFaqsGroupedByTopic()

  return (
    <PageWrapper>
      {/* Hero */}
      <div className="max-w-3xl xl:hidden">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Domande Frequenti</h1>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Trova risposte rapide alle domande più comuni su Smartables. Se non trovi quello
          che cerchi, consulta le nostre guide pratiche o contatta il supporto.
        </p>
      </div>

      {/* FAQ Sections by Topic */}
      {topicGroups.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessuna FAQ disponibile al momento.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {topicGroups.map((group) => (
            <div key={group.topic} className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold tracking-tight">{group.label}</h2>
              <div className="rounded-xl border border-border bg-card">
                <Accordion type="single" collapsible className="w-full">
                  {group.faqs.map((faq) => (
                    <AccordionItem key={faq._id} value={`item-${faq._id}`} className="px-5">
                      <AccordionTrigger className="text-sm text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}