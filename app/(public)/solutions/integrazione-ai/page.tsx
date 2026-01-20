import Link from 'next/link'
import { Bot, PhoneMissed, MessageCircle, BarChart3, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'

const AiIntegrationPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-black text-white">
        <div className="absolute inset-0 z-0 opacity-40">
          {/* Abstract gradient for AI feel */}
          <div className="absolute top-0 left-1/2 w-[800px] h-[600px] bg-indigo-600/30 rounded-full blur-[120px] -translate-x-1/2 -translate-y-[20%]"></div>
        </div>

        <div className="container relative z-10 px-4 md:px-6 mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
            <Bot className="w-4 h-4" /> Integrazione AI
          </div>
          <h1 className="text-4xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            L'intelligenza <br />
            <span className="text-indigo-400">invisibile.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl leading-relaxed mb-10">
            Recupera il 100% delle chiamate perse. Mentre il tuo staff è impegnato a servire i clienti,
            la nostra AI gestisce il telefono e prende le prenotazioni per te.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="h-14 px-8 text-lg font-bold bg-[#FF9710] hover:bg-[#e0850e] text-white rounded-full">
              Attiva Recupero Chiamate
            </Button>
          </div>
        </div>
      </section>

      {/* The Problem & Solution */}
      <section className="py-24 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
                Il telefono squilla, ma nessuno risponde.
              </h2>
              <p className="text-xl text-gray-600">
                È sabato sera. Il locale è pieno. Il telefono continua a suonare, ma i camerieri non possono lasciare la sala.
              </p>
              <div className="p-6 bg-red-50 border border-red-100 rounded-2xl">
                <div className="flex items-center gap-4 mb-2">
                  <PhoneMissed className="text-red-500 w-8 h-8" />
                  <span className="font-bold text-red-700 text-lg">Il costo nascosto</span>
                </div>
                <p className="text-gray-700">
                  Ogni chiamata persa è un potenziale cliente che chiama il concorrente.
                  Un ristorante medio perde <strong>fino al 20%</strong> del fatturato così.
                </p>
              </div>
            </div>
            <div className="relative">
              {/* Visualizing the flow */}
              <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-50"></div>

                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-4 opacity-50">
                    <Radio className="w-6 h-6 animate-pulse" />
                    <span>Chiamata in arrivo...</span>
                  </div>
                  <div className="pl-4 border-l-2 border-gray-700 space-y-6">
                    <div className="bg-gray-800 p-4 rounded-xl rounded-tl-none">
                      <p className="text-sm text-gray-400 mb-1">AI System • 0.1s</p>
                      <p>Chiamata intercettata. Linea occupata o fuori orario.</p>
                    </div>
                    <div className="bg-indigo-600/20 border border-indigo-500/50 p-4 rounded-xl rounded-tl-none">
                      <p className="text-sm text-indigo-300 mb-1">Azione Automatica</p>
                      <p className="text-lg font-medium">Invio WhatsApp immediato</p>
                    </div>
                    <div className="bg-green-900/20 border border-green-500/50 p-4 rounded-xl rounded-tl-none">
                      <p className="text-sm text-green-300 mb-1">Risultato</p>
                      <p>Il cliente prenota via Chat in 30 secondi.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-gray-50 border-t border-gray-200">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Come funziona</h2>
            <p className="text-lg text-gray-600">Nessuna app da scaricare per il cliente. Nessun hardware costoso per te.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 text-indigo-600">
                <PhoneMissed className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Intercettazione</h3>
              <p className="text-gray-600">Deviamo le chiamate a cui non rispondi (o su occupato) verso il nostro centralino virtuale sicuro.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 text-green-600">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Conversione</h3>
              <p className="text-gray-600">Mandiamo subito un WhatsApp: "Ciao, non riusciamo a rispondere. Prenota qui 👇".</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 text-blue-600">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Risultato</h3>
              <p className="text-gray-600">Il cliente prenota autonomamente. Tu ti ritrovi la prenotazione confermata nel sistema.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Proof */}
      <section className="py-20 bg-[#FF9710] text-white">
        <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-around items-center gap-12 text-center">
          <div>
            <div className="text-5xl md:text-6xl font-bold mb-2">+25%</div>
            <div className="text-xl font-medium opacity-90">Prenotazioni recuperate</div>
          </div>
          <div>
            <div className="text-5xl md:text-6xl font-bold mb-2">0</div>
            <div className="text-xl font-medium opacity-90">Telefonate perse</div>
          </div>
          <div>
            <div className="text-5xl md:text-6xl font-bold mb-2">24/7</div>
            <div className="text-xl font-medium opacity-90">Operatività</div>
          </div>
        </div>
      </section>

    </div>
  )
}

export default AiIntegrationPage
