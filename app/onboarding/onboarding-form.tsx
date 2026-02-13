"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WeeklyHoursSelector } from "@/components/utility/weekly-hours-selector";
import { Store, User, Utensils, ArrowRight, Check, MapPin, Phone } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { NumberInput } from "@/components/ui/number-input";
import { submitOnboarding } from "./actions";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

const STEPS = [
  { id: 1, title: "Chi sei", description: "Dettagli del profilo" },
  { id: 2, title: "Dove sei", description: "Posizione e contatti" },
  { id: 3, title: "Dettagli", description: "Capienza e orari" },
];

export function OnboardingForm({ plan, interval, error }: { plan?: string; interval?: string; error?: string }) {
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    restaurantName: "",
    fullName: "",
    address: "",
    phoneNumber: "",
    totalSeats: "",
    openingHours: "",
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Validation minimal logic for "Next" button enablement
  const isStep1Valid = formData.restaurantName.length > 2 && formData.fullName.length > 2;
  const isStep2Valid = formData.address.length > 5 && formData.phoneNumber.length > 5;
  const isStep3Valid = parseInt(formData.totalSeats) > 0;
  // Note: Opening hours are optional or have defaults usually, but let's assume valid.

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Sidebar */}
      <div className="flex w-full flex-col justify-between bg-primary p-8 text-white lg:w-1/3 lg:min-h-screen">
        <div>
          <div className="mb-12 flex items-center gap-2">
            <span className="text-3xl font-bold tracking-tighter">Smartables</span>
          </div>

          <div className="space-y-4">
            {STEPS.map((s) => {
              const isActive = step === s.id;
              const isCompleted = step > s.id;

              return (
                <div key={s.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex w-8 h-8 rounded-lg items-center justify-center border-2 transition-all duration-300",
                        isActive
                          ? "border-white bg-white text-primary"
                          : isCompleted
                            ? "border-white bg-white/20 text-white"
                            : "border-white/30 text-white"
                      )}
                    >
                      {isCompleted ? <Check /> : <span>{s.id}</span>}
                    </div>
                    {s.id !== STEPS.length && (
                      <div
                        className={cn(
                          "h-full w-px my-2 rounded-full transition-colors duration-300",
                          isCompleted ? "bg-white/20" : "bg-white/80"
                        )}
                      />
                    )}
                  </div>
                  <div className={cn("pb-8 transition-opacity duration-300", isActive ? "opacity-100" : "opacity-60")}>
                    <h3 className="font-medium text-lg leading-none mb-1">{s.title}</h3>
                    <p className="text-sm text-white">{s.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-auto pt-8 text-xs text-white">
          © {new Date().getFullYear()} Smartables. Tutti i diritti riservati.
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-[#fcfaee]">
        {process.env.NODE_ENV === "development" && (
          <div className="absolute top-4 right-4 z-50">
            <Button
              size="sm"
              onClick={() => {
                setFormData({
                  restaurantName: "Ristorante Demo",
                  fullName: "Mario Rossi",
                  address: "Via Roma 1, Milano",
                  phoneNumber: "+393331234567",
                  totalSeats: "50",
                  openingHours: "",
                });
              }}
            >
              Fill
            </Button>
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full p-6 lg:p-12">
          <form
            action={submitOnboarding}
            onSubmit={() => setIsLoading(true)}
            onKeyDown={(e) => {
              // Prevent form submission when pressing Enter on steps 1 and 2
              if (e.key === "Enter" && step < 3) {
                e.preventDefault();
              }
            }}
          >
            {/* Hidden Inputs for final submission */}
            <input type="hidden" name="restaurantName" value={formData.restaurantName} />
            <input type="hidden" name="fullName" value={formData.fullName} />
            <input type="hidden" name="address" value={formData.address} />
            <input type="hidden" name="phoneNumber" value={formData.phoneNumber} />
            <input type="hidden" name="totalSeats" value={formData.totalSeats} />
            {/* WeeklyHoursSelector handles its own hidden input naming usually, 
                    but here we need to ensure it syncs with a hidden field or distinct name 
                    that actions.ts expects.
                    The WeeklyHoursSelector inside creates a hidden input named "openingHours"
                    with the value. Since we only render it in step 3, we need to make sure 
                    it's available in the form when submitting.
                    
                    HOWEVER: If we unmount step 3 (by moving back to step 2), the hidden input 
                    inside WeeklyHoursSelector might be gone.
                    
                    SOLUTION: We will render hidden inputs for ALL fields permanently outside the 
                    switching logic, and sync them.
                */}
            <input type="hidden" name="plan" value={plan || ''} />
            <input type="hidden" name="interval" value={interval || ''} />

            {/* We manually handle openingHours hidden input to ensure it persists */}
            <input type="hidden" name="openingHours" value={formData.openingHours} />

            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-black mb-2">
                {step === 1 && "Cominciamo dall'inizio"}
                {step === 2 && "Dove ti trovi?"}
                {step === 3 && "Ultimi dettagli"}
              </h1>
              <p className="text-gray-500 text-lg">
                {step === 1 && "Raccontaci un po' della tua attività."}
                {step === 2 && "Aiuta i clienti a trovarti e contattarti."}
                {step === 3 && "Definisci la tua capacità e quando sei aperto."}
              </p>
            </div>

            <div className="min-h-[300px]">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="restaurantName" className="text-black">Nome del Ristorante</Label>
                        <div className="relative">
                          <Store className="absolute left-3 top-3.5 h-5 w-5 text-black" />
                          <Input
                            id="restaurantName"
                            className="pl-10 h-12 text-lg text-black border-neutral-200 border-2 bg-white!"
                            placeholder="es. La Bella Napoli"
                            value={formData.restaurantName}
                            onChange={(e) => updateField("restaurantName", e.target.value)}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-black">Il tuo Nome Completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3.5 h-5 w-5 text-black" />
                          <Input
                            id="fullName"
                            className="pl-10 h-12 text-lg text-black border-neutral-200 border-2 bg-white!"
                            placeholder="es. Mario Rossi"
                            value={formData.fullName}
                            onChange={(e) => updateField("fullName", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-black">Indirizzo Completo</Label>
                        <div className="relative">
                          <AddressAutocomplete
                            name="address_visible" // rename to avoid conflict with hidden input
                            context="onboarding"
                            defaultValue={formData.address}
                            onAddressSelect={(addr) => updateField("address", addr)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber" className="text-black">Numero di Telefono</Label>
                        <div className="relative">
                          <PhoneInput
                            id="phoneNumber"
                            name="phoneNumber_visible"
                            context="onboarding"
                            className="border-neutral-200 bg-white! border-2 rounded-xl "
                            defaultCountry="IT"
                            value={formData.phoneNumber}
                            onChange={(val) => updateField("phoneNumber", val)}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="totalSeats" className="text-black">Coperti Totali</Label>
                        <div className="relative">
                          <Utensils className="absolute left-3 top-3.5 h-5 w-5 text-black z-10 pointer-events-none" />
                          <NumberInput
                            id="totalSeats"
                            context="onboarding"
                            className="pl-10 h-12 text-lg text-black border-2 border-neutral-200 bg-white!"
                            placeholder="es. 80"
                            value={formData.totalSeats ? parseInt(formData.totalSeats) : undefined}
                            onValueChange={(val) => updateField("totalSeats", val?.toString() ?? "")}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-black">Orari di Apertura</Label>
                        <WeeklyHoursSelector
                          context="onboarding"
                          initialData={formData.openingHours ? JSON.parse(formData.openingHours) : undefined}
                          onChange={(hours) => updateField("openingHours", JSON.stringify(hours))}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-8 flex justify-between pt-6 border-t">
              {step > 1 ? (
                <Button type="button" variant="outline" className="text-black bg-white! border border-neutral-200! hover:text-black/50" onClick={prevStep} disabled={isLoading}>
                  Indietro
                </Button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                  className="bg-primary text-white min-w-[120px]"
                >
                  Continua <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!isStep3Valid || isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? "Salvataggio..." : "Completa Setup"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}