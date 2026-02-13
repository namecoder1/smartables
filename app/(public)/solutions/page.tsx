import Link from 'next/link'
import { ArrowRight, Bot, Calendar, LayoutDashboard, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SolutionsIndexPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans selection:bg-[#FF9710] selection:text-white">

      {/* Header */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 w-[600px] h-[600px] bg-[#FF9710]/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="container px-4 md:px-6 mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-[#FF9710] font-semibold text-sm mb-6 animate-fade-in-up">
            <span className="p-1 bg-[#FF9710]/20 rounded-full">
              <Zap className="w-3 h-3 fill-current" />
            </span>
            La Suite Completa
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6 max-w-4xl mx-auto leading-[1.1]">
            Tutto ciò di cui hai bisogno per <span className="text-transparent bg-clip-text bg-linear-to-r from-[#FF9710] to-[#FF6B00]">crescere.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Smartables non è solo un software. È un ecosistema di strumenti interconnessi progettati per automatizzare il tuo ristorante.
          </p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="pb-32 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-8">

            <SolutionCard
              href="/solutions/integrazione-ai"
              icon={<Bot className="w-8 h-8 text-white" />}
              title="Integrazione AI"
              desc="Non perdere mai più una chiamata. La nostra AI risponde per te e converte le richieste in prenotazioni su WhatsApp."
              color="bg-indigo-600"
              tags={["Auto-risponditore", "Zero App", "+20% Fatturato"]}
            />

            <SolutionCard
              href="/solutions/gestione-prenotazioni"
              icon={<Calendar className="w-8 h-8 text-white" />}
              title="Gestione Prenotazioni"
              desc="Automatizza conferme, reminder e liste d'attesa. Sconfiggi i No-Show con la carta a garanzia e WhatsApp."
              color="bg-green-600"
              tags={["WhatsApp First", "Anticipo", "No-Show Protection"]}
            />

            <SolutionCard
              href="/solutions/gestione-sala"
              icon={<LayoutDashboard className="w-8 h-8 text-white" />}
              title="Gestione Sala Visionaria"
              desc="Ottimizza i turni e la rotazione dei tavoli con una mappa interattiva drag & drop. Massima resa, minimo stress."
              color="bg-[#FF9710]"
              tags={["Mappa 3D", "Turni Multipli", "Analisi Tempi"]}
            />

            <SolutionCard
              href="/solutions/crm"
              icon={<Users className="w-8 h-8 text-white" />}
              title="CRM & Loyalty"
              desc="Riconosci i tuoi clienti migliori e falli tornare con campagne marketing automatiche basate sui loro gusti."
              color="bg-blue-600"
              tags={["Database Unico", "Marketing Auto", "Profilazione"]}
            />

          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50 border-t border-gray-100 text-center">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-gray-900">
            Non sai da dove iniziare?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="h-14 px-8 text-lg font-bold bg-gray-900 hover:bg-black text-white rounded-2xl shadow-lg">
              Parla con un esperto
            </Button>
            <Button variant="outline" className="h-14 px-8 text-lg font-bold border-2 border-gray-200 text-gray-700 hover:bg-white rounded-2xl">
              Vedi la demo
            </Button>
          </div>
        </div>
      </section>

    </div>
  )
}

const SolutionCard = ({ href, icon, title, desc, color, tags }: { href: string, icon: React.ReactNode, title: string, desc: string, color: string, tags: string[] }) => {
  return (
    <Link href={href} className="group relative bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-12 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-1 block overflow-hidden">
      <div className={`absolute top-0 right-0 w-64 h-64 ${color} opacity-[0.03] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 transition-opacity group-hover:opacity-[0.08]`}></div>

      <div className="relative z-10">
        <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mb-8 shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>

        <h3 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-[#FF9710] transition-colors flex items-center gap-2">
          {title}
          <ArrowRight className="w-6 h-6 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#FF9710]" />
        </h3>

        <p className="text-lg text-gray-500 mb-8 leading-relaxed">
          {desc}
        </p>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span key={i} className="px-3 py-1 bg-gray-50 text-gray-600 text-sm font-medium rounded-full border border-gray-100">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

export default SolutionsIndexPage