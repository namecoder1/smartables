"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PhoneCall,
  CheckCircle2,
  Copy,
  ArrowRight,
  Smartphone,
  Phone,
  Server,
  PartyPopper,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageWrapper from "@/components/private/page-wrapper";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

type PhoneType = "mobile" | "landline" | "voip";

export default function TestOnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [telnyxNumber, setTelnyxNumber] = useState<string | null>(null);
  const [isTestCompleted, setIsTestCompleted] = useState(false);

  // Wizard State
  const [step, setStep] = useState<"setup" | "test" | "completed">("setup");
  const [phoneType, setPhoneType] = useState<PhoneType | null>(null);
  const [carrier, setCarrier] = useState<string>("");

  const router = useRouter();
  const supabase = createClient();
  const { width, height } = useWindowSize();

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profile?.organization_id) {
        const { data: location } = await supabase
          .from("locations")
          .select("id, telnyx_phone_number, is_test_completed")
          .eq("organization_id", profile.organization_id)
          .single();

        if (location) {
          setLocationId(location.id);
          setTelnyxNumber(location.telnyx_phone_number);
          if (location.is_test_completed) {
            setStep("completed");
            setIsTestCompleted(true);
          }
        }
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  // Polling for test success
  useEffect(() => {
    if (step !== "test" || !locationId) return;

    const interval = setInterval(async () => {
      try {
        const { data: location } = await supabase
          .from("locations")
          .select("is_test_completed")
          .eq("id", locationId)
          .single();

        if (location?.is_test_completed) {
          setIsTestCompleted(true);
          setStep("completed");
          clearInterval(interval);
          toast.success("Test Riuscito! Messaggio Inviato!");
        }
      } catch {
        // ignore polling errors silently
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [step, locationId, supabase]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Codice copiato negli appunti!");
  };

  const getMMICode = () => {
    if (!telnyxNumber) return "";
    return `**61*${telnyxNumber}#`;
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageWrapper>
    );
  }

  if (step === "completed") {
    return (
      <PageWrapper>
        {isTestCompleted && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in zoom-in duration-500">
          <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center shadow-lg border-4 border-green-50">
            <PartyPopper className="h-12 w-12 text-green-600" />
          </div>
          <div className="text-center space-y-3 max-w-md">
            <h1 className="text-3xl font-extrabold text-green-700">Magia Completata!</h1>
            <p className="text-muted-foreground text-lg">
              Hai appena vissuto l'esperienza dei tuoi clienti. Il tuo assistente AI è ora pienamente operativo e pronto a trasformare le chiamate perse in prenotazioni!
            </p>
          </div>
          <Button size="lg" className="mt-4 px-8" onClick={() => router.push("/home")}>
            Vai alla Dashboard
          </Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Il Test Finale</h1>
        <p className="text-muted-foreground text-lg">
          Imposta la deviazione di chiamata e prova con mano la magia di Smartables.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  {step === "setup" ? <PhoneCall className="h-6 w-6 text-primary" /> : <Smartphone className="h-6 w-6 text-primary" />}
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {step === "setup" ? "Passo 1: Deviazione di Chiamata" : "Passo 2: Il Momento WOW"}
                  </CardTitle>
                  <CardDescription>
                    {step === "setup"
                      ? "Collega il tuo numero ristorante attuale al tuo nuovo assistente AI."
                      : "Verifichiamo che il sistema riconosca la chiamata e invii il messaggio WhatsApp."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {step === "setup" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Come ricevi oggi le chiamate al ristorante?</Label>
                    <RadioGroup
                      value={phoneType || ""}
                      onValueChange={(val: string) => setPhoneType(val as PhoneType)}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      <Label
                        htmlFor="mobile"
                        className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5 ${phoneType === 'mobile' ? 'border-primary bg-primary/5' : ''}`}
                      >
                        <RadioGroupItem value="mobile" id="mobile" className="sr-only" />
                        <Smartphone className="mb-3 h-8 w-8 text-muted-foreground" />
                        <span className="font-medium">Cellulare</span>
                        <span className="text-xs text-muted-foreground mt-1 text-center">SIM aziendale o personale</span>
                      </Label>

                      <Label
                        htmlFor="landline"
                        className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5 ${phoneType === 'landline' ? 'border-primary bg-primary/5' : ''}`}
                      >
                        <RadioGroupItem value="landline" id="landline" className="sr-only" />
                        <Phone className="mb-3 h-8 w-8 text-muted-foreground" />
                        <span className="font-medium">Rete Fissa</span>
                        <span className="text-xs text-muted-foreground mt-1 text-center">Telefono classico o cordless</span>
                      </Label>

                      <Label
                        htmlFor="voip"
                        className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5 ${phoneType === 'voip' ? 'border-primary bg-primary/5' : ''}`}
                      >
                        <RadioGroupItem value="voip" id="voip" className="sr-only" />
                        <Server className="mb-3 h-8 w-8 text-muted-foreground" />
                        <span className="font-medium">Centralino / VoIP</span>
                        <span className="text-xs text-muted-foreground mt-1 text-center">Numeri virtuali, PBX in cloud</span>
                      </Label>
                    </RadioGroup>
                  </div>

                  {phoneType === "mobile" && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                        <h4 className="font-semibold text-blue-900 mb-2">Istruzioni per Cellulare</h4>
                        <p className="text-sm text-blue-800/80 mb-4">
                          Apri il tastierino del telefono dove ricevi le chiamate del ristorante, digita questo codice e premi il tasto verde per chiamare.
                          Questo inoltrerà le chiamate non risposte (dopo circa 15 secondi) al tuo assistente AI.
                        </p>
                        <div className="space-y-4">
                          <div className="flex flex-col gap-2">
                            <Label className="text-sm font-semibold text-blue-900">1. Se non riesci a rispondere (Squilla a vuoto):</Label>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 bg-white px-4 py-3 rounded-md border shadow-sm font-mono text-lg font-bold text-center tracking-wider text-slate-800">
                                **61*{telnyxNumber}#
                              </code>
                              <Button variant="secondary" size="icon" className="h-12 w-12 shrink-0" onClick={() => copyToClipboard(`**61*${telnyxNumber}#`)}>
                                <Copy className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Label className="text-sm font-semibold text-blue-900">2. Se sei già al telefono (Occupato):</Label>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 bg-white px-4 py-3 rounded-md border shadow-sm font-mono text-lg font-bold text-center tracking-wider text-slate-800">
                                **67*{telnyxNumber}#
                              </code>
                              <Button variant="secondary" size="icon" className="h-12 w-12 shrink-0" onClick={() => copyToClipboard(`**67*${telnyxNumber}#`)}>
                                <Copy className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-blue-200/50">
                          <h5 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Come disattivare (Safe Exit)</h5>
                          <ul className="text-xs text-blue-800/80 space-y-1 list-disc pl-4">
                            <li>Digita <strong>##61#</strong> e chiama per annullare la deviazione "se non rispondi".</li>
                            <li>Digita <strong>##67#</strong> e chiama per annullare la deviazione "se occupato".</li>
                            <li>Digita <strong>##002#</strong> e chiama per disattivare <em>tutte</em> le deviazioni.</li>
                          </ul>
                        </div>
                        <p className="text-[10px] text-blue-700/60 mt-3 text-center">
                          Nota: se usi un operatore virtuale (es. Iliad) e il codice principale non funziona, contatta l'operatore per attivare la "Deviazione su mancata risposta".
                        </p>
                      </div>
                    </div>
                  )}

                  {phoneType === "landline" && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="p-4 bg-orange-50/50 rounded-lg border border-orange-100">
                        <h4 className="font-semibold text-orange-900 mb-2">Istruzioni per Rete Fissa</h4>
                        <p className="text-sm text-orange-800/80 mb-4">
                          Se usi TIM, digita sul tastierino <code className="font-bold bg-white px-1 py-0.5 rounded">*22*{telnyxNumber}#</code> e ascolta il messaggio di conferma.
                          Per altri operatori (Vodafone, Fastweb, WindTre), l'impostazione va fatta dal pannello di controllo online del tuo modem (es. Vodafone Station, Fastgate) o contattando l'assistenza clienti.
                        </p>
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs uppercase font-bold text-orange-800/60 tracking-wider">Il tuo numero di destinazione (da copiare):</Label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 bg-white px-4 py-3 rounded-md border shadow-sm font-mono text-lg font-bold text-center tracking-wider text-slate-800">
                              {telnyxNumber}
                            </code>
                            <Button variant="secondary" size="icon" className="h-12 w-12 shrink-0" onClick={() => copyToClipboard(telnyxNumber || "")}>
                              <Copy className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {phoneType === "voip" && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
                        <h4 className="font-semibold text-purple-900 mb-2">Istruzioni per VoIP / Centralino</h4>
                        <p className="text-sm text-purple-800/80 mb-4">
                          Accedi al pannello di controllo del tuo provider VoIP o centralino (es. FritzBox, 3CX, Wildix).
                          Cerca l'opzione "Trasferimento di chiamata", "Inoltro Incondizionato" o "Inoltro per Mancata Risposta" e imposta questo numero come destinazione:
                        </p>
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs uppercase font-bold text-purple-800/60 tracking-wider">Numero di Destinazione:</Label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 bg-white px-4 py-3 rounded-md border shadow-sm font-mono text-lg font-bold text-center tracking-wider text-slate-800">
                              {telnyxNumber}
                            </code>
                            <Button variant="secondary" size="icon" className="h-12 w-12 shrink-0" onClick={() => copyToClipboard(telnyxNumber || "")}>
                              <Copy className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t flex justify-end">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto text-base"
                      disabled={!phoneType}
                      onClick={() => setStep("test")}
                    >
                      Ho attivato la deviazione, vai al Test! <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              {step === "test" && (
                <div className="space-y-8 py-4 animate-in fade-in slide-in-from-right-4">
                  <div className="text-center space-y-4 max-w-lg mx-auto">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 relative">
                      <Smartphone className="h-10 w-10 text-blue-600 animate-pulse" />
                      <span className="absolute top-0 right-0 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold">Fai uno squillo al Bot</h3>

                    <p className="text-lg text-muted-foreground">
                      Prendi il tuo <strong>cellulare personale</strong> e chiama direttamente il numero del tuo nuovo assistente qui sotto.
                    </p>

                    <div className="bg-muted px-6 py-4 rounded-xl border-2 border-dashed border-muted-foreground/30 inline-block w-full">
                      <span className="text-3xl font-mono font-black tracking-widest text-foreground">{telnyxNumber}</span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Ascolta la voce di risposta rapida e <strong>guarda subito il tuo WhatsApp</strong>. Riceverai un messaggio istantaneo!
                    </p>
                  </div>

                  <div className="bg-blue-50/50 rounded-lg p-4 flex items-center justify-center gap-3 text-blue-800 border border-blue-100">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="font-medium animate-pulse">In attesa che tu chiami il numero...</span>
                  </div>

                  <div className="pt-4 flex justify-center">
                    <Button variant="ghost" className="text-muted-foreground text-sm" onClick={() => setStep("setup")}>
                      Tornare alle istruzioni di setup
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-800">Cosa stiamo testando?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-3">
              <p>
                Invece di perdere potenziali clienti quando non puoi rispondere al telefono,
                Smartables intercetta la chiamata trasferita.
              </p>
              <ul className="list-disc pl-4 space-y-2 opacity-90">
                <li>La chiamata arriva al tuo numero.</li>
                <li>Dopo qualche squillo o se occupato, passa alla nostra rete (Telnyx).</li>
                <li>Identifichiamo il cliente.</li>
                <li>Inviamo immediatamente un WhatsApp ufficiale per accoglierlo e fargli prenotare un tavolo online.</li>
              </ul>
              <p className="font-medium text-slate-800 pt-2 border-t border-slate-200">
                Risultato: Zero chiamate perse, più coperti garantiti.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
