import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import {
  ShieldAlert,
  UserCheck,
  PhoneCall,
  CheckCircle2,
  MapPin,
  Radio,
  ChevronRight,
  ShieldCheck,
  Send,
  Compass,
  Lock,
} from 'lucide-react';
import { formatDateTime, formatTimeOnly, calculateDistanceMeters } from '@/lib/utils';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';

export const TrustedDashboard: React.FC = () => {
  const {
    currentUser,
    incidents,
    incidentRecipients,
    journeys,
    activeLocationShare,
    acknowledgeIncident,
    indicateResponding,
    resolveIncident,
    openIncidentDetails,
    setCurrentScreen,
    currentLocation,
  } = useSafeSphere();

  const [customNote, setCustomNote] = useState<Record<string, string>>({});
  const [showNoteInput, setShowNoteInput] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');

  // Active Journey in Circle
  const circleActiveJourney = journeys.find(
    (j) => j.status !== 'completed' && j.status !== 'cancelled'
  );

  // Check if current contact is authorized to view journey coordinates
  const isAuthorizedForLocation =
    circleActiveJourney?.share_location &&
    (!activeLocationShare ||
      activeLocationShare.allowed_contact_ids.length === 0 ||
      activeLocationShare.allowed_contact_ids.includes(currentUser.id) ||
      activeLocationShare.allowed_contact_ids.includes('tc_maya_01') ||
      currentUser.id === 'usr_maya_02');

  // Filter incidents assigned to this contact or visible to circle
  const myAssignedIncidents = incidents.filter((inc) => {
    const recipients = incidentRecipients.filter((r) => r.incident_id === inc.id);
    const isRecipient = recipients.some(
      (r) => r.contact_email.toLowerCase() === currentUser.email.toLowerCase() || r.contact_name === currentUser.full_name
    );
    return isRecipient || inc.owner_user_id !== currentUser.id;
  });

  const activeIncidents = myAssignedIncidents.filter(
    (inc) => inc.status !== 'resolved' && inc.status !== 'cancelled'
  );
  const resolvedIncidents = myAssignedIncidents.filter(
    (inc) => inc.status === 'resolved' || inc.status === 'cancelled'
  );

  const displayedIncidents = activeTab === 'active' ? activeIncidents : resolvedIncidents;

  const handleRespondWithNote = async (incidentId: string, note?: string) => {
    const finalNote = note || customNote[incidentId] || 'En route to support user';
    await indicateResponding(incidentId, currentUser.id, finalNote);
    setShowNoteInput((prev) => ({ ...prev, [incidentId]: false }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-teal bg-brand-aqua/60 px-2.5 py-0.5 rounded-full border border-brand-teal/20">
              Trusted Responder Console
            </span>
            <span className="text-xs text-brand-muted">
              Logged in as: <strong className="text-brand-text font-semibold">{currentUser.full_name}</strong>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-brand-text mt-1.5 flex items-center gap-2">
            Emergency & Distress Circle Console
          </h1>
          <p className="text-xs text-brand-muted mt-1 max-w-2xl leading-relaxed">
            You are authorized in this personal safety circle to receive distress alerts, acknowledge receipt, coordinate response with other circle members, and view privacy-controlled location data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-brand-bg px-4 py-2.5 rounded-xl border border-brand-border text-center shadow-xs">
            <p className="text-[10px] uppercase text-brand-muted font-bold tracking-wider">Active Alerts</p>
            <p className={`text-2xl font-bold ${activeIncidents.length > 0 ? 'text-brand-coral animate-pulse' : 'text-brand-text'}`}>
              {activeIncidents.length}
            </p>
          </div>
        </div>
      </div>

      {/* Monitored Journey in Progress in Circle */}
      {circleActiveJourney && (
        <div className="bg-gradient-to-r from-brand-lavender/40 via-white to-white border border-brand-violet/25 rounded-2xl p-5 shadow-card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-violet/10 text-brand-violet flex items-center justify-center shadow-xs">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-brand-text text-sm">Monitored Journey in Progress</h3>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-brand-violet/10 text-brand-violet border border-brand-violet/20">
                    Safe Arrival Monitored
                  </span>
                </div>
                <p className="text-xs text-brand-muted mt-0.5">
                  Elena is en route to: <strong className="text-brand-text">{circleActiveJourney.destination_name}</strong>
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] uppercase text-brand-muted font-bold tracking-wider">Expected Arrival</p>
              <p className="text-sm font-mono font-bold text-brand-text">
                {formatTimeOnly(circleActiveJourney.expected_arrival_time)}
              </p>
            </div>
          </div>

          {/* Location & Authorization state */}
          <div className="p-3.5 bg-brand-bg border border-brand-border rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            {isAuthorizedForLocation ? (
              <div className="flex items-center gap-2 text-brand-text">
                <span className="w-2 h-2 rounded-full bg-brand-teal animate-ping" />
                <span>
                  Live GPS Shared • Safe Radius:{' '}
                  <strong className="text-brand-teal">{circleActiveJourney.safe_radius_meters}m</strong>
                </span>
                {circleActiveJourney.current_lat && circleActiveJourney.current_lng && (
                  <span className="text-brand-muted">
                    (Distance: ~{calculateDistanceMeters(
                      circleActiveJourney.current_lat,
                      circleActiveJourney.current_lng,
                      circleActiveJourney.dest_lat,
                      circleActiveJourney.dest_lng
                    )}m)
                  </span>
                )}
                {currentLocation?.isStale && (
                  <span className="text-amber-600 font-semibold">• ⚠️ GPS Stale (&gt;2m)</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-brand-muted">
                <Lock className="w-3.5 h-3.5 text-brand-muted" />
                <span>
                  {circleActiveJourney.share_location
                    ? 'Coordinates hidden by user privacy protocol for this session.'
                    : 'Manual check-in mode: Elena has not enabled live coordinate broadcasting.'}
                </span>
              </div>
            )}

            <button
              onClick={() => setCurrentScreen('journeys')}
              className="text-xs text-brand-violet hover:text-brand-violet/80 font-semibold px-3 py-1.5 rounded-lg bg-white border border-brand-border flex items-center gap-1 shadow-xs transition-colors"
            >
              <span>View Map</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-brand-border pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'active'
              ? 'bg-brand-teal text-white shadow-teal'
              : 'text-brand-muted hover:text-brand-text bg-white border border-brand-border'
          }`}
        >
          <span>Active Alerts</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-brand-bg text-brand-muted'}`}>
            {activeIncidents.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'resolved'
              ? 'bg-brand-teal text-white shadow-teal'
              : 'text-brand-muted hover:text-brand-text bg-white border border-brand-border'
          }`}
        >
          <span>Past Resolved</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'resolved' ? 'bg-white/20 text-white' : 'bg-brand-bg text-brand-muted'}`}>
            {resolvedIncidents.length}
          </span>
        </button>
      </div>

      {/* Empty State */}
      {displayedIncidents.length === 0 && (
        <EmptyState
          icon={ShieldCheck}
          title="All Clear in Safety Circle"
          description={
            activeTab === 'active'
              ? 'No active distress alerts or overdue check-ins currently require your attention. You will be alerted immediately if a session escalates.'
              : 'No resolved incidents recorded in this session.'
          }
        />
      )}

      {/* Incidents List */}
      <div className="space-y-4">
        {displayedIncidents.map((incident) => {
          const recipients = incidentRecipients.filter((r) => r.incident_id === incident.id);
          const myRecipientRecord = recipients.find(
            (r) => r.contact_email.toLowerCase() === currentUser.email.toLowerCase() || r.contact_name === currentUser.full_name
          );
          const hasAcknowledged =
            myRecipientRecord?.status === 'acknowledged' ||
            myRecipientRecord?.status === 'responding' ||
            incident.status === 'acknowledged' ||
            incident.status === 'responding';
          const isResponding = myRecipientRecord?.is_responding || incident.status === 'responding';

          const isUrgent = incident.priority === 'urgent';

          return (
            <div
              key={incident.id}
              className={`rounded-2xl border p-6 transition-all shadow-card ${
                isUrgent
                  ? 'bg-brand-peach/40 border-brand-coral/50 shadow-coral/10'
                  : 'bg-white border-brand-border'
              }`}
            >
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      isUrgent
                        ? 'bg-brand-coral text-white animate-pulse'
                        : 'bg-brand-aqua text-brand-teal'
                    }`}
                  >
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-brand-muted">
                        {incident.incident_number}
                      </span>
                      <StatusBadge status={incident.priority} />
                      <span className="text-xs text-brand-muted font-mono">
                        {formatDateTime(incident.created_at)}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-brand-text mt-1">
                      {incident.title}
                    </h3>
                    <p className="text-xs text-brand-muted mt-1 max-w-2xl leading-relaxed">
                      {incident.description || 'No additional note provided.'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <StatusBadge status={incident.status} size="md" />
                </div>
              </div>

              {/* Responder Coordination Box */}
              <div className="bg-brand-bg border border-brand-border rounded-xl p-4 my-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-brand-teal" />
                    <span className="text-brand-text font-bold">Circle Coordination:</span>
                  </div>
                  <span className="text-[11px] text-brand-muted font-medium">
                    Tier {incident.escalation_tier} Escalation Active
                  </span>
                </div>

                {/* Other circle members status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {recipients.map((r) => (
                    <div
                      key={r.id}
                      className="p-2.5 rounded-lg bg-white border border-brand-border flex items-center justify-between shadow-xs"
                    >
                      <div>
                        <p className="font-semibold text-brand-text">
                          {r.contact_name}{' '}
                          {r.contact_email.toLowerCase() === currentUser.email.toLowerCase() ? '(You)' : ''}
                        </p>
                        <p className="text-[10px] text-brand-muted">
                          Tier {r.escalation_tier} Responder
                          {r.response_note ? ` • "${r.response_note}"` : ''}
                        </p>
                      </div>
                      <StatusBadge status={r.is_responding ? 'responding' : r.status} />
                    </div>
                  ))}
                </div>

                {/* Location snippet if permitted */}
                {incident.location_shared && incident.location_address && (
                  <div className="pt-2 border-t border-brand-border flex items-center justify-between text-xs text-brand-text">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-teal" />
                      <span>
                        Location: <strong className="text-brand-text font-bold">{incident.location_address}</strong>
                      </span>
                      {incident.is_demo_location && (
                        <span className="text-[10px] bg-brand-bg text-brand-muted px-1.5 py-0.2 rounded border border-brand-border font-mono">
                          Demo Coords
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setCurrentScreen('journeys')}
                      className="text-xs text-brand-teal hover:text-brand-deepTeal font-bold underline"
                    >
                      View on Map
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons for Contact */}
              {incident.status !== 'resolved' && incident.status !== 'cancelled' && (
                <div className="space-y-3 pt-3 border-t border-brand-border">
                  {/* Response note input toggle */}
                  {showNoteInput[incident.id] && (
                    <div className="p-3 bg-white border border-brand-teal/30 rounded-xl space-y-2 text-xs shadow-xs">
                      <label className="block text-brand-text font-medium">
                        Response update for circle (visible to Elena & other contacts):
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. On my way to the station / Calling Elena directly"
                          value={customNote[incident.id] || ''}
                          onChange={(e) =>
                            setCustomNote((prev) => ({ ...prev, [incident.id]: e.target.value }))
                          }
                          className="flex-1 bg-brand-bg border border-brand-border rounded-lg px-3 py-1.5 text-brand-text focus:outline-none focus:border-brand-teal text-xs"
                        />
                        <button
                          onClick={() => handleRespondWithNote(incident.id)}
                          className="px-3 py-1.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-lg font-bold flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send
                        </button>
                      </div>

                      {/* Quick preset buttons */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] text-brand-muted">
                        <span>Quick presets:</span>
                        {['On my way', 'Calling user directly', 'Contacted building security'].map(
                          (preset) => (
                            <button
                              key={preset}
                              onClick={() => handleRespondWithNote(incident.id, preset)}
                              className="px-2 py-0.5 rounded bg-brand-bg hover:bg-brand-lavender/40 border border-brand-border text-brand-text hover:text-brand-violet transition-colors"
                            >
                              {preset}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Step 1: Acknowledge */}
                      {!hasAcknowledged ? (
                        <button
                          onClick={() => acknowledgeIncident(incident.id, currentUser.id)}
                          className="px-4 py-2 bg-brand-violet hover:bg-brand-violet/90 text-white rounded-xl text-xs font-bold shadow-violet transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Acknowledge Alert (I Am Aware)
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-xs text-brand-teal bg-brand-aqua/50 border border-brand-teal/20 px-3 py-1.5 rounded-xl font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal" />
                          <span>You Acknowledged This Alert</span>
                        </div>
                      )}

                      {/* Step 2: Indicate Responding */}
                      {!isResponding ? (
                        <button
                          onClick={() =>
                            setShowNoteInput((prev) => ({
                              ...prev,
                              [incident.id]: !prev[incident.id],
                            }))
                          }
                          className="px-4 py-2 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal transition-all flex items-center gap-1.5"
                        >
                          <UserCheck className="w-4 h-4" />
                          I Am Responding / En Route
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-xs text-brand-teal bg-brand-aqua/80 border border-brand-teal/40 px-3 py-1.5 rounded-xl font-bold">
                          <Radio className="w-3.5 h-3.5 text-brand-teal animate-pulse" />
                          <span>You Are Actively Responding</span>
                        </div>
                      )}

                      {/* Direct Call Button (Phone link) */}
                      {incident.owner_phone && (
                        <a
                          href={`tel:${incident.owner_phone}`}
                          className="px-3 py-2 bg-brand-bg hover:bg-brand-border/40 text-brand-text rounded-xl text-xs font-medium border border-brand-border transition-colors flex items-center gap-1.5"
                          title="Open device telephone dialer. DigiSakhi does not falsely claim the call connected."
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-brand-violet" />
                          <span>Call {incident.owner_name} ({incident.owner_phone})</span>
                        </a>
                      )}

                      {/* Contact Resolution Control */}
                      <button
                        onClick={() => resolveIncident(incident.id, `Confirmed safe by responder ${currentUser.full_name}`)}
                        className="px-3 py-2 bg-brand-bg hover:bg-brand-aqua/40 text-brand-teal hover:text-brand-deepTeal rounded-xl text-xs font-bold border border-brand-border transition-colors flex items-center gap-1"
                        title="Mark incident as resolved once you have confirmed safety"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </button>
                    </div>

                    {/* Incident Details & Timeline Link */}
                    <button
                      onClick={() => openIncidentDetails(incident.id)}
                      className="text-xs text-brand-muted hover:text-brand-text px-3 py-1.5 rounded-lg bg-brand-bg border border-brand-border flex items-center gap-1 transition-colors"
                    >
                      <span>Full Incident Timeline</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
