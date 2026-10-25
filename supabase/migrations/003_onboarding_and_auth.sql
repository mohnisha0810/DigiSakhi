-- Migration 003: Onboarding, Cross-Device Authentication & Preference Persistence
-- Adds onboarding tracking columns and structured JSON preferences to public.profiles

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS check_in_preferences JSONB DEFAULT '{"enabled": true, "interval_minutes": 10, "countdown_seconds": 120, "notification_type": "in_app"}'::jsonb,
  ADD COLUMN IF NOT EXISTS emergency_preferences JSONB DEFAULT '{"emergency_number": "112", "share_location": true}'::jsonb;

-- Comment for schema documentation
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Tracks whether the user has finished the 5-step initial safety onboarding';
COMMENT ON COLUMN public.profiles.onboarding_step IS 'Stores the last active onboarding step (1 to 5) for cross-device resume';
COMMENT ON COLUMN public.profiles.check_in_preferences IS 'Stores interval and countdown preferences for safety check-ins';
COMMENT ON COLUMN public.profiles.emergency_preferences IS 'Stores primary helpline and live GPS broadcast preferences for emergency SOS';
