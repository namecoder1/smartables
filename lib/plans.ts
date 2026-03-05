import { isDev } from "./utils";

export const PLANS = [
  {
    id: "starter",
    name: "Starter",
    priceIdMonth: !isDev()
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTH
      : "price_1SuvWrDmWHgnXPDyqZ2gQbls",
    priceIdYear: !isDev()
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEAR
      : "price_1Sus34DmWHgnXPDyVEgoctUN",
    priceMonth: 79,
    priceYear: 790,
    features: [
      "1 Sede",
      "Massimo 2 account Staff",
      "300 Prenotazioni / mese",
      "150 Conversazioni WhatsApp",
      "Bot WhatsApp",
      "Sistema di gestione tavoli",
      "Gestione prenotazioni",
      "Creazione menu digitali e QR code",
      "AI Basic",
      "Garanzia 14 giorni soddisfatti o rimborsati",
    ],
    popular: false,
    buttonText: "Attiva Ora",
  },
  {
    id: "pro",
    name: "Growth",
    priceIdMonth: !isDev()
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTH
      : "price_1SusAEDmWHgnXPDyUUzEik6c",
    priceIdYear: !isDev()
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEAR
      : "price_1SusAiDmWHgnXPDyR4O5kF2O",
    priceMonth: 99,
    priceYear: 990,
    features: [
      "3 Sedi",
      "Massimo 5 account Staff",
      "1.000 Prenotazioni / mese",
      "400 Conversazioni WhatsApp",
      "App Mobile Inclusa",
      "Bot WhatsApp",
      "AI Basic",
      "Sistema di gestione tavoli",
      "Gestione prenotazioni",
      "Creazione menu digitali e QR code",
    ],
    popular: true,
    buttonText: "Scopri",
  },
  {
    id: "business",
    name: "Business",
    priceIdMonth: !isDev()
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTH
      : "price_1SusB3DmWHgnXPDyggftPbfV",
    priceIdYear: !isDev()
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_YEAR
      : "price_1SusBKDmWHgnXPDyyetBeNzy",
    priceMonth: 199,
    priceYear: 1990,
    features: [
      "5 Sedi",
      "Account Staff Illimitati",
      "3.000 Prenotazioni / mese",
      "1.000 Conversazioni WhatsApp",
      "App Mobile Inclusa",
      "Bot WhatsApp",
      "AI Advanced",
      "Analytics Avanzati",
      "Sistema di gestione tavoli",
      "Gestione prenotazioni",
      "Creazione menu digitali e QR code",
    ],
    popular: false,
    buttonText: "Scopri",
  },
];

/**
 * Find a plan by its Stripe price ID (monthly or yearly).
 * Centralizes the repeated PLANS.find() pattern.
 */
export function findPlanByPriceId(priceId: string) {
  return PLANS.find(
    (p) => p.priceIdMonth === priceId || p.priceIdYear === priceId,
  );
}
