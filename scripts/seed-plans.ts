import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    priceIdMonth: "price_1SuvWrDmWHgnXPDyqZ2gQbls",
    priceIdYear: "price_1Sus34DmWHgnXPDyVEgoctUN",
    limits: {
      max_locations: 1,
      max_staff: 2,
      monthly_reservations: 300,
      whatsapp_conversation_limit: 150,
      mobile_access: false,
      features: [
        "whatsapp_bot",
        "table_management",
        "reservations_management",
        "digital_menu",
        "ai_basic",
      ],
    },
  },
  {
    id: "pro",
    name: "Growth",
    priceIdMonth: "price_1SusAEDmWHgnXPDyUUzEik6c",
    priceIdYear: "price_1SusAiDmWHgnXPDyR4O5kF2O",
    limits: {
      max_locations: 3,
      max_staff: 5,
      monthly_reservations: 1000,
      whatsapp_conversation_limit: 400,
      mobile_access: true,
      features: [
        "whatsapp_bot",
        "table_management",
        "reservations_management",
        "digital_menu",
        "ai_basic",
        "mobile_app",
      ],
    },
  },
  {
    id: "business",
    name: "Business",
    priceIdMonth: "price_1SusB3DmWHgnXPDyggftPbfV",
    priceIdYear: "price_1SusBKDmWHgnXPDyyetBeNzy",
    limits: {
      max_locations: 5,
      max_staff: 9999,
      monthly_reservations: 3000,
      whatsapp_conversation_limit: 1000,
      mobile_access: true,
      features: [
        "whatsapp_bot",
        "table_management",
        "reservations_management",
        "digital_menu",
        "ai_advanced",
        "analytics_advanced",
        "mobile_app",
      ],
    },
  },
];

async function seedPlans() {
  console.log("Seeding plans...");

  for (const plan of PLANS) {
    // 1. Insert/Update Monthly Plan
    const { error: errorMonth } = await supabase
      .from("subscription_plans")
      .upsert(
        {
          stripe_price_id: plan.priceIdMonth,
          name: plan.name,
          key: plan.id, // e.g. 'starter'
          limits: plan.limits,
        },
        { onConflict: "stripe_price_id" },
      );

    if (errorMonth) {
      console.error(`Error seeding ${plan.name} (Month):`, errorMonth.message);
    } else {
      console.log(`Seeded ${plan.name} (Month)`);
    }

    // 2. Insert/Update Yearly Plan (We need unique keys, so maybe append _year?)
    // Note: The DB constraint requires unique `key`.
    // If we want both prices to resolve to the same plan logic, we usually just store the plan metadata keyed by Stripe Price ID.
    // The DB schema says: key text NOT NULL UNIQUE.
    // So we can't insert a second row with 'starter' key for the yearly price.
    // However, the Stripe Webhook looks up the Plan Metadata by Price ID (from PLANS constant in code) -> so it knows 'starter'.
    // The TABLE `subscription_plans` is mainly used for what?
    // If it's used to verify "What does this price ID give me?", then we need entries for BOTH prices.
    // BUT we have a UNIQUE constraint on `key`.
    // Let's modify the yearly key to be 'starter_year'.

    const { error: errorYear } = await supabase
      .from("subscription_plans")
      .upsert(
        {
          stripe_price_id: plan.priceIdYear,
          name: plan.name, // "Starter"
          key: `${plan.id}_year`, // "starter_year"
          limits: plan.limits,
        },
        { onConflict: "stripe_price_id" },
      );

    if (errorYear) {
      console.error(`Error seeding ${plan.name} (Year):`, errorYear.message);
    } else {
      console.log(`Seeded ${plan.name} (Year)`);
    }
  }

  // Also Setup Fee?
  const SETUP_FEE_PRICE = process.env.STRIPE_SETUP_FEE_PRICE_ID;
  if (SETUP_FEE_PRICE) {
    const { error: errorSetup } = await supabase
      .from("subscription_plans")
      .upsert(
        {
          stripe_price_id: SETUP_FEE_PRICE,
          name: "Setup Fee",
          key: "setup_fee",
          limits: {},
        },
        { onConflict: "stripe_price_id" },
      );
    if (errorSetup)
      console.error("Error seeding Setup Fee", errorSetup.message);
    else console.log("Seeded Setup Fee");
  }

  console.log("Done.");
}

seedPlans();
