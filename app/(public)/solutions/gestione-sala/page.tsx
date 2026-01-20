import Link from 'next/link'
import { LayoutDashboard, Armchair, Clock, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

const HallManagementPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-black text-white">
        <div className="absolute inset-0 z-0 opacity-40">
          {/* Abstract gradient */}
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-[#da3743]/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="container relative z-10 px-4 md:px-6 mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-6">
            <LayoutDashboard className="w-4 h-4" /> Gestione Sala
          </div>
          <h1 className="text-4xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            Il tuo locale, <br />
            <span className="text-[#da3743]">sotto controllo visivo.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl leading-relaxed mb-10">
            Massimizza la rotazione dei tavoli senza stress.
            Una pianta digitale interattiva che aiuta il tuo staff ad essere più efficiente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="h-14 px-8 text-lg font-bold bg-[#FF9710] hover:bg-[#e0850e] text-white rounded-full">
              Disegna la tua sala
            </Button>
          </div>
        </div>
      </section>

      {/* Main Feature: The Floor Plan */}
      <section className="py-24 bg-white relative">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Mappa Interattiva
            </h2>
            <p className="text-xl text-gray-600">
              Replica fedelmente la disposizione del tuo ristorante. Sposta tavoli, uniscili o dividili con un tocco.
            </p>
          </div>

          {/* Visual representation of a floor plan */}
          <div className="relative w-full aspect-video bg-gray-100 rounded-3xl border border-gray-200 shadow-inner flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-4 p-8 opacity-50 pointer-events-none">
              {/* Simulated tables */}
              <div className="col-span-2 row-span-2 bg-white border-2 border-green-500 rounded-full flex items-center justify-center shadow-sm">
                <span className="font-bold text-green-700">T1 (4)</span>
              </div>
              <div className="col-span-2 row-span-2 col-start-4 bg-white border-2 border-red-500 rounded-lg flex items-center justify-center shadow-sm">
                <span className="font-bold text-red-700">T2 (Occupato)</span>
              </div>
              <div className="col-span-3 row-span-2 col-start-8 bg-white border-2 border-yellow-500 rounded-lg flex items-center justify-center shadow-sm">
                <span className="font-bold text-yellow-700">T3 (In arrivo)</span>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-md px-8 py-4 rounded-full border shadow-xl z-10 flex gap-8">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-medium">Libero</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="font-medium">Occupato</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="font-medium">In arrivo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Details Grid */}
      <section className="py-24 bg-gray-50 border-t border-gray-200">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-12">

            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6 text-[#da3743]">
                <Armchair className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Gestione Capienza</h3>
              <p className="text-gray-600">
                Imposta la capienza massima per fascia oraria. Il sistema smette di accettare
                prenotazioni online quando la sala è piena, evitando l'overbooking.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6 text-[#da3743]">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Turni e Orari</h3>
              <p className="text-gray-600">
                Definisci turni multipli (es. 19:30 e 21:30) per massimizzare il fatturato.
                Smartables suggerisce gli orari migliori ai clienti per riempire i "buchi".
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6 text-[#da3743]">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Rotazione Tavoli</h3>
              <p className="text-gray-600">
                Monitora il tempo medio di permanenza. Ricevi un alert discreto quando un tavolo
                supera il tempo previsto, per gestire l'attesa successiva.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="py-24 bg-white text-center">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 text-gray-900">
            Organizzazione perfetta.
          </h2>
          <Button variant="outline" className="h-16 px-12 text-xl font-bold border-2 border-gray-900 text-gray-900 hover:bg-gray-100 rounded-full">
            Esplora le funzionalità
          </Button>
        </div>
      </section>
    </div>
  )
}

export default HallManagementPage
