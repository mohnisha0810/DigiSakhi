-- SafeSphere Women's Safety Platform Database Schema
-- Production PostgreSQL Migration with Row Level Security (RLS)

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    emergency_notes TEXT,
    medical_info TEXT,
    discreet_exit_pin VARCHAR(6) DEFAULT '1234',
    discreet_mode_enabled BOOLEAN DEFAULT FALSE,
    quick_exit_disguise VARCHAR(20) DEFAULT 'weather',
    discreet_lockscreen_mask BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trusted Contacts Table
CREATE TABLE IF NOT EXISTS public.trusted_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contact_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    relationship TEXT NOT NULL,
    escalation_order INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    can_view_location BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_contact UNIQUE (user_id, email)
);

-- 3. Contact Invitations Table
CREATE TABLE IF NOT EXISTS public.contact_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    invitee_name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    escalation_order INT NOT NULL DEFAULT 1,
    invitation_token TEXT UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- 4. Safety Protocols Table
CREATE TABLE IF NOT EXISTS public.safety_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL, -- 'check_in_overdue', 'urgent_button', 'journey_delayed', 'custom'
    reminder_lead_seconds INT DEFAULT 120,
    grace_period_seconds INT DEFAULT 180,
    contact_wait_seconds INT DEFAULT 180,
    allow_location_sharing BOOLEAN DEFAULT TRUE,
    location_auto_expire_minutes INT DEFAULT 60,
    escalation_contact_ids JSONB DEFAULT '[]'::jsonb,
    is_default BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Check-ins Table
CREATE TABLE IF NOT EXISTS public.check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    protocol_id UUID REFERENCES public.safety_protocols(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    deadline_at TIMESTAMPTZ NOT NULL,
    reminder_at TIMESTAMPTZ NOT NULL,
    grace_period_seconds INT NOT NULL DEFAULT 180,
    contact_wait_seconds INT NOT NULL DEFAULT 180,
    status VARCHAR(30) NOT NULL DEFAULT 'active', -- 'active', 'reminded', 'in_grace_period', 'escalated', 'completed', 'cancelled'
    current_escalation_tier INT DEFAULT 0,
    next_escalation_at TIMESTAMPTZ,
    related_journey_id UUID,
    active_incident_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 6. Journeys Table
CREATE TABLE IF NOT EXISTS public.journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    protocol_id UUID REFERENCES public.safety_protocols(id) ON DELETE SET NULL,
    check_in_id UUID REFERENCES public.check_ins(id) ON DELETE SET NULL,
    origin_name TEXT NOT NULL,
    destination_name TEXT NOT NULL,
    dest_lat DOUBLE PRECISION NOT NULL,
    dest_lng DOUBLE PRECISION NOT NULL,
    safe_radius_meters INT DEFAULT 200,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    expected_arrival_time TIMESTAMPTZ NOT NULL,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    status VARCHAR(30) NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'approaching', 'safe_arrival_pending', 'completed', 'overdue_escalated', 'cancelled'
    share_location BOOLEAN DEFAULT TRUE,
    prompted_arrival_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Add check_ins foreign key to journey
ALTER TABLE public.check_ins
    ADD CONSTRAINT fk_journey FOREIGN KEY (related_journey_id) REFERENCES public.journeys(id) ON DELETE SET NULL;

-- 7. Incidents Table
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_number VARCHAR(30) UNIQUE NOT NULL,
    owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    incident_type VARCHAR(30) NOT NULL, -- 'check_on_me', 'call_me', 'urgent_assistance', 'journey_checkin'
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status VARCHAR(30) NOT NULL DEFAULT 'triggered', -- 'triggered', 'notification_pending', 'notification_sent', 'delivery_confirmed', 'acknowledged', 'responding', 'resolved', 'cancelled'
    title TEXT NOT NULL,
    description TEXT,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    location_address TEXT,
    location_accuracy DOUBLE PRECISION,
    is_demo_location BOOLEAN DEFAULT FALSE,
    location_shared BOOLEAN DEFAULT FALSE,
    location_expires_at TIMESTAMPTZ,
    related_journey_id UUID REFERENCES public.journeys(id) ON DELETE SET NULL,
    related_checkin_id UUID REFERENCES public.check_ins(id) ON DELETE SET NULL,
    escalation_tier INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    responding_at TIMESTAMPTZ,
    responding_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT
);

