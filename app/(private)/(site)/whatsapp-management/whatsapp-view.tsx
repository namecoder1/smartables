'use client'

import React, { useEffect, useState } from "react";
import PageWrapper from "@/components/private/page-wrapper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, Settings2, Phone, Package, Loader2, MessageCircleQuestion } from "lucide-react";
import { BrandingForm } from "../compliance/branding-form";
import { useRouter } from "next/navigation";
import { CallbackRequestsPanel } from "@/components/private/whatsapp/callback-requests-panel";
import { TaggedSuppliersPanel } from "@/components/private/whatsapp/tagged-suppliers-panel";
import { getWhatsappSettings } from "./actions";

interface WhatsAppSettings {
  primaryLocation: {
    id: string;
    name: string;
    activation_status: string | null;
    meta_phone_id: string | null;
    telnyx_phone_number: string | null;
  } | null;
  whatsappName: string;
  businessProfile: Record<string, unknown> | null;
  pendingCallbackCount: number;
}

export default function WhatsappView() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"branding" | "callbacks" | "suppliers">("branding");

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getWhatsappSettings();
        if (result.error === "Unauthorized") {
          router.push("/login");
          return;
        } else if (!result.success) {
          setError(result.error || "Errore durante il caricamento");
        } else {
          setSettings(result.data as WhatsAppSettings);
        }
      } catch (err) {
        console.error("Fetch settings error:", err);
        setError("Errore imprevisto");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex h-[50vh] items-center justify-center space-y-4 flex-col">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground flex animate-pulse">Caricamento in corso...</p>
        </div>
      </PageWrapper>
    );
  }

  if (error || !settings) {
    return (
      <PageWrapper>
        <div className="flex h-[50vh] items-center justify-center text-red-500">
          {error || "Impossibile caricare i dati."}
        </div>
      </PageWrapper>
    );
  }

  const { primaryLocation, whatsappName, businessProfile, pendingCallbackCount } = settings;

  return (
    <div >
      <div className="flex flex-col lg:flex-row gap-4 items-start relative">
        <Card className="w-full py-0 lg:w-72 shrink-0 space-y-6 border-r border-border">
          <div className="w-full flex flex-col gap-2">
            <div className="flex flex-col h-auto bg-transparent p-2 border-b w-full space-y-1 items-start">
              <button
                onClick={() => setActiveTab("branding")}
                className={`flex items-center w-full justify-start px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "branding"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
                  }`}
              >
                <MessageSquare className="h-5 w-5 mr-3 opacity-80" />
                Profilo
              </button>
              <button
                onClick={() => setActiveTab("callbacks")}
                className={`flex items-center w-full justify-start px-4 py-3 rounded-xl font-medium text-sm transition-colors relative ${activeTab === "callbacks"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
                  }`}
              >
                <Phone className="h-5 w-5 mr-3 opacity-80" />
                Da richiamare
                {pendingCallbackCount > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-orange-500 text-white text-[10px] font-bold">
                    {pendingCallbackCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("suppliers")}
                className={`flex items-center w-full justify-start px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "suppliers"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
                  }`}
              >
                <Package className="h-5 w-5 mr-3 opacity-80" />
                Fornitori
              </button>
            </div>

            {/* Sidebar Info Cards */}
            <div className="space-y-2">
              <Card className="gap-2 shadow-none border mx-2 py-0">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    Stato Canale
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">API Meta</span>
                    <span className="text-green-600 font-medium">Attiva</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">Webhook</span>
                    <span className="text-green-600 font-medium">Attivo</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="gap-2 shadow-none mx-2 mb-2 border-primary/20 bg-orange-50 dark:bg-orange-500/10 p-4 flex flex-col items-center justify-center text-center space-y-2">
                <MessageSquare className="h-6 w-6 text-orange-500 mb-1" />
                <h2 className="text-sm font-semibold text-foreground">Prossimamente</h2>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Notifiche popup e impostazioni avanzate del bot in arrivo.
                </p>
              </Card>
            </div>
          </div>
        </Card>

        {/* Main Content Area */}
        <Card className="flex-1 w-full min-w-0 py-0">
          {activeTab === "branding" && (
            <div className="w-full pl-6">
              {primaryLocation ? (
                <BrandingForm
                  locationId={primaryLocation.id}
                  whatsappName={whatsappName}
                  initialProfile={businessProfile}
                  locationPhoneNumber={primaryLocation.telnyx_phone_number || undefined}
                />
              ) : (
                <div className="py-20 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <MessageCircleQuestion className="text-muted-foreground" size={32} />
                    <p className="text-muted-foreground">Nessuna sede trovata per la configurazione.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "callbacks" && (
            <div className="p-6">
              <div>
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold tracking-tight">Richieste di richiamata</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Clienti che hanno chiesto di essere ricontattati dopo una
                    chiamata persa.
                  </p>
                </div>
                <div>
                  {primaryLocation ? (
                    <CallbackRequestsPanel
                      locationId={primaryLocation.id}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nessuna sede configurata.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "suppliers" && (
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold tracking-tight">Fornitori taggati</h3>
                </div>
                <p className="text-muted-foreground">
                  Numeri che si sono auto-identificati come fornitori. Non
                  riceveranno il messaggio automatico per 7 giorni.
                </p>
              </div>
              <div>
                {primaryLocation ? (
                  <TaggedSuppliersPanel
                    locationId={primaryLocation.id}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nessuna sede configurata.
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
