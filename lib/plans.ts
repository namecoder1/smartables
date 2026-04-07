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
    priceMonth: 59,
    priceYear: 590,
    features: [
      "1 Sede",
      "5 Account Staff",
      "300 Prenotazioni / mese",
      "400 Contatti Automatizzati AI / mese",
      "300 MB Storage globale",
      "3 Mappe Tavoli",
      "5 Menu Digitali",
      "Bot WhatsApp",
      "AI Basic",
      "Google Calendar Sync",
      "Garanzia 14 giorni soddisfatti o rimborsati",
    ],
    popular: false,
    buttonText: "Scegli",
  },
  {
    id: "growth",
    name: "Growth",
    priceIdMonth: !isDev()
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTH
      : "price_1SusAEDmWHgnXPDyUUzEik6c",
    priceIdYear: !isDev()
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEAR
      : "price_1SusAiDmWHgnXPDyR4O5kF2O",
    priceMonth: 129,
    priceYear: 1290,
    features: [
      "3 Sedi",
      "15 Account Staff",
      "1.000 Prenotazioni / mese",
      "1.200 Contatti Automatizzati AI / mese",
      "1 GB Storage globale",
      "12 Mappe Tavoli",
      "15 Menu Digitali",
      "App Mobile Inclusa",
      "Bot WhatsApp",
      "AI Medium (liste d'attesa + fornitori)",
      "Google Calendar + Business Profile Reviews",
      "Analitiche Avanzate",
      "Integrazione TheFork & Quandoo",
    ],
    popular: true,
    buttonText: "Scegli",
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
    priceMonth: 229,
    priceYear: 2290,
    features: [
      "10 Sedi",
      "Account Staff Illimitati",
      "3.000 Prenotazioni / mese",
      "3.500 Contatti Automatizzati AI / mese",
      "5 GB Storage globale",
      "35+ Mappe Tavoli",
      "50 Menu Digitali",
      "App Mobile Inclusa",
      "Bot WhatsApp",
      "AI Pro (cross-selling + memoria estesa KB)",
      "Google Full Suite (Calendar, Reviews, Performance API)",
      "Business Intelligence (export, report aggregati)",
      "Integrazione TheFork, Quandoo & OpenTable",
    ],
    popular: false,
    buttonText: "Scegli",
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
