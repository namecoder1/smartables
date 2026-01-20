import Link from 'next/link'
import { Check, Calendar, Bell, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const BookingsPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-black text-white">
        <div className="absolute inset-0 z-0 opacity-40">
          {/* Abstract gradient background */}
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-green-600/30 rounded-full blur-[100px] hover:blur-[80px] transition-all duration-1000 -translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="container relative z-10 px-4 md:px-6 mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-6">
            <Calendar className="w-4 h-4" /> Gestione Prenotazioni
          </div>
          <h1 className="text-4xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            Mai più <span className="text-[#FF9710]">No-Show.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl leading-relaxed mb-10">
            Riempi i tavoli vuoti automaticamente. Il nostro sistema di prenotazione intelligente
            gestisce conferme, promemoria e liste d'attesa per te.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="h-14 px-8 text-lg font-bold bg-[#FF9710] hover:bg-[#e0850e] text-white rounded-full">
              Attiva Prenotazioni
            </Button>
            <Button variant="outline" className="h-14 px-8 text-lg font-bold border-white/20 hover:bg-white/10 text-white rounded-full">
              Come Funziona
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-24 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              L'assistente virtuale per le tue prenotazioni
            </h2>
            <p className="text-xl text-gray-600">
              Non perdere tempo al telefono. Lascia che Smartables gestisca il flusso.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="flex flex-col items-start gap-4">
              <div className="p-4 bg-green-100 rounded-2xl text-green-600 mb-2">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">WhatsApp First</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Le conferme arrivano dove i clienti le leggono: su WhatsApp.
                Niente email perse nello spam, niente SMS ignorati. Un semplice "Sì" conferma il tavolo.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-start gap-4">
              <div className="p-4 bg-orange-100 rounded-2xl text-[#FF9710] mb-2">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Garanzia Carta di Credito</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Per tavoli numerosi o serate speciali, richiedi una carta a garanzia in modo automatico.
                Deterrente perfetto contro i 'furbetti' del last minute.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-start gap-4">
              <div className="p-4 bg-blue-100 rounded-2xl text-blue-600 mb-2">
                <Bell size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Reminder Automatico</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                24 ore prima, Smartables chiede conferma al cliente. Se disdice,
                il tavolo torna subito disponibile e avvisiamo la lista d'attesa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Flow Visualization */}
      <section className="py-24 bg-gray-50 overflow-hidden">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-[#FF9710] font-bold tracking-wider uppercase text-sm mb-4 block">Il Flusso Intelligente</span>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-8">
                Come Smartables sconfigge i No-Show
              </h2>
              <ol className="relative border-l border-gray-200 ml-4 space-y-10">
                <li className="mb-10 ml-6">
                  <span className="absolute flex items-center justify-center w-8 h-8 bg-green-100 rounded-full -left-4 ring-8 ring-white">
                    <span className="text-green-600 font-bold">1</span>
                  </span>
                  <h3 className="flex items-center mb-1 text-lg font-bold text-gray-900">Prenotazione Inserita</h3>
                  <p className="mb-4 text-base font-normal text-gray-500">Il cliente prenota via telefono, web o walk-in. Lo status è <span className="inline-block px-2 py-0.5 rounded bg-gray-100 border text-xs font-mono">PENDING</span>.</p>
                </li>
                <li className="mb-10 ml-6">
                  <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full -left-4 ring-8 ring-white">
                    <span className="text-blue-600 font-bold">2</span>
                  </span>
                  <h3 className="mb-1 text-lg font-bold text-gray-900">Reminder (24h prima)</h3>
                  <p className="text-base font-normal text-gray-500">Un messaggio automatico chiede conferma. Il cliente clicca un bottone.</p>
                </li>
                <li className="ml-6">
                  <span className="absolute flex items-center justify-center w-8 h-8 bg-[#FF9710]/20 rounded-full -left-4 ring-8 ring-white">
                    <span className="text-[#FF9710] font-bold">3</span>
                  </span>
                  <h3 className="mb-1 text-lg font-bold text-gray-900">Azione Automatica</h3>
                  <p className="text-base font-normal text-gray-500">
                    <strong>Conferma:</strong> Status diventa <span className="text-green-600 font-bold">CONFIRMED</span>.<br />
                    <strong>Disdetta:</strong> Status <span className="text-red-600 font-bold">CANCELLED</span>, il tavolo si libera.
                  </p>
                </li>
              </ol>
            </div>
            <div className="relative h-[600px] w-full bg-white rounded-3xl shadow-2xl border-4 border-gray-100 p-8 flex flex-col justify-center items-center">
              {/* Visual representation regarding WhatsApp Flow could go here */}
              <div className="w-64 bg-green-50 rounded-lg p-4 mb-4 border border-green-100 self-end rounded-tr-none">
                <p className="text-sm text-gray-800">Ciao Mario! Confermi la cena per domani alle 20:30 x 4 persone?</p>
                <span className="text-[10px] text-gray-400 mt-1 block text-right">18:45</span>
              </div>
              <div className="w-64 bg-white rounded-lg p-3 mb-4 border shadow-sm self-end">
                <div className="flex flex-col gap-2">
                  <div className="h-10 bg-green-500 text-white rounded flex items-center justify-center font-bold text-sm cursor-pointer">Sì, Confermo ✅</div>
                  <div className="h-10 bg-gray-100 text-gray-600 rounded flex items-center justify-center font-bold text-sm cursor-pointer">No, cancella ❌</div>
                </div>
              </div>
              <div className="w-64 bg-green-50 rounded-lg p-4 mb-4 border border-green-100 self-end rounded-tr-none">
                <p className="text-sm text-gray-800">Grazie! Il tuo tavolo è confermato. A domani! 🍽️</p>
                <span className="text-[10px] text-gray-400 mt-1 block text-right">18:46</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-black text-white text-center">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold mb-8">
            Basta sedie vuote.
          </h2>
          <Button className="h-16 px-12 text-xl font-bold bg-[#FF9710] hover:bg-[#e0850e] text-white rounded-full shadow-lg border-none">
            Ottimizza le tue prenotazioni
          </Button>
        </div>
      </section>
    </div>
  )
}

export default BookingsPage
