import Image from 'next/image'
import { CheckCircle2, Users, LayoutDashboard, LineChart, MessageCircle, PhoneMissed, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans overflow-x-hidden selection:bg-[#FF9710] selection:text-white">
      <Hero />
      <SocialProof />
      <WhatsAppFeature />
      <CRMFeatures />
      <Testimonials />
      <CTA />
    </div>
  )
}

const Hero = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-20 pb-10">
      {/* Abstract Background */}
      <div className="absolute inset-0 z-0 bg-white">
        <div className="absolute top-[-50%] right-[-10%] w-[800px] h-[800px] rounded-full bg-[#FF9710]/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-orange-100/40 blur-[100px]" />
      </div>

      <div className="w-full max-w-7xl mx-auto mt-10 relative z-10 px-4 md:px-6 flex flex-col items-center text-center">

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-gray-900 mb-8 max-w-5xl leading-[1.1] animate-fade-in-up delay-100">
          Non perdere mai più <br className='hidden md:block' />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-[#FF9710] to-[#FF6B00]">
            una prenotazione.
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
          Il primo CRM per ristoranti che trasforma le chiamate perse in clienti reali tramite WhatsApp. Automatizza la sala, fidelizza i clienti e aumenta il fatturato.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 w-full justify-center animate-fade-in-up delay-300">
          <Button className="h-14  text-lg font-bold bg-[#FF9710] hover:bg-[#ff8906] text-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(255,151,16,0.5)] transition-all hover:scale-105 hover:shadow-[0_25px_50px_-12px_rgba(255,151,16,0.6)]">
            Prova Smartables
          </Button>
          <Button variant="ghost" className="h-14 px-10 text-lg font-bold text-gray-600 hover:text-[#FF9710] hover:bg-orange-50 rounded-2xl transition-all">
            Scopri come funziona
          </Button>
        </div>

        {/* Hero Image / Dashboard Preview */}
        <div className="mt-20 relative w-full max-w-5xl mx-auto animate-fade-in-up delay-500">
          {/* Glow Effect behind image */}
          <div className="absolute -inset-1 bg-linear-to-r from-[#FF9710] to-[#ff6b00] rounded-[2.5rem] blur opacity-20"></div>
          <div className="relative rounded-[2rem] bg-gray-900 p-2 ring-1 ring-gray-900/10 shadow-2xl">
            <div className="rounded-[1.5rem] overflow-hidden bg-white aspect-video relative grid place-items-center text-gray-300">
              {/* Placeholder for Hero Image - Reusing existing if compatible or using a div structure */}
              <Image
                src="/app-showcase.png"
                alt="Dashboard Smartables"
                width={1200}
                height={675}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const SocialProof = () => {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">
          Scelto dai migliori ristoranti
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
          {/* Logos simulated with text for now, assuming images might not be perfect for this new layout yet */}
          <span className="text-2xl font-serif font-bold text-gray-800">Da Vittorio</span>
          <span className="text-2xl font-mono font-bold text-gray-800">Osteria Francescana</span>
          <span className="text-2xl font-sans font-black italic text-gray-800">SORBILLO</span>
          <span className="text-2xl font-serif italic font-semibold text-gray-800">La Pergola</span>
          <span className="text-2xl font-sans font-medium tracking-widest text-gray-800">CRACCO</span>
        </div>
      </div>
    </section>
  )
}

