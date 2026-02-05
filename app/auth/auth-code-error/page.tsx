import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center bg-white p-10 rounded-xl shadow border">
        <h2 className="text-3xl font-extrabold text-gray-900">Errore di Autenticazione</h2>
        <p className="mt-2 text-sm text-gray-600">
          Non siamo riusciti a verificare il tuo invito. Il link potrebbe essere scaduto o non valido.
        </p>
        <p className="text-xs text-gray-500 mt-4">
          Se vedi questo errore ripetutamente, contatta l'amministratore.
          (Codice mancante nella callback)
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/login">Torna al Login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
