import { LayoutDashboard, Armchair, Clock, RotateCcw, Move, MousePointerClick, Sofa } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Hero from '../hero'

const HallManagementPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans selection:bg-[#FF9710] selection:text-white">
      {/* Hero Section */}
      <Hero
        icon={<LayoutDashboard className="w-4 h-4" />}
        title="Gestione Sala"
        subtitle="Il tuo locale, sotto controllo visivo."
        description="Massimizza la rotazione dei tavoli senza stress. Una pianta digitale interattiva che aiuta il tuo staff ad essere più efficiente."
        ctaText="Disegna la tua sala"
      />
      <FeatureSection />
      <DetailsSection />
      <CTASection />
    </div>
  )
}

const FeatureSection = () => {
  return (
    <section className="py-24 bg-white relative">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-20 items-center">

          <div className="order-2 lg:order-1 relative rounded-[2.5rem] overflow-hidden bg-gray-50 border border-gray-100 aspect-video lg:aspect-square flex items-center justify-center shadow-2xl">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>

            <div className="relative w-full h-full p-10">
              <div className="absolute top-8 left-8 bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div> <span className="text-xs font-bold text-gray-500">Libero</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div> <span className="text-xs font-bold text-gray-500">Occupato</span>
                </div>
              </div>

              {/* Draggable Tables Mockup */}
              <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white rounded-full border-4 border-green-500 flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing hover:scale-105 transition-transform group">
                <span className="font-bold text-gray-700">T4</span>
                <div className="absolute -top-10 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Sposta</div>
              </div>

              <div className="absolute top-1/3 right-1/4 w-32 h-24 bg-white rounded-2xl border-4 border-red-500 flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <span className="font-bold text-gray-700 block">T12</span>
                  <span className="text-[10px] text-red-500 font-bold uppercase">52:00 min</span>
                </div>
              </div>

              <div className="absolute bottom-1/4 left-1/4 w-16 h-16 bg-white rounded-lg border-4 border-gray-300 flex items-center justify-center shadow-sm dashed opacity-50">
                <span className="font-bold text-gray-400">T5</span>
              </div>

              {/* Cursor */}
              <div className="absolute top-[52%] left-[38%] pointer-events-none drop-shadow-xl">
                <MousePointerClick className="w-8 h-8 fill-black text-white" />
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="p-3 bg-orange-50 w-fit rounded-2xl mb-6">
              <Move className="w-8 h-8 text-[#FF9710]" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Mappa <span className="text-[#FF9710]">Interattiva</span>
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">
              Replica fedelmente la disposizione del tuo ristorante. Sposta tavoli, uniscili o dividili con un tocco.
              Vedi a colpo d'occhio chi sta aspettando da troppo tempo.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <h4 className="font-bold text-gray-900 mb-1">Drag & Drop</h4>
                <p className="text-sm text-gray-500">Sposta i tavoli come vuoi</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <h4 className="font-bold text-gray-900 mb-1">Timer Tavolo</h4>
                <p className="text-sm text-gray-500">Monitora i tempi di servizio</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

const DetailsSection = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Precisione Svizzera</h2>
          <p className="text-gray-500 text-lg">Ogni dettaglio è pensato per velocizzare il servizio.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">

          <FeatureCard
            icon={<Armchair className="w-8 h-8 text-white" />}
            title="Gestione Capienza"
            desc="Imposta la capienza massima per fascia oraria. Stop overbooking."
            color="bg-red-500"
          />

          <FeatureCard
            icon={<Clock className="w-8 h-8 text-white" />}
            title="Turni e Orari"
            desc="Gestisci doppi turni (es. 19:30 e 21:30) per raddoppiare i coperti."
            color="bg-[#FF9710]"
          />

          <FeatureCard
            icon={<RotateCcw className="w-8 h-8 text-white" />}
            title="Rotazione"
            desc="Analizza i tempi medi di permanenza e ottimizza il turnover."
            color="bg-blue-600"
          />

        </div>
      </div>
    </section>
  )
}

const FeatureCard = ({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) => (
  <div className="bg-gray-50 p-8 rounded-[2rem] hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-xl transition-all group">
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${color} group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-500 leading-relaxed font-medium">
      {desc}
    </p>
  </div>
)

const CTASection = () => {
  return (
    <section className="py-32 bg-white relative overflow-hidden">
      <div className="container max-w-5xl mx-auto px-4 relative z-10 text-center">
        <div className="bg-[#1a1a1a] rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-500/20 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#FF9710]/20 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2"></div>

          <h2 className="text-3xl md:text-5xl font-bold mb-8 text-white relative z-10">
            Organizzazione perfetta.
          </h2>
          <Button className="h-16 px-12 text-xl font-bold bg-[#FF9710] hover:bg-[#e0850e] text-white rounded-2xl shadow-xl hover:scale-105 transition-transform relative z-10">
            Disegna la tua sala
          </Button>
        </div>
      </div>
    </section>
  )
}

export default HallManagementPage
