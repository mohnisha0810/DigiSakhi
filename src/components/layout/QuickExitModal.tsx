import React, { useState, useEffect } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import {
  CloudSun,
  Calendar,
  CheckCircle2,
  Lock,
  Search,
  Droplets,
  Wind,
  Sun,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export const QuickExitModal: React.FC = () => {
  const {
    isQuickExitActive,
    unlockQuickExit,
    activeIncident,
    activeCheckIn,
    activeJourney,
  } = useSafeSphere();

  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);

  // Listen for ESC key shortcut to trigger or toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isQuickExitActive) {
        setShowPinInput(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickExitActive]);

  if (!isQuickExitActive) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockQuickExit(pin)) {
      setPin('');
      setPinError(false);
      setShowPinInput(false);
    } else {
      setPinError(true);
      setPin('');
    }
  };

  const hasActiveSession = Boolean(activeIncident || activeCheckIn || activeJourney);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-slate-100 flex flex-col font-sans select-none overflow-y-auto">
      {/* Top Disguise Header */}
      <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            onClick={() => setShowPinInput(true)}
            className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center cursor-pointer hover:bg-amber-500/30 transition-colors"
            title="Double-click to unlock DigiSakhi"
          >
            <CloudSun className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-100 text-base">Metro Weather & Daily Planner</h1>
            <p className="text-xs text-slate-400">San Francisco Bay Area • 68°F Partly Cloudy</p>
          </div>
        </div>

        {/* Discreet Return Trigger */}
        <div className="flex items-center gap-2">
          {showPinInput ? (
            <form onSubmit={handleUnlock} className="flex items-center gap-2 bg-slate-850 p-1 rounded-lg border border-slate-700">
              <input
                type="password"
                maxLength={6}
                placeholder="PIN (1234)"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setPinError(false);
                }}
                autoFocus
                className="w-24 bg-slate-900 px-2 py-1 text-xs rounded border border-slate-700 text-white focus:outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-medium"
              >
                Return
              </button>
              <button
                type="button"
                onClick={() => setShowPinInput(false)}
                className="px-2 py-1 text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowPinInput(true)}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Resume Session</span>
            </button>
          )}
        </div>
      </header>

      {/* Reassurance banner: discreet note that backend safety monitoring is intact */}
      <div className="bg-slate-950/40 border-b border-slate-800/80 px-6 py-2 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          <span>
            Discreet Exit Active. Background check-in escalation and active sessions remain securely running.
          </span>
        </div>
        {hasActiveSession && (
          <span className="text-amber-400 font-mono">
            1 Active Safety Protocol Active
          </span>
        )}
      </div>

      {pinError && (
        <div className="max-w-md mx-auto mt-4 px-4 py-2 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Incorrect PIN. Enter default '1234' or your custom PIN.</span>
        </div>
      )}

      {/* Disguise Main Content: Realistic Daily Planner & Weather */}
      <main className="max-w-4xl mx-auto w-full p-6 space-y-6 flex-1">
        {/* Weather Card */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Today's Forecast</p>
              <h2 className="text-4xl font-light text-slate-100 mt-1">68°F</h2>
              <p className="text-sm text-slate-300 mt-1">Partly cloudy throughout the afternoon. Light evening breeze.</p>
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-400" />
                <span>Humidity: 48%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-teal-400" />
                <span>Wind: 9 mph W</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>UV Index: Moderate</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-6 pt-4 border-t border-slate-700/60 text-center">
            {['12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'].map((time, idx) => (
              <div key={time} className="p-2 rounded-xl bg-slate-900/40">
                <p className="text-xs text-slate-400">{time}</p>
                <CloudSun className="w-5 h-5 mx-auto my-1.5 text-amber-300" />
                <p className="text-xs font-semibold text-slate-200">{68 - idx}°</p>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Schedule / Tasks Card */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-sm text-slate-200">Daily Agenda & Notes</h3>
            </div>
            <span className="text-xs text-slate-400">Updated just now</span>
          </div>

          <div className="space-y-3">
            {[
              { title: 'Project team sync meeting', time: '10:30 AM', done: true },
              { title: 'Review lecture notes & bibliography', time: '1:00 PM', done: true },
              { title: 'Return library textbooks', time: '4:15 PM', done: false },
              { title: 'Evening grocery pickup', time: '7:30 PM', done: false },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800/80"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2
                    className={`w-4 h-4 ${item.done ? 'text-teal-400' : 'text-slate-600'}`}
                  />
                  <span className={`text-sm ${item.done ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                    {item.title}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-mono">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Disguise Footer */}
      <footer className="p-4 border-t border-slate-800 text-center text-xs text-slate-500">
        Metro Weather Service • Offline Sync Enabled • Tap lock icon or press Escape to resume DigiSakhi
      </footer>
    </div>
  );
};
