import Link from 'next/link'
import Image from 'next/image'
import { Check, Users, Database, Heart, LineChart, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CrmPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-black text-white">
        <div className="absolute inset-0 z-0 opacity-40">
          {/* Abstract gradient background */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/30 rounded-full blur-[100px] hover:blur-[80px] transition-all duration-1000 -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="container relative z-10 px-4 md:px-6 mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <Users className="w-4 h-4" /> Smartables CRM
          </div>
          <h1 className="text-4xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            Conosci i tuoi clienti, <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-500">
              aumenta i profitti.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl leading-relaxed mb-10">
            Trasforma un cliente occasionale in un cliente fedele.
            Smartables centralizza i dati dei tuoi ospiti per offrirti insight potenti e azioni mirate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="h-14 px-8 text-lg font-bold bg-[#FF9710] hover:bg-[#e0850e] text-white rounded-full">
              Inizia Gratuito
            </Button>
            <Button variant="outline" className="h-14 px-8 text-lg font-bold border-white/20 hover:bg-white/10 text-white rounded-full">
              Richiedi Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Highlight 1 */}
      <section className="py-24 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="p-3 bg-blue-100 w-fit rounded-2xl mb-6">
                <Database className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                Database Clienti Unificato
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Dimentica i fogli Excel sparsi. Smartables crea automaticamente una scheda cliente per ogni prenotazione,
                unificando i dati se gestisci più location.
              </p>
              <ul className="space-y-4">
                {[
                  "Riconoscimento automatico del cliente abituale",
                  "Storico completo delle visite e delle spese",
                  "Note condivise tra tutto lo staff (es. 'Allergico al glutine', 'Preferisce tavolo 5')",
                  "Tag intelligente (VIP, Spendaccione, Business)"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 bg-blue-100 p-1 rounded-full">
                      <Check className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-lg text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-gray-50 aspect-video flex items-center justify-center">
              <div className="text-center text-gray-400 p-8">
                {/* Placeholder for UI Image */}
                <span className="block text-6xl mb-4">👥</span>
                <span className="text-lg font-medium">Interfaccia Scheda Cliente</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlight 2 */}
      <section className="py-24 bg-gray-50">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative rounded-2xl overflow-hidden shadow-2xl border bg-white aspect-video flex items-center justify-center">
              <div className="text-center text-gray-400 p-8">
                {/* Placeholder for UI Image */}
                <span className="block text-6xl mb-4">📊</span>
                <span className="text-lg font-medium">Dashboard Analitica</span>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="p-3 bg-purple-100 w-fit rounded-2xl mb-6">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                Marketing & Loyalty
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Usa i dati per far tornare i tuoi clienti. Crea campagne mirate basate sulle abitudini di consumo
                e premia i tuoi clienti migliori.
              </p>
              <ul className="space-y-4">
                {[
                  "Campagne SMS/WhatsApp automatiche per compleanni",
                  "Inviti esclusivi per i tuoi VIP",
                  "Recupero clienti inattivi (non tornano da > 60gg)",
                  "Feedback automatico post-cena"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 bg-purple-100 p-1 rounded-full">
                      <Check className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-lg text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white border-t border-gray-100 text-center">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 text-gray-900">
            Pronto a costruire una community?
          </h2>
          <p className="text-xl text-gray-500 mb-12">
            Inizia oggi a raccogliere i frutti dei tuoi dati.
          </p>
          <Button className="h-16 px-12 text-xl font-bold bg-[#FF9710] hover:bg-[#e0850e] text-white rounded-full shadow-lg">
            Prova Smartables CRM
          </Button>
        </div>
      </section>
    </div>
  )
}

export default CrmPage