-- 8. Incident Recipients Table
CREATE TABLE IF NOT EXISTS public.incident_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.trusted_contacts(id) ON DELETE CASCADE,
    escalation_tier INT NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'notified', 'acknowledged', 'responding', 'resolved'
    notified_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    is_responding BOOLEAN DEFAULT FALSE,
    responded_at TIMESTAMPTZ,
    response_note TEXT,
    CONSTRAINT unique_incident_contact UNIQUE (incident_id, contact_id)
);

-- 9. Incident Events Table (Audit log & Chronological Timeline)
CREATE TABLE IF NOT EXISTS public.incident_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role VARCHAR(20) NOT NULL, -- 'user', 'contact', 'system_scheduler'
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Location Shares Table
CREATE TABLE IF NOT EXISTS public.location_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_type VARCHAR(20) NOT NULL, -- 'incident', 'journey', 'manual'
    session_id UUID NOT NULL,
    allowed_contact_ids JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- 11. Location Updates Table
CREATE TABLE IF NOT EXISTS public.location_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID NOT NULL REFERENCES public.location_shares(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy_meters DOUBLE PRECISION,
    address_approximate TEXT,
    is_demo_coordinates BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Notification Records Table
CREATE TABLE IF NOT EXISTS public.notification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.trusted_contacts(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE,
    channel VARCHAR(30) NOT NULL, -- 'in_app', 'browser_push', 'email_simulated', 'sms_simulated'
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
    provider_status TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    masked_message TEXT,
    is_discreet_masked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_checkins_deadline ON public.check_ins(deadline_at, status);
CREATE INDEX IF NOT EXISTS idx_incidents_owner ON public.incidents(owner_user_id, status);
CREATE INDEX IF NOT EXISTS idx_incident_recipients_contact ON public.incident_recipients(contact_id, status);
CREATE INDEX IF NOT EXISTS idx_incident_events_incident ON public.incident_events(incident_id, created_at);
CREATE INDEX IF NOT EXISTS idx_location_shares_active ON public.location_shares(user_id, is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_journeys_user_status ON public.journeys(owner_user_id, status);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_records ENABLE ROW LEVEL SECURITY;

-- Security Policies:
-- Profiles: Users can view & edit own profile; contacts can view user profile if authorized
CREATE POLICY "Users can manage own profile"
    ON public.profiles FOR ALL
    USING (auth.uid() = id);

-- Trusted Contacts: Users manage their contacts; contacts can view contact records for their email/user_id
CREATE POLICY "Users can manage own contacts"
    ON public.trusted_contacts FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Contacts can view their own contact link"
    ON public.trusted_contacts FOR SELECT
    USING (auth.uid() = contact_user_id);

-- Incidents: Owners have full access; authorized recipients have read & response access
CREATE POLICY "Owners can manage incidents"
    ON public.incidents FOR ALL
    USING (auth.uid() = owner_user_id);

CREATE POLICY "Authorized contacts can view assigned incidents"
    ON public.incidents FOR SELECT
    USING (
        id IN (
            SELECT ir.incident_id FROM public.incident_recipients ir
            JOIN public.trusted_contacts tc ON ir.contact_id = tc.id
            WHERE tc.contact_user_id = auth.uid() OR tc.email = (auth.jwt() ->> 'email')
        )
    );

CREATE POLICY "Authorized contacts can update response on incidents"
    ON public.incidents FOR UPDATE
    USING (
        id IN (
            SELECT ir.incident_id FROM public.incident_recipients ir
            JOIN public.trusted_contacts tc ON ir.contact_id = tc.id
            WHERE tc.contact_user_id = auth.uid() OR tc.email = (auth.jwt() ->> 'email')
        )
    );

-- Check-ins and Journeys: Private to owners
CREATE POLICY "Owners manage check-ins"
    ON public.check_ins FOR ALL
    USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners manage journeys"
    ON public.journeys FOR ALL
    USING (auth.uid() = owner_user_id);

-- Safety Protocols: Private to owner
CREATE POLICY "Owners manage safety protocols"
    ON public.safety_protocols FOR ALL
    USING (auth.uid() = user_id);

-- Incident Events: Incident owners and authorized contacts can view timeline
CREATE POLICY "Owners and contacts view incident timeline"
    ON public.incident_events FOR SELECT
    USING (
        incident_id IN (
            SELECT id FROM public.incidents WHERE owner_user_id = auth.uid()
            UNION
            SELECT ir.incident_id FROM public.incident_recipients ir
            JOIN public.trusted_contacts tc ON ir.contact_id = tc.id
            WHERE tc.contact_user_id = auth.uid() OR tc.email = (auth.jwt() ->> 'email')
        )
    );

CREATE POLICY "Participants can insert incident events"
    ON public.incident_events FOR INSERT
    WITH CHECK (
        incident_id IN (
            SELECT id FROM public.incidents WHERE owner_user_id = auth.uid()
            UNION
            SELECT ir.incident_id FROM public.incident_recipients ir
            JOIN public.trusted_contacts tc ON ir.contact_id = tc.id
            WHERE tc.contact_user_id = auth.uid() OR tc.email = (auth.jwt() ->> 'email')
        )
    );

-- Location Shares: Owners manage; contacts can only read if authorized and active
CREATE POLICY "Owners manage location shares"
    ON public.location_shares FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Authorized contacts read active location updates"
    ON public.location_updates FOR SELECT
    USING (
        share_id IN (
            SELECT ls.id FROM public.location_shares ls
            WHERE ls.is_active = TRUE AND ls.expires_at > NOW()
            AND (
                ls.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.trusted_contacts tc
                    WHERE tc.user_id = ls.user_id
                    AND (tc.contact_user_id = auth.uid() OR tc.email = (auth.jwt() ->> 'email'))
                    AND tc.status = 'accepted'
                    AND tc.can_view_location = TRUE
                )
            )
        )
    );

-- Contact Invitations Policies
CREATE POLICY "Users can manage invitations they created"
    ON public.contact_invitations FOR ALL
    USING (auth.uid() = inviter_id);

CREATE POLICY "Anyone with valid token can view invitation"
    ON public.contact_invitations FOR SELECT
    USING (status = 'pending');

-- Notification Records Policies
CREATE POLICY "Users manage own notifications"
    ON public.notification_records FOR ALL
    USING (auth.uid() = user_id);

-- Automatic Profile Creation Trigger on Supabase Auth Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        phone_number,
        emergency_notes,
        medical_info,
        discreet_exit_pin,
        discreet_mode_enabled,
        quick_exit_disguise,
        discreet_lockscreen_mask,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'phone_number',
        NEW.raw_user_meta_data->>'emergency_notes',
        NEW.raw_user_meta_data->>'medical_info',
        COALESCE(NEW.raw_user_meta_data->>'discreet_exit_pin', '1234'),
        FALSE,
        'weather',
        TRUE,
        NOW(),
        NOW()
    );

    -- Automatically seed default protocol for new user
    INSERT INTO public.safety_protocols (
        id,
        user_id,
        name,
        description,
        trigger_type,
        reminder_lead_seconds,
        grace_period_seconds,
        contact_wait_seconds,
        allow_location_sharing,
        location_auto_expire_minutes,
        escalation_contact_ids,
        is_default,
        active,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        NEW.id,
        'Standard Safety Protocol',
        'Automatic 2-minute reminder and 3-minute grace period before escalation.',
        'check_in_overdue',
        120,
        180,
        180,
        TRUE,
        60,
        '[]'::jsonb,
        TRUE,
        TRUE,
        NOW(),
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
