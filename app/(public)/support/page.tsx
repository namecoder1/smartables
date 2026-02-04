'use client'

import Link from 'next/link'
import { Search, Book, User, CreditCard, MessageCircle, Mail, ArrowRight, Phone, Clock, Shield, Zap, HelpCircle, FileText, Settings, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { motion } from 'framer-motion'

const SupportPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <Hero />
      <StatsSection />
      <HelpTopics />
      <PopularArticlesSection />
      <ContactSection />
      <FAQSection />
      <CTASection />
    </div>
  )
}

const Hero = () => {
  return (
    <section className="bg-[#ff9f29] py-20 md:py-32 relative overflow-hidden">

      <div className="container px-4 md:px-6 mx-auto relative z-10 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Come possiamo aiutarti?
          </h1>
          <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
            Trova risposte immediate nelle nostre guide o contatta il nostro team di supporto dedicato.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl mx-auto relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white w-5 h-5" />
          <Input
            className="pl-12 h-14 bg-white/10 border-white/20 text-white placeholder:text-white rounded-full text-lg"
            placeholder="Cerca un argomento (es. 'configurazione menu', 'fatturazione')..."
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-white"
        >
          <span>Ricerche popolari:</span>
          <Link href="#" className="text-white hover:underline underline-offset-2 transition-colors">Prenotazioni</Link>
          <span>•</span>
          <Link href="#" className="text-white hover:underline underline-offset-2 transition-colors">WhatsApp Bot</Link>
          <span>•</span>
          <Link href="#" className="text-white hover:underline underline-offset-2 transition-colors">Menu QR</Link>
          <span>•</span>
          <Link href="#" className="text-white hover:underline underline-offset-2 transition-colors">Fatturazione</Link>
        </motion.div>
      </div>
    </section>
  )
}

