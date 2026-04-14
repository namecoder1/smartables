-- Consent Records
-- Stores audit trail of user consent choices for GDPR compliance.
-- Written server-side via service role only — never exposed to clients.

create table if not exists public.consent_records (
  id          uuid        primary key default gen_random_uuid(),
  preferences jsonb       not null,     -- { necessary: true, measurement: true, ... }
  user_agent  text,                     -- pseudonymous browser/device info
  created_at  timestamptz not null default now()
);

-- No direct client access — records are written via service role server action only
alter table public.consent_records enable row level security;
