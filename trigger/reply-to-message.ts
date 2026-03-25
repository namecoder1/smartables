import { task } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { checkWhatsAppLimitNotification } from "@/lib/notifications";

// Supabase client initialization requires explicit passing since it runs in a different worker
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type ReplyToMessagePayload = {
  organizationId: string;
  locationId: string;
  customerId: string;
  customerPhone: string;
  customerName: string;
  metaPhoneId: string;
};

export const replyToMessage = task({
  id: "reply-to-message",
  retry: {
    maxAttempts: 3,
    factor: 1.8,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30_000,
    randomize: false,
  },
  run: async (payload: ReplyToMessagePayload) => {
    const {
      organizationId,
      locationId,
      customerId,
      customerPhone,
      customerName,
      metaPhoneId,
    } = payload;

    const supabase = getSupabaseAdmin();

    console.log(`[Reply Task] Processing for ${customerPhone}...`);

    // 0. Check WhatsApp usage cap before doing any work
    const { data: org } = await supabase
      .from("organizations")
      .select("whatsapp_usage_count, usage_cap_whatsapp")
      .eq("id", organizationId)
      .single();

    const usageCount = org?.whatsapp_usage_count ?? 0;
    const usageCap   = org?.usage_cap_whatsapp   ?? 400;

    if (usageCount >= usageCap) {
      console.warn(`[Reply Task] WhatsApp cap reached (${usageCount}/${usageCap}) for org ${organizationId}. Sending fallback.`);

      const { data: loc } = await supabase
        .from("locations")
        .select("slug")
        .eq("id", locationId)
        .single();

      const { sendWhatsAppText } = await import("../lib/whatsapp");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://smartables.it";

      try {
        await sendWhatsAppText(
          customerPhone,
          `Il nostro assistente automatico non è al momento disponibile. Per prenotare un tavolo puoi usare il nostro sito: ${appUrl}/p/${loc?.slug ?? ""}`,
          metaPhoneId,
        );
      } catch (err) {
        console.error("[Reply Task] Failed to send fallback message:", err);
      }

      return { success: false, reason: "cap_exceeded" };
    }

    // 1. Fetch Location profile to get the bot's persona
    const { data: location } = await supabase
      .from("locations")
      .select("name")
      .eq("id", locationId)
      .single();

    const restaurantName = location?.name || "il nostro ristorante";

    // 2. Fetch Active Knowledge Base
    const { data: kbEntries } = await supabase
      .from("knowledge_base")
      .select("title, content")
      .eq("location_id", locationId)
      .eq("is_active", true);

    let rulesText = "";
    if (kbEntries && kbEntries.length > 0) {
      rulesText = kbEntries
        .map((kb) => `Regola [${kb.title}]: ${kb.content}`)
        .join("\n");
    }

    // 3. Construct System Prompt
    const systemPrompt = `Sei un assistente virtuale su WhatsApp per "${restaurantName}".
Parli a nome del ristorante in modo cortese, amichevole e sintetico.
Evita messaggi troppo lunghi, usa formattazione WhatsApp (grassetto testuale con *, emoji).
Il cliente con cui stai parlando si chiama (o ha come nome profilo): "${customerName}".

Sei dotato di alcune "Regole Operative / Knowledge Base". Rispondi basandoti ESCLUSIVAMENTE su quanto descritto in tali regole se l'argomento è inerente.
Se il cliente chiede qualcosa che non è presente nelle regole o su cui sei incerto, offriti di contattare l'intervento umano chiedendogli di aspettare un attimo.

REGOLE OPERATIVE:
${rulesText ? rulesText : "(Nessuna regola aggiuntiva configurata. Rispondi in modo generico ma cortese e dirotta le richieste allo staff)."}`;

    // 4. Fetch the Conversation History
    // Get the last 10 messages
    const { data: messageHistory } = await supabase
      .from("whatsapp_messages")
      .select("direction, content")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(10);

    // AI messages expects an array of { role: 'user' | 'assistant', content: string }
    // We reverse it because we got descending order but we want chronological
    const messages: { role: "user" | "assistant"; content: string }[] = [];

    if (messageHistory) {
      const chronological = messageHistory.reverse();
      for (const msg of chronological) {
        if (!msg.content) continue;
        const textContent = (msg.content as any).text || "Media/Attachment";

        let role: "user" | "assistant" = "user";
        if (msg.direction === "outbound_bot") {
          role = "assistant";
        } else if (msg.direction === "outbound_human") {
          role = "assistant"; // Treat human intervention as assistant in the chat history
        }

        messages.push({
          role,
          content: textContent,
        });
      }
    }

    // Since the webhook already saved the latest inbound message, it's ALREADY the last item in the array `messages`.

    // 5. Generate AI Response
    console.log(`[Reply Task] Generating response for history:`, messages);

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: systemPrompt,
        messages: messages,
      });

      console.log(`[Reply Task] AI generated message: ${text}`);

      // 6. Send the message via WhatsApp
      const { sendWhatsAppText } = await import("../lib/whatsapp");

      let messageId = null;
      try {
        const waResponse = await sendWhatsAppText(
          customerPhone,
          text,
          metaPhoneId,
        );
        messageId = waResponse?.messages?.[0]?.id || null;
      } catch (err) {
        console.error("[Reply Task] Failed to send to WhatsApp API", err);
      }

      // 7. Save the bot's response to DB
      await supabase.from("whatsapp_messages").insert({
        organization_id: organizationId,
        location_id: locationId,
        customer_id: customerId,
        meta_message_id: messageId,
        content: { type: "text", text: text },
        direction: "outbound_bot",
        status: "sent",
      });

      // 8. Increment WhatsApp usage counter and check thresholds
      try {
        await supabase.rpc("increment_whatsapp_usage", { org_id: organizationId });
        await checkWhatsAppLimitNotification(supabase as any, organizationId);
      } catch (err) {
        console.error("[Reply Task] Failed to increment usage:", err);
      }

      return { success: true, text };
    } catch (e) {
      console.error("[Reply Task] AI generation failed:", e);
      return { success: false, error: e };
    }
  },
});
