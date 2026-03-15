/**
 * RESTORE DELETED USER
 *
 * Questo script ripristina un utente cancellato per errore recuperando i dati
 * dalle API di Telnyx e Meta WABA, poi ricrea i record nel DB.
 *
 * UTILIZZO:
 *   1. Esegui in modalità DISCOVER per vedere cosa c'è sulle API:
 *      npx tsx scripts/restore-deleted-user.ts discover
 *
 *   2. Riempi la sezione CONFIG qui sotto con i dati trovati + quelli noti
 *
 *   3. Esegui in modalità RESTORE per ricreare i record nel DB:
 *      npx tsx scripts/restore-deleted-user.ts restore
 *
 * NOTA: Il comando restore crea l'utente con una password temporanea.
 *       Dopo il restore l'utente dovrà fare "Forgot Password" per impostarne una nuova.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// ─────────────────────────────────────────────────────────────────
// CONFIG — Riempi questi campi dopo aver eseguito la modalità discover
// ─────────────────────────────────────────────────────────────────
const CONFIG = {
  // IDs noti dell'utente cancellato
  userId: "11d48fed-3f6c-49c2-b44a-7be36fa34539",
  organizationId: "ba35d6a6-95b6-4cc0-8f7a-bd3cca422b77",

  // --- AUTH USER ---
  userEmail: "bartozzo04@gmail.com", // es: "mario@example.com"
  userFullName: "Tobia Bartolomei", // es: "Mario Rossi"
  tempPassword: "Bartolomei2004!", // cambia pure, è solo per il primo accesso

  // --- ORGANIZATION ---
  orgName: "Pizzaurum", // es: "Ristorante Bella Italia"
  orgSlug: "pizzaurum", // es: "bella-italia" (url-friendly)
  orgBillingEmail: "", // di solito uguale a userEmail
  orgBillingTier: "growth", // starter | growth | business
  orgActivationStatus: "active", // pending | active

  // Stripe (opzionale — lascia vuoto se non disponibile)
  stripeCustomerId: "cus_U866U0v286XxtR", // es: "cus_XXXXXXXXXX"
  stripeSubscriptionId: "sub_1T9puqDmWHgnXPDyWoFxZME6", // es: "sub_XXXXXXXXXX"
  stripePriceId: "price_1SusAEDmWHgnXPDyUUzEik6c", // es: "price_XXXXXXXXXX"
  stripeStatus: "active", // active | past_due | canceled | ...

  // Telnyx managed account ID (visibile nella dashboard Telnyx > Accounts)
  telnyxManagedAccountId: "", // es: "2253564182563890132"

  // --- LOCATION ---
  // Lascia vuoti: telnyx_phone_number, telnyx_connection_id, telnyx_requirement_group_id,
  // meta_phone_id verranno presi dalle API (o configura manualmente se necessario)
  locationName: "Pizzaurum", // es: "Bella Italia - Centro"
  locationSlug: "pizzaurum-5718", // es: "bella-italia-centro"
  locationAddress: "Piazzale Giuseppe Garibaldi, 4, Pesaro, Province of Pesaro and Urbino, Italy", // es: "Via Roma 1, 00100 Roma"
  locationPhoneNumber: "+393486974498", // numero pubblico display (può = telnyx_phone_number)
  locationVoiceForwardingNumber: "", // es: "+39123456789" (cellulare del titolare)

  // Questi vengono auto-popolati dalla modalità discover.
  // Puoi sovrascriverli manualmente se necessario.
  telnyxPhoneNumber: "+3907211640282", // es: "+39072100001"
  telnyxConnectionId: "2888539653114169268", // es: "2226601234567890"
  telnyxVoiceAppId: "2888539653114169268", // es: "2226601234567890" (spesso = connectionId)
  telnyxRequirementGroupId: "10435278-1c1b-4332-886c-d0f1beb47012", // es: "abc123-..."
  metaPhoneId: "973386825864131", // es: "123456789012345"
};
// ─────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TELNYX_API_KEY = process.env.TELNYX_API_KEY!;
const META_TOKEN = process.env.META_SYSTEM_USER_TOKEN!;
const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!;
const TELNYX_CONNECTION_ID = process.env.TELNYX_CONNECTION_ID!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Telnyx helpers ───────────────────────────────────────────────

async function fetchTelnyx(endpoint: string) {
  const res = await fetch(`https://api.telnyx.com/v2/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${TELNYX_API_KEY}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Telnyx [${endpoint}] error: ${text}`);
  }
  return res.json();
}

async function discoverTelnyx() {
  console.log("\n━━━ TELNYX: Phone Numbers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const numbersRes = await fetchTelnyx("phone_numbers?page[size]=50");
  const numbers: any[] = numbersRes.data || [];

  if (numbers.length === 0) {
    console.log("  Nessun numero trovato su Telnyx.");
    return null;
  }

  numbers.forEach((n) => {
    console.log(`\n  📞 ${n.phone_number}`);
    console.log(`     ID Telnyx:            ${n.id}`);
    console.log(`     Status:               ${n.status}`);
    console.log(`     Connection ID:        ${n.connection_id || "NONE"}`);
    console.log(`     Connection Name:      ${n.connection_name || "NONE"}`);
    console.log(`     Requirement Group:    ${n.requirement_group_id || "NONE"}`);
  });

  console.log("\n━━━ TELNYX: Requirement Groups ━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const rgRes = await fetchTelnyx("requirement_groups?page[size]=50");
  const rgs: any[] = rgRes.data || [];

  if (rgs.length === 0) {
    console.log("  Nessun requirement group trovato.");
  } else {
    rgs.forEach((rg) => {
      console.log(`\n  📋 ${rg.id}`);
      console.log(`     Status:     ${rg.status}`);
      console.log(`     Action:     ${rg.action}`);
      console.log(`     Reference:  ${rg.customer_reference}`);
      console.log(`     Country:    ${rg.country_code}`);
    });
  }

  return { numbers, rgs };
}

// ─── Meta / WABA helpers ──────────────────────────────────────────

async function discoverMeta() {
  console.log("\n━━━ META WABA: Phone Numbers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (!META_TOKEN || !WABA_ID) {
    console.log("  ⚠️  META_SYSTEM_USER_TOKEN o WHATSAPP_BUSINESS_ACCOUNT_ID mancanti.");
    return null;
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${WABA_ID}/phone_numbers?fields=id,display_phone_number,verified_name,code_verification_status,quality_rating`,
    {
      headers: { Authorization: `Bearer ${META_TOKEN}` },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    console.log(`  ⚠️  Errore Meta API: ${text}`);
    return null;
  }

  const data = await res.json();
  const phones: any[] = data.data || [];

  if (phones.length === 0) {
    console.log("  Nessun numero trovato nel WABA.");
    return null;
  }

  phones.forEach((p) => {
    console.log(`\n  💬 ${p.display_phone_number}`);
    console.log(`     Meta Phone ID:        ${p.id}`);
    console.log(`     Verified Name:        ${p.verified_name}`);
    console.log(`     Verification Status:  ${p.code_verification_status}`);
    console.log(`     Quality Rating:       ${p.quality_rating}`);
  });

  return phones;
}

// ─── DISCOVER MODE ────────────────────────────────────────────────

async function runDiscover() {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║           MODALITÀ DISCOVER — Lettura API                    ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const telnyxData = await discoverTelnyx();
  const metaPhones = await discoverMeta();

  console.log("\n━━━ RIEPILOGO CONFIG SUGGERITA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Aggiorna la sezione CONFIG in questo script con i valori seguenti:\n");

  if (telnyxData && telnyxData.numbers.length > 0) {
    const n = telnyxData.numbers[0]; // prende il primo (di solito c'è solo uno)
    console.log(`  telnyxPhoneNumber:        "${n.phone_number}"`);
    console.log(`  telnyxConnectionId:       "${n.connection_id || TELNYX_CONNECTION_ID}"`);
    console.log(`  telnyxVoiceAppId:         "${n.connection_id || TELNYX_CONNECTION_ID}"`);

    const rg = telnyxData.rgs.find((r: any) => r.status === "approved") || telnyxData.rgs[0];
    if (rg) {
      console.log(`  telnyxRequirementGroupId: "${rg.id}"`);
    }
  }

  if (metaPhones && metaPhones.length > 0) {
    const p = metaPhones[0];
    console.log(`  metaPhoneId:              "${p.id}"`);
    if (!CONFIG.locationName) {
      console.log(`  (locationName suggerito da WABA: "${p.verified_name}")`);
    }
  }

  console.log("\n✅ Discover completato. Riempi CONFIG e lancia: npx tsx scripts/restore-deleted-user.ts restore");
}

// ─── RESTORE MODE ─────────────────────────────────────────────────

function validateConfig() {
  const required: (keyof typeof CONFIG)[] = [
    "userEmail", "userFullName", "orgName", "orgSlug", "locationName",
  ];
  const missing = required.filter((k) => !CONFIG[k]);
  if (missing.length > 0) {
    throw new Error(
      `Campi CONFIG mancanti: ${missing.join(", ")}\nRiempi la sezione CONFIG prima di eseguire il restore.`,
    );
  }
}

async function restoreAuthUser() {
  console.log("\n[1/4] Creazione utente in auth.users...");

  // Verifica se esiste già
  const { data: existing } = await supabase.auth.admin.getUserById(CONFIG.userId);
  if (existing?.user) {
    console.log(`  ⚠️  Utente auth già presente (email: ${existing.user.email}). Skip.`);
    return existing.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: CONFIG.userEmail,
    password: CONFIG.tempPassword,
    email_confirm: true, // skip verifica email
    user_metadata: { full_name: CONFIG.userFullName },
  });

  if (error) throw new Error(`Errore creazione auth user: ${error.message}`);

  // L'ID generato sarà diverso da quello originale — dobbiamo usare quello originale.
  // Supabase Admin non supporta la specifica dell'ID. Aggiorniamo via SQL raw.
  const newId = data.user.id;

  if (newId !== CONFIG.userId) {
    console.log(`  ⚠️  Supabase ha generato ID ${newId}. Aggiorno al vecchio ID ${CONFIG.userId}...`);

    // Aggiorna l'ID in auth.users tramite service role (richiede accesso diretto al DB)
    // Purtroppo non è possibile via REST — usa questa query manualmente nel Supabase SQL Editor:
    console.log(`\n  ⚠️  AZIONE MANUALE RICHIESTA:`);
    console.log(`  Esegui questa query nel Supabase SQL Editor per sistemare l'ID:`);
    console.log(`\n    UPDATE auth.users SET id = '${CONFIG.userId}' WHERE id = '${newId}';`);
    console.log(`    UPDATE auth.identities SET user_id = '${CONFIG.userId}' WHERE user_id = '${newId}';\n`);
    console.log(`  Poi ri-esegui questo script per completare il restore.`);
    process.exit(1);
  }

  console.log(`  ✅ Auth user creato: ${CONFIG.userEmail} (ID: ${newId})`);
  return data.user;
}

async function restoreOrganization() {
  console.log("\n[2/4] Aggiornamento organization...");

  const orgPayload: Record<string, any> = {
    name: CONFIG.orgName,
    slug: CONFIG.orgSlug,
    billing_email: CONFIG.orgBillingEmail || CONFIG.userEmail,
    activation_status: CONFIG.orgActivationStatus,
    created_by: CONFIG.userId,
    billing_tier: CONFIG.orgBillingTier,
  };

  if (CONFIG.telnyxManagedAccountId) orgPayload.telnyx_managed_account_id = CONFIG.telnyxManagedAccountId;
  if (CONFIG.stripeCustomerId) orgPayload.stripe_customer_id = CONFIG.stripeCustomerId;
  if (CONFIG.stripeSubscriptionId) orgPayload.stripe_subscription_id = CONFIG.stripeSubscriptionId;
  if (CONFIG.stripePriceId) orgPayload.stripe_price_id = CONFIG.stripePriceId;
  if (CONFIG.stripeStatus) orgPayload.stripe_status = CONFIG.stripeStatus;

  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", CONFIG.organizationId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("organizations")
      .update(orgPayload)
      .eq("id", CONFIG.organizationId);
    if (error) throw new Error(`Errore aggiornamento organization: ${error.message}`);
    console.log(`  ✅ Organization aggiornata: ${CONFIG.orgName}`);
  } else {
    const { error } = await supabase.from("organizations").insert({
      id: CONFIG.organizationId,
      ...orgPayload,
      whatsapp_usage_count: 0,
      usage_cap_whatsapp: 400,
      addons_config: { extra_staff: 0, extra_contacts_wa: 0, extra_storage_mb: 0, extra_locations: 0, extra_kb_chars: 0 },
      total_storage_used: 0,
    });
    if (error) throw new Error(`Errore creazione organization: ${error.message}`);
    console.log(`  ✅ Organization creata: ${CONFIG.orgName} (ID: ${CONFIG.organizationId})`);
  }
}

async function restoreProfile() {
  console.log("\n[3/4] Aggiornamento profilo...");

  const profilePayload = {
    organization_id: CONFIG.organizationId,
    full_name: CONFIG.userFullName,
    email: CONFIG.userEmail,
    role: "admin",
  };

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", CONFIG.userId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("profiles")
      .update(profilePayload)
      .eq("id", CONFIG.userId);
    if (error) throw new Error(`Errore aggiornamento profilo: ${error.message}`);
    console.log(`  ✅ Profilo aggiornato: ${CONFIG.userFullName}`);
  } else {
    const { error } = await supabase.from("profiles").insert({
      id: CONFIG.userId,
      ...profilePayload,
      accessible_locations: null,
    });
    if (error) throw new Error(`Errore creazione profilo: ${error.message}`);
    console.log(`  ✅ Profilo creato: ${CONFIG.userFullName}`);
  }
}

async function restoreLocation(telnyxData: any, metaPhones: any[]) {
  console.log("\n[4/4] Aggiornamento location...");

  // Usa i valori dalla CONFIG (già compilata) o fallback alle API
  let telnyxPhone = CONFIG.telnyxPhoneNumber;
  let connectionId = CONFIG.telnyxConnectionId || TELNYX_CONNECTION_ID;
  let voiceAppId = CONFIG.telnyxVoiceAppId || connectionId;
  let requirementGroupId = CONFIG.telnyxRequirementGroupId;
  let metaPhoneId = CONFIG.metaPhoneId;

  if (!telnyxPhone && telnyxData?.numbers?.length > 0) {
    const n = telnyxData.numbers[0];
    telnyxPhone = n.phone_number;
    connectionId = n.connection_id || connectionId;
    voiceAppId = n.connection_id || voiceAppId;
    console.log(`  Auto-rilevato telnyx_phone_number: ${telnyxPhone}`);
  }

  if (!requirementGroupId && telnyxData?.rgs?.length > 0) {
    const rg = telnyxData.rgs.find((r: any) => r.status === "approved") || telnyxData.rgs[0];
    requirementGroupId = rg.id;
    console.log(`  Auto-rilevato requirement_group_id: ${requirementGroupId} (status: ${rg.status})`);
  }

  if (!metaPhoneId && metaPhones?.length > 0) {
    metaPhoneId = metaPhones[0].id;
    console.log(`  Auto-rilevato meta_phone_id: ${metaPhoneId}`);
  }

  const locationPayload: Record<string, any> = {
    name: CONFIG.locationName,
    slug: CONFIG.locationSlug || CONFIG.orgSlug,
    address: CONFIG.locationAddress || null,
    phone_number: CONFIG.locationPhoneNumber || telnyxPhone || null,
    // Tutti i passi erano completati: forza verified + approved
    // "verified" = voice verification completata (richiesto da getOnboardingStatus)
    activation_status: "verified",
    regulatory_status: "approved",
    is_branding_completed: true,
    is_test_completed: true,
  };

  if (telnyxPhone) locationPayload.telnyx_phone_number = telnyxPhone;
  if (connectionId) locationPayload.telnyx_connection_id = connectionId;
  if (voiceAppId) locationPayload.telnyx_voice_app_id = voiceAppId;
  if (requirementGroupId) locationPayload.telnyx_requirement_group_id = requirementGroupId;
  if (metaPhoneId) locationPayload.meta_phone_id = metaPhoneId;
  if (CONFIG.locationVoiceForwardingNumber) locationPayload.voice_forwarding_number = CONFIG.locationVoiceForwardingNumber;

  const { data: existing } = await supabase
    .from("locations")
    .select("id")
    .eq("organization_id", CONFIG.organizationId)
    .single();

  let locationId: string;

  if (existing) {
    const { error } = await supabase
      .from("locations")
      .update(locationPayload)
      .eq("id", existing.id);
    if (error) throw new Error(`Errore aggiornamento location: ${error.message}`);
    locationId = existing.id;
    console.log(`  ✅ Location aggiornata: ${CONFIG.locationName} (ID: ${locationId})`);
  } else {
    const { data: loc, error } = await supabase
      .from("locations")
      .insert({ organization_id: CONFIG.organizationId, ...locationPayload })
      .select("id")
      .single();
    if (error) throw new Error(`Errore creazione location: ${error.message}`);
    locationId = loc!.id;
    console.log(`  ✅ Location creata: ${CONFIG.locationName} (ID: ${locationId})`);
  }

  console.log(`\n  Connessioni impostate:`);
  console.log(`     activation_status:       verified`);
  console.log(`     regulatory_status:       approved`);
  console.log(`     telnyx_phone_number:     ${telnyxPhone || "—"}`);
  console.log(`     telnyx_connection_id:    ${connectionId || "—"}`);
  console.log(`     telnyx_req_group_id:     ${requirementGroupId || "—"}`);
  console.log(`     meta_phone_id:           ${metaPhoneId || "—"}`);

  if (!telnyxPhone || !metaPhoneId) {
    console.log(`\n  ⚠️  ATTENZIONE: Alcune connessioni non sono complete:`);
    if (!telnyxPhone) console.log(`     - telnyx_phone_number mancante`);
    if (!metaPhoneId) console.log(`     - meta_phone_id mancante`);
  }
}

async function runRestore() {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║           MODALITÀ RESTORE — Scrittura su DB                 ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  validateConfig();

  // Recupera dati dalle API per auto-completare i campi Telnyx/Meta
  console.log("\nRecupero dati dalle API (Telnyx + Meta)...");
  let telnyxData: any = null;
  let metaPhones: any[] = [];

  try {
    const numbersRes = await fetchTelnyx("phone_numbers?page[size]=50");
    const rgRes = await fetchTelnyx("requirement_groups?page[size]=50");
    telnyxData = { numbers: numbersRes.data || [], rgs: rgRes.data || [] };
    console.log(`  Telnyx: ${telnyxData.numbers.length} numeri, ${telnyxData.rgs.length} requirement groups`);
  } catch (e: any) {
    console.log(`  ⚠️  Telnyx non disponibile: ${e.message}`);
  }

  if (META_TOKEN && WABA_ID) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${WABA_ID}/phone_numbers?fields=id,display_phone_number,verified_name`,
        { headers: { Authorization: `Bearer ${META_TOKEN}` } },
      );
      const data = await res.json();
      metaPhones = data.data || [];
      console.log(`  Meta WABA: ${metaPhones.length} numeri`);
    } catch (e: any) {
      console.log(`  ⚠️  Meta WABA non disponibile: ${e.message}`);
    }
  }

  await restoreAuthUser();
  await restoreOrganization();
  await restoreProfile();
  await restoreLocation(telnyxData, metaPhones);

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║                    RESTORE COMPLETATO ✅                     ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`\n  L'utente può accedere con:`);
  console.log(`    Email:    ${CONFIG.userEmail}`);
  console.log(`    Password: ${CONFIG.tempPassword}  (temporanea — cambiala subito)`);
  console.log(`\n  Oppure usa "Forgot Password" nell'app per impostarne una nuova.\n`);
}

// ─── Entry Point ──────────────────────────────────────────────────

const mode = process.argv[2] || "discover";

if (mode === "discover") {
  runDiscover().catch((e) => {
    console.error("Errore durante discover:", e);
    process.exit(1);
  });
} else if (mode === "restore") {
  runRestore().catch((e) => {
    console.error("\n❌ Errore durante restore:", e.message);
    process.exit(1);
  });
} else {
  console.error(`Modalità non riconosciuta: "${mode}". Usa "discover" o "restore".`);
  process.exit(1);
}
