"use client"

import { useState, useTransition } from "react"
import { submitFeedback } from "./feedback-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, MessageSquare, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

const FEEDBACK_REASONS = [
  { value: "too_expensive", label: "Troppo costoso" },
  { value: "missing_features", label: "Funzionalità mancanti" },
  { value: "difficult_to_use", label: "Difficile da usare" },
  { value: "not_as_expected", label: "Non era come mi aspettavo" },
  { value: "found_alternative", label: "Ho trovato un'alternativa" },
  { value: "other", label: "Altro" },
] as const

export function FeedbackForm() {
  const [selectedReason, setSelectedReason] = useState("")
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!selectedReason) {
      toast.error("Seleziona un motivo")
      return
    }

    startTransition(async () => {
      try {
        await submitFeedback(selectedReason, message)
        setSubmitted(true)
        toast.success("Grazie per il tuo feedback!")
      } catch {
        toast.error("Errore nell'invio del feedback. Riprova più tardi.")
      }
    })
  }

  if (submitted) {
    return (
      <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
        <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-full">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            Grazie per il tuo feedback! Ci aiuterà a migliorare.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Aiutaci a migliorare
        </CardTitle>
        <CardDescription>
          Ci dispiace vederti andare. Dicci cosa possiamo migliorare — il tuo feedback è importante per noi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Cosa ti ha portato a questa decisione? *</Label>
          <div className="grid gap-2">
            {FEEDBACK_REASONS.map((reason) => (
              <label
                key={reason.value}
                className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${selectedReason === reason.value
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/40 bg-input/30 hover:bg-primary/10"
                  }`}
              >
                <input
                  type="radio"
                  name="feedback-reason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`h-3 w-3 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedReason === reason.value
                    ? "border-primary"
                    : "border-black/10"
                    }`}
                >
                  {selectedReason === reason.value && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-sm">{reason.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedback-message">Dettagli aggiuntivi (opzionale)</Label>
          <Textarea
            id="feedback-message"
            placeholder="Dicci di più su cosa possiamo migliorare..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isPending || !selectedReason}
          className="w-full"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Invio...
            </>
          ) : (
            "Invia Feedback"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
