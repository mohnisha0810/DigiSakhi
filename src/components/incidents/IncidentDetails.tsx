import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { IncidentTimeline } from './IncidentTimeline';
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Users,
  PhoneCall,
  UserCheck,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export const IncidentDetails: React.FC = () => {
  const {
    selectedIncidentId,
    incidents,
    incidentRecipients,
    incidentEvents,
    currentUser,
    currentRole,
    resolveIncident,
    cancelIncident,
    acknowledgeIncident,
    indicateResponding,
    setCurrentScreen,
  } = useSafeSphere();

  const [resolutionNote, setResolutionNote] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);

  const incident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];

  if (!incident) {
    return (
      <div className="bg-white border border-brand-border rounded-2xl p-12 text-center max-w-lg mx-auto shadow-card">
        <h3 className="text-base font-bold text-brand-text">Incident Not Found</h3>
        <p className="text-xs text-brand-muted mt-1">
          No incident matching this ID was found or it may have been deleted.
        </p>
        <button
          onClick={() => setCurrentScreen(currentRole === 'user' ? 'home' : 'trusted_dashboard')}
          className="mt-4 px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-bold shadow-teal"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const recipients = incidentRecipients.filter((r) => r.incident_id === incident.id);
  const events = incidentEvents
    .filter((e) => e.incident_id === incident.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const isResolved = incident.status === 'resolved' || incident.status === 'cancelled';
  const isUrgent = incident.priority === 'urgent';

  const isOwner = incident.owner_user_id === currentUser.id;
  const isRecipient = recipients.some(
    (r) => r.contact_email === currentUser.email || r.contact_name === currentUser.full_name
  );

  const handleResolve = () => {
    resolveIncident(incident.id, resolutionNote || 'User confirmed safe.');
    setShowResolveModal(false);
    setResolutionNote('');
  };

  const handleCancel = () => {
    cancelIncident(incident.id, 'Triggered in error.');
  };

  return (
    <div className="space-y-6">
      {/* Back button & top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentScreen(currentRole === 'user' ? 'home' : 'trusted_dashboard')}
          className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {currentRole === 'user' ? 'Home' : 'Responder Console'}</span>
        </button>

        <div className="flex items-center gap-2">
          {!isResolved && isOwner && (
            <button
              onClick={() => setShowResolveModal(true)}
              className="px-3.5 py-1.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              I Am Safe • Resolve Incident
            </button>
          )}
          {!isResolved && isOwner && (
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 bg-white hover:bg-brand-bg text-brand-muted hover:text-brand-text rounded-xl text-xs font-medium border border-brand-border transition-colors shadow-xs"
            >
              Cancel Alert
            </button>
          )}
        </div>
      </div>

      {/* Main Incident Overview Card */}
      <div
        className={`rounded-2xl border p-6 shadow-card ${
          isUrgent
            ? 'bg-brand-peach/40 border-brand-coral/50 shadow-coral/10'
            : 'bg-white border-brand-border'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                isUrgent ? 'bg-brand-coral text-white animate-pulse' : 'bg-brand-aqua text-brand-teal'
              }`}
            >
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-brand-muted">
                  {incident.incident_number}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                    isUrgent
                      ? 'bg-brand-coral/15 text-brand-coral border-brand-coral/30'
                      : 'bg-brand-aqua text-brand-teal border-brand-teal/20'
                  }`}
                >
                  {incident.priority.toUpperCase()} PRIORITY
                </span>
                <span className="text-xs text-brand-muted">
                  Type: <strong className="text-brand-text capitalize">{incident.incident_type.replace('_', ' ')}</strong>
                </span>
              </div>

              <h1 className="text-2xl font-bold text-brand-text mt-1.5">
                {incident.title}
              </h1>

              <p className="text-xs text-brand-muted mt-1 max-w-2xl leading-relaxed">
                {incident.description || 'Dispatched via SafeSphere protocol.'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border inline-block capitalize ${
                incident.status === 'resolved'
                  ? 'bg-brand-aqua text-brand-teal border-brand-teal/30'
                  : incident.status === 'cancelled'
                  ? 'bg-brand-bg text-brand-muted border-brand-border'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              Status: {incident.status.replace('_', ' ')}
            </span>
            <p className="text-[11px] text-brand-muted mt-1 font-mono">
              Created: {formatDateTime(incident.created_at)}
            </p>
          </div>
        </div>

        {/* Coordination / Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-brand-border text-xs">
          <div className="p-3.5 bg-brand-bg rounded-xl border border-brand-border">
            <span className="text-[11px] text-brand-muted uppercase font-bold tracking-wider">Initiator</span>
            <p className="text-sm font-bold text-brand-text mt-1">{incident.owner_name}</p>
            <p className="text-[11px] text-brand-muted">{incident.owner_phone || 'Phone on file'}</p>
          </div>

          <div className="p-3.5 bg-brand-bg rounded-xl border border-brand-border">
            <span className="text-[11px] text-brand-muted uppercase font-bold tracking-wider">Escalation Tier</span>
            <p className="text-sm font-bold text-brand-text mt-1">Tier {incident.escalation_tier}</p>
            <p className="text-[11px] text-brand-muted">
              {recipients.length} authorized responder{recipients.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="p-3.5 bg-brand-bg rounded-xl border border-brand-border">
            <span className="text-[11px] text-brand-muted uppercase font-bold tracking-wider">Location Privacy</span>
            <p className="text-sm font-bold text-brand-text mt-1">
              {incident.location_shared ? 'Shared with Authorized Circle' : 'Sharing Disabled'}
            </p>
            <p className="text-[11px] text-brand-muted">
              {incident.location_address || 'Coordinates withheld'}
            </p>
          </div>
        </div>

        {/* Contact actions if viewer is recipient and incident is open */}
        {!isResolved && isRecipient && (
          <div className="mt-4 pt-4 border-t border-brand-border flex items-center gap-3 flex-wrap">
            <button
              onClick={() => acknowledgeIncident(incident.id, currentUser.id)}
              className="px-4 py-2 bg-brand-violet hover:bg-brand-violet/90 text-white rounded-xl text-xs font-bold transition-all shadow-violet flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Acknowledge Alert
            </button>
            <button
              onClick={() => indicateResponding(incident.id, currentUser.id, 'Responding in person')}
              className="px-4 py-2 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold transition-all shadow-teal flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              I Am Responding / En Route
            </button>
          </div>
        )}
      </div>

      {/* Authorized Recipients Table */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
        <h3 className="font-bold text-brand-text text-base mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-teal" />
          Authorized Recipients & Circle Status
        </h3>

        <div className="divide-y divide-brand-border">
          {recipients.map((r) => (
            <div key={r.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-semibold text-brand-text">
                  {r.contact_name} <span className="text-brand-muted font-normal">({r.contact_email})</span>
                </p>
                <p className="text-[11px] text-brand-muted">
                  Tier {r.escalation_tier} Escalation • Notified: {formatDateTime(r.notified_at)}
                  {r.acknowledged_at && ` • Acknowledged: ${formatDateTime(r.acknowledged_at)}`}
                </p>
                {r.response_note && (
                  <p className="text-xs text-brand-teal font-semibold mt-0.5">
                    Response Note: "{r.response_note}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                    r.is_responding
                      ? 'bg-brand-aqua text-brand-teal border border-brand-teal/30'
                      : r.status === 'acknowledged'
                      ? 'bg-brand-lavender text-brand-violet border border-brand-violet/30'
                      : 'bg-brand-bg text-brand-muted border border-brand-border'
                  }`}
                >
                  {r.is_responding ? 'Responding' : r.status}
                </span>

                {r.contact_phone && (
                  <a
                    href={`tel:${r.contact_phone}`}
                    className="p-1.5 text-brand-muted hover:text-brand-text rounded-lg hover:bg-brand-bg transition-colors"
                    title={`Call ${r.contact_name}`}
                  >
                    <PhoneCall className="w-4 h-4 text-brand-violet" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chronological Event Timeline */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-brand-text text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-teal" />
              Chronological Incident Timeline & Audit Trail
            </h3>
            <p className="text-xs text-brand-muted mt-0.5">
              Every status change, notification dispatch, acknowledgement, and escalation is permanently logged.
            </p>
          </div>
          <span className="text-xs text-brand-muted font-mono">
            {events.length} event{events.length !== 1 ? 's' : ''} logged
          </span>
        </div>

        <IncidentTimeline events={events} />
      </div>

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-brand-border rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-brand-text">Resolve Safety Incident</h3>
            <p className="text-xs text-brand-muted mt-2 leading-relaxed">
              Confirming you are safe will stop any further escalation and mark the incident as successfully resolved for your trusted contacts.
            </p>

            <div className="my-4">
              <label className="block text-xs font-semibold text-brand-text mb-1">
                Resolution Note (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Arrived home safely / False alarm"
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowResolveModal(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-brand-border text-brand-muted hover:text-brand-text text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                className="flex-1 px-4 py-2 rounded-xl bg-brand-teal hover:bg-brand-deepTeal text-white text-xs font-bold shadow-teal"
              >
                Confirm Safe & Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
