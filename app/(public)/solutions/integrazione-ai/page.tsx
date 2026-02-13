import { Bot, PhoneMissed, MessageCircle, BarChart3, Radio, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Hero from '../hero'

const AiIntegrationPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans selection:bg-[#FF9710] selection:text-white">
      <Hero
        icon={<Bot className='h-4 w-4' />}
        title="Integrazione AI"
        subtitle="L'intelligenza invisibile"
        description="Recupera il 100% delle chiamate perse. Mentre il tuo staff è impegnato a servire i clienti, la nostra AI gestisce il telefono e prende le prenotazioni per te."
        ctaText='Attiva Recupero Chiamate'
      />
      <ProblemSolution />
      <Benefits />
      <StatsSection />
    </div>
  )
}

const ProblemSolution = () => {
  return (
    <section className="py-24 bg-white relative">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
              Il telefono squilla, <br /> <span className="text-gray-400">ma nessuno risponde.</span>
            </h2>
            <p className="text-xl text-gray-500">
              È sabato sera. Il locale è pieno. Il telefono continua a suonare, ma i camerieri non possono lasciare la sala.
            </p>
            <div className="p-8 bg-red-50 rounded-[2rem] border border-red-100/50 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <PhoneMissed className="text-red-500 w-6 h-6" />
                </div>
                <span className="font-bold text-gray-900 text-xl">Il costo nascosto</span>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                Ogni chiamata persa è un potenziale cliente che chiama il concorrente.
                Un ristorante medio perde <strong className="text-red-600 bg-red-100 px-1 rounded">fino al 20%</strong> del fatturato così.
              </p>
            </div>
          </div>
          <div className="relative">
            {/* Visualizing the flow */}
            <div className="absolute -inset-4 bg-linear-to-tr from-indigo-500 to-purple-500 rounded-[3rem] blur-2xl opacity-20"></div>
            <div className="bg-[#0f172a] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-gray-800">
              {/* Background Grip */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>

              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between border-b border-gray-800 pb-6">
                  <div className="flex items-center gap-3 text-indigo-400">
                    <Radio className="w-5 h-5 animate-pulse" />
                    <span className="font-mono text-sm tracking-widest uppercase">Incoming Call Detected</span>
                  </div>
                  <div className="text-xs text-gray-500 font-mono">ID: #8921-CALL</div>
                </div>

                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex gap-4 opacity-50">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-0.5 h-full bg-gray-800"></div>
                    </div>
                    <div className="pb-8">
                      <p className="text-sm text-gray-400 mb-1 font-mono">Status: BUSY</p>
                      <p className="text-lg">Chiamata Persa</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="p-1 bg-indigo-500/20 rounded-full border border-indigo-500">
                        <div className="w-3 h-3 rounded-full bg-indigo-500 animate-ping"></div>
                      </div>
                      <div className="w-0.5 h-full bg-indigo-500/50"></div>
                    </div>
                    <div className="pb-8">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs py-0.5 px-2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">AI INTERVENTION</span>
                        <span className="text-xs text-gray-500">0.2s latency</span>
                      </div>
                      <p className="text-xl font-medium text-white">Attivazione Workflow "Recupero"</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div>
                      <p className="text-sm text-green-400 mb-2 font-mono">ACTION: SEND_WHATSAPP</p>
                      <div className="bg-white/10 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                        <p className="text-sm text-gray-300 italic">"Ciao! Non riusciamo a rispondere. Prenota qui 👇"</p>
                      </div>
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

const Benefits = () => {
  return (
    <section className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Come funziona</h2>
          <p className="text-lg text-gray-500">Nessuna app da scaricare per il cliente. Nessun hardware costoso per te.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <BenefitCard
            icon={<PhoneMissed className="w-8 h-8 text-indigo-600" />}
            title="1. Intercettazione"
            desc="Deviamo le chiamate a cui non rispondi (o su occupato) verso il nostro centralino virtuale sicuro."
          />
          <BenefitCard
            icon={<MessageCircle className="w-8 h-8 text-[#25D366]" />}
            title="2. Conversione"
            desc='Mandiamo subito un WhatsApp: "Ciao, non riusciamo a rispondere. Prenota qui 👇".'
          />
          <BenefitCard
            icon={<BarChart3 className="w-8 h-8 text-blue-600" />}
            title="3. Risultato"
            desc="Il cliente prenota autonomamente. Tu ti ritrovi la prenotazione confermata nel sistema."
          />
        </div>
      </div>
    </section>
  )
}

const BenefitCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="flex flex-col items-center text-center p-8 bg-white rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1">
    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
    <p className="text-gray-500 leading-relaxed font-medium">{desc}</p>
  </div>
)

const StatsSection = () => {
  return (
    <section className="py-24 bg-[#FF9710] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-[100px]"></div>

      <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-around items-center gap-12 text-center relative z-10">
        <div>
          <div className="text-6xl md:text-7xl font-bold mb-2 tracking-tight">+25%</div>
          <div className="text-xl font-medium opacity-90">Prenotazioni recuperate</div>
        </div>
        <div className="w-px h-24 bg-white/20 hidden md:block"></div>
        <div>
          <div className="text-6xl md:text-7xl font-bold mb-2 tracking-tight">0</div>
          <div className="text-xl font-medium opacity-90">Telefonate perse</div>
        </div>
        <div className="w-px h-24 bg-white/20 hidden md:block"></div>
        <div>
          <div className="text-6xl md:text-7xl font-bold mb-2 tracking-tight">24/7</div>
          <div className="text-xl font-medium opacity-90">Operatività</div>
        </div>
      </div>
    </section>
  )
}

export default AiIntegrationPage
