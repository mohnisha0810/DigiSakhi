import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import {
  User,
  Shield,
  EyeOff,
  Bell,
  MapPin,
  Lock,
  LogOut,
  Download,
  Save,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Sliders,
  Radio,
} from 'lucide-react';
import { notificationService } from '@/lib/notifications';
import { toast } from '@/lib/toast';

export const ProfileAndSettingsScreen: React.FC = () => {
  const {
    currentUser,
    updateUserProfile,
    locationPermission,
    refreshLocation,
    signOut,
  } = useSafeSphere();

  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'permissions' | 'account'>('profile');

  // Profile Form State
  const [fullName, setFullName] = useState(currentUser.full_name || '');
  const [phone, setPhone] = useState(currentUser.phone_number || '');
  const [emergencyNotes, setEmergencyNotes] = useState(currentUser.emergency_notes || '');
  const [medicalInfo, setMedicalInfo] = useState(currentUser.medical_info || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Privacy & Camouflage State
  const [discreetMode, setDiscreetMode] = useState(currentUser.discreet_mode_enabled ?? true);
  const [disguise, setDisguise] = useState<'weather' | 'notes' | 'calculator'>(currentUser.quick_exit_disguise || 'weather');
  const [pin, setPin] = useState(currentUser.discreet_exit_pin || '1234');
  const [lockscreenMask, setLockscreenMask] = useState(currentUser.discreet_lockscreen_mask ?? true);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);

  // Notification Permission State
  const [notifPermission, setNotifPermission] = useState<string>(notificationService.getPermissionState());

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateUserProfile({
        full_name: fullName.trim(),
        phone_number: phone.trim(),
        emergency_notes: emergencyNotes.trim(),
        medical_info: medicalInfo.trim(),
      });
      toast.success('Profile and emergency information updated.');
    } catch (err: any) {
      toast.error(err.message || 'Could not save profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      toast.error('Discreet unlock PIN must be at least 4 digits.');
      return;
    }
    setIsSavingPrivacy(true);
    try {
      await updateUserProfile({
        discreet_mode_enabled: discreetMode,
        quick_exit_disguise: disguise,
        discreet_exit_pin: pin,
        discreet_lockscreen_mask: lockscreenMask,
      });
      toast.success('Privacy & camouflage settings saved.');
    } catch (err: any) {
      toast.error(err.message || 'Could not save privacy settings.');
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const handleRequestPush = async () => {
    const res = await notificationService.requestPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      toast.success('Browser push notifications enabled!');
    } else {
      toast.info('Notification permission status: ' + res);
    }
  };

  const handleExportData = () => {
    const backup = {
      user: currentUser,
      exportDate: new Date().toISOString(),
      platform: 'DigiSakhi Women Safety Platform',
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digisakhi_profile_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Account security audit trail exported.');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E8E1F3] shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#351078] bg-[#F2EDFF] px-3 py-1 rounded-full border border-[#5517C8]/20">
            Account Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#211638] mt-2 tracking-tight">
            Profile & Settings
          </h1>
          <p className="text-sm text-[#716B80] mt-1 max-w-2xl leading-relaxed">
            Manage your personal profile, discreet camouflage settings, device permissions, and security preferences.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="w-full sm:w-auto grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-[#E8E1F3] text-xs font-bold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-2.5 sm:px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-white text-[#5517C8] shadow-xs'
                : 'text-[#716B80] hover:text-[#211638]'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span className="truncate">Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-2.5 sm:px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'privacy'
                ? 'bg-white text-[#365BFF] shadow-xs'
                : 'text-[#716B80] hover:text-[#211638]'
            }`}
          >
            <EyeOff className="w-4 h-4 shrink-0" />
            <span className="truncate">Privacy & PIN</span>
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-2.5 sm:px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'permissions'
                ? 'bg-white text-[#5517C8] shadow-xs'
                : 'text-[#716B80] hover:text-[#211638]'
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span className="truncate">Permissions</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`px-2.5 sm:px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'account'
                ? 'bg-white text-[#D92D45] shadow-xs'
                : 'text-[#716B80] hover:text-[#211638]'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" />
            <span className="truncate">Security</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROFILE INFORMATION */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl p-6 border border-[#E8E1F3] shadow-card space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E1F3]">
            <div>
              <h3 className="text-lg font-extrabold text-[#211638]">Personal & Emergency Information</h3>
              <p className="text-xs text-[#716B80] mt-0.5">
                This information is shared with verified circle contacts when an urgent safety alert is triggered.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-5 py-2.5 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingProfile ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-[#211638] block mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-[#E8E1F3] rounded-xl px-3 py-2.5 text-xs font-medium text-[#211638] focus:outline-none focus:border-[#5517C8]"
              />
            </div>

            <div>
              <label className="font-bold text-[#211638] block mb-1">Contact Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-[#E8E1F3] rounded-xl px-3 py-2.5 text-xs font-medium text-[#211638] focus:outline-none focus:border-[#5517C8] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-[#211638] block mb-1">Account Email (Verified)</label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full bg-slate-100 border border-[#E8E1F3] rounded-xl px-3 py-2.5 text-xs font-medium text-[#716B80] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="font-bold text-[#211638] block mb-1">Emergency Medical Info (Blood Group / Allergies)</label>
              <input
                type="text"
                placeholder="e.g. Blood type O+, Penicillin allergy"
                value={medicalInfo}
                onChange={(e) => setMedicalInfo(e.target.value)}
                className="w-full bg-slate-50 border border-[#E8E1F3] rounded-xl px-3 py-2.5 text-xs font-medium text-[#211638] focus:outline-none focus:border-[#5517C8]"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#211638] block mb-1">
              Emergency Responder Notes (Visible to circle during active incidents)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Asthma inhaler in outer bag pocket. Front door keycard code is 4921."
              value={emergencyNotes}
              onChange={(e) => setEmergencyNotes(e.target.value)}
              className="w-full bg-slate-50 border border-[#E8E1F3] rounded-xl p-3 text-xs font-medium text-[#211638] focus:outline-none focus:border-[#5517C8] leading-relaxed"
            />
          </div>
        </form>
      )}

      {/* TAB 2: PRIVACY & DISCREET MODE */}
      {activeTab === 'privacy' && (
        <form onSubmit={handleSavePrivacy} className="bg-white rounded-2xl p-6 border border-[#E8E1F3] shadow-card space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E1F3]">
            <div>
              <h3 className="text-lg font-extrabold text-[#211638]">Privacy & Discreet Camouflage</h3>
              <p className="text-xs text-[#716B80] mt-0.5">
                Instant camouflage disguise protects you from shoulder-surfing without interrupting active safety sessions.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSavingPrivacy}
              className="px-4 py-2 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingPrivacy ? 'Saving...' : 'Save Privacy'}</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Discreet Mode Toggle */}
            <div className="p-4 rounded-xl bg-slate-50 border border-[#E8E1F3] flex items-center justify-between">
              <div>
                <span className="font-extrabold text-[#211638] text-sm block">Quick Exit Disguise Enabled (Esc Key)</span>
                <span className="text-[#716B80] text-[11px] leading-relaxed">
                  Pressing the <strong>Esc</strong> key immediately covers the screen with an innocent disguise app.
                </span>
              </div>
              <input
                type="checkbox"
                checked={discreetMode}
                onChange={(e) => setDiscreetMode(e.target.checked)}
                className="rounded border-[#E8E1F3] text-[#5517C8] focus:ring-[#5517C8] h-5 w-5 accent-[#5517C8]"
              />
            </div>

            {/* Disguise Appearance */}
            <div className="p-4 rounded-xl bg-slate-50 border border-[#E8E1F3] space-y-2">
              <label className="font-bold text-[#211638] block">Camouflage Disguise Screen</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'weather', name: 'Weather Forecast', desc: 'Daily weather planner with real temperatures' },
                  { id: 'notes', name: 'Shopping Notes', desc: 'Innocent grocery to-do checklist' },
                  { id: 'calculator', name: 'Standard Calculator', desc: 'Working math calculator keypad' },
                ].map((item) => (
                  <label
                    key={item.id}
                    onClick={() => setDisguise(item.id as any)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      disguise === item.id
                        ? 'bg-[#F2EDFF] border-[#5517C8] text-[#351078] shadow-xs'
                        : 'bg-white border-[#E8E1F3] hover:bg-slate-100 text-[#716B80]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="radio"
                        name="disguise_type"
                        checked={disguise === item.id}
                        onChange={() => setDisguise(item.id as any)}
                        className="text-[#5517C8] focus:ring-[#5517C8] accent-[#5517C8]"
                      />
                      <span className="font-bold text-xs text-[#211638]">{item.name}</span>
                    </div>
                    <p className="text-[10px] text-[#716B80] pl-5">{item.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* PIN Unlock */}
            <div className="p-4 rounded-xl bg-slate-50 border border-[#E8E1F3] space-y-2">
              <label className="font-bold text-[#211638] block">
                Discreet Unlock PIN (Minimum 4 digits)
              </label>
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-48 bg-white border border-[#E8E1F3] rounded-xl px-3 py-2 text-sm font-mono tracking-widest text-[#211638] focus:outline-none focus:border-[#5517C8]"
              />
              <p className="text-[11px] text-[#716B80]">
                Enter this PIN on the disguise screen to unlock your safety dashboard.
              </p>
            </div>

            {/* Lockscreen Masking */}
            <div className="p-4 rounded-xl bg-slate-50 border border-[#E8E1F3] flex items-center justify-between">
              <div>
                <span className="font-extrabold text-[#211638] text-sm block">Lockscreen Notification Masking</span>
                <span className="text-[#716B80] text-[11px] leading-relaxed">
                  Masks sensitive safety alerts on lockscreens as "Calendar Schedule Reminder".
                </span>
              </div>
              <input
                type="checkbox"
                checked={lockscreenMask}
                onChange={(e) => setLockscreenMask(e.target.checked)}
                className="rounded border-[#E8E1F3] text-[#5517C8] focus:ring-[#5517C8] h-5 w-5 accent-[#5517C8]"
              />
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: NOTIFICATIONS & PERMISSIONS */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-2xl p-6 border border-[#E8E1F3] shadow-card space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-lg font-extrabold text-[#211638]">Device Permissions & Alerts</h3>
            <p className="text-xs text-[#716B80] mt-0.5">
              Ensure browser push alerts and device GPS have proper authorization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Push Notifications Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-[#E8E1F3] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#5517C8]" />
                    <h4 className="font-extrabold text-[#211638] text-sm">Browser Push Notifications</h4>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      notifPermission === 'granted'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {notifPermission}
                  </span>
                </div>
                <p className="text-[#716B80] text-xs leading-relaxed">
                  Receive audible pre-deadline check-in reminders and urgent circle response notifications.
                </p>
              </div>

              {notifPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestPush}
                  className="w-full py-2.5 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Enable Push Notifications
                </button>
              )}
            </div>

            {/* Geolocation GPS Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-[#E8E1F3] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#365BFF]" />
                    <h4 className="font-extrabold text-[#211638] text-sm">Geolocation Device GPS</h4>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#F2EDFF] text-[#5517C8] border border-[#5517C8]/20">
                    {locationPermission}
                  </span>
                </div>
                <p className="text-[#716B80] text-xs leading-relaxed">
                  Used exclusively during active safety journeys and urgent SOS broadcasts. Never runs continuously in the background.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  refreshLocation(false);
                  toast.success('Querying live GPS coordinates...');
                }}
                className="w-full py-2.5 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Refresh Device GPS Fix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACCOUNT SECURITY & SIGN OUT */}
      {activeTab === 'account' && (
        <div className="bg-white rounded-2xl p-6 border border-[#E8E1F3] shadow-card space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-lg font-extrabold text-[#211638]">Account Security & Audit Trail</h3>
            <p className="text-xs text-[#716B80] mt-0.5">
              Export encrypted safety audit logs or sign out of your active session.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Account Details Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-[#E8E1F3] space-y-2">
              <span className="font-bold text-[#211638] block text-sm">Account Overview</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#716B80]">
                <div>User ID: <span className="font-mono text-[#211638]">{currentUser.id}</span></div>
                <div>Email: <span className="font-mono text-[#211638]">{currentUser.email}</span></div>
                <div>Phone: <span className="font-mono text-[#211638]">{currentUser.phone_number || 'Not configured'}</span></div>
                <div>Account Role: <span className="font-bold text-[#5517C8] capitalize">Protected User</span></div>
              </div>
            </div>

            {/* Export Audit Data */}
            <div className="p-4 rounded-xl bg-slate-50 border border-[#E8E1F3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-extrabold text-[#211638] text-sm block">Export Safety Audit Data</span>
                <span className="text-[#716B80] text-[11px]">
                  Download your encrypted historical incident timelines, check-in records, and profile details.
                </span>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                className="px-4 py-2 border border-[#E8E1F3] bg-white hover:bg-slate-50 text-[#211638] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#5517C8]" />
                <span>Export JSON</span>
              </button>
            </div>

            {/* Sign Out Card */}
            <div className="p-4 rounded-xl bg-red-50/50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-extrabold text-[#D92D45] text-sm block">Sign Out of Session</span>
                <span className="text-[#716B80] text-[11px]">
                  End your current browser session and return to the login screen.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  signOut();
                  toast.success('Signed out successfully.');
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-[#D92D45] to-[#B91C1C] hover:opacity-95 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shrink-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
