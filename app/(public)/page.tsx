import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, Users, ArrowRight, LayoutDashboard, LineChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'

const images = [
  '/clients/osteria_basilico.png',
  '/clients/la_forchetta.png',
  '/clients/trattoria_porto.png',
  '/clients/il_mulino.png',
  '/clients/pizzeria_vesuvio.png',
  '/clients/enoteca_divino.png'
]

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <Hero />
      <Clients />
      <Solutions />
      <Showcase />
      <SocialProof />
      <CTA />
    </div>
  )
}

const Hero = () => {
  return (
    <section className="relative h-[65vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero.jpg"
          alt="Ristorante elegante"
          fill
          className="object-cover brightness-[0.6]"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/30" />
      </div>

      {/* Content */}
      <div className="w-full max-w-7xl mx-auto relative z-10 px-4 md:px-6 text-center text-white">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 drop-shadow-lg">
          Il sistema operativo <br className="hidden md:block" /> per il tuo ristorante
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
          Un'unica piattaforma per gestire prenotazioni, sala, marketing e operazioni.
          Smartables trasforma il modo in cui lavori.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button className="h-14 px-8 text-lg font-bold bg-[#FF9710] hover:bg-[#FF9710] text-white rounded-full transition-all hover:scale-105 shadow-xl border-none">
            Inizia ora
          </Button>
          <Button variant="outline" className="h-14 px-8 text-lg font-bold bg-white/10 text-white border-white/40 hover:bg-white/20 hover:text-white backdrop-blur-sm rounded-full transition-all">
            Scopri di più
          </Button>
        </div>
        <p className="mt-6 text-sm text-gray-300 font-medium">
          Scelto da piu di 50 ristoratori contenti
        </p>
      </div>
    </section>
  )
}

const Clients = () => {
  return (
    <section className='bg-black py-24 flex flex-col items-center justify-center'>
      <div className='mx-6'>
        <h2 className="text-white text-3xl md:text-5xl font-bold mb-6 tracking-tight">Usato da <span className="text-[#FF9710] italic font-light">più di 50</span> ristoranti a Pesaro</h2>
        <p className="text-white">Siamo la scelta senza riserve di piu di 2000 tra ristoranti, bar, pizzierie e tanto altro. Ecco alcuni dei nostri clienti:</p>
      </div>
      <Carousel className='sm:hidden w-full'>
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index} className='relative h-40 w-80 opacity-70 hover:opacity-100 transition-opacity'>
              <Image src={image} alt="Client" fill className='object-contain' />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="sm:grid hidden sm:grid-cols-6 gap-8 mt-12 w-full max-w-6xl px-4 items-center grayscale hover:grayscale-0 transition-all duration-500">
        <div className="relative h-20 w-full opacity-70 hover:opacity-100 transition-opacity">
          <Image src="/clients/osteria_basilico.png" alt="Osteria Basilicò" fill className='object-contain' />
        </div>
        <div className="relative h-20 w-full opacity-70 hover:opacity-100 transition-opacity">
          <Image src="/clients/la_forchetta.png" alt="La Forchetta" fill className='object-contain' />
        </div>
        <div className="relative h-20 w-full opacity-70 hover:opacity-100 transition-opacity">
          <Image src="/clients/trattoria_porto.png" alt="Trattoria del Porto" fill className='object-contain' />
        </div>
        <div className="relative h-20 w-full opacity-70 hover:opacity-100 transition-opacity">
          <Image src="/clients/il_mulino.png" alt="Il Mulino" fill className='object-contain' />
        </div>
        <div className="relative h-20 w-full opacity-70 hover:opacity-100 transition-opacity">
          <Image src="/clients/pizzeria_vesuvio.png" alt="Pizzeria Vesuvio" fill className='object-contain' />
        </div>
        <div className="relative h-20 w-full opacity-70 hover:opacity-100 transition-opacity">
          <Image src="/clients/enoteca_divino.png" alt="Enoteca Divino" fill className='object-contain' />
        </div>
      </div>
    </section>
  )
}

