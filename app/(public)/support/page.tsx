import Link from 'next/link'
import { Search, Book, User, CreditCard, MessageCircle, Mail, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const SupportPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      {/* Hero Section */}
      <section className="bg-black py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#FF9710]/10" />
        <div className="container px-4 md:px-6 mx-auto relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Come possiamo aiutarti?
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Cerca nelle nostre guide o contatta il nostro team di supporto.
          </p>
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              className="pl-12 h-14 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-full text-lg focus-visible:ring-[#FF9710] focus-visible:border-[#FF9710]"
              placeholder="Cerca un argomento (es. 'configurazione menu', 'fatturazione')..."
            />
          </div>
        </div>
      </section>

      {/* Help Topics Grid */}
      <section className="py-20 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow border-gray-200 cursor-pointer group">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Book className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Primi passi</CardTitle>
                <CardDescription>Tutto ciò che serve per configurare il tuo ristorante.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mt-2 text-sm text-gray-600">
                  <li className="hover:text-[#FF9710] transition-colors">Configurazione account</li>
                  <li className="hover:text-[#FF9710] transition-colors">Importazione menu</li>
                  <li className="hover:text-[#FF9710] transition-colors">Setup stampanti</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-gray-200 cursor-pointer group">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Account & Team</CardTitle>
                <CardDescription>Gestisci permessi, utenti e impostazioni profilo.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mt-2 text-sm text-gray-600">
                  <li className="hover:text-[#FF9710] transition-colors">Aggiungi collaboratori</li>
                  <li className="hover:text-[#FF9710] transition-colors">Permessi e ruoli</li>
                  <li className="hover:text-[#FF9710] transition-colors">Sicurezza account</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-gray-200 cursor-pointer group">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Fatturazione</CardTitle>
                <CardDescription>Gestisci abbonamenti, metodi di pagamento e fatture.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mt-2 text-sm text-gray-600">
                  <li className="hover:text-[#FF9710] transition-colors">Storico fatture</li>
                  <li className="hover:text-[#FF9710] transition-colors">Modifica metodo di pagamento</li>
                  <li className="hover:text-[#FF9710] transition-colors">Piani e upgrade</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="container px-4 md:px-6 mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Hai ancora bisogno di aiuto?</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-[#FF9710]/10 rounded-full flex items-center justify-center mb-6">
                <MessageCircle className="w-8 h-8 text-[#FF9710]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Chatta con noi</h3>
              <p className="text-gray-600 mb-6 text-center">
                Il nostro team è disponibile Lun-Ven, 9:00 - 18:00
              </p>
              <Button className="w-full bg-[#FF9710] hover:bg-[#e0850e] text-white font-bold rounded-full">
                Avvia Live Chat
              </Button>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-[#da3743]/10 rounded-full flex items-center justify-center mb-6">
                <Mail className="w-8 h-8 text-[#da3743]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Scrivici una email</h3>
              <p className="text-gray-600 mb-6 text-center">
                Ti risponderemo entro 24 ore lavorative.
              </p>
              <Button variant="outline" className="w-full border-gray-200 text-gray-900 font-bold hover:bg-gray-50 rounded-full">
                support@smartables.it
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Link */}
      <section className="py-12 bg-white text-center">
        <Link href="/pricing" className="inline-flex items-center text-gray-500 hover:text-[#FF9710] transition-colors font-medium">
          Consulta le FAQ sui prezzi <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
      </section>
    </div>
  )
}

export default SupportPage