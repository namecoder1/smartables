-- ==============================================================================
-- Migration: Add voice OTP retry counter to locations
-- Date: 2026-03-25
-- Purpose: Track automatic retry attempts when Whisper fails to extract the
--          Meta OTP code from the voice call recording.
--          Max 1 automatic retry before escalating to manual fallback.
-- ==============================================================================

ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS voice_otp_retry_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.locations.voice_otp_retry_count IS
  'Number of automatic OTP re-request attempts made after a transcription failure. '
  'Reset to 0 on successful verification. If >= 1 at failure time, escalates to manual fallback notification.';
