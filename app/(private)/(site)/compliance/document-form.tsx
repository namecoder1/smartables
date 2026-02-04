"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle, Loader2 } from "lucide-react";
import { createClient } from "@/supabase/client";
import { toast } from "sonner";
import { updateLocationStatus } from "@/app/actions/locations";
import { ITALIAN_AREA_CODES } from "@/lib/constants/italian-area-codes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { BirthSelect } from "../../../../components/utility/birth-select";
import { format } from "date-fns";

interface DocumentFormProps {
  locationId: string;
}

export function DocumentForm({ locationId }: DocumentFormProps) {
  // --- STATE: Files ---
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [addressFile, setAddressFile] = useState<File | null>(null);

  // --- STATE: Form Fields ---
  const [customerType, setCustomerType] = useState<"natural_person" | "legal_entity">("legal_entity"); // Default to business usually

  // Personal / Business Info
  const [businessName, setBusinessName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [taxCode, setTaxCode] = useState(""); // Codice Fiscale (Persona) o P.IVA (Azienda)
  const [vatNumber, setVatNumber] = useState(""); // Per aziende (spesso uguale al taxCode in Italia)

  // Legal Rep / Identity Details
  const [idType, setIdType] = useState("Identity card");
  const [idNumber, setIdNumber] = useState("");
  const [idIssuer, setIdIssuer] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [idExpirationDate, setIdExpirationDate] = useState("");

  // Address Details (Parsed)
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [province, setProvince] = useState(""); // State/Province
  const [countryCode, setCountryCode] = useState("IT");

  // Meta
  const [areaCode, setAreaCode] = useState("");
  const [detectedAreaName, setDetectedAreaName] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // --- HANDLERS ---
  const handleAddressSelect = (address: string, lat: number, lng: number, placeResult?: google.maps.GeocoderResult) => {
    if (placeResult && placeResult.address_components) {
      // Parse Components
      let street = "";
      let streetNum = "";
      let locality = "";
      let postal = "";
      let adminArea = "";

      placeResult.address_components.forEach(comp => {
        const types = comp.types;
        if (types.includes('route')) street = comp.long_name;
        if (types.includes('street_number')) streetNum = comp.long_name;
        if (types.includes('locality')) locality = comp.long_name;
        if (types.includes('postal_code')) postal = comp.long_name;
        if (types.includes('administrative_area_level_2')) adminArea = comp.short_name; // Province code (MI, RM)
      });

      setStreetAddress(`${street} ${streetNum}`.trim());
      setCity(locality);
      setZipCode(postal);
      setProvince(adminArea);

      // Auto-set Area Code
      if (locality) {
        const code = ITALIAN_AREA_CODES[locality.toLowerCase()];
        if (code) {
          setAreaCode(code);
          setDetectedAreaName(locality);
          toast.success(`Prefisso ${code} rilevato per ${locality}`);
        }
      }
    }
  };


  // --- HANDLERS ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (file: File | null) => void) => {
    if (e.target.files && e.target.files[0]) setter(e.target.files[0]);
  };

  const uploadFile = async (file: File, path: string) => {
    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const fileName = `${path}/${Date.now()}.${fileExt}`;
    const filePath = `${locationId}/${fileName}`;

    const { error } = await supabase.storage.from("compliance-docs").upload(filePath, file);
    if (error) throw error;
    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identityFile || !addressFile || !areaCode || !streetAddress || !city || !zipCode) {
      toast.error("Compila tutti i campi obbligatori.");
      return;
    }

    setUploading(true);
    try {
      const identityPath = await uploadFile(identityFile, "identity_proof");
      const addressPath = await uploadFile(addressFile, "address_proof");

      // Payload Construction
      const payload = {
        locationId,
        areaCode,
        customerType,

        // Identity / Business
        businessName: customerType === 'legal_entity' ? businessName : undefined,
        firstName: customerType === 'natural_person' ? firstName : undefined,
        lastName: customerType === 'natural_person' ? lastName : undefined,

        taxCode, // CF or P.IVA
        vatNumber: customerType === 'legal_entity' ? vatNumber : undefined,

        // Legal Rep Info
        idType,
        idNumber,
        idIssuer,
        idExpirationDate: idExpirationDate ? format(new Date(idExpirationDate), "yyyy-MM-dd") : "",
        placeOfBirth,
        dateOfBirth: dateOfBirth ? format(new Date(dateOfBirth), "yyyy-MM-dd") : "",

        // Address
        streetAddress,
        city,
        zipCode,
        province,
        countryCode,

        // Files
        identityPath,
        addressPath,
      };

      const response = await fetch("/api/telnyx/compliance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore durante l'invio.");
      }

      setUploadSuccess(true);
      toast.success("Richiesta inviata con successo!");
    } catch (error: any) {
      console.error(error);
      toast.error("Errore: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (uploadSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600 flex items-center gap-2">
            <CheckCircle className="h-6 w-6" /> Richiesta Inviata
          </CardTitle>
          <CardDescription>
            I tuoi documenti e dati sono stati inviati. Il team di Smartables verificherà la conformità entro 24 ore.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setUploadSuccess(false)}>Nuova Richiesta</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Verifica Sede & Attivazione Numero</CardTitle>
        <CardDescription>
          Compila i dati anagrafici e carica i documenti richiesti per attivare un numero locale italiano.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* 1. TIPO CLIENTE */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">1. Anagrafica</h3>

            <div className="space-y-2">
              <Label>Tipo Cliente</Label>
              <div className="flex">
                <Button
                  type="button"
                  variant={customerType === 'legal_entity' ? 'default' : 'outline'}
                  onClick={() => setCustomerType('legal_entity')}
                  className="flex-1"
                >
                  Azienda / P.IVA
                </Button>
                <Button
                  type="button"
                  variant={customerType === 'natural_person' ? 'default' : 'outline'}
                  onClick={() => setCustomerType('natural_person')}
                  className="flex-1"
                >
                  Privato
                </Button>
              </div>
            </div>

            {customerType === 'legal_entity' ? (
              <>
                <div className="space-y-2">
                  <Label>Ragione Sociale</Label>
                  <Input placeholder="Es. Mario Rossi SRL" value={businessName} onChange={e => setBusinessName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Partita IVA</Label>
                    <Input placeholder="11 cifre" value={vatNumber} onChange={e => setVatNumber(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Codice Fiscale (Azienda)</Label>
                    <Input placeholder="Spesso uguale alla P.IVA" value={taxCode} onChange={e => setTaxCode(e.target.value)} required />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input placeholder="Es. Mario" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Cognome</Label>
                    <Input placeholder="Es. Rossi" value={lastName} onChange={e => setLastName(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Codice Fiscale</Label>
                  <Input placeholder="Es. MROSRI80A01H501L" value={taxCode} onChange={e => setTaxCode(e.target.value)} required />
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* 2. RAPPRESENTANTE LEGALE */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {customerType === 'legal_entity' ? '2. Rappresentante Legale' : '2. Dati Documento'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo Documento</Label>
                <Select value={idType} onValueChange={setIdType}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="Identity card">Carta d'Identità</SelectItem>
                    <SelectItem value="Passport">Passaporto</SelectItem>
                    <SelectItem value="Driving license">Patente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Numero Documento</Label>
                <Input placeholder="Es. MROSRI80A01H501L" value={idNumber} onChange={e => setIdNumber(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Ente Rilascio</Label>
                <Input placeholder="Es. Comune di Roma / Questura" value={idIssuer} onChange={e => setIdIssuer(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Data Scadenza</Label>
                <BirthSelect
                  value={idExpirationDate}
                  onChange={setIdExpirationDate}
                  fromYear={new Date().getFullYear()}
                  toYear={new Date().getFullYear() + 20}
                />
              </div>
              <div className="space-y-2">
                <Label>Luogo di Nascita</Label>
                <Input placeholder="Es. Roma" value={placeOfBirth} onChange={e => setPlaceOfBirth(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Data di Nascita</Label>
                <BirthSelect value={dateOfBirth} onChange={e => setDateOfBirth(e)} />
              </div>
            </div>
          </div>

          <Separator />

          {/* 3. INDIRIZZO SEDE */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">3. Indirizzo Sede Operativa</h3>
            <div className="space-y-2">
              <Label>Cerca Indirizzo</Label>
              <AddressAutocomplete
                onAddressSelect={handleAddressSelect}
                placeholder="Inizia a digitare..."
                context="default"
              />
              <p className="text-xs text-muted-foreground">Seleziona dal menu a tendina per compilare automaticamente</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Indirizzo e Civico</Label>
                <Input placeholder="Es. Via Roma 1" value={streetAddress} onChange={e => setStreetAddress(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Città</Label>
                <Input placeholder="Es. Roma" value={city} onChange={e => setCity(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>CAP</Label>
                <Input placeholder="Es. 00100" value={zipCode} onChange={e => setZipCode(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Provincia (Sigla)</Label>
                <Input placeholder="Es. RM" value={province} maxLength={2} className="uppercase" onChange={e => setProvince(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2 dark:bg-muted/30 bg-background p-4 border flex items-center justify-between">
              <div className="flex flex-col space-y-1">
                <Label>Prefisso Telefonico Desiderato</Label>
                <p className="text-xs text-muted-foreground">Il numero verrà attivato con questo prefisso.</p>
              </div>
              <div className="flex gap-0.5 flex-col items-center">
                <Input value={areaCode} disabled onChange={e => setAreaCode(e.target.value)} className="w-24 font-mono text-lg" required />
                {detectedAreaName && <span className="text-[10px] text-muted-foreground">Rilevato per {detectedAreaName}</span>}
              </div>
            </div>
          </div>

          <Separator />

          {/* 4. DOCUMENTI */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">4. Caricamento File</h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Identity File */}
              <div className="space-y-2">
                <Label>Copia Documento Identità</Label>
                <div className="relative border-2 border-dashed bg-background dark:bg-input/30 p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 cursor-pointer h-40">
                  <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-50" onChange={e => handleFileChange(e, setIdentityFile)} />
                  {identityFile ? (
                    <div className="flex flex-col items-center text-green-600">
                      <CheckCircle className="h-8 w-8 mb-2" />
                      <span className="text-xs truncate max-w-[150px]">{identityFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Clicca o trascina qui</span>
                    </>
                  )}
                </div>
              </div>

              {/* Address File */}
              <div className="space-y-2">
                <Label>Prova Indirizzo (Bolletta/Visura)</Label>
                <div className="relative border-2 border-dashed bg-background dark:bg-input/30 p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 cursor-pointer h-40">
                  <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-50" onChange={e => handleFileChange(e, setAddressFile)} />
                  {addressFile ? (
                    <div className="flex flex-col items-center text-green-600">
                      <CheckCircle className="h-8 w-8 mb-2" />
                      <span className="text-xs truncate max-w-[150px]">{addressFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Clicca o trascina qui</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Invio in corso...
              </>
            ) : "Invia Richiesta Attivazione"}
          </Button>

        </form>
      </CardContent>
    </Card>
  );
}
