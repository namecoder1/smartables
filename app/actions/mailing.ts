"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { ok, okWith, fail, type ActionResult } from "@/lib/action-response";
import { resend } from "@/utils/resend/client";
import { render } from "@react-email/components";
import { MailingCampaignEmail } from "@/emails/mailing-campaign";
import React from "react";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type MailingCampaign = {
  id: string;
  subject: string;
  content_markdown: string;
  status: "draft" | "sending" | "sent" | "failed";
  sent_at: string | null;
  sent_by: string | null;
  recipients_count: number;
  resend_batch_ids: string[] | null;
  created_at: string;
  updated_at: string;
};

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

async function requireSuperadmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "superadmin") {
    return { user: null, error: "Non autorizzato" };
  }
  return { user, error: null };
}

/** Convert markdown to minimal inline HTML for email clients */
function markdownToHtml(markdown: string): string {
  return (
    markdown
      // headings
      .replace(/^### (.+)$/gm, "<h3 style=\"font-size:16px;font-weight:600;margin:20px 0 8px\">$1</h3>")
      .replace(/^## (.+)$/gm, "<h2 style=\"font-size:18px;font-weight:600;margin:24px 0 10px\">$1</h2>")
      .replace(/^# (.+)$/gm, "<h1 style=\"font-size:22px;font-weight:700;margin:28px 0 12px\">$1</h1>")
      // bold / italic
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // inline code
      .replace(/`(.+?)`/g, "<code style=\"background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:13px\">$1</code>")
      // links
      .replace(/\[(.+?)\]\((.+?)\)/g, "<a href=\"$2\" style=\"color:#f97316;text-decoration:underline\">$1</a>")
      // unordered lists
      .replace(/^\s*[-*] (.+)$/gm, "<li style=\"margin:4px 0\">$1</li>")
      .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul style="padding-left:20px;margin:12px 0">${match}</ul>`)
      // ordered lists
      .replace(/^\d+\. (.+)$/gm, "<li style=\"margin:4px 0\">$1</li>")
      // horizontal rule
      .replace(/^---$/gm, "<hr style=\"border:none;border-top:1px solid #e5e7eb;margin:24px 0\">")
      // paragraphs (double newline → <p>)
      .split(/\n{2,}/)
      .map((block) => {
        if (block.startsWith("<h") || block.startsWith("<ul") || block.startsWith("<ol") || block.startsWith("<hr")) {
          return block;
        }
        const trimmed = block.trim();
        if (!trimmed) return "";
        return `<p style="margin:0 0 16px;line-height:1.7">${trimmed.replace(/\n/g, "<br>")}</p>`;
      })
      .join("\n")
  );
}

// --------------------------------------------------------------------------
// Actions
// --------------------------------------------------------------------------

/** Fetch all campaigns (admin only) */
export async function getCampaignsAction(): Promise<ActionResult<MailingCampaign[]>> {
  const { error: authError } = await requireSuperadmin();
  if (authError) return fail(authError);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mailing_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return fail("Errore nel caricamento delle campagne");
  return okWith(data as MailingCampaign[]);
}

/** Save (create or update) a campaign draft */
export async function saveCampaignAction(input: {
  id?: string;
  subject: string;
  content_markdown: string;
}): Promise<ActionResult<{ id: string }>> {
  const { user, error: authError } = await requireSuperadmin();
  if (authError || !user) return fail(authError ?? "Non autorizzato");

  const admin = createAdminClient();

  if (input.id) {
    // Update existing draft
    const { error } = await admin
      .from("mailing_campaigns")
      .update({
        subject: input.subject,
        content_markdown: input.content_markdown,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .eq("status", "draft"); // can only edit drafts

    if (error) return fail("Errore nel salvataggio della bozza");
    return okWith({ id: input.id });
  }

  // Create new draft
  const { data, error } = await admin
    .from("mailing_campaigns")
    .insert({
      subject: input.subject,
      content_markdown: input.content_markdown,
      sent_by: user.id,
    })
    .select("id")
    .single();

  if (error) return fail("Errore nella creazione della campagna");
  return okWith({ id: data.id });
}

/** Delete a draft campaign */
export async function deleteCampaignAction(id: string): Promise<ActionResult> {
  const { error: authError } = await requireSuperadmin();
  if (authError) return fail(authError);

  const admin = createAdminClient();
  const { error } = await admin
    .from("mailing_campaigns")
    .delete()
    .eq("id", id)
    .eq("status", "draft");

  if (error) return fail("Errore nell'eliminazione della campagna");
  return ok();
}

/** Send a campaign to all consenting users */
export async function sendCampaignAction(id: string): Promise<ActionResult<{ recipientsCount: number }>> {
  const { user, error: authError } = await requireSuperadmin();
  if (authError || !user) return fail(authError ?? "Non autorizzato");

  const admin = createAdminClient();

  // 1. Fetch campaign
  const { data: campaign, error: campaignError } = await admin
    .from("mailing_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (campaignError || !campaign) return fail("Campagna non trovata");
  if (campaign.status !== "draft") return fail("Solo le bozze possono essere inviate");

  // 2. Fetch all consenting users with a valid email
  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("email")
    .eq("mailing_consent", true)
    .not("email", "is", null);

  if (profilesError) return fail("Errore nel recupero dei destinatari");

  const emails = (profiles ?? [])
    .map((p) => p.email as string)
    .filter(Boolean);

  if (emails.length === 0) return fail("Nessun destinatario con consenso mailing");

  // 3. Mark as sending
  await admin
    .from("mailing_campaigns")
    .update({ status: "sending", updated_at: new Date().toISOString() })
    .eq("id", id);

  // 4. Render HTML from markdown
  const contentHtml = markdownToHtml(campaign.content_markdown);
  const html = await render(
    React.createElement(MailingCampaignEmail, {
      subject: campaign.subject,
      contentHtml,
      unsubscribeUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/profile`,
    })
  );

  // 5. Send in batches of 50 (Resend limit: 100/call, we use 50 for safety)
  const BATCH_SIZE = 50;
  const batchIds: string[] = [];

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE);
    const messages = chunk.map((to) => ({
      from: "Smartables <newsletter@smartables.it>",
      to,
      subject: campaign.subject,
      html,
    }));

    try {
      const result = await resend.batch.send(messages);
      // Resend v6: result.data is { data: Array<{id: string}> }
      const batchData = (result.data as Record<string, unknown> | null)?.data;
      if (Array.isArray(batchData)) {
        batchIds.push(...batchData.map((r: { id: string }) => r.id));
      }
    } catch (err) {
      console.error(`[mailing] batch ${i / BATCH_SIZE + 1} failed:`, err);
      // Mark as failed and abort
      await admin
        .from("mailing_campaigns")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", id);
      return fail("Errore nell'invio. Alcune email potrebbero non essere state consegnate.");
    }
  }

  // 6. Mark as sent
  await admin
    .from("mailing_campaigns")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      recipients_count: emails.length,
      resend_batch_ids: batchIds,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return okWith({ recipientsCount: emails.length });
}

/** Get count of consenting subscribers */
export async function getSubscribersCountAction(): Promise<ActionResult<{ count: number }>> {
  const { error: authError } = await requireSuperadmin();
  if (authError) return fail(authError);

  const admin = createAdminClient();
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("mailing_consent", true)
    .not("email", "is", null);

  if (error) return fail("Errore nel conteggio subscriber");
  return okWith({ count: count ?? 0 });
}
