import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Carica variabili d'ambiente da .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ ERRORE: Variabili d'ambiente Supabase mancanti in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const orgId = "122ad2c5-b7f2-4ecd-9b96-990508a41485";

async function checkOnboarding() {
  console.log(`\n==================================================`);
  console.log(`🔍 DEBUG ONBOARDING PER ORGANIZZAZIONE: ${orgId}`);
  console.log(`==================================================\n`);

  // 1. Check organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (orgError || !org) {
    console.error(
      `❌ ERRORE: Organizzazione NON TROVATA! (${orgError?.message || "Nessun record"})`,
    );
    return;
  }

  console.log(`🏢 Organizzazione trovata: ${org.name}`);
  const step5_test = (org.whatsapp_usage_count || 0) > 0;

  // 2. Fetch locations
  const { data: locations, error: locError } = await supabase
    .from("locations")
    .select("*")
    .eq("organization_id", orgId);

  if (locError) {
    console.error(`❌ Errore nel recupero delle sedi:`, locError);
    return;
  }

  if (!locations || locations.length === 0) {
    console.error(`❌ Nessuna sede trovata per questa organizzazione.`);
    return;
  }

  for (const loc of locations) {
    console.log(`\n--------------------------------------------------`);
    console.log(`📍 Analizzando Sede: ${loc.name} (ID: ${loc.id})`);

    let step1_docs = false;
    let step1_statusStr = "MANCANTE";

    // Step 1: Documents
    if (loc.regulatory_requirement_id) {
      const { data: req } = await supabase
        .from("telnyx_regulatory_requirements")
        .select("*")
        .eq("id", loc.regulatory_requirement_id)
        .single();

      if (req) {
        if (["approved", "pending", "unapproved"].includes(req.status)) {
          step1_docs = true;
          step1_statusStr = `OK (Trovato ID: ${req.id} con stato: ${req.status})`;
        } else {
          step1_statusStr = `STATO NON VALIDO (Stato attuale: ${req.status})`;
        }
      } else {
        step1_statusStr = `ID Reg Req presente nella sede, ma NON TROVATO nella tabella telnyx!`;
      }
    }

    // Step 2-4 logic
    const step2_phone = !!loc.telnyx_phone_number;
    const step3_voice = !!loc.telnyx_voice_app_id;
    const step4_brand = !!(loc.branding && loc.branding.logo_url);

    console.log(`\n📋 STATO DEI PASSAGGI:`);
    console.log(
      `1. Documenti Aziendali:  ${step1_docs ? "✅" : "❌"} ${step1_statusStr}`,
    );
    console.log(
      `2. Acquisto Numero:      ${step2_phone ? "✅ OK" : "❌ MANCANTE (telnyx_phone_number)"}`,
    );
    console.log(
      `3. Verifica Vocale:      ${step3_voice ? "✅ OK" : "❌ MANCANTE (telnyx_voice_app_id)"}`,
    );
    console.log(
      `4. Personalizzazione:    ${step4_brand ? "✅ OK" : "❌ MANCANTE (branding json o logo_url)"}`,
    );
    console.log(
      `5. Test Finale:          ${step5_test ? "✅ OK" : "❌ MANCANTE (whatsapp_usage_count = 0)"}`,
    );

    console.log(`\n🛠️ COME RISOLVERE MANUALMENTE DAL DATABASE:`);
    if (!step1_docs) {
      console.log(
        `👉 STEP 1: Vai sulla tabella 'locations', cerca l'ID ${loc.id}. Seleziona un ID valido dalla tabella 'telnyx_regulatory_requirements' nel campo 'regulatory_requirement_id'.`,
      );
    }
    if (!step2_phone) {
      console.log(
        `👉 STEP 2: Vai sulla tabella 'locations', cerca l'ID ${loc.id}. Inserisci il numero nel campo 'telnyx_phone_number' (es. "+39340...").`,
      );
    }
    if (!step3_voice) {
      console.log(
        `👉 STEP 3: Vai sulla tabella 'locations', cerca l'ID ${loc.id}. Inserisci l'App ID di Telnyx in 'telnyx_voice_app_id'.`,
      );
    }
    if (!step4_brand) {
      console.log(
        `👉 STEP 4: Vai sulla tabella 'locations', cerca l'ID ${loc.id}. Inserisci un JSON nel campo 'branding'. Esempio: {"logo_url": "https://..."}`,
      );
    }
    if (!step5_test) {
      console.log(
        `👉 STEP 5: Vai sulla tabella 'organizations', cerca l'ID ${org.id}. Imposta 'whatsapp_usage_count' a 1 (o fai inviare un messaggio reale dall'app).`,
      );
    }
  }
}

checkOnboarding().catch(console.error);
