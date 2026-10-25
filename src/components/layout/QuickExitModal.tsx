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
  FileText,
  Calculator as CalcIcon,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';

export const QuickExitModal: React.FC = () => {
  const {
    currentUser,
    isQuickExitActive,
    triggerQuickExit,
    unlockQuickExit,
    activeIncident,
    activeCheckIn,
    activeJourney,
  } = useSafeSphere();

  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);

  // Notes Disguise State
  const [notesCategory, setNotesCategory] = useState<'grocery' | 'study' | 'todo'>('grocery');
  const [noteItems, setNoteItems] = useState([
    { id: 1, text: 'Organic oat milk (1 Gallon)', done: true, cat: 'grocery' },
    { id: 2, text: 'Farm fresh brown eggs (1 dozen)', done: true, cat: 'grocery' },
    { id: 3, text: 'Hass avocados (4 pack)', done: false, cat: 'grocery' },
    { id: 4, text: 'Artisan sourdough whole wheat', done: false, cat: 'grocery' },
    { id: 5, text: 'Greek strained yogurt (Plain)', done: false, cat: 'grocery' },
    { id: 6, text: 'Review Chapter 4 & 5 economics notes', done: true, cat: 'study' },
    { id: 7, text: 'Prepare presentation bibliography citations', done: false, cat: 'study' },
    { id: 8, text: 'Return campus library textbooks by Friday', done: false, cat: 'todo' },
    { id: 9, text: 'Schedule dentist 6-month checkup appointment', done: true, cat: 'todo' },
  ]);
  const [newNoteText, setNewNoteText] = useState('');

  // Calculator Disguise State
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrev, setCalcPrev] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [calcReset, setCalcReset] = useState(false);

  // Global ESC key shortcut handler:
  // 1. When NOT active: Pressing Escape immediately triggers camouflage
  // 2. When active: Pressing Escape toggles the PIN prompt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isQuickExitActive) {
          setShowPinInput((prev) => !prev);
          setPinError(false);
        } else {
          triggerQuickExit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isQuickExitActive, triggerQuickExit]);

  // When camouflage is inactive, do not render modal content
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
  const disguiseType = currentUser?.quick_exit_disguise || 'weather';

  // Calculator logic
  const handleCalcNumber = (digit: string) => {
    if (calcReset || calcDisplay === '0') {
      setCalcDisplay(digit);
      setCalcReset(false);
    } else {
      setCalcDisplay(calcDisplay + digit);
    }
  };

  const handleCalcOp = (op: string) => {
    const current = parseFloat(calcDisplay);
    if (calcPrev !== null && calcOp && !calcReset) {
      let res = calcPrev;
      if (calcOp === '+') res = calcPrev + current;
      if (calcOp === '-') res = calcPrev - current;
      if (calcOp === '×') res = calcPrev * current;
      if (calcOp === '÷') res = current !== 0 ? calcPrev / current : 0;
      setCalcDisplay(String(Number(res.toFixed(6))));
      setCalcPrev(res);
    } else {
      setCalcPrev(current);
    }
    setCalcOp(op);
    setCalcReset(true);
  };

  const handleCalcEquals = () => {
    if (calcPrev === null || !calcOp) return;
    const current = parseFloat(calcDisplay);
    let res = calcPrev;
    if (calcOp === '+') res = calcPrev + current;
    if (calcOp === '-') res = calcPrev - current;
    if (calcOp === '×') res = calcPrev * current;
    if (calcOp === '÷') res = current !== 0 ? calcPrev / current : 0;
    setCalcDisplay(String(Number(res.toFixed(6))));
    setCalcPrev(null);
    setCalcOp(null);
    setCalcReset(true);
  };

  const handleCalcClear = () => {
    setCalcDisplay('0');
    setCalcPrev(null);
    setCalcOp(null);
    setCalcReset(false);
  };

  // Notes logic
  const toggleNoteItem = (id: number) => {
    setNoteItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setNoteItems((prev) => [
      ...prev,
      { id: Date.now(), text: newNoteText.trim(), done: false, cat: notesCategory },
    ]);
    setNewNoteText('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-slate-100 flex flex-col font-sans select-none overflow-y-auto">
      {/* Top Disguise Header */}
      <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            onClick={() => setShowPinInput(true)}
            className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center cursor-pointer hover:bg-amber-500/30 transition-colors"
            title="Click to enter PIN & unlock DigiSakhi"
          >
            {disguiseType === 'calculator' ? (
              <CalcIcon className="w-5 h-5 text-indigo-400" />
            ) : disguiseType === 'notes' ? (
              <FileText className="w-5 h-5 text-emerald-400" />
            ) : (
              <CloudSun className="w-6 h-6 text-amber-400" />
            )}
          </div>
          <div>
            <h1 className="font-semibold text-slate-100 text-base">
              {disguiseType === 'calculator'
                ? 'Standard Desk Calculator & Math Utilities'
                : disguiseType === 'notes'
                ? 'Personal Notebook & Grocery Checklist'
                : 'Metro Weather & Daily Planner'}
            </h1>
            <p className="text-xs text-slate-400">
              {disguiseType === 'calculator'
                ? 'Decimal Precision Mode • History Synced'
                : disguiseType === 'notes'
                ? 'Last updated 5 minutes ago • Offline Storage'
                : 'San Francisco Bay Area • 68°F Partly Cloudy'}
            </p>
          </div>
        </div>

        {/* Discreet Return Trigger */}
        <div className="flex items-center gap-2">
          {showPinInput ? (
            <form onSubmit={handleUnlock} className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700 shadow-md">
              <input
                type="password"
                maxLength={8}
                placeholder="PIN (1234)"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setPinError(false);
                }}
                autoFocus
                className="w-24 bg-slate-900 px-2.5 py-1 text-xs rounded-lg border border-slate-700 text-white font-mono focus:outline-none focus:border-purple-400"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:opacity-90 text-white rounded-lg text-xs font-bold"
              >
                Return
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPinInput(false);
                  setPinError(false);
                }}
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
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            Discreet Exit Active. Background check-in escalation and active safety monitoring remain securely running.
          </span>
        </div>
        {hasActiveSession && (
          <span className="text-amber-400 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            1 Active Safety Protocol Running in Background
          </span>
        )}
      </div>

      {pinError && (
        <div className="max-w-md mx-auto mt-4 px-4 py-2 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>Incorrect PIN. Enter default '1234' or your custom PIN configured in Settings.</span>
        </div>
      )}

      {/* DISGUISE 1: WORKING CALCULATOR */}
      {disguiseType === 'calculator' && (
        <main className="max-w-md mx-auto w-full p-6 space-y-6 flex-1 flex flex-col justify-center">
          <div className="bg-slate-800/70 border border-slate-700 rounded-3xl p-6 shadow-2xl">
            {/* Calculator Display */}
            <div className="bg-slate-900/90 rounded-2xl p-5 mb-5 border border-slate-700/80 text-right">
              <div className="text-xs text-slate-400 font-mono h-4">
                {calcPrev !== null && calcOp ? `${calcPrev} ${calcOp}` : ''}
              </div>
              <div className="text-4xl font-mono font-light text-white tracking-wider truncate">
                {calcDisplay}
              </div>
            </div>

            {/* Calculator Keypad */}
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={handleCalcClear}
                className="p-3.5 rounded-2xl bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 font-bold text-sm border border-rose-800/40 transition-colors"
              >
                C
              </button>
              <button
                onClick={() => setCalcDisplay((prev) => (parseFloat(prev) * -1).toString())}
                className="p-3.5 rounded-2xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-600/50 transition-colors"
              >
                ±
              </button>
              <button
                onClick={() => setCalcDisplay((prev) => (parseFloat(prev) / 100).toString())}
                className="p-3.5 rounded-2xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-600/50 transition-colors"
              >
                %
              </button>
              <button
                onClick={() => handleCalcOp('÷')}
                className={`p-3.5 rounded-2xl font-bold text-sm border transition-colors ${
                  calcOp === '÷'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border-amber-500/40'
                }`}
              >
                ÷
              </button>

              {['7', '8', '9'].map((d) => (
                <button
                  key={d}
                  onClick={() => handleCalcNumber(d)}
                  className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-medium text-lg border border-slate-700/60 transition-colors"
                >
                  {d}
                </button>
              ))}
              <button
                onClick={() => handleCalcOp('×')}
                className={`p-3.5 rounded-2xl font-bold text-sm border transition-colors ${
                  calcOp === '×'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border-amber-500/40'
                }`}
              >
                ×
              </button>

              {['4', '5', '6'].map((d) => (
                <button
                  key={d}
                  onClick={() => handleCalcNumber(d)}
                  className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-medium text-lg border border-slate-700/60 transition-colors"
                >
                  {d}
                </button>
              ))}
              <button
                onClick={() => handleCalcOp('-')}
                className={`p-3.5 rounded-2xl font-bold text-sm border transition-colors ${
                  calcOp === '-'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border-amber-500/40'
                }`}
              >
                -
              </button>

              {['1', '2', '3'].map((d) => (
                <button
                  key={d}
                  onClick={() => handleCalcNumber(d)}
                  className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-medium text-lg border border-slate-700/60 transition-colors"
                >
                  {d}
                </button>
              ))}
              <button
                onClick={() => handleCalcOp('+')}
                className={`p-3.5 rounded-2xl font-bold text-sm border transition-colors ${
                  calcOp === '+'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border-amber-500/40'
                }`}
              >
                +
              </button>

              <button
                onClick={() => handleCalcNumber('0')}
                className="col-span-2 p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-medium text-lg border border-slate-700/60 transition-colors"
              >
                0
              </button>
              <button
                onClick={() => {
                  if (!calcDisplay.includes('.')) {
                    setCalcDisplay(calcDisplay + '.');
                  }
                }}
                className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-medium text-lg border border-slate-700/60 transition-colors"
              >
                .
              </button>
              <button
                onClick={handleCalcEquals}
                className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg border border-emerald-500 transition-colors shadow-md"
              >
                =
              </button>
            </div>
          </div>
        </main>
      )}

      {/* DISGUISE 2: SHOPPING NOTES & CHECKLIST */}
      {disguiseType === 'notes' && (
        <main className="max-w-3xl mx-auto w-full p-6 space-y-6 flex-1">
          <div className="bg-slate-800/70 border border-slate-700 rounded-3xl p-6 shadow-xl space-y-5">
            {/* Category tabs */}
            <div className="flex items-center gap-2 border-b border-slate-700/80 pb-3">
              {[
                { id: 'grocery', label: 'Grocery Checklist' },
                { id: 'study', label: 'Study & Course Notes' },
                { id: 'todo', label: 'Daily Errands' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setNotesCategory(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    notesCategory === tab.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                placeholder={`Add item to ${notesCategory}...`}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {/* Item List */}
            <div className="space-y-2">
              {noteItems
                .filter((item) => item.cat === notesCategory)
                .map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleNoteItem(item.id)}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {item.done ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <span
                        className={`text-xs ${
                          item.done
                            ? 'line-through text-slate-500'
                            : 'text-slate-200 font-medium'
                        }`}
                      >
                        {item.text}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {item.done ? 'Purchased' : 'Pending'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </main>
      )}

      {/* DISGUISE 3: WEATHER & DAILY AGENDA (DEFAULT) */}
      {disguiseType === 'weather' && (
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
      )}

      {/* Disguise Footer */}
      <footer className="p-4 border-t border-slate-800 text-center text-xs text-slate-500">
        Discreet Safety Cover • Tap lock icon or press Escape to resume DigiSakhi
      </footer>
    </div>
  );
};
