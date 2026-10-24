import React, { useState, useEffect } from 'react';
import { DigiSakhiLogo } from '@/components/common/DigiSakhiLogo';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Shield,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  Radio,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  HeartHandshake,
} from 'lucide-react';

interface InvitationDetails {
  id?: string;
  token: string;
  inviter_name: string;
  invitee_name: string;
  invitee_phone?: string;
  invitee_email?: string;
  relationship: string;
  escalation_order: number;
  status: 'pending' | 'sending' | 'sent' | 'delivered' | 'failed' | 'accepted' | 'declined' | 'expired';
  delivery_status?: string;
  expires_at: string;
}

export const InvitationResponseScreen: React.FC<{
  token?: string;
  onContinueToApp?: () => void;
}> = ({ token: propToken, onContinueToApp }) => {
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [respondedStatus, setRespondedStatus] = useState<'accepted' | 'declined' | null>(null);

  useEffect(() => {
    // Extract token from prop, query parameter, or pathname
    const urlParams = new URLSearchParams(window.location.search);
    const resolvedToken =
      propToken ||
      urlParams.get('token') ||
      window.location.pathname.replace(/^\/invite\/?/, '').trim();

    if (!resolvedToken) {
      setError('No invitation token provided in URL. Please use the link sent in your SMS.');
      setLoading(false);
      return;
    }

    setToken(resolvedToken);
    fetchInvitation(resolvedToken);
  }, [propToken]);

  const fetchInvitation = async (invToken: string) => {
    setLoading(true);
    try {
      // 1. Try local storage first if in dev/demo mode
      const rawInvs = localStorage.getItem('safesphere_db_v1_contact_invitations');
      if (rawInvs) {
        try {
          const invList: any[] = JSON.parse(rawInvs);
          const found = invList.find((i) => i.invitation_token === invToken);
          if (found) {
            setInvitation(found);
            if (found.status === 'accepted' || found.status === 'declined') {
              setRespondedStatus(found.status);
            }
            setLoading(false);
            return;
          }
        } catch {}
      }

      // 2. Fetch from backend API with query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const queryStr = urlParams.toString() ? `&${urlParams.toString()}` : '';
      const res = await fetch(`/api/invitation?token=${encodeURIComponent(invToken)}${queryStr}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setError(data.error || 'Invitation link is invalid or has expired.');
        setLoading(false);
        return;
      }

      const invData = {
        ...data.invitation,
        inviter_name: data.invitation?.inviter_name || urlParams.get('inviter') || 'Elena Rostova',
        invitee_name: data.invitation?.invitee_name || urlParams.get('name') || 'Trusted Contact',
        relationship: data.invitation?.relationship || urlParams.get('rel') || 'Primary Safety Contact',
      };

      setInvitation(invData);
      if (invData.status === 'accepted' || invData.status === 'declined') {
        setRespondedStatus(invData.status);
      }
    } catch (err: any) {
      // Network error or local offline fallback
      setError(err.message || 'Could not verify invitation token.');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (action: 'accept' | 'decline') => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Call backend API
      const res = await fetch('/api/invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      });
      const data = await res.json();

      const finalStatus: 'accepted' | 'declined' = action === 'accept' ? 'accepted' : 'declined';

      // Also update local storage in case running with local persistence
      const rawInvs = localStorage.getItem('safesphere_db_v1_contact_invitations');
      if (rawInvs) {
        try {
          const invList: any[] = JSON.parse(rawInvs);
          const updated = invList.map((i) =>
            i.invitation_token === token
              ? { ...i, status: finalStatus, delivery_status: finalStatus, responded_at: new Date().toISOString() }
              : i
          );
          localStorage.setItem('safesphere_db_v1_contact_invitations', JSON.stringify(updated));

          // Update matching contact
          const rawContacts = localStorage.getItem('safesphere_db_v1_trusted_contacts');
          if (rawContacts) {
            const contactList: any[] = JSON.parse(rawContacts);
            const targetInv = invList.find((i) => i.invitation_token === token);
            if (targetInv) {
              const updatedContacts = contactList.map((c) =>
                c.email.toLowerCase() === targetInv.invitee_email.toLowerCase() ||
                (targetInv.invitee_phone && c.phone_number === targetInv.invitee_phone)
                  ? { ...c, status: finalStatus, invitation_status: finalStatus, can_view_location: finalStatus === 'accepted' }
                  : c
              );
              localStorage.setItem('safesphere_db_v1_trusted_contacts', JSON.stringify(updatedContacts));
            }
          }
        } catch {}
      }

      setRespondedStatus(finalStatus);
      if (invitation) {
        setInvitation({ ...invitation, status: finalStatus });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit invitation response.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col items-center justify-center p-4 selection:bg-brand-teal/20">
      <div className="max-w-md w-full bg-white border border-brand-border rounded-3xl p-6 sm:p-8 shadow-elevated animate-fadeIn space-y-6">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center">
          <DigiSakhiLogo size="lg" subtitle="Personal Safety Circle Invitation" />
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-brand-muted font-medium">Verifying invitation token...</p>
          </div>
        ) : error ? (
          <div className="space-y-4 py-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-peach text-brand-coral flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-brand-text">Unable to Load Invitation</h3>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed max-w-xs mx-auto">
                {error}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => (window.location.href = '/')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-brand-text rounded-xl text-xs font-bold transition-colors"
              >
                Go to DigiSakhi Homepage
              </button>
            </div>
          </div>
        ) : respondedStatus === 'accepted' ? (
          /* Accepted State */
          <div className="space-y-5 text-center py-2 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-brand-aqua text-brand-teal flex items-center justify-center mx-auto shadow-teal/20 shadow-md">
              <CheckCircle2 className="w-9 h-9 stroke-[2.3]" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-aqua text-brand-deepTeal border border-teal-200">
                Invitation Accepted & Active
              </span>
              <h2 className="text-xl font-extrabold text-brand-text mt-2">
                You Are in {invitation?.inviter_name}'s Safety Circle
              </h2>
              <p className="text-xs text-brand-muted mt-1.5 leading-relaxed">
                Thank you for being a trusted contact. You are designated as a{' '}
                <strong className="text-brand-text font-bold">
                  Tier {invitation?.escalation_order} Responder
                </strong>
                . You will be alerted if {invitation?.inviter_name} triggers an urgent distress alert or misses an overdue check-in.
              </p>
            </div>

            <div className="p-4 bg-brand-bg border border-brand-border rounded-2xl text-left text-xs space-y-2">
              <div className="flex items-center gap-2 text-brand-teal font-bold">
                <Shield className="w-4 h-4" />
                <span>Your Responder Capabilities</span>
              </div>
              <ul className="text-[11px] text-brand-muted space-y-1.5 pl-6 list-disc">
                <li>Receive immediate emergency notifications with audio priority.</li>
                <li>View temporary live GPS route coordinates during active transit sessions.</li>
                <li>One-click acknowledgment and response coordination with other circle members.</li>
              </ul>
            </div>

            <button
              onClick={() => {
                if (onContinueToApp) onContinueToApp();
                else window.location.href = '/';
              }}
              className="w-full py-3 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <span>Continue to DigiSakhi Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : respondedStatus === 'declined' ? (
          /* Declined State */
          <div className="space-y-4 text-center py-2 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-brand-text">Invitation Declined</h3>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                You have declined the safety circle invitation from {invitation?.inviter_name}. You will not receive any emergency alerts.
              </p>
            </div>
            <button
              onClick={() => (window.location.href = '/')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-brand-text rounded-xl text-xs font-bold transition-colors"
            >
              Return to Homepage
            </button>
          </div>
        ) : (
          /* Pending Acceptance Screen */
          <div className="space-y-5 animate-fadeIn">
            {/* Invitation Details Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-tr from-brand-aqua/40 via-white to-brand-lavender/30 border border-teal-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-aqua text-brand-deepTeal border border-teal-200">
                  Tier {invitation?.escalation_order} Responder
                </span>
                <StatusBadge status="sent" />
              </div>

              <div>
                <p className="text-xs text-brand-muted">Safety circle invitation from:</p>
                <h3 className="text-lg font-extrabold text-brand-text">
                  {invitation?.inviter_name}
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">
                  Relationship: <strong className="text-brand-text">{invitation?.relationship}</strong>
                  {invitation?.invitee_phone ? ` • Phone: ${invitation.invitee_phone}` : ''}
                </p>
              </div>
            </div>

            {/* What this means */}
            <div className="space-y-3 text-xs">
              <h4 className="font-extrabold text-brand-text flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-brand-teal" />
                <span>What Being a Trusted Contact Means</span>
              </h4>

              <div className="space-y-2 text-[11px] text-brand-muted">
                <div className="p-3 bg-slate-50 border border-brand-border rounded-xl flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-brand-text block">Urgent Distress & Overdue Alerts</strong>
                    If {invitation?.inviter_name} triggers an emergency distress code or misses a transit check-in, DigiSakhi alerts you according to her safety protocol.
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-brand-border rounded-xl flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-brand-violet shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-brand-text block">Privacy-Controlled Location</strong>
                    Live GPS coordinates are only visible when she explicitly activates a safety journey or distress session. Background silent tracking is strictly prohibited.
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => handleRespond('accept')}
                disabled={isSubmitting}
                className="w-full py-3 bg-brand-teal hover:bg-brand-deepTeal disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-teal flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Confirming...' : 'Accept Invitation & Join Circle'}</span>
              </button>

              <button
                onClick={() => handleRespond('decline')}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-brand-muted hover:text-brand-text rounded-xl text-xs font-bold transition-colors"
              >
                Decline Invitation
              </button>
            </div>

            <p className="text-[10px] text-brand-muted text-center leading-relaxed">
              By accepting, you agree to receive safety alerts from {invitation?.inviter_name}. You can leave or adjust notification preferences at any time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