const StatsSection = () => {
  const stats = [
    { icon: Clock, value: "< 4 ore", label: "Tempo medio risposta" },
    { icon: MessageCircle, value: "98%", label: "Soddisfazione clienti" },
    { icon: FileText, value: "150+", label: "Articoli di supporto" },
    { icon: Shield, value: "24/7", label: "Bot WhatsApp attivo" },
  ]

  return (
    <section className="py-12 bg-gray-50 border-b border-gray-100">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-200/40 text-primary mb-3">
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

const HelpTopics = () => {
  const topics = [
    {
      icon: Book,
      color: "blue",
      title: "Primi passi",
      description: "Tutto ciò che serve per configurare il tuo ristorante.",
      items: ["Configurazione account", "Importazione menu", "Setup stampanti", "Prima prenotazione"]
    },
    {
      icon: User,
      color: "green",
      title: "Account & Team",
      description: "Gestisci permessi, utenti e impostazioni profilo.",
      items: ["Aggiungi collaboratori", "Permessi e ruoli", "Sicurezza account", "Multi-sede"]
    },
    {
      icon: CreditCard,
      color: "purple",
      title: "Fatturazione",
      description: "Gestisci abbonamenti, metodi di pagamento e fatture.",
      items: ["Storico fatture", "Modifica pagamento", "Piani e upgrade", "Disdetta"]
    },
    {
      icon: Smartphone,
      color: "orange",
      title: "App Mobile",
      description: "Guida completa all'utilizzo dell'app per lo staff.",
      items: ["Download app", "Notifiche push", "Gestione ordini", "Sincronizzazione"]
    },
    {
      icon: MessageCircle,
      color: "teal",
      title: "WhatsApp Bot",
      description: "Configura e ottimizza il tuo assistente WhatsApp.",
      items: ["Attivazione bot", "Risposte automatiche", "Prenotazioni via chat", "Statistiche"]
    },
    {
      icon: Settings,
      color: "gray",
      title: "Impostazioni",
      description: "Personalizza ogni aspetto della tua piattaforma.",
      items: ["Orari apertura", "Gestione tavoli", "Notifiche email", "Integrazioni"]
    }
  ]

  const colorClasses: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-blue-100", text: "text-blue-600" },
    green: { bg: "bg-green-100", text: "text-green-600" },
    purple: { bg: "bg-purple-100", text: "text-purple-600" },
    orange: { bg: "bg-orange-100", text: "text-orange-600" },
    teal: { bg: "bg-teal-100", text: "text-teal-600" },
    gray: { bg: "bg-gray-100", text: "text-gray-600" },
  }

  return (
    <section className="py-20 bg-white">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-black tracking-tight mb-4">Esplora per argomento</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Trova rapidamente le risposte che cerchi navigando per categoria
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow border-gray-200 cursor-pointer group h-full bg-neutral-50">
                <CardHeader>
                  <div className={`w-12 h-12 ${colorClasses[topic.color].bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <topic.icon className={`w-6 h-6 ${colorClasses[topic.color].text}`} />
                  </div>
                  <CardTitle className="text-gray-900">{topic.title}</CardTitle>
                  <CardDescription className="text-gray-500">{topic.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-gray-600">
                    {topic.items.map((item, i) => (
                      <li key={i} className="hover:text-primary transition-colors flex items-center gap-2">
                        <ArrowRight className="w-3 h-3" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

const PopularArticlesSection = () => {
  const articles = [
    { title: "Come configurare il menu digitale", category: "Primi passi", readTime: "3 min" },
    { title: "Gestire le prenotazioni dal pannello", category: "Prenotazioni", readTime: "5 min" },
    { title: "Attivare il bot WhatsApp", category: "WhatsApp", readTime: "4 min" },
    { title: "Aggiungere un nuovo membro del team", category: "Team", readTime: "2 min" },
    { title: "Scaricare le fatture mensili", category: "Fatturazione", readTime: "2 min" },
    { title: "Configurare le notifiche email", category: "Impostazioni", readTime: "3 min" },
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container px-4 md:px-6 mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Articoli più letti</h2>
          <p className="text-gray-600">Le guide più consultate dai nostri utenti</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          {articles.map((article, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link href="#" className="block bg-white p-5 border border-gray-200 hover:shadow-md hover:border-primary/40 transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-medium text-primary mb-2 block">{article.category}</span>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{article.readTime}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-8"
        >
          <button className="flex items-center gap-2 px-4 py-2 w-fit mx-auto rounded-full border-gray-300 text-gray-700 hover:bg-gray-100">
            Vedi tutti gli articoli
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  )
}

const ContactSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container px-4 md:px-6 mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Hai ancora bisogno di aiuto?</h2>
          <p className="text-gray-600">Il nostro team è sempre pronto ad assisterti</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-linear-to-br from-blue-50 to-blue-100 p-8 border border-blue-200 flex flex-col items-center text-center h-full">
              <div className="w-16 h-16 bg-blue-600 flex items-center justify-center mb-6">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-6 flex-1">
                Chatta in tempo reale con un operatore. Disponibile Lun-Ven, 9:00 - 18:00.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                Avvia Chat
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="bg-linear-to-br from-emerald-50 to-emerald-100 p-8 border border-emerald-200 flex flex-col items-center text-center h-full">
              <div className="w-16 h-16 bg-emerald-600 flex items-center justify-center mb-6">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Chiamaci</h3>
              <p className="text-gray-600 mb-6 flex-1">
                Parla direttamente con il nostro team. Per piani Business e superiori.
              </p>
              <Button variant="outline" className="w-full bg-emerald-600! border-emerald-300 text-white hover:bg-emerald-50 font-semibold">
                +39 02 1234 5678
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="bg-linear-to-br from-purple-50 to-purple-100 p-8 border border-purple-200 flex flex-col items-center text-center h-full">
              <div className="w-16 h-16 bg-purple-600 flex items-center justify-center mb-6">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600 mb-6 flex-1">
                Scrivi al nostro supporto. Risposta garantita entro 24 ore lavorative.
              </p>
              <Button variant="outline" className="w-full bg-purple-600! border-purple-300 text-white hover:bg-purple-50 font-semibold">
                support@smartables.it
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

const FAQSection = () => {
  const faqs = [
    {
      question: "Quanto tempo ci vuole per ricevere una risposta?",
      answer: "Il nostro team risponde in media entro 4 ore lavorative. Per i clienti Business, garantiamo una risposta entro 2 ore."
    },
    {
      question: "Posso richiedere una demo personalizzata?",
      answer: "Certamente! Puoi prenotare una demo gratuita di 30 minuti con un nostro esperto. Ti mostreremo tutte le funzionalità più adatte alle tue esigenze."
    },
    {
      question: "È disponibile supporto in italiano?",
      answer: "Assolutamente sì. Tutto il nostro team di supporto è italiano e disponibile per assisterti nella tua lingua."
    },
    {
      question: "Offrite formazione per il mio staff?",
      answer: "Sì, per i piani Business offriamo sessioni di formazione dedicate per il tuo team. Per gli altri piani, abbiamo video tutorial e guide dettagliate."
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container px-4 md:px-6 mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Domande sul supporto</h2>
          <p className="text-gray-600">Risposte alle domande più comuni sul nostro servizio clienti</p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Accordion type="single" collapsible className="border border-gray-200 px-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                <AccordionItem value="item-1" className="border-b-0">
                  <AccordionTrigger className="text-gray-900 font-semibold text-lg hover:no-underline py-5 text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-base pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

const CTASection = () => {
  return (
    <section className="py-16 bg-gray-900">
      <div className="container px-4 md:px-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Supporto Premium
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Non hai trovato quello che cercavi?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Consulta le nostre FAQ complete o contattaci direttamente. Siamo qui per aiutarti.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base px-8 rounded-full bg-white text-gray-900 hover:bg-gray-100">
              <Link href="/pricing">
                Vedi i piani
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 rounded-full bg-transparent text-white border-white/30 hover:bg-white/10">
              <Link href="/contact">
                Contattaci
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default SupportPage