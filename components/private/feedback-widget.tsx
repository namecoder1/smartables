"use client";

import { useState, useTransition } from "react";
import { MessageSquarePlus, Bug, Lightbulb, Heart, MessageCircle, X, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { VscFeedback } from "react-icons/vsc";
import { submitUserFeedback } from "@/app/actions/user-feedback";

type FeedbackType = "feature_request" | "bug_report" | "general" | "praise";

const FEEDBACK_TYPES: {
  value: FeedbackType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  description: string;
}[] = [
  {
    value: "feature_request",
    label: "Suggerisci una feature",
    icon: Lightbulb,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200 hover:bg-amber-100",
    description: "Hai un'idea per migliorare Smartables?",
  },
  {
    value: "bug_report",
    label: "Segnala un bug",
    icon: Bug,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200 hover:bg-red-100",
    description: "Qualcosa non funziona come dovrebbe?",
  },
  {
    value: "general",
    label: "Feedback generale",
    icon: MessageCircle,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    description: "Qualsiasi altra cosa vuoi dirci",
  },
  {
    value: "praise",
    label: "Complimento",
    icon: Heart,
    color: "text-pink-600",
    bg: "bg-pink-50 border-pink-200 hover:bg-pink-100",
    description: "Hai qualcosa di bello da condividere?",
  },
];

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"type" | "form" | "done">("type");
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleTypeSelect = (type: FeedbackType) => {
    setSelectedType(type);
    setStep("form");
  };

  const handleSubmit = (formData: FormData) => {
    if (!selectedType) return;
    formData.set("type", selectedType);
    startTransition(async () => {
      const result = await submitUserFeedback(formData);
      if (result.success) {
        setStep("done");
      }
    });
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setStep("type");
      setSelectedType(null);
    }, 300);
  };

  const selectedConfig = FEEDBACK_TYPES.find((t) => t.value === selectedType);

  return (
    <>
      {/* Floating trigger button */}
      <Button
        onClick={() => setOpen(true)}
        className="fixed rounded-xl! bottom-4 right-4 xl:bottom-7 xl:right-7 z-50 flex items-center gap-2 bg-primary text-background shadow-lg px-4 py-2.5 text-sm font-medium transition-all hover:scale-105 active:scale-95"
        aria-label="Invia feedback"
        size='icon-lg'
      >
        <VscFeedback className="h-4 w-4" />
      </Button>

      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg">
                {step === "type" && "Come possiamo aiutarti?"}
                {step === "form" && selectedConfig?.label}
                {step === "done" && "Grazie!"}
              </SheetTitle>
            </div>
            {step === "form" && (
              <p className="text-sm text-muted-foreground">
                {selectedConfig?.description}
              </p>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Step 1: Type selection */}
            {step === "type" && (
              <div className="grid grid-cols-1 gap-3">
                {FEEDBACK_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => handleTypeSelect(type.value)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-3xl border-2 text-left transition-all",
                        type.bg
                      )}
                    >
                      <div className={cn("rounded-lg p-2 bg-white/70", type.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-md">{type.label}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {type.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 2: Form */}
            {step === "form" && selectedType && (
              <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    {selectedType === "bug_report" ? "Descrivi il problema" : "Titolo"}
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    required
                    placeholder={
                      selectedType === "feature_request"
                        ? "es: Vorrei poter esportare le prenotazioni in Excel"
                        : selectedType === "bug_report"
                        ? "es: Il calendario non si aggiorna dopo aver cancellato"
                        : selectedType === "praise"
                        ? "es: Il sistema di prenotazione via WhatsApp è fantastico!"
                        : "es: Ho una domanda su..."
                    }
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Dettagli{" "}
                    <span className="text-muted-foreground text-xs">(opzionale)</span>
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={5}
                    placeholder={
                      selectedType === "bug_report"
                        ? "Cosa stavi facendo quando è successo? Come si riproduce il problema?"
                        : "Aggiungi qualsiasi dettaglio che possa essere utile..."
                    }
                    className="resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("type")}
                    className="flex-1"
                  >
                    Indietro
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="flex-1"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Invia
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: Done */}
            {step === "done" && (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Feedback ricevuto!</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Leggiamo ogni messaggio. Se hai segnalato un bug o suggerito una
                    feature, ti risponderemo il prima possibile.
                  </p>
                </div>
                <Button onClick={handleClose} className="mt-2">
                  Chiudi
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
