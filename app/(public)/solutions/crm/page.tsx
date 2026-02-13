import Link from 'next/link'
import Image from 'next/image'
import { Check, Users, Database, Heart, LineChart, ArrowRight, Star, Gift, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Hero from '../hero'

const CrmPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans selection:bg-[#FF9710] selection:text-white">
      {/* Hero Section */}
      <Hero
        icon={<Users className="w-4 h-4" />}
        title="Smartables CRM"
        subtitle="Conosci i tuoi clienti, aumenta i profitti."
        description="Trasforma un cliente occasionale in un cliente fedele. Smartables centralizza i dati dei tuoi ospiti per offrirti insight potenti e azioni mirate."
        ctaText="Inizia Gratuito"
      />
      <Feature1Section />
      <Feature2Section />
      <CTASection />
    </div>
  )
}

const Feature1Section = () => {
  return (
    <section className="py-24 bg-white relative">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="p-3 bg-blue-50 w-fit rounded-2xl mb-6">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Database Clienti <br /> <span className="text-blue-600">Unificato</span>
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">
              Dimentica i fogli Excel sparsi. Smartables crea automaticamente una scheda cliente per ogni prenotazione,
              unificando i dati se gestisci più location.
            </p>
            <ul className="space-y-6">
              {[
                { text: "Riconoscimento automatico del cliente abituale", icon: <Search className="w-5 h-5 text-white" /> },
                { text: "Storico completo delle visite e delle spese", icon: <LineChart className="w-5 h-5 text-white" /> },
                { text: "Note condivise tra tutto lo staff", icon: <Users className="w-5 h-5 text-white" /> },
                { text: "Tag intelligente (VIP, Spendaccione, Business)", icon: <Star className="w-5 h-5 text-white" /> }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className="bg-blue-500 p-2 rounded-xl shadow-lg shadow-blue-200">
                    {item.icon}
                  </div>
                  <span className="text-lg font-medium text-gray-700">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-blue-100 rounded-[3rem] rotate-3 transform translate-x-4 translate-y-4 -z-10"></div>
            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border border-gray-100 aspect-square flex flex-col relative">
              {/* Mock UI for CRM Profile */}
              <div className="bg-linear-to-br from-blue-600 to-blue-800 p-8 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold">
                    MV
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Marco Visionario</h3>
                    <div className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm mt-2 backdrop-blur-md border border-white/10">
                      <Star className="w-3 h-3 fill-current" /> VIP Customer
                    </div>
                  </div>
                </div>
                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <div className="text-2xl font-bold">12</div>
                    <div className="text-xs opacity-70">Visite</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <div className="text-2xl font-bold">€850</div>
                    <div className="text-xs opacity-70">Spesa Tot.</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <div className="text-2xl font-bold">4.9</div>
                    <div className="text-xs opacity-70">Rating</div>
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 bg-white relative">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50">
                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Prossimo compleanno</p>
                      <p className="text-sm text-gray-500">12 Marzo (invia offerta)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50">
                    <div className="bg-red-100 p-2 rounded-lg text-red-600">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Preferenze</p>
                      <p className="text-sm text-gray-500">Tavolo vicino alla finestra, Vino Rosso</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const Feature2Section = () => {
  return (
    <section className="py-24 bg-gray-50 text-white relative overflow-hidden">
      {/* Background shapes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

      <div className="container px-4 md:px-6 mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="absolute inset-0 bg-purple-200 rounded-[3rem] -rotate-3 transform -translate-x-4 translate-y-4 -z-10 opacity-30"></div>
            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border border-gray-100 aspect-square flex items-center justify-center p-8">
              <div className="w-full h-full bg-gray-50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce shadow-xl shadow-green-100">
                  <Image src="/logo.png" width={40} height={40} alt="WA" className="opacity-80" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">Auguri Marco! 🎉</h4>
                  <p className="text-gray-500 mt-2">
                    "Per il tuo compleanno abbiamo riservato uno sconto speciale del 20% sulla tua prossima cena!"
                  </p>
                </div>
                <Button className="rounded-full bg-[#25D366] hover:bg-[#128c7e] text-white pointer-events-none">Prenota Ora</Button>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="p-3 bg-purple-50 w-fit rounded-2xl mb-6">
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Marketing & <br /> Loyalty
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">
              Usa i dati per far tornare i tuoi clienti. Crea campagne mirate basate sulle abitudini di consumo
              e premia i tuoi clienti migliori senza muovere un dito.
            </p>
            <ul className="space-y-4">
              {[
                "Campagne SMS/WhatsApp automatiche per compleanni",
                "Inviti esclusivi per i tuoi VIP",
                "Recupero clienti inattivi (non tornano da > 60gg)",
                "Feedback automatico post-cena"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="bg-purple-100 p-2 rounded-full shrink-0">
                    <Check className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-lg font-medium text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

const CTASection = () => {
  return (
    <section className="py-32 bg-white relative overflow-hidden">
      <div className="container max-w-5xl mx-auto px-4 relative z-10 text-center">
        <div className="bg-[#1a1a1a] rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/30 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/30 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2"></div>

          <h2 className="text-3xl md:text-5xl font-bold mb-8 text-white relative z-10">
            Pronto a costruire una community?
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto relative z-10">
            Inizia oggi a raccogliere i frutti dei tuoi dati.
          </p>
          <Button className="h-16 px-12 text-xl font-bold bg-[#FF9710] hover:bg-[#e0850e] text-white rounded-2xl shadow-xl hover:scale-105 transition-transform relative z-10">
            Prova Smartables CRM
          </Button>
        </div>
      </div>
    </section>
  )
}

export default CrmPage
