-- Migration 002: Add SMS delivery tracking and recipient phone to contact_invitations
-- DigiSakhi Trusted Contact Invitation System

ALTER TABLE public.contact_invitations
ADD COLUMN IF NOT EXISTS invitee_phone TEXT,
ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'twilio',
ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
ADD COLUMN IF NOT EXISTS provider_error TEXT,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Index on invitation_token for fast lookup
CREATE INDEX IF NOT EXISTS idx_contact_invitations_token ON public.contact_invitations(invitation_token);

-- Update status constraint or comments
COMMENT ON COLUMN public.contact_invitations.delivery_status IS 'pending, sending, sent, delivered, failed, accepted, declined, expired';
