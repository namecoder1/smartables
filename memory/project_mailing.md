---
name: Mailing List Feature
description: Mailing list system implemented for Smartables - DB schema, consent flow, admin UI, Resend batch sending
type: project
---

Mailing list feature fully implemented on 2026-04-14.

**Why:** Admin wanted to send newsletter/product updates to all Smartables users via Resend.

**How to apply:** When extending the mailing system, these are the key files:

- Migration: `utils/supabase/migrations/20260414_mailing.sql`
- DB schema: `profiles.mailing_consent boolean DEFAULT true` + `mailing_campaigns` table
- Server actions: `app/actions/mailing.ts` — saveCampaign, sendCampaign, deleteCampaign, getCampaigns, getSubscribersCount
- Admin UI: `app/(admin)/mailing/` — page.tsx (RSC) + mailing-view.tsx (client, markdown editor)
- Email template: `emails/mailing-campaign.tsx`
- Consent opt-out: `app/(private)/(org)/profile/profile-view.tsx` — Switch toggle
- Consent on signup: `app/(setup)/onboarding/onboarding-form.tsx` — checkbox step 3

Resend batch sending is chunked at 50 emails per call. The `markdownToHtml()` helper in the action converts MD to inline HTML for email clients.
