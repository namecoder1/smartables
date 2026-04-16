-- Migration: add web push subscription column to push_tokens
-- Web Push (VAPID) subscriptions are stored as JSON objects,
-- while Expo tokens are still stored in the `token` text column.
-- For `platform = 'web'`: token = endpoint URL, subscription = full PushSubscription JSON
-- For `platform = 'ios'|'android'`: token = ExponentPushToken, subscription = NULL

ALTER TABLE public.push_tokens
  ADD COLUMN IF NOT EXISTS subscription jsonb DEFAULT NULL;
