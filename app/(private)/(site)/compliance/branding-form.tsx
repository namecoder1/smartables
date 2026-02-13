"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateWhatsappProfile } from "@/app/actions/branding";

interface BrandingFormProps {
  locationId: string;
}

export function BrandingForm({ locationId }: BrandingFormProps) {
  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("locationId", locationId);
    if (description) formData.append("description", description);
    if (about) formData.append("about", about);
    if (email) formData.append("email", email);
    if (website) formData.append("website", website);
    if (profileImage) {
      formData.append("profileImage", profileImage);
    }

    try {
      const result = await updateWhatsappProfile(formData);

      if (result.success) {
        setSuccess(true);
        toast.success("Profilo WhatsApp aggiornato con successo!");
      } else {
        toast.error("Errore: " + result.error);
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Errore durante l'aggiornamento.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="bg-green-50/50 border-green-200">
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-xl font-semibold text-green-800">
            Profilo Aggiornato!
          </h3>
          <p className="text-muted-foreground mt-2 mb-6">
            Le informazioni del tuo bot WhatsApp sono state aggiornate su Meta.
          </p>
          <Button variant="outline" onClick={() => setSuccess(false)}>
            Modifica ancora
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Personalizza Profilo WhatsApp
        </CardTitle>
        <CardDescription>
          Queste informazioni saranno visibili ai tuoi clienti quando chatteranno col bot.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Descrizione (Max 512 caratteri)</Label>
            <Textarea
              placeholder="Es. Il miglior ristorante di Roma..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={512}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email Contatto</Label>
              <Input
                type="email"
                placeholder="info@ristorante.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sito Web</Label>
              <Input
                type="url"
                placeholder="https://www.ristorante.it"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Info "About" (Stato testuale)</Label>
            <Input
              placeholder="Es. Aperti tutti i giorni 19-24"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              maxLength={139}
            />
          </div>

          <div className="space-y-2">
            <Label>Immagine Profilo</Label>
            <div className="relative border-2 rounded-xl border-dashed bg-background dark:bg-input/30 p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 cursor-pointer h-32">
              <Input
                type="file"
                accept="image/png, image/jpeg"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-50"
                onChange={handleFileChange}
              />
              {profileImage ? (
                <div className="flex flex-col items-center text-green-600">
                  <CheckCircle className="h-6 w-6 mb-2" />
                  <span className="text-xs truncate max-w-[150px]">
                    {profileImage.name}
                  </span>
                </div>
              ) : (
                <>
                  <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Carica logo (JPG/PNG)
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1">
                      Consigliato: Quadrato, almeno 640x640px.
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Aggiornamento...
              </>
            ) : (
              "Salva e Aggiorna su WhatsApp"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