const WhatsAppFeature = () => {
  return (
    <section className="py-32 bg-gray-50 relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#25D366]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FF9710]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">

          <div className="order-2 lg:order-1 relative">
            {/* Phone Mockup */}
            <div className="relative mx-auto border-gray-800 bg-gray-800 border-14 rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
              <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
              <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
              <div className="rounded-[2rem] overflow-hidden w-full h-full bg-[#E5DDD5] relative flex flex-col">
                {/* WhatsApp Header */}
                <div className="bg-[#075E54] p-4 flex items-center gap-3 text-white shadow-md z-10">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Image src="/logo.png" width={20} height={20} alt="Logo" className="rounded-full" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">Il Tuo Ristorante</p>
                    <p className="text-[10px] opacity-80">Online</p>
                  </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">

                  {/* Message 1: Auto Reply */}
                  <div className="flex justify-start animate-in slide-in-from-left-4 duration-700 fade-in fill-mode-forwards" style={{ animationDelay: '1s' }}>
                    <div className="bg-white rounded-tr-lg rounded-bl-lg rounded-br-lg p-3 max-w-[85%] shadow-sm relative">
                      <p className="text-xs text-gray-800 leading-relaxed">
                        Ciao! 👋 Ho visto che ci hai chiamato ma non siamo riusciti a rispondere. Vuoi prenotare un tavolo?
                      </p>
                      <span className="text-[9px] text-gray-400 absolute bottom-1 right-2">12:01</span>
                    </div>
                  </div>

                  {/* Message 2: Customer */}
                  <div className="flex justify-end animate-in slide-in-from-right-4 duration-700 fade-in fill-mode-forwards" style={{ animationDelay: '2.5s', opacity: 0 }}>
                    <div className="bg-[#dcf8c6] rounded-tl-lg rounded-bl-lg rounded-br-lg p-3 max-w-[85%] shadow-sm relative">
                      <p className="text-xs text-gray-800">Sì, per stasera alle 20:30 per 2 persone.</p>
                      <span className="text-[9px] text-gray-500 absolute bottom-1 right-2">12:02</span>
                    </div>
                  </div>

                  {/* Message 3: Bot Confirmation */}
                  <div className="flex justify-start animate-in slide-in-from-left-4 duration-700 fade-in fill-mode-forwards" style={{ animationDelay: '4s', opacity: 0 }}>
                    <div className="bg-white rounded-tr-lg rounded-bl-lg rounded-br-lg p-3 max-w-[85%] shadow-sm relative">
                      <p className="text-xs text-gray-800 leading-relaxed">
                        Perfetto! Ti confermo un tavolo per 2 persone alle 20:30 stasera. A dopo! 🍝
                      </p>
                      <span className="text-[9px] text-gray-400 absolute bottom-1 right-2">12:02</span>
                    </div>
                  </div>

                </div>

                {/* Input Area (Static) */}
                <div className="p-2 bg-[#f0f0f0] flex items-center gap-2">
                  <div className="w-full h-8 bg-white rounded-full border border-gray-200" />
                  <div className="w-8 h-8 bg-[#075E54] rounded-full flex items-center justify-center text-white">
                    <MessageCircle size={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Value Badges */}
            <div className="absolute top-20 right-[-20px] bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 animate-bounce shadow-orange-100 ring-1 ring-orange-50">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                <PhoneMissed size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold">Chiamata Persa</p>
                <p className="text-sm font-bold text-gray-900">Ore 12:01</p>
              </div>
            </div>
            <div className="absolute bottom-40 left-[-40px] bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 animate-pulse shadow-green-100 ring-1 ring-green-50">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <Smartphone size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold">Recuperata</p>
                <p className="text-sm font-bold text-gray-900">+ €60.00 Coperti</p>
              </div>
            </div>

          </div>

          <div className="order-1 lg:order-2">
            <div className="inline-block p-2 bg-[#25D366]/10 rounded-2xl mb-6">
              <MessageCircle className="w-8 h-8 text-[#25D366]" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Recupera il 100% delle <span className="text-[#FF9710]">chiamate perse.</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Durante il servizio non hai tempo di rispondere al telefono. Intanto, perdi prenotazioni.
              <br /><br />
              Smartables rileva automaticamente le chiamate senza risposta e invia immediatamente un messaggio WhatsApp personalizzato al cliente per concludere la prenotazione.
            </p>

            <ul className="space-y-4 mb-10">
              {[
                "Zero installazioni per i tuoi clienti",
                "Funziona 24/7, anche quando sei chiuso",
                "Aumenta il fatturato senza muovere un dito",
                "Numero WhatsApp Business Verificato"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-lg font-medium text-gray-800">
                  <div className="w-6 h-6 rounded-full bg-[#FF9710]/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-[#FF9710]" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <Button className="h-14 px-8 text-lg font-bold bg-[#25D366] hover:bg-[#1da851] text-white rounded-2xl hover:scale-105 transition-all shadow-lg shadow-green-200">
              Attiva WhatsApp Bot
            </Button>
          </div>

        </div>
      </div>
    </section>
  )
}

const CRMFeatures = () => {
  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            Molto più di un semplice <span className="text-[#FF9710]">gestionale.</span>
          </h2>
          <p className="text-xl text-gray-500">
            Smartables è un vero e proprio sistema operativo che unisce sala, clienti e marketing in un'unica piattaforma fluida.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Users size={32} />}
            title="CRM Intelligente"
            description="Riconosci i tuoi clienti migliori. Smartables crea automaticamente profili dettagliati con preferenze, storico ordini e frequenza di visita."
            colorClass="bg-blue-50 text-blue-600"
          />
          <FeatureCard
            icon={<LayoutDashboard size={32} />}
            title="Gestione Sala Visionaria"
            description="Una mappa interattiva che respira con il tuo locale. Assegna tavoli, gestisci turni e ottimizza il flusso con un drag & drop intuitivo."
            colorClass="bg-orange-50 text-[#FF9710]"
          />
          <FeatureCard
            icon={<LineChart size={32} />}
            title="Marketing Automatico"
            description="Fai tornare i clienti. Invia offerte mirate via WhatsApp a chi non si vede da 30 giorni o festeggia i compleanni in automatico."
            colorClass="bg-purple-50 text-purple-600"
          />
        </div>
      </div>
    </section>
  )
}

const FeatureCard = ({ icon, title, description, colorClass }: { icon: React.ReactNode, title: string, description: string, colorClass: string }) => (
  <div className="group p-8 rounded-[2rem] bg-white transition-all hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-2 cursor-default border border-transparent hover:border-gray-50">
    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", colorClass)}>
      {icon}
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
    <p className="text-gray-500 leading-relaxed font-medium">
      {description}
    </p>
  </div>
)

const Testimonials = () => {
  return (
    <section className="py-24 bg-[#FF9710]/5">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <blockquote className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            {[1, 2, 3, 4, 5].map(i => (
              <svg key={i} className="w-8 h-8 text-[#FF9710]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-3xl md:text-5xl font-serif text-gray-900 italic leading-tight mb-10">
            "Da quando usiamo il Bot di Smartables, abbiamo azzerato i no-show e recuperato circa 1500€ al mese di prenotazioni che avremmo perso."
          </p>
          <footer className="flex flex-col items-center">
            <cite className="not-italic text-lg font-bold text-gray-900">Marco Visionario</cite>
            <span className="text-gray-500">Owner, Ristorante Il Gusto</span>
          </footer>
        </blockquote>
      </div>
    </section>
  )
}

const CTA = () => {
  return (
    <section className="py-32 bg-white relative overflow-hidden">
      <div className="w-full max-w-5xl mx-auto px-4 md:px-6 text-center relative z-10">

        <div className="bg-[#1a1a1a] rounded-[3rem] p-12 md:p-24 relative overflow-hidden text-center shadow-2xl">
          {/* Background Gradients */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF9710] rounded-full blur-[150px] opacity-20 translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600 rounded-full blur-[150px] opacity-20 -translate-x-1/2 translate-y-1/2" />

          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 relative z-10">
            Pronto a rivoluzionare <br /> il tuo ristorante?
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto relative z-10">
            Unisciti alla beta privata. Posti limitati per garantire la massima qualità del servizio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Button className="h-16 px-12 text-xl font-bold bg-[#FF9710] hover:bg-[#ff8906] text-white rounded-2xl shadow-xl hover:scale-105 transition-all">
              Richiedi Accesso
            </Button>
          </div>
          <p className="mt-8 text-sm text-gray-500 relative z-10">
            Setup gratuito • Nessun contratto vincolante • Supporto dedicato
          </p>
        </div>

      </div>
    </section>
  )
}

export default HomePage