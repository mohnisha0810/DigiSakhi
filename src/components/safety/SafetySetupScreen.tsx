import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import {
  Sliders,
  Clock,
  Shield,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Users,
  MapPin,
  ChevronRight,
  ChevronDown,
  Info,
  Save,
  Radio,
  Star,
  Trash2,
} from 'lucide-react';
import { CheckInSetupModal } from '@/components/checkin/CheckInSetupModal';
import { EmergencyMessageModal } from '@/components/safety/EmergencyMessageModal';
import { EmergencyCallModal } from '@/components/safety/EmergencyCallModal';
import { SafetyProtocol } from '@/types';
import { toast } from '@/lib/toast';

interface SafetySetupScreenProps {
  defaultTab?: 'checkins' | 'protocols' | 'emergency';
}

export const SafetySetupScreen: React.FC<SafetySetupScreenProps> = ({
  defaultTab = 'checkins',
}) => {
  const {
    currentUser,
    contacts,
    protocols,
    defaultProtocol,
    saveProtocol,
    setDefaultProtocol,
    deleteProtocol,
    activeCheckIn,
    setCurrentScreen,
    updateUserProfile,
  } = useSafeSphere();

  const [activeTab, setActiveTab] = useState<'checkins' | 'protocols' | 'emergency'>(defaultTab);

  // Check-in configuration state
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [checkInsEnabled, setCheckInsEnabled] = useState(
    currentUser.check_in_preferences?.enabled ?? true
  );
  const [checkInInterval, setCheckInInterval] = useState(
    currentUser.check_in_preferences?.interval_minutes ?? 30
  );
  const [responseDeadline, setResponseDeadline] = useState(
    currentUser.check_in_preferences?.countdown_seconds
      ? Math.round(currentUser.check_in_preferences.countdown_seconds / 60)
      : 15
  );
  const [reminderLeadMinutes, setReminderLeadMinutes] = useState(2); // minutes
  const [gracePeriodSeconds, setGracePeriodSeconds] = useState(
    defaultProtocol?.grace_period_seconds ?? 180
  );
  const [savedCheckInNotice, setSavedCheckInNotice] = useState(false);

  // Protocol creation/editing state
  const [isCreatingProtocol, setIsCreatingProtocol] = useState(false);
  const [protocolName, setProtocolName] = useState('');
  const [protocolDescription, setProtocolDescription] = useState('');
  const [protocolTrigger, setProtocolTrigger] = useState<'check_in_overdue' | 'urgent_button' | 'journey_delayed' | 'custom'>('check_in_overdue');
  const [protocolGraceSeconds, setProtocolGraceSeconds] = useState(180);
  const [protocolWaitSeconds, setProtocolWaitSeconds] = useState(180);
  const [protocolAllowLocation, setProtocolAllowLocation] = useState(true);
  const [protocolLocationExpireMins, setProtocolLocationExpireMins] = useState(60);
  const [protocolSelectedContacts, setProtocolSelectedContacts] = useState<string[]>([]);

  // Emergency preferences state
  const [emergencyHelpline, setEmergencyHelpline] = useState(
    currentUser.emergency_preferences?.emergency_number || '112'
  );
  const [autoShareLocationOnSOS, setAutoShareLocationOnSOS] = useState(
    currentUser.emergency_preferences?.share_location ?? true
  );
  const [emergencySosModalOpen, setEmergencySosModalOpen] = useState(false);
  const [emergencyCallModalOpen, setEmergencyCallModalOpen] = useState(false);
  const [savedEmergencyNotice, setSavedEmergencyNotice] = useState(false);

  const acceptedContacts = contacts.filter((c) => c.status === 'accepted');

  const handleSaveCheckInPreferences = async () => {
    try {
      await updateUserProfile({
        check_in_preferences: {
          ...currentUser.check_in_preferences,
          enabled: checkInsEnabled,
          interval_minutes: checkInInterval,
          countdown_seconds: responseDeadline * 60,
        },
      });
      setSavedCheckInNotice(true);
      toast.success('Check-in preferences saved successfully.');
      setTimeout(() => setSavedCheckInNotice(false), 3000);
    } catch (err: any) {
      toast.error('Could not save check-in preferences.');
    }
  };

  const handleSaveEmergencyPreferences = async () => {
    try {
      await updateUserProfile({
        emergency_preferences: {
          ...currentUser.emergency_preferences,
          emergency_number: emergencyHelpline,
          share_location: autoShareLocationOnSOS,
        },
      });
      setSavedEmergencyNotice(true);
      toast.success('Emergency preferences updated.');
      setTimeout(() => setSavedEmergencyNotice(false), 3000);
    } catch (err: any) {
      toast.error('Could not save emergency preferences.');
    }
  };

  const handleCreateProtocolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!protocolName.trim()) {
      toast.error('Please enter a protocol name.');
      return;
    }

    try {
      await saveProtocol({
        user_id: currentUser.id,
        name: protocolName.trim(),
        description: protocolDescription.trim() || 'Custom safety escalation protocol.',
        trigger_type: protocolTrigger,
        reminder_lead_seconds: 120,
        grace_period_seconds: protocolGraceSeconds,
        contact_wait_seconds: protocolWaitSeconds,
        allow_location_sharing: protocolAllowLocation,
        location_auto_expire_minutes: protocolLocationExpireMins,
        escalation_contact_ids: protocolSelectedContacts.length > 0
          ? protocolSelectedContacts
          : acceptedContacts.map((c) => c.id),
        is_default: protocols.length === 0,
        active: true,
      });

      setIsCreatingProtocol(false);
      setProtocolName('');
      setProtocolDescription('');
      toast.success('New safety protocol saved.');
    } catch (err: any) {
      toast.error(err.message || 'Could not save protocol.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E8E1F3] shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#351078] bg-[#F2EDFF] px-3 py-1 rounded-full border border-[#5517C8]/20">
            Safety Setup & Rules
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#211638] mt-2 tracking-tight">
            Safety Setup
          </h1>
          <p className="text-sm text-[#716B80] mt-1 max-w-2xl leading-relaxed">
            Centralized safety controls. Configure timed check-ins, automated escalation protocols, and emergency broadcast preferences in one unified place.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="w-full sm:w-auto grid grid-cols-3 sm:flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-[#E8E1F3] text-xs font-bold">
          <button
            onClick={() => setActiveTab('checkins')}
            className={`px-2 sm:px-3.5 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'checkins'
                ? 'bg-white text-[#5517C8] shadow-xs'
                : 'text-[#716B80] hover:text-[#211638]'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span className="truncate">A. Check-ins</span>
          </button>

          <button
            onClick={() => setActiveTab('protocols')}
            className={`px-2 sm:px-3.5 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'protocols'
                ? 'bg-white text-[#365BFF] shadow-xs'
                : 'text-[#716B80] hover:text-[#211638]'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span className="truncate">B. Protocols</span>
          </button>

          <button
            onClick={() => setActiveTab('emergency')}
            className={`px-2 sm:px-3.5 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'emergency'
                ? 'bg-white text-[#D92D45] shadow-xs'
                : 'text-[#716B80] hover:text-[#211638]'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span className="truncate">C. Emergency</span>
          </button>
        </div>
      </div>

      {/* SUBSECTION A: SAFETY CHECK-INS */}
      {activeTab === 'checkins' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Active Check-in Alert if running */}
          {activeCheckIn && (
            <div className="p-4 bg-[#F2EDFF] border border-[#5517C8]/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#5517C8] animate-spin-slow shrink-0" />
                <div>
                  <strong className="text-[#351078] block text-sm font-bold">
                    Active Safety Check-in Timer Running ({activeCheckIn.title})
                  </strong>
                  <span className="text-[#716B80]">
                    Deadline: {new Date(activeCheckIn.deadline_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCurrentScreen('home')}
                className="px-3.5 py-1.5 bg-gradient-to-r from-[#5517C8] to-[#365BFF] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                View on Home
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 border border-[#E8E1F3] shadow-card space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E8E1F3]">
              <div>
                <h3 className="text-lg font-extrabold text-[#211638]">
                  Automated Check-in Preferences
                </h3>
                <p className="text-xs text-[#716B80] mt-0.5">
                  Configure interval timers and grace buffer before alerts escalate to your circle.
                </p>
              </div>

              <button
                onClick={() => setIsCheckInModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Start a Check-in Now</span>
              </button>
            </div>

            {/* Check-in Settings Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Enable / Disable */}
              <div className="p-4 rounded-xl bg-slate-50 border border-[#E8E1F3] space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-extrabold text-[#211638] text-sm block">
                      Enable Periodic Safety Check-ins
                    </span>
                    <span className="text-[#716B80] text-[11px] leading-relaxed">
                      Automatically prompt for safety confirmations during active sessions.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={checkInsEnabled}
                    onChange={(e) => setCheckInsEnabled(e.target.checked)}
                    className="rounded border-[#E8E1F3] text-[#5517C8] focus:ring-[#5517C8] h-5 w-5 accent-[#5517C8]"
                  />
                </label>
              </div>

              {/* Default Interval */}
              <div className="p-4 rounded-xl bg-slate-50 border border-[#E8E1F3] space-y-2">
                <label className="font-bold text-[#211638] block">
                  Default Check-in Interval
                </label>
                <select
                  value={checkInInterval}
                  onChange={(e) => setCheckInInterval(Number(e.target.value))}
                  className="w-full bg-white border border-[#E8E1F3] rounded-xl px-3 py-2 text-xs font-medium text-[#211638] focus:outline-none focus:border-[#5517C8]"
                >
                  <option value={15}>15 Minutes (Short transit or quick walks)</option>
                  <option value={30}>30 Minutes (Recommended for city transit)</option>
                  <option value={45}>45 Minutes (Extended commutes)</option>
                  <option value={60}>60 Minutes (Long travel journeys)</option>
                </select>
                <p className="text-[11px] text-[#716B80]">
                  How often DigiSakhi prompts you to confirm you are safe.
                </p>
              </div>

              {/* Response Deadline */}
              <div className="p-4 rounded-xl bg-slate-50 border border-[#E8E1F3] space-y-2">
                <label className="font-bold text-[#211638] block">
                  Response Window Deadline
                </label>
                <select
                  value={responseDeadline}
                  onChange={(e) => setResponseDeadline(Number(e.target.value))}
                  className="w-full bg-white border border-[#E8E1F3] rounded-xl px-3 py-2 text-xs font-medium text-[#211638] focus:outline-none focus:border-[#5517C8]"
                >
                  <option value={5}>5 Minutes</option>
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes (Standard)</option>
                  <option value={30}>30 Minutes</option>
                </select>
                <p className="text-[11px] text-[#716B80]">
                  Amount of time allowed to tap "I am Safe" before entering the grace period.
                </p>
              </div>

              {/* Grace Period Buffer */}
              <div className="p-4 rounded-xl bg-slate-50 border border-[#E8E1F3] space-y-2">
                <label className="font-bold text-[#211638] block">
                  Overdue Grace Period Buffer
                </label>
                <select
                  value={gracePeriodSeconds}
                  onChange={(e) => setGracePeriodSeconds(Number(e.target.value))}
                  className="w-full bg-white border border-[#E8E1F3] rounded-xl px-3 py-2 text-xs font-medium text-[#211638] focus:outline-none focus:border-[#5517C8]"
                >
                  <option value={120}>2 Minutes (120 seconds)</option>
                  <option value={180}>3 Minutes (180 seconds • Recommended)</option>
                  <option value={300}>5 Minutes (300 seconds)</option>
                </select>
                <p className="text-[11px] text-[#716B80]">
                  Critical safety buffer: Prevents accidental false alarms by providing reminder prompts before escalating.
                </p>
              </div>
            </div>

            {/* Escalation behavior explanation */}
            <div className="p-4 bg-[#F2EDFF]/60 border border-[#5517C8]/20 rounded-2xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#351078]">
                <Info className="w-4 h-4 text-[#5517C8] shrink-0" />
                <span>What Happens After a Missed Check-in?</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[#211638] text-[11px] pl-1 leading-relaxed">
                <li>
                  <strong>Deadline passes:</strong> Check-in enters <em>Grace Period</em>. You receive an audible device reminder.
                </li>
                <li>
                  <strong>Grace expires:</strong> Automatically escalates to your <strong>Tier 1 Contact</strong> with location fix and logs a traceable incident.
                </li>
                <li>
                  <strong>Wait window elapses:</strong> If Tier 1 does not acknowledge, automatically advances to <strong>Tier 2 Contact</strong>.
                </li>
              </ol>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E8E1F3]">
              <span className="text-[11px] text-[#716B80]">
                {savedCheckInNotice ? 'Preferences saved to your active profile.' : ''}
              </span>
              <button
                type="button"
                onClick={handleSaveCheckInPreferences}
                className="px-5 py-2.5 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Check-in Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBSECTION B: SAFETY PROTOCOLS */}
      {activeTab === 'protocols' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 border border-[#E8E1F3] shadow-card space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E8E1F3]">
              <div>
                <h3 className="text-lg font-extrabold text-[#211638]">
                  Safety Protocols & Escalation Rules
                </h3>
                <p className="text-xs text-[#716B80] mt-0.5">
                  Protocols govern the exact timing, notification channels, and contact order when an incident escalates.
                </p>
              </div>

              {!isCreatingProtocol && (
                <button
                  onClick={() => setIsCreatingProtocol(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Protocol</span>
                </button>
              )}
            </div>

            {/* Protocol Creation Form */}
            {isCreatingProtocol && (
              <form onSubmit={handleCreateProtocolSubmit} className="p-5 bg-slate-50 border border-[#E8E1F3] rounded-2xl space-y-4 text-xs animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-[#E8E1F3]">
                  <h4 className="font-extrabold text-[#211638] text-sm">Create New Safety Protocol</h4>
                  <button
                    type="button"
                    onClick={() => setIsCreatingProtocol(false)}
                    className="text-[#716B80] hover:text-[#211638] font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-[#211638] block mb-1">Protocol Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Night Commute Protocol"
                      value={protocolName}
                      onChange={(e) => setProtocolName(e.target.value)}
                      className="w-full bg-white border border-[#E8E1F3] rounded-xl px-3 py-2 text-xs font-medium text-[#211638] focus:outline-none focus:border-[#5517C8]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#211638] block mb-1">Trigger Condition</label>
                    <select
                      value={protocolTrigger}
                      onChange={(e) => setProtocolTrigger(e.target.value as any)}
                      className="w-full bg-white border border-[#E8E1F3] rounded-xl px-3 py-2 text-xs font-medium text-[#211638] focus:outline-none focus:border-[#5517C8]"
                    >
                      <option value="check_in_overdue">Check-in Overdue Expiry</option>
                      <option value="urgent_button">Direct SOS Button Press</option>
                      <option value="journey_delayed">Journey Delayed Expiry</option>
                      <option value="custom">Custom Safety Trigger</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#211638] block mb-1">Short Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Rapid 2-minute escalation for evening solo transit"
                    value={protocolDescription}
                    onChange={(e) => setProtocolDescription(e.target.value)}
                    className="w-full bg-white border border-[#E8E1F3] rounded-xl px-3 py-2 text-xs font-medium text-[#211638] focus:outline-none focus:border-[#5517C8]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-[#211638] block mb-1">Grace Period Buffer</label>
                    <select
                      value={protocolGraceSeconds}
                      onChange={(e) => setProtocolGraceSeconds(Number(e.target.value))}
                      className="w-full bg-white border border-[#E8E1F3] rounded-xl px-3 py-2 text-xs font-medium text-[#211638] focus:outline-none focus:border-[#5517C8]"
                    >
                      <option value={120}>2 Minutes (120s)</option>
                      <option value={180}>3 Minutes (180s)</option>
                      <option value={300}>5 Minutes (300s)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#211638] block mb-1">Contact Wait Window</label>
                    <select
                      value={protocolWaitSeconds}
                      onChange={(e) => setProtocolWaitSeconds(Number(e.target.value))}
                      className="w-full bg-white border border-[#E8E1F3] rounded-xl px-3 py-2 text-xs font-medium text-[#211638] focus:outline-none focus:border-[#5517C8]"
                    >
                      <option value={120}>2 Minutes</option>
                      <option value={180}>3 Minutes</option>
                      <option value={300}>5 Minutes</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#211638] block mb-1">Location Auto-Expire</label>
                    <select
                      value={protocolLocationExpireMins}
                      onChange={(e) => setProtocolLocationExpireMins(Number(e.target.value))}
                      className="w-full bg-white border border-[#E8E1F3] rounded-xl px-3 py-2 text-xs font-medium text-[#211638] focus:outline-none focus:border-[#5517C8]"
                    >
                      <option value={30}>30 Minutes</option>
                      <option value={60}>60 Minutes (1 Hour)</option>
                      <option value={120}>120 Minutes (2 Hours)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Safety Protocol</span>
                  </button>
                </div>
              </form>
            )}

            {/* List of Existing Protocols */}
            <div className="space-y-3">
              {protocols.map((protocol) => {
                const isDefault = protocol.is_default || protocol.id === defaultProtocol?.id;

                return (
                  <div
                    key={protocol.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isDefault
                        ? 'bg-[#F2EDFF]/40 border-[#5517C8]/40 shadow-xs'
                        : 'bg-white border-[#E8E1F3] hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <Sliders className={`w-4 h-4 ${isDefault ? 'text-[#5517C8]' : 'text-[#716B80]'}`} />
                        <h4 className="font-extrabold text-[#211638] text-sm">{protocol.name}</h4>
                        {isDefault && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#5517C8] text-white">
                            Default Protocol
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isDefault && (
                          <button
                            type="button"
                            onClick={() => setDefaultProtocol(protocol.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#5517C8] border border-[#5517C8]/30 hover:bg-[#F2EDFF] transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5" />
                            <span>Set as Default</span>
                          </button>
                        )}

                        {protocols.length > 1 && (
                          <button
                            type="button"
                            onClick={() => deleteProtocol(protocol.id)}
                            className="p-1.5 text-[#716B80] hover:text-[#D92D45] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove protocol"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[#716B80] mb-3 leading-relaxed">
                      {protocol.description}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-medium text-[#211638] pt-2 border-t border-[#E8E1F3]">
                      <div>
                        <span className="text-[#716B80] block text-[10px] uppercase">Grace Period</span>
                        <span className="font-bold">{protocol.grace_period_seconds} seconds</span>
                      </div>
                      <div>
                        <span className="text-[#716B80] block text-[10px] uppercase">Contact Wait</span>
                        <span className="font-bold">{protocol.contact_wait_seconds} seconds</span>
                      </div>
                      <div>
                        <span className="text-[#716B80] block text-[10px] uppercase">GPS Sharing</span>
                        <span className="font-bold">{protocol.allow_location_sharing ? 'Enabled' : 'Disabled'}</span>
                      </div>
                      <div>
                        <span className="text-[#716B80] block text-[10px] uppercase">Auto-Expires</span>
                        <span className="font-bold">{protocol.location_auto_expire_minutes} minutes</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBSECTION C: EMERGENCY PREFERENCES */}
      {activeTab === 'emergency' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 border border-[#E8E1F3] shadow-card space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E8E1F3]">
              <div>
                <h3 className="text-lg font-extrabold text-[#211638]">
                  Emergency Numbers & SOS Broadcast Preferences
                </h3>
                <p className="text-xs text-[#716B80] mt-0.5">
                  Configure default helpline destinations, live location broadcast permissions, and circle responders.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEmergencySosModalOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-[#D92D45] to-[#B91C1C] hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>Test SOS Modal</span>
                </button>

                <button
                  onClick={() => setEmergencyCallModalOpen(true)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-red-400" />
                  <span>Test Dialer</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Emergency Helpline Choice */}
              <div className="p-4 rounded-xl bg-slate-50 border border-[#E8E1F3] space-y-2">
                <label className="font-bold text-[#211638] block">
                  Default Emergency Calling Destination
                </label>
                <select
                  value={emergencyHelpline}
                  onChange={(e) => setEmergencyHelpline(e.target.value)}
                  className="w-full bg-white border border-[#E8E1F3] rounded-xl px-3 py-2 text-xs font-medium text-[#211638] focus:outline-none focus:border-[#5517C8]"
                >
                  <option value="112">112 (National Emergency Helpline • India All-in-One)</option>
                  <option value="1091">1091 (Women's Safety & Distress Helpline)</option>
                  <option value="100">100 (Police Direct Control Room)</option>
                  <option value="primary_contact">Primary Trusted Contact (Circle Tier 1)</option>
                </select>
                <p className="text-[11px] text-[#716B80]">
                  The primary number invoked when pressing the Emergency Call button.
                </p>
              </div>

              {/* Location Sharing in SOS */}
              <div className="p-4 rounded-xl bg-slate-50 border border-[#E8E1F3] space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-extrabold text-[#211638] text-sm block">
                      Include Live GPS in Emergency SOS
                    </span>
                    <span className="text-[#716B80] text-[11px] leading-relaxed">
                      Embeds a direct Google Maps link in your WhatsApp/SMS emergency alerts.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoShareLocationOnSOS}
                    onChange={(e) => setAutoShareLocationOnSOS(e.target.checked)}
                    className="rounded border-[#E8E1F3] text-[#D92D45] focus:ring-[#D92D45] h-5 w-5 accent-[#D92D45]"
                  />
                </label>
              </div>
            </div>

            {/* Circle Responders Summary */}
            <div className="p-4 bg-slate-50 border border-[#E8E1F3] rounded-2xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#211638] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#5517C8]" />
                  <span>Circle Responders Authorized to Receive Emergency SOS Alerts</span>
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('circle')}
                  className="text-[#5517C8] font-bold hover:underline cursor-pointer"
                >
                  Manage in Circle →
                </button>
              </div>

              {acceptedContacts.length === 0 ? (
                <p className="text-[#716B80] text-[11px]">
                  No verified contacts yet. Add contacts in Trusted Circle to configure alert recipients.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {acceptedContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-2.5 bg-white border border-[#E8E1F3] rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#211638]">{contact.full_name}</p>
                        <p className="text-[10px] text-[#716B80] font-mono">{contact.phone_number}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#F2EDFF] text-[#5517C8] border border-[#5517C8]/20">
                        Tier {contact.escalation_order}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E8E1F3]">
              <span className="text-[11px] text-[#716B80]">
                {savedEmergencyNotice ? 'Emergency preferences updated.' : ''}
              </span>
              <button
                type="button"
                onClick={handleSaveEmergencyPreferences}
                className="px-5 py-2.5 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Emergency Preferences</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connected Modals */}
      <CheckInSetupModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
      />
      <EmergencyMessageModal
        isOpen={emergencySosModalOpen}
        onClose={() => setEmergencySosModalOpen(false)}
      />
      <EmergencyCallModal
        isOpen={emergencyCallModalOpen}
        onClose={() => setEmergencyCallModalOpen(false)}
      />
    </div>
  );
};
