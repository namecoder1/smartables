import { getFaqsByTopic, type SanityFaq } from "@/utils/sanity/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { HelpCircle } from "lucide-react"

type FaqSectionProps = {
  topic: string
  title?: string
  faqs?: SanityFaq[]
}

export function FaqContent({ faqs, title }: { faqs: SanityFaq[], title: string }) {
  if (faqs.length === 0) return null

  return (
    <div className='bg-card text-card-foreground rounded-[32px] border-2 shadow-sm overflow-hidden h-fit'>
      <div className='px-6 py-6 border-b-2 bg-muted/5'>
        <div className='flex items-center gap-2'>
          <HelpCircle className='w-5 h-5 text-primary' />
          <h3 className='text-lg font-bold tracking-tight'>{title}</h3>
        </div>
      </div>
      <div className='p-6 pt-2'>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq) => (
            <AccordionItem key={faq._id} value={`item-${faq._id}`} className='border-b last:border-0 py-1'>
              <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-primary transition-colors py-4 text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}

export default async function FaqSection({ topic, title = "Supporto & FAQ", faqs: externalFaqs }: FaqSectionProps) {
  const faqs = externalFaqs ?? await getFaqsByTopic(topic)
  return <FaqContent faqs={faqs} title={title} />
}


