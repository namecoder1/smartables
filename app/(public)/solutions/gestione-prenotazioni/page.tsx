import { Calendar, Bell, MessageSquare, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Hero from '../hero'

const BookingsPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans selection:bg-[#FF9710] selection:text-white">
      <Hero
        icon={<Calendar className='h-4 w-4' />}
        title="Gestione Prenotazioni"
        subtitle="Mai più No-Show."
        description="Riempi i tavoli vuoti automaticamente. Il nostro sistema di prenotazione intelligente gestisce conferme, promemoria e liste d'attesa per te."
        ctaText="Attiva Prenotazioni"
      />
      <Benefits />
      <FlowSection />
      <CTASection />
    </div>
  )
}

const Benefits = () => {
  return (
    <section className="py-24 bg-white relative">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            L'assistente virtuale per le <br /> <span className="text-[#FF9710]">tue prenotazioni</span>
          </h2>
          <p className="text-xl text-gray-500">
            Non perdere tempo al telefono. Lascia che Smartables gestisca il flusso.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <BenefitCard
            icon={<MessageSquare size={32} />}
            title="WhatsApp First"
            description="Le conferme arrivano dove i clienti le leggono: su WhatsApp. Un semplice 'Sì' conferma il tavolo."
            theme="green"
          />
          <BenefitCard
            icon={<ShieldCheck size={32} />}
            title="Carta a Garanzia"
            description="Per tavoli numerosi o serate speciali, richiedi una carta a garanzia in modo automatico. Deterrente perfetto."
            theme="orange"
          />
          <BenefitCard
            icon={<Bell size={32} />}
            title="Reminder Automatico"
            description="24 ore prima, Smartables chiede conferma. Se disdice, il tavolo torna subito disponibile."
            theme="blue"
          />
        </div>
      </div>
    </section>
  )
}

const BenefitCard = ({ icon, title, description, theme }: { icon: React.ReactNode, title: string, description: string, theme: "green" | "orange" | "blue" }) => {
  const themeStyles = {
    green: "bg-green-50 text-green-600 hover:border-green-100",
    orange: "bg-orange-50 text-orange-600 hover:border-orange-100",
    blue: "bg-blue-50 text-blue-600 hover:border-blue-100"
  }

  return (
    <div className={`p-8 rounded-[2rem] bg-white border border-transparent transition-all hover:shadow-xl hover:-translate-y-1 ${themeStyles[theme].split(' ')[2]}`}>
      <div className={`p-4 rounded-2xl w-fit mb-6 ${themeStyles[theme].split(' ').slice(0, 2).join(' ')}`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-500 leading-relaxed font-medium">
        {description}
      </p>
    </div>
  )
}

const FlowSection = () => {
  return (
    <section className="py-24 bg-gray-50 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-1/4 left-[-10%] w-[600px] h-[600px] bg-green-200/40 rounded-full blur-[100px]"></div>
      </div>

      <div className="container px-4 md:px-6 mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <span className="inline-block py-1 px-3 rounded-full bg-[#FF9710]/10 text-[#FF9710] font-bold tracking-wider uppercase text-xs mb-6">Il Flusso Intelligente</span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-10 leading-tight">
              Come Smartables sconfigge i No-Show
            </h2>
            <div className="space-y-12 relative">
              {/* Vertical Line */}
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-200"></div>

              {[
                { step: 1, title: "Prenotazione", desc: "Il cliente prenota. Status: PENDING", color: "bg-gray-900", text: "text-white" },
                { step: 2, title: "Reminder 24h", desc: "Messaggio WhatsApp automatico", color: "bg-blue-600", text: "text-white" },
                { step: 3, title: "Azione", desc: "Conferma o Disdetta immediata", color: "bg-[#FF9710]", text: "text-white" }
              ].map((item, i) => (
                <div key={i} className="relative flex gap-8 items-start">
                  <div className={`w-12 h-12 rounded-full ${item.color} ${item.text} flex items-center justify-center text-xl font-bold shrink-0 shadow-lg relative z-10 border-4 border-gray-50`}>
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                    <p className="text-gray-500 mt-1 font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-linear-to-tr from-green-200 to-blue-200 rounded-[3rem] blur-xl opacity-50"></div>
            <div className="relative h-[650px] w-full bg-white rounded-[2.5rem] shadow-2xl p-8 flex flex-col justify-center items-center overflow-hidden border border-gray-100">
              <div className="absolute top-0 inset-x-0 h-32 bg-gray-50/50"></div>

              {/* Conversation Flow */}
              <div className="w-full max-w-xs space-y-6 relative z-10">
                <div className="flex justify-end">
                  <div className="bg-green-100 p-4 rounded-2xl rounded-tr-sm text-gray-800 text-sm shadow-sm max-w-[85%]">
                    <p>Ciao Mario! Confermi la cena per domani alle 20:30 x 4 persone?</p>
                    <span className="text-[10px] opacity-50 block text-right mt-1">10:00</span>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 p-2 rounded-xl shadow-lg w-full">
                    <p className="text-xs text-center text-gray-500 mb-2">Seleziona un'opzione</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 transition-colors">
                        <CheckCircle2 size={14} /> Sì
                      </button>
                      <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 transition-colors">
                        <XCircle size={14} /> No
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end opacity-50 blur-[1px]">
                  <div className="bg-green-100 p-4 rounded-2xl rounded-tr-sm text-gray-800 text-sm shadow-sm max-w-[85%]">
                    <p>Perfetto, grazie! A domani! 🍽️</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-10 left-0 right-0 text-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Esperienza Cliente Senza App</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const CTASection = () => {
  return (
    <section className="py-32 bg-white text-center relative overflow-hidden">
      <div className="container max-w-5xl mx-auto px-4 relative z-10">
        <div className="bg-[#1a1a1a] rounded-[3rem] p-16 md:p-24 relative overflow-hidden shadow-2xl text-white">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#FF9710] rounded-full blur-[120px] opacity-20"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-green-500 rounded-full blur-[120px] opacity-20"></div>

          <h2 className="text-3xl md:text-5xl font-bold mb-8 relative z-10">
            Basta sedie vuote.
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto relative z-10">
            L'80% dei no-show si evita con un semplice messaggio.
          </p>
          <Button className="h-16 px-12 text-xl font-bold bg-[#FF9710] hover:bg-[#ff8906] text-white rounded-2xl shadow-xl hover:scale-105 transition-transform relative z-10">
            Ottimizza le tue prenotazioni
          </Button>
        </div>
      </div>
    </section>
  )
}

export default BookingsPage
