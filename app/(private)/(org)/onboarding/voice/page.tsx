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
  Phone,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  Smartphone
} from "lucide-react";
import { triggerVoiceVerification, submitVerificationCode } from "@/actions/verify-voice";
import { getOnboardingStatus } from "@/actions/get-onboarding-status";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { isValidPhoneNumber } from "react-phone-number-input";
import PageWrapper from "@/components/private/page-wrapper";
import Link from "next/link";

export default function VoiceVerificationPage() {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false); // Polling state
  const [status, setStatus] = useState<string>("pending");
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);

  // Manual Verification State
  const [forwardingNumber, setForwardingNumber] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"idle" | "calling" | "entering_code">("idle");

  const router = useRouter();
  const supabase = createClient();

  // Polling for status changes
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!locationId) return;
      try {
        const { data: location } = await supabase
          .from("locations")
          .select("activation_status, meta_verification_otp")
          .eq("id", locationId)
          .single();

        if (location?.activation_status) {
          setStatus(location.activation_status);
        }

        // Auto-fill OTP if found
        if (location?.meta_verification_otp && step !== "entering_code") {
          setManualCode(location.meta_verification_otp);
          setStep("entering_code");
          toast.success("Codice rilevato automaticamente!");
        }

        if (location?.activation_status === "verified") {
          setVerifying(false);
          clearInterval(interval);
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [locationId, supabase]);

  // Load initial status
  useEffect(() => {
    async function loadStatus() {
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
          .select("id, telnyx_phone_number, activation_status, meta_verification_otp")
          .eq("organization_id", profile.organization_id)
          .single();

        if (location) {
          setLocationId(location.id);
          setPhoneNumber(location.telnyx_phone_number);
          setStatus(location.activation_status || "pending");
        }
      }
    }
    loadStatus();
  }, [supabase]);

  const handleCallMe = async () => {
    if (!locationId) return;

    if (!forwardingNumber) {
      toast.error("Inserisci il numero su cui ricevere la chiamata");
      return;
    }

    setLoading(true);
    try {
      const result = await triggerVoiceVerification(
        locationId,
        forwardingNumber
      );

      if (result.success) {
        toast.success("Chiamata inoltrata! Rispondi e segna il codice.");
        setStep("entering_code");
      } else {
        // Handle partial success (forwarding saved but call failed e.g. rate limit)
        if ((result as any).forwardingSaved) {
          toast.warning("Numero salvato, ma Meta bloccata: Prova a chiamarti da solo!");
          setStep("entering_code");
        } else {
          toast.error("Errore: " + result.error);
        }
      }
    } catch (e) {
      toast.error("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!locationId || !manualCode) return;
    if (manualCode.length !== 6) {
      toast.error("Il codice deve essere di 6 cifre");
      return;
    }

    setLoading(true);
    try {
      const result = await submitVerificationCode(locationId, manualCode, pin);
      if (result.success) {
        toast.success("Codice verificato!");
        setStatus("verified");
        setTimeout(() => router.push("/home"), 2000);
      } else {
        toast.error("Codice non valido o errore Meta: " + result.error);
      }
    } catch (e) {
      toast.error("Errore durante la verifica");
    } finally {
      setLoading(false);
    }
  };

  if (status === "verified") {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in">
          <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-green-700">Numero Verificato!</h1>
            <p className="text-muted-foreground">Il tuo numero è pronto per ricevere chiamate.</p>
          </div>
          <Button onClick={() => router.push("/home")}>Torna alla Dashboard</Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Verifica Vocale</h1>
        <p className="text-muted-foreground text-lg">
          Completa la configurazione del tuo numero per attivare WhatsApp Business.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Main Content */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-2 shadow-sm border-blue-100/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Chiama e Verifica</CardTitle>
                  <CardDescription>
                    Verifichiamo che il numero {phoneNumber ? <span className="font-mono font-medium text-foreground">{phoneNumber}</span> : "..."} sia tuo.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-2">

              {/* Steps Visualizer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border-2 transition-colors ${step === 'idle' ? 'bg-blue-50 border-blue-200' : 'bg-muted/30 border-transparent'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                    <span className="font-semibold text-sm">Inserisci Numero</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Il tuo cellulare personale dove ricevere la chiamata.</p>
                </div>
                <div className={`p-4 rounded-lg border-2 transition-colors ${step === 'calling' ? 'bg-blue-50 border-blue-200' : 'bg-muted/30 border-transparent'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                    <span className="font-semibold text-sm">Ricevi Chiamata</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Rispondi e ascolta il codice di verifica di 6 cifre.</p>
                </div>
                <div className={`p-4 rounded-lg border-2 transition-colors ${step === 'entering_code' ? 'bg-blue-50 border-blue-200' : 'bg-muted/30 border-transparent'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                    <span className="font-semibold text-sm">Inserisci Codice</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Digita il codice qui sotto per confermare.</p>
                </div>
              </div>

              {/* Action Area */}
              <div className="space-y-6 border-t pt-6">
                {(status === "pending" || status === "provisioning" || status === "purchasing") && (
                  <div className="space-y-4 animate-in slide-in-from-left-2 fade-in duration-300">
                    <div className="bg-amber-50/50 p-6 rounded-xl border border-amber-200 flex flex-col items-center gap-4 text-center">
                      <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
                      <div>
                        <h3 className="font-semibold text-amber-800 text-lg">In attesa di attivazione</h3>
                        <p className="text-amber-700/80 text-sm mt-2 max-w-md mx-auto leading-relaxed">
                          I tuoi documenti sono in fase di revisione manuale per rispettare le normative italiane.
                          Il processo richiede solitamente <span className="font-semibold">24-48 ore lavorative</span>.<br />
                          Riceverai un'email appena il numero sarà pronto per la verifica vocale.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {step === "idle" && (status === "pending_verification" || status === "active") && (
                  <div className="space-y-4 animate-in slide-in-from-left-2 fade-in duration-300">
                    <div className="space-y-2">
                      <Label>Il tuo numero di cellulare</Label>
                      <PhoneInput
                        value={forwardingNumber}
                        onChange={(value) => setForwardingNumber(value || "")}
                        defaultCountry="IT"
                        context="onboarding"
                        placeholder="Es. +39 333 1234567"
                      />
                      <p className="text-xs text-muted-foreground">Non verrà salvato, serve solo per questa verifica.</p>
                    </div>

                    <Button
                      size="lg"
                      className="w-full h-12 text-lg font-semibold"
                      onClick={handleCallMe}
                      disabled={loading || !isValidPhoneNumber(forwardingNumber)}
                    >
                      {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Smartphone className="mr-2 h-5 w-5" />}
                      Chiama il mio numero
                    </Button>

                    <div className="text-center mt-2">
                      <button
                        onClick={() => setStep("entering_code")}
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        Hai già un codice? Inseriscilo manualmente
                      </button>
                    </div>
                  </div>
                )}

                {step === "entering_code" && (
                  <div className="space-y-4 animate-in slide-in-from-right-2 fade-in duration-300">
                    <div className="bg-green-50/50 p-6 rounded-xl border border-green-100 flex flex-col items-center gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <Label className="text-green-800 font-semibold text-lg">Codice di 6 cifre</Label>
                        <Input
                          placeholder="123456"
                          className="text-center text-3xl tracking-[0.5em] w-64 h-16 font-mono font-bold border-2 focus-visible:ring-green-500"
                          maxLength={6}
                          value={manualCode}
                          onChange={(e) => setManualCode(e.target.value)}
                          autoFocus
                        />
                      </div>

                      <div className="flex flex-col items-center gap-2 mt-2">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">PIN a 2 Fattori (Opzionale)</Label>
                        <Input
                          placeholder="123456"
                          className="text-center text-xl tracking-[0.2em] w-48 h-12 font-mono border focus-visible:ring-blue-500"
                          maxLength={6}
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground italic">Inseriscilo solo se lo hai attivato nel Business Manager</p>
                      </div>
                    </div>

                    <Button
                      onClick={handleSubmitCode}
                      className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700"
                      disabled={loading || manualCode.length !== 6}
                    >
                      {loading ? <Loader2 className="animate-spin mr-2" /> : "Verifica Codice"}
                    </Button>

                    <div className="text-center">
                      <button
                        onClick={() => setStep("idle")}
                        className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                      >
                        Non hai ricevuto la chiamata? Riprova con un altro numero
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">

          {/* Why Verify Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <CardTitle className="text-base">Perché è necessario?</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                Meta richiede di verificare che tu sia il proprietario del numero prima di attivare le API di WhatsApp Business.
              </p>
              <p>
                Questo processo garantisce la sicurezza e previene l'uso non autorizzato dei numeri di telefono sulla piattaforma.
              </p>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="bg-muted/30 border-none shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Serve aiuto?</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Se non riesci a ricevere la chiamata o il codice non viene accettato, contatta il nostro supporto tecnico.
              </p>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="mailto:support@smartables.app">
                  Contatta Supporto
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
