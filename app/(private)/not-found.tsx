'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft, SearchX } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4 text-center">
      <div className="flex flex-col items-center gap-5 max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center">
          <SearchX className="w-8 h-8 text-gray-500" />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            Errore 404
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pagina non trovata
          </h1>
          <p className="text-gray-500 leading-relaxed">
            Questa sezione non esiste o non hai i permessi per visualizzarla.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button asChild className="flex-1 rounded-xl font-semibold">
            <Link href="/home">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex-1 rounded-xl font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Indietro
          </Button>
        </div>
      </div>
    </div>
  )
}
