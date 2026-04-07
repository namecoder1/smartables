import PageWrapper from "@/components/private/page-wrapper"
import { Metadata } from "next"
import { getAllFaqsGroupedByTopic } from "@/utils/sanity/queries"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { getFaqIcon } from "@/utils/sanity/icons"

export const metadata: Metadata = {
  title: "FAQs",
  description: "Trova risposte rapide alle domande più comuni su Smartables. Se non trovi quello che cerchi, consulta le nostre guide pratiche o contatta il supporto.",
}

export const revalidate = 60

export default async function FaqsPage() {
  const topicGroups = await getAllFaqsGroupedByTopic()

  return (
    <PageWrapper>
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight">Domande Frequenti</h2>
        <p className="text-muted-foreground max-w-3xl">
          Trova risposte rapide alle domande più comuni su Smartables. Se non trovi quello
          che cerchi, consulta le nostre guide pratiche o contatta il supporto.
        </p>
      </div>

      {/* FAQ Sections by Topic */}
      {topicGroups.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessuna FAQ disponibile al momento.</p>
      ) : (
        <div className="flex flex-col divide-y-2 space-y-6">
          {topicGroups.map((group) => (
            <div key={group.topic} className="flex flex-col gap-6 pb-6">
              <h2 className="text-2xl font-bold tracking-tighter capitalize">{group.label}</h2>
              <div className="grid grid-cols-3 gap-6">
                {group.faqs.map((faq) => {
                  const Icon = getFaqIcon(faq.icon)

                  return (
                    <div key={faq.id} className="flex flex-row gap-3 items-start">
                      <div className="h-10 w-10 flex items-center justify-center border rounded-lg bg-white">
                        <Icon size={20} />
                      </div>
                      <div className="flex flex-col flex-1 items-start gap-2">
                        <h3 className="text-xl mt-1 font-bold tracking-tight">{faq.question}</h3>
                        <p className="text-muted-foreground text-lg">{faq.answer}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}