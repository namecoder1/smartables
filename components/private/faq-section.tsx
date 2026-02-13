import { getFaqsByTopic, type SanityFaq } from "@/utils/sanity/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

type FaqSectionProps = {
  topic: string
  title?: string
  faqs?: SanityFaq[]
}

export default async function FaqSection({ topic, title = "Domande Frequenti", faqs: externalFaqs }: FaqSectionProps) {
  const faqs = externalFaqs ?? await getFaqsByTopic(topic)

  if (faqs.length === 0) return null

  return (
    <Card className="h-fit gap-2">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {faqs.map((faq) => (
          <Accordion key={faq._id} type="single" collapsible className="w-full">
            <AccordionItem value={`item-${faq._id}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </CardContent>
    </Card>
  )
}
