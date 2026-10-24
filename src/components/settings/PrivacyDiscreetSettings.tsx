import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import {
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Key,
} from 'lucide-react';

export const PrivacyDiscreetSettings: React.FC = () => {
  const { currentUser, updateUserProfile, triggerQuickExit } = useSafeSphere();

  const [pin, setPin] = useState(currentUser.discreet_exit_pin || '1234');
  const [disguise, setDisguise] = useState(currentUser.quick_exit_disguise || 'weather');
  const [lockscreenMask, setLockscreenMask] = useState(currentUser.discreet_lockscreen_mask);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      discreet_exit_pin: pin,
      quick_exit_disguise: disguise,
      discreet_lockscreen_mask: lockscreenMask,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-teal bg-brand-aqua/60 px-2.5 py-0.5 rounded-full border border-brand-teal/20">
            Feature Five • Privacy & Discreet Protection
          </span>
          <h1 className="text-2xl font-bold text-brand-text mt-1.5 flex items-center gap-2">
            Discreet Exit & Sensitive-Data Settings
          </h1>
          <p className="text-xs text-brand-muted mt-1 max-w-2xl leading-relaxed">
            Configure emergency camouflage disguises, unlock PINs, and lockscreen notification masking to prevent shoulder-surfing and protect your privacy.
          </p>
        </div>

        <button
          onClick={triggerQuickExit}
          className="px-4 py-2 bg-white hover:bg-brand-bg text-brand-text rounded-xl text-xs font-bold transition-all border border-brand-border flex items-center gap-2 shadow-xs"
        >
          <EyeOff className="w-4 h-4 text-amber-600" />
          Test Quick Exit Now
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-brand-aqua/60 border border-brand-teal/30 rounded-xl text-brand-text text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" />
          <span>Privacy preferences updated successfully.</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-brand-border rounded-2xl p-6 shadow-card space-y-6">
        {/* Quick Exit Disguise Selector */}
        <div>
          <h3 className="text-sm font-bold text-brand-text mb-1 flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-brand-teal" />
            Quick Exit Disguise Screen
          </h3>
          <p className="text-xs text-brand-muted mb-4">
            Pressing ESC or tapping the Quick Exit button instantly switches the screen to this neutral façade without cancelling your active safety session.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'weather', name: 'Weather & Agenda', desc: 'Forecast, hourly temperatures, and daily task checklist.' },
              { id: 'notes', name: 'Study Notes & Reader', desc: 'Academic article excerpts and research bibliography.' },
              { id: 'calculator', name: 'Scientific Calculator', desc: 'Standard numerical keypad and unit converter.' },
            ].map((d) => (
              <label
                key={d.id}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  disguise === d.id
                    ? 'bg-brand-aqua/40 border-brand-teal text-brand-text shadow-xs'
                    : 'bg-brand-bg border-brand-border text-brand-muted hover:border-brand-teal/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-brand-text">{d.name}</span>
                    <input
                      type="radio"
                      name="disguise"
                      value={d.id}
                      checked={disguise === d.id}
                      onChange={() => setDisguise(d.id as any)}
                      className="text-brand-teal focus:ring-brand-teal"
                    />
                  </div>
                  <p className="text-xs text-brand-muted leading-relaxed">{d.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* PIN Configuration */}
        <div className="pt-4 border-t border-brand-border">
          <h3 className="text-sm font-bold text-brand-text mb-1 flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-violet" />
            Camouflage Unlock PIN
          </h3>
          <p className="text-xs text-brand-muted mb-3">
            To resume your SafeSphere session from the disguise screen, you must enter this secure PIN. (Default is 1234).
          </p>

          <div className="max-w-xs">
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text font-mono focus:outline-none focus:border-brand-teal"
            />
          </div>
        </div>

        {/* Lockscreen Masking */}
        <div className="pt-4 border-t border-brand-border">
          <h3 className="text-sm font-bold text-brand-text mb-1 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-brand-teal" />
            Lockscreen Notification Text Masking
          </h3>
          <p className="text-xs text-brand-muted mb-3">
            Replace distress terminology with innocuous calendar appointment alerts so observers cannot see safety alerts on your phone lock screen.
          </p>

          <label className="flex items-start gap-2.5 text-xs text-brand-text cursor-pointer">
            <input
              type="checkbox"
              checked={lockscreenMask}
              onChange={(e) => setLockscreenMask(e.target.checked)}
              className="mt-0.5 rounded border-brand-border text-brand-teal focus:ring-brand-teal bg-white"
            />
            <span>
              <strong className="text-brand-text block">Mask Notification Content</strong>
              Show "Schedule Reminder: Routine activity pending" instead of "Urgent distress alert dispatched".
            </span>
          </label>
        </div>

        {/* Honest Privacy Disclaimer */}
        <div className="p-4 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-muted space-y-1">
          <p className="font-bold text-brand-text flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Security Transparency & Limitations:
          </p>
          <p className="leading-relaxed">
            SafeSphere does not claim to erase browser history, hide from device operating system process managers, or guarantee undetectability. Location data is stored only during an active safety session and automatically expires afterwards.
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal transition-all"
          >
            Save Privacy Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