const Solutions = () => {
  return (
    <section className="py-24 bg-white">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Tutto <span className="text-[#FF9710]">ciò che serve</span> al tuo ristorante
          </h2>
          <p className="text-xl text-gray-600">
            Soluzioni integrate progettate per ogni aspetto della tua attività.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {/* Feature 1 */}
          <div className="group flex flex-col items-start gap-4 p-6 rounded-2xl transition-colors hover:bg-gray-50">
            <div className="p-3 bg-red-100/50 rounded-2xl text-[#da3743] mb-2 group-hover:scale-110 transition-transform">
              <LayoutDashboard size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Gestione Sala</h3>
            <p className="text-lg text-gray-600 leading-relaxed">
              Ottimizza i posti a sedere, gestisci le liste d'attesa e i tuoi menù con il nostro sistema intelligente di prenotazioni e conferme.
            </p>
            <Link href="#" className="mt-auto flex items-center text-[#da3743] font-semibold text-lg hover:underline group-hover:translate-x-1 transition-transform">
              Scopri Gestione Sala <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>

          {/* Feature 2 */}
          <div className="group flex flex-col items-start gap-4 p-6 rounded-2xl transition-colors hover:bg-gray-50">
            <div className="p-3 bg-blue-100/50 rounded-2xl text-blue-600 mb-2 group-hover:scale-110 transition-transform">
              <Users size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Marketing & CRM</h3>
            <p className="text-lg text-gray-600 leading-relaxed">
              Conosci i tuoi clienti migliori e falli tornare più spesso grazie a analitiche avanzate e profili cliente dettagliati.
            </p>
            <Link href="#" className="mt-auto flex items-center text-blue-600 font-semibold text-lg hover:underline group-hover:translate-x-1 transition-transform">
              Scopri Marketing <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>

          {/* Feature 3 */}
          <div className="group flex flex-col items-start gap-4 p-6 rounded-2xl transition-colors hover:bg-gray-50">
            <div className="p-3 bg-green-100/50 rounded-2xl text-green-600 mb-2 group-hover:scale-110 transition-transform">
              <LineChart size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Gestione prenotazioni</h3>
            <p className="text-lg text-gray-600 leading-relaxed">
              Avvia il nostro bot per la gestione delle prenotazioni e scopri quanto i no-show possono impattare sul tuo ristorante.
            </p>
            <Link href="#" className="mt-auto flex items-center text-green-600 font-semibold text-lg hover:underline group-hover:translate-x-1 transition-transform">
              Scopri Analytics <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

const Showcase = () => {
  return (
    <section className="py-24 bg-gray-50 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white ring-1 ring-gray-200">
              <Image
                src="/app-showcase.png"
                alt="Smartables Dashboard su Tablet"
                width={800}
                height={600}
                className="w-full h-auto object-cover"
              />
            </div>
            {/* Floating elements for visual interest */}
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#da3743]/10 rounded-full blur-3xl -z-10" />
            <div className="absolute -top-10 -right-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl -z-10" />
          </div>

          <div className="order-1 lg:order-2 flex flex-col gap-8">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
              Potente come un Enterprise. <br className="hidden xl:block" />
              Semplice come un'App.
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Abbiamo progettato Smartables pensando ai ritmi frenetici del tuo ristorante.
              L'interfaccia intuitiva permette al tuo staff di essere operativo in pochi minuti, non giorni.
            </p>

            <ul className="space-y-4">
              {[
                "Pianta del locale interattiva e personalizzabile",
                "Gestione turni e permessi dello staff",
                "Reportistica in tempo reale accessibile ovunque",
                "Integrazione POS e pagamenti seamless"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-lg font-medium text-gray-800">
                  <CheckCircle2 className="w-6 h-6 shrink-0" color='#f96800' />
                  {item}
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <Button variant="default" className="p-0 h-auto text-xl font-bold hover:no-underline hover:opacity-80 flex items-center gap-2">
                Vedi tutte le funzionalità <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const SocialProof = () => {
  return (
    <section className="py-24 bg-white border-y border-gray-100">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 text-center">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-12">
          La scelta dei migliori ristoratori italiani
        </h3>

        <div className="max-w-4xl mx-auto mb-16">
          <blockquote className="text-3xl md:text-4xl font-serif text-gray-900 leading-snug">
            "Smartables ha completamente rivoluzionato il modo in cui gestiamo la sala.
            I nostri incassi sono aumentati del 20% nel primo mese."
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden relative">
              {/* Placeholder avatar or initial */}
              <div className="absolute inset-0 flex items-center justify-center bg-[#ff964b] text-white font-bold text-xl">M</div>
            </div>
            <div className="text-left">
              <div className="font-bold text-gray-900">Marco Visionario</div>
              <div className="text-sm text-gray-500">Owner, Ristorante Il Gusto</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
          {/* Using text specific font styles to mimic logos */}
          <span className="text-2xl font-serif font-bold tracking-tighter">Osteria</span>
          <span className="text-2xl font-mono font-bold">BISTROT</span>
          <span className="text-2xl font-sans font-black italic">PIZZA&CO</span>
          <span className="text-2xl font-serif italic font-semibold">La Trattoria</span>
          <span className="text-2xl font-sans font-medium tracking-widest border-2 border-current px-2">FINE DINING</span>
        </div>
      </div>
    </section>
  )
}

const CTA = () => {
  return (
    <section className="py-32 bg-[#f96800] text-white overflow-hidden relative">
      {/* Abstract background shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-black blur-3xl"></div>
      </div>

      <div className="w-full max-w-7xl mx-auto relative z-10 px-4 md:px-6 text-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-8">
          Pronto a far crescere il tuo business?
        </h2>
        <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
          Unisciti ai migliaia di ristoratori che hanno scelto Smartables per ottimizzare il proprio lavoro.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Button className="h-16 px-12 text-xl font-bold bg-white text-[#da3743] hover:bg-gray-100 rounded-full shadow-2xl">
            Richiedi una demo gratuita
          </Button>
          <Button variant="outline" className="h-16 px-12 text-xl font-bold bg-transparent text-white border-2 border-white/30 hover:bg-white/90 rounded-full">
            Parla con un esperto
          </Button>
        </div>
        <p className="mt-8 text-sm text-white/70">
          Setup gratuito • Nessun contratto vincolante • Supporto 24/7
        </p>
      </div>
    </section>
  )
}

export default HomePage