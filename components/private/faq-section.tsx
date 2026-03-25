import { getFaqsByTopic, type SanityFaq } from "@/utils/sanity/queries"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { HelpCircle } from "lucide-react"

import { Dialog, DialogTitle, DialogContent, DialogHeader, DialogTrigger } from "../ui/dialog"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"

type FaqSectionProps = {
  topic: string
  title?: string
  faqs?: SanityFaq[]
  className?: string
}

export function FaqContent({ 
  faqs, 
  title, 
  className,
  variant = 'default'
}: { 
  faqs: SanityFaq[], 
  title: string, 
  className?: string,
  variant?: 'default' | 'minimized' 
}) {
  if (faqs.length === 0) return null

  if (variant === 'minimized') {
    return (
      <Dialog>
        <DialogTrigger className={cn('flex items-center gap-2', className)} asChild>
          <Button type="button" variant="outline" >
            <HelpCircle className='w-5 h-5 cursor-pointer' />
            {title}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="tracking-tight">Domande frequenti</DialogTitle>
          </DialogHeader>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={`item-${faq.id}`} className='border-b last:border-0 py-1'>
                <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-primary transition-colors py-4 text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </DialogContent>
      </Dialog>
    )
  }


  return (
    <div className={`bg-card w-full text-card-foreground rounded-[32px] border-2 shadow-sm overflow-hidden h-fit ${className || ''}`}>
      <div className='px-6 py-6 border-b-2 bg-muted/5'>
        <div className='flex items-center gap-2'>
          <HelpCircle className='w-5 h-5 text-primary' />
          <h3 className='text-xl font-bold tracking-tight'>{title}</h3>
        </div>
      </div>
      <div className='p-6 pt-2'>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={`item-${faq.id}`} className='border-b last:border-0 py-1'>
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

export default async function FaqSection({ topic, title = "Supporto & FAQ", faqs: externalFaqs, className }: FaqSectionProps) {
  const faqs = externalFaqs ?? await getFaqsByTopic(topic)
  return <FaqContent faqs={faqs} title={title} className={className} />
}


