"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Phone, Search, ShoppingCart } from "lucide-react";
import { searchAvailableNumbers, purchasePhoneNumber } from "@/lib/telnyx"; // We'll move these to server actions or API calls to avoid exposing keys client-side if they aren't already.
// Wait, `lib/telnyx.ts` uses process.env.TELNYX_API_KEY which is server-side only. We cannot import it directly in "use client" component.
// We need Server Actions or API routes.
// Let's create a server action wrapper for this.

// But for now, let's assume we use the existing API structure or create a new one.
// The user prompt mentioned "purchase number".
// Let's create a Server Action file `app/actions/telnyx.ts` for this?
// Or just use the API route `/api/telnyx/buy`.
// Let's check if `/api/telnyx/buy` exists? 
// The docs mentioned `/api/telnyx/buy` proposed.

// Let's implement the component assuming we will call an action or API.
// For Simplicity in this Agentic flow, I'll inline the Server Action logic in a new file `app/actions/telnyx-numbers.ts` 
// and import it here.

import { searchNumbersAction, buyNumberAction } from "@/app/actions/telnyx-numbers";

interface NumberPurchaseProps {
  locationId: string;
  requirementGroupId: string;
  areaCode: string;
}

export function NumberPurchase({ locationId, requirementGroupId, areaCode }: NumberPurchaseProps) {
  const [numbers, setNumbers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handleSearch = async () => {
    setSearching(true);
    try {
      // Use the area code from compliance
      const results = await searchNumbersAction("IT", areaCode);
      setNumbers(results);
    } catch (error: any) {
      toast.error("Errore ricerca numeri: " + error.message);
    } finally {
      setSearching(false);
    }
  };

  const handleBuy = async (phoneNumber: string) => {
    if (!confirm(`Sei sicuro di voler acquistare il numero ${phoneNumber}?`)) return;

    setPurchasing(phoneNumber);
    try {
      await buyNumberAction(phoneNumber, locationId, requirementGroupId);
      toast.success(`Numero ${phoneNumber} acquistato e collegato alla sede!`);
      // Refresh page or update state
      window.location.reload();
    } catch (error: any) {
      toast.error("Errore acquisto: " + error.message);
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acquista Numero Locale</CardTitle>
        <CardDescription>
          La tua verifica per il prefisso <strong>{areaCode}</strong> è stata approvata.
          Scegli un numero da attivare.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={handleSearch} disabled={searching}>
            {searching ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2" />}
            Cerca Numeri {areaCode}
          </Button>
        </div>

        <div className="grid gap-2">
          {numbers.map((num) => (
            <div key={num.phoneNumber} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono font-medium">{num.phoneNumber}</span>
                <span className="text-xs text-muted-foreground">({num.region})</span>
              </div>
              <Button
                size="sm"
                onClick={() => handleBuy(num.phoneNumber)}
                disabled={!!purchasing}
              >
                {purchasing === num.phoneNumber ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" /> Acquista
                  </>
                )}
              </Button>
            </div>
          ))}
          {numbers.length === 0 && !searching && (
            <p className="text-sm text-muted-foreground">Clicca su Cerca per vedere i numeri disponibili.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
