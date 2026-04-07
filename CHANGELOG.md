# Changelog

Tutte le modifiche significative al progetto sono documentate in questo file.

Formato: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)  
Versionamento: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [Unreleased]

### Added
- Enterprise & Acquisition Readiness Audit (Sezione 17 di MASTER.md)
- Meta webhook HMAC-SHA256 signature verification (`X-Hub-Signature-256`)
- GitHub CI/CD workflow: TypeScript + ESLint + Vitest + build su main
- Dependabot (npm settimanale + github-actions mensile)
- `.env.example` con 45+ variabili documentate
- `lib/env-check.ts` — startup validation fail-fast
- GDPR-compliant `deleteCustomers()`: anonimizzazione bookings + cascade
- `utils/supabase/sql/gdpr_customer_fk_fix.sql` — FK `ON DELETE SET NULL`
- `SECURITY.md` — vulnerability disclosure policy
- 8 Architecture Decision Records in `docs/adr/` (ADR-001 → ADR-008)
- Monitoring completo su tutti i path critici (GCal, Telnyx, Stripe, TheFork, WhatsApp Flow)
- Commenti inline "perché" nei file critici: anti-spam 24h, supplier suppression, semantic roles

### Changed
- `app/api/webhooks/whatsapp/route.ts` — legge `rawBody` prima del parsing per verifica firma
- `app/actions/customers.ts` — `deleteCustomers()` GDPR-compliant

---

## [0.4.0] — 2026-03-27

### Added
- GlitchTip error monitoring (self-hosted) con `lib/monitoring.ts`
- Admin section `/addons` — analytics add-on adoption e MRR
- Add-on system: Staff Power Pack, Smart Contact Boost, Media Storage Plus, Sede Extra, AI Knowledge Base, Analytics Pro, Connection Pack
- WABA Template Management (`/bot-templates`): creazione, editing, validazione LLM, submission a Meta
- `lib/addon-catalog.ts` — source of truth per metadata add-on
- `lib/limiter.ts` — `checkResourceAvailability()` per 11 tipi di risorse
- Trial/onboarding page (`/trial`)
- Case studies page e docs con routing dinamico `[sectionSlug]`

### Changed
- `lib/plans.ts` — aggiornato con Stripe price ID per add-on
- `app/(private)/(org)/billing/` — integrata sezione add-on
- `components/private/navbar.tsx` — navigazione aggiornata

---

## [0.3.0] — 2026-03-10

### Added
- Google Calendar integration: sync prenotazioni ↔ GCal
- TheFork POS webhook handler — sync prenotazioni da TheFork
- `/connections` page — gestione connettori (Google, TheFork, ...)
- Custom recovery template WhatsApp con semantic roles sui bottoni
- `lib/waba-templates.ts` — Meta API calls + LLM validation
- Skeleton components per pagine private

### Changed
- `trigger/sync-booking-to-gcal.ts` — task Trigger.dev per sync GCal
- Landing page e shared pages (blog, support) — finalizzate

---

## [0.2.0] — 2026-02-15

### Added
- Floor plan interattivo con Konva
- Analytics dashboard con Recharts
- Sistema notifiche push (Web Push API)
- Promotions management (`/promotions`)
- Knowledge base editor per bot AI (`/bot-memory`)
- Telnyx compliance flow: upload documenti → requirement group → acquisto numero → verifica OTP
- Admin dashboard: health score, compliance pipeline, revenue analytics

### Fixed
- Auth flow: suspense boundary per login/register
- `call.ts` — notification-bell type mismatch

---

## [0.1.0] — 2026-01-20

### Added
- Core missed call recovery: Telnyx → WhatsApp template automatico
- Multi-tenancy: Organization → Locations → Menus / Bookings / Customers
- Prenotazione via WhatsApp Flow (form strutturato nativo)
- Bot AI su WhatsApp (GPT-4o-mini)
- Stripe subscriptions (Starter / Growth / Business)
- Supabase Auth + RLS multi-tenant
- `trigger/verify-booking.ts` — reminder 24h pre-prenotazione
- `trigger/request-review.ts` — richiesta recensione post-visita
- Rate limiting prenotazioni pubbliche (Upstash Redis)
- Public pages: `/p/[locationSlug]`, `/m/[locationSlug]/[menuId]`, `/order/[locationSlug]/[tableId]`

---

[Unreleased]: https://github.com/smartables/web/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/smartables/web/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/smartables/web/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/smartables/web/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/smartables/web/releases/tag/v0.1.0
