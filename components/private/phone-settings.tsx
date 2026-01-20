import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Phone, Search, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Location } from '@/types/components'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PhoneSettingsProps {
  location: Location
}

import { TelnyxNumber } from '@/lib/telnyx'

interface PhoneSettingsProps {
  location: Location
}

export default function PhoneSettings({ location }: PhoneSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchAreaCode, setSearchAreaCode] = useState('')
  const [searchCountry, setSearchCountry] = useState('IT')
  const [availableNumbers, setAvailableNumbers] = useState<TelnyxNumber[]>([])
  const [selectedNumber, setSelectedNumber] = useState<TelnyxNumber | null>(null)

  // Existing numbers state
  const [ownedNumbers, setOwnedNumbers] = useState<any[]>([])
  const [selectedOwnedNumber, setSelectedOwnedNumber] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState('buy')

  // Auto-fetch on mount with location-based filtering
  useEffect(() => {
    let initialAreaCode = ''

    // Try to infer area code from address for Italy
    if (location.address && searchCountry === 'IT') {
      const address = location.address.toLowerCase()
      if (address.includes('milano')) initialAreaCode = '02'
      else if (address.includes('roma')) initialAreaCode = '06'
      else if (address.includes('torino')) initialAreaCode = '011'
      else if (address.includes('napoli')) initialAreaCode = '081'
      else if (address.includes('genova')) initialAreaCode = '010'
      else if (address.includes('bologna')) initialAreaCode = '051'
      else if (address.includes('firenze')) initialAreaCode = '055'
      else if (address.includes('bari')) initialAreaCode = '080'
      else if (address.includes('palermo')) initialAreaCode = '091'
      else if (address.includes('venezia')) initialAreaCode = '041'
      else if (address.includes('verona')) initialAreaCode = '045'
    }

    if (initialAreaCode) {
      setSearchAreaCode(initialAreaCode)
    }

    // Pass the inferred code directly to search to avoid state mismatch
    handleSearch(initialAreaCode)
  }, [location.address, searchCountry])

  const handleSearch = async (overrideAreaCode?: string) => {
    setIsSearching(true)
    setAvailableNumbers([])
    setSelectedNumber(null)
    try {
      const params = new URLSearchParams()
      const areaCodeToUse = overrideAreaCode !== undefined ? overrideAreaCode : searchAreaCode
      if (areaCodeToUse) params.append('areaCode', areaCodeToUse)
      params.append('country', searchCountry)

      const res = await fetch(`/api/telnyx/search?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setAvailableNumbers(data.numbers || [])
      if (data.numbers?.length === 0) {
        toast.info('No numbers found. Try a different search?')
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to search numbers'
      toast.error(message)
    } finally {
      setIsSearching(false)
    }
  }

  const handleFetchOwned = async () => {
    setIsSearching(true)
    setOwnedNumbers([])
    try {
      const res = await fetch('/api/telnyx/owned')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOwnedNumbers(data.numbers || [])
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch owned numbers'
      toast.error(message)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedOwnedNumber) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/telnyx/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId: selectedOwnedNumber.id,
          phoneNumber: selectedOwnedNumber.phoneNumber,
          connectionId: selectedOwnedNumber.connectionId,
          locationId: location.id
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(`Number ${selectedOwnedNumber.phoneNumber} assigned successfully!`)
      router.refresh()
      setOwnedNumbers([])
      setSelectedOwnedNumber(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to assign number'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!selectedNumber) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/telnyx/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: selectedNumber.phoneNumber,
          locationId: location.id
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(`Number ${selectedNumber.phoneNumber} purchased successfully!`)
      // Refresh the page to show the connected number
      router.refresh()
      // Optionally clear state
      setAvailableNumbers([])
      setSelectedNumber(null)

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to purchase number'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (location.telnyx_phone_number) {
    return (
      <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Phone className="w-5 h-5" /> Connected Number
          </CardTitle>
          <CardDescription>
            Your AI assistant is active on this number.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-background rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <Phone className="w-4 h-4 text-green-700 dark:text-green-400" />
              </div>
              <div>
                <p className="font-mono text-lg font-medium">{location.telnyx_phone_number}</p>
                <p className="text-xs text-muted-foreground hidden">ID: {location.telnyx_connection_id?.substring(0, 8)}...</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
              <Check className="w-4 h-4" /> Active
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="space-y-6">
        {/* Search Section */}
        <div className="flex flex-col gap-6">
          {isSearching && availableNumbers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-zinc-300" />
              <p className="text-sm">Fetching available numbers...</p>
            </div>
          )}

          {/* Results List */}
          {!isSearching && availableNumbers.length > 0 && (
            <div className="border h-[200px] border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="max-h-[200px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900/50">
                {availableNumbers.map((num) => (
                  <div
                    key={num.phoneNumber}
                    className={`group flex items-center justify-between p-4 cursor-pointer transition-all duration-200 ${selectedNumber?.phoneNumber === num.phoneNumber
                      ? 'bg-blue-50/80 dark:bg-blue-900/20'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}
                    onClick={() => setSelectedNumber(num)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-full transition-colors ${selectedNumber?.phoneNumber === num.phoneNumber
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'
                        }`}>
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`font-mono font-medium text-base ${selectedNumber?.phoneNumber === num.phoneNumber
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-foreground'
                          }`}>
                          {num.phoneNumber}
                        </p>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedNumber?.phoneNumber === num.phoneNumber
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-zinc-300 dark:border-zinc-600 text-transparent'
                      }`}>
                      {selectedNumber?.phoneNumber === num.phoneNumber && (
                        <Check className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {availableNumbers.length === 0 && !isSearching && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No formatted numbers found.</p>
              <p className="text-xs mt-1 opacity-70">Try refreshing or changing filters.</p>
            </div>
          )}
        </div>
      </div>
      {selectedNumber && (
        <div className="bg-zinc-50/50 dark:bg-zinc-900/50 border-t p-4 flex justify-between items-center">
          <div className="text-sm">
            Selected: <span className="font-mono font-medium">{selectedNumber.phoneNumber}</span>
          </div>
          <Button onClick={handlePurchase} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Confirm & Buy'}
          </Button>
        </div>
      )}
    </div>
  )
}
