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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateWhatsappProfile } from "@/app/actions/branding";

import { WhatsAppProfilePreview } from "@/components/private/whatsapp/profile-preview";
import { FaWhatsapp } from "react-icons/fa6";

interface BrandingFormProps {
  locationId: string;
  whatsappName?: string;
  initialProfile?: any;
  locationPhoneNumber?: string;
}

const VERTICALS = [
  { value: "RESTAURANT", label: "Ristorante" },
  { value: "DRINK", label: "Bar / Bevande" },
  { value: "GROCERY", label: "Alimentari / Supermercato" },
  { value: "HOTEL", label: "Hotel / Alloggio" },
  { value: "RETAIL", label: "Retail / Shopping" },
  { value: "BEAUTY", label: "Bellezza / Spa" },
  { value: "HEALTH", label: "Salute / Farmacia" },
  { value: "EDUCATION", label: "Educazione" },
  { value: "ENTERTAIN", label: "Intrattenimento" },
  { value: "EVENT", label: "Pianificazione Eventi" },
  { value: "FINANCE", label: "Finanza / Banche" },
  { value: "CLOTHING", label: "Abbigliamento" },
  { value: "AUTO", label: "Automotive" },
  { value: "SERVICE", label: "Servizi Professionali" },
  { value: "TRAVEL", label: "Viaggi" },
  { value: "OTHER", label: "Altro" },
];

export function BrandingForm({ locationId, whatsappName, initialProfile, locationPhoneNumber }: BrandingFormProps) {
  const [description, setDescription] = useState(initialProfile?.description || "");
  const [about, setAbout] = useState(initialProfile?.about || "");
  const [email, setEmail] = useState(initialProfile?.email || "");
  const [website, setWebsite] = useState(initialProfile?.websites?.[0] || "");
  const [address, setAddress] = useState(initialProfile?.address || "");
  const [vertical, setVertical] = useState(initialProfile?.vertical || "Ristorante");
  const [profileImage, setProfileImage] = useState<File | null>(null);

  console.log(initialProfile.vertical)

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Compute live image url for preview
  const currentPreviewImageUrl = profileImage
    ? URL.createObjectURL(profileImage)
    : initialProfile?.profile_picture_url || "";

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
    if (address) formData.append("address", address);
    if (vertical) formData.append("vertical", vertical);
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

  return (
    <div className="grid grid-cols-1 2xl:grid-cols-5">
      <div className="2xl:col-span-3">
        <div className="flex flex-col items-start gap-8">
          <div className="border-b-2 pl-6 py-5 w-full">
            <h3 className="text-lg font-bold tracking-tight">Personalizza il profilo</h3>
          </div>
          <div className="w-full pb-6 px-6">
            <form onSubmit={handleSubmit} className="space-y-4 pr-6 2xl:pr-0 w-full">

              {/* Profile Image & Basic Info Section */}
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                <div className="shrink-0">
                  <Label className="text-sm font-medium text-foreground mb-3 block">Foto Profilo</Label>
                  <div className="relative w-32 h-32 rounded-full bg-muted/40 hover:bg-muted/60 flex items-center justify-center text-center cursor-pointer transition-colors border-2 border-dashed border-muted-foreground/20 overflow-hidden group shadow-sm">
                    <Input
                      type="file"
                      accept="image/png, image/jpeg"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={handleFileChange}
                    />
                    {currentPreviewImageUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={currentPreviewImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="h-6 w-6 text-white mb-1" />
                          <span className="text-[10px] text-white font-medium">Cambia</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground p-4">
                        <Upload className="h-6 w-6 mb-2" />
                        <span className="text-[10px] uppercase font-semibold">Carica</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 text-center max-w-32">
                    Minimo 640x640px<br />JPG o PNG.
                  </p>
                </div>

                <div className="flex-1 space-y-5 w-full">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Nome Profilo WhatsApp (Verified Name)</Label>
                    <Input
                      value={whatsappName || "Non verificato"}
                      disabled
                      className="bg-muted/40 border-0 shadow-none h-11 px-4 text-foreground rounded-xl"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Il nome visualizzato è gestito da Meta. Per cambiarlo avvia una procedura su Meta Business Manager.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Stato "About"</Label>
                    <Input
                      placeholder="Vieni a provare la nostra pizza!"
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      maxLength={139}
                      className="bg-muted/40 border-0 shadow-none h-11 px-4 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Descrizione attività (Max 512 caratteri)</Label>
                <Textarea
                  placeholder="Es. La miglior spianata romana in tutta Pesaro!"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={512}
                  className="bg-muted/40 border-0 shadow-none min-h-30 resize-none px-4 py-3 rounded-xl"
                />
              </div>

              {/* Contact & Location Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Email Contatto</Label>
                  <Input
                    type="email"
                    placeholder="info@pizzaurum.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-muted/40 border-0 shadow-none h-11 px-4 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Sito Web</Label>
                  <Input
                    type="url"
                    placeholder="https://www.ristorante.it"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="bg-muted/40 border-0 shadow-none h-11 px-4 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Indirizzo Fisico</Label>
                  <Input
                    placeholder="Es. Piazzale Giuseppe Garibaldi 4 Pesaro"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="bg-muted/40 border-0 shadow-none h-11 px-4 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Categoria Attività</Label>
                  <Select value={vertical} onValueChange={setVertical}>
                    <SelectTrigger className="bg-muted/40 border-0 w-full shadow-none h-12! px-4 rounded-xl">
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {VERTICALS.map((v) => (
                        <SelectItem key={v.value} value={v.value}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-fit h-12 ml-auto text-white rounded-xl font-semibold text-base mt-2 shadow-sm transition-all hover:shadow-md"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Aggiornamento...
                  </>
                ) : (
                  "Salva"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
      <div className="2xl:col-span-2 hidden bg-neutral-100 rounded-r-[20px] border-l pt-4 pb-0 2xl:flex flex-col h-full overflow-hidden">
        <WhatsAppProfilePreview
          name={whatsappName || "Non verificato"}
          description={description}
          about={about}
          email={email}
          website={website}
          address={address}
          vertical={VERTICALS.find((v) => v.value === vertical)?.label || ""}
          phoneNumber={locationPhoneNumber || ''}
          profileImageUrl={currentPreviewImageUrl}
        />
      </div>
    </div>
  );
}
