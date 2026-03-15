'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, Loader2 } from 'lucide-react'
import {
  exportBookingsCSV,
  exportCustomersCSV,
  exportOrdersCSV,
  exportWhatsAppCSV,
} from '@/lib/analytics/export'

interface ExportMenuProps {
  from?: string
  to?: string
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function ExportMenu({ from, to }: ExportMenuProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handle = async (
    action: () => Promise<{ csv?: string; filename?: string; error?: string }>,
    key: string,
  ) => {
    setLoading(key)
    try {
      const result = await action()
      if (result.csv && result.filename) {
        downloadCSV(result.csv, result.filename)
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Esporta
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Esporta CSV</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!!loading}
          onClick={() => handle(() => exportBookingsCSV(from, to), 'bookings')}
        >
          Prenotazioni
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!!loading}
          onClick={() => handle(() => exportCustomersCSV(), 'customers')}
        >
          Clienti
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!!loading}
          onClick={() => handle(() => exportOrdersCSV(from, to), 'orders')}
        >
          Ordini
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!!loading}
          onClick={() => handle(() => exportWhatsAppCSV(from, to), 'whatsapp')}
        >
          Messaggi WhatsApp
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
