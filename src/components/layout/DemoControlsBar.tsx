import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import {
  FastForward,
  RotateCcw,
  UserCheck,
  MapPin,
  Clock,
  Database,
  Radio,
  ShieldAlert,
  LogIn,
  FileCheck2,
} from 'lucide-react';
import { formatTimeOnly } from '@/lib/utils';
import { AuthModal } from '@/components/auth/AuthModal';
import { VerificationModal } from '@/components/demo/VerificationModal';

export const DemoControlsBar: React.FC = () => {
  const {
    currentUser,
    allProfiles,
    switchUserAccount,
    advanceDemoTime,
    resetAllDemoData,
    simulateArrivedAtDestination,
    virtualTime,
    activeJourney,
    backendMode,
    isCloud,
  } = useSafeSphere();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  return (
    <div className="bg-white border-b border-brand-border text-xs px-3 py-2 text-brand-text shadow-xs z-30 relative">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left: Hackathon Judge Badge & Virtual Clock */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-aqua text-brand-teal font-bold border border-brand-teal/20 text-[11px]">
            <Radio className="w-3 h-3 text-brand-teal animate-pulse" />
            JUDGE DEMO BAR
          </span>

          <div className="flex items-center gap-1.5 text-brand-muted">
            <Clock className="w-3.5 h-3.5 text-brand-teal" />
            <span>Virtual Time:</span>
            <span className="font-mono text-brand-text font-bold">
              {formatTimeOnly(virtualTime.toISOString())}
            </span>
          </div>

          {/* Backend Mode Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 text-brand-muted pl-2.5 border-l border-brand-border">
            <Database className={`w-3.5 h-3.5 ${isCloud ? 'text-brand-teal' : 'text-amber-600'}`} />
            <span
              className={`font-semibold ${isCloud ? 'text-brand-teal' : 'text-amber-800'}`}
              title={
                isCloud
                  ? 'Connected to live Supabase Cloud PostgreSQL with active Row Level Security (RLS).'
                  : 'Local Development Adapter with persistent storage. Not for production security.'
              }
            >
              {isCloud
                ? 'Supabase Cloud (PostgreSQL + RLS)'
                : 'Local Dev Adapter (Persistent DB • Demo Mode)'}
            </span>
          </div>
        </div>

        {/* Right: Quick Switcher & Time Acceleration Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Account Switcher */}
          <div className="flex items-center gap-1 bg-brand-bg px-2 py-1 rounded-lg border border-brand-border shadow-xs">
            <UserCheck className="w-3.5 h-3.5 text-brand-teal" />
            <span className="text-brand-muted mr-1 font-medium">Switch:</span>
            {allProfiles.slice(0, 3).map((p) => {
              const isSelected = p.id === currentUser.id;
              const isUser = p.id === 'usr_elena_01';
              return (
                <button
                  key={p.id}
                  onClick={() => switchUserAccount(p.id)}
                  className={`px-2 py-0.5 rounded text-xs transition-all font-semibold ${
                    isSelected
                      ? 'bg-brand-teal text-white shadow-xs'
                      : 'text-brand-muted hover:text-brand-text hover:bg-white'
                  }`}
                  title={`Switch perspective to ${p.full_name} (${isUser ? 'Protected User' : 'Trusted Contact'})`}
                >
                  {p.full_name.split(' ')[0]} {isUser ? '(User)' : '(Contact)'}
                </button>
              );
            })}
          </div>

          {/* Sign In / Sign Up Modal Trigger */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-2.5 py-1 bg-white hover:bg-brand-bg text-brand-text rounded-lg border border-brand-border text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
            title="Log in with email & password or create a new user account"
          >
            <LogIn className="w-3.5 h-3.5 text-brand-teal" />
            <span>Auth / Switch</span>
          </button>

          {/* Self-Test Suite Modal Trigger */}
          <button
            onClick={() => setIsVerificationModalOpen(true)}
            className="px-2.5 py-1 bg-brand-aqua/50 hover:bg-brand-aqua text-brand-teal rounded-lg border border-brand-teal/30 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Run the 11-step automated end-to-end self-test suite"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-brand-teal" />
            <span>Run Self-Test Suite</span>
          </button>

          {/* Time Accelerator */}
          <div className="flex items-center gap-1 bg-brand-bg px-1.5 py-1 rounded-lg border border-brand-border shadow-xs">
            <span className="text-brand-muted px-1 font-mono text-[11px]">Fast-Forward:</span>
            <button
              onClick={() => advanceDemoTime(60)}
              className="px-2 py-0.5 bg-white hover:bg-brand-bg text-brand-text border border-brand-border rounded text-xs font-medium transition-colors flex items-center gap-1 shadow-xs"
              title="Advance virtual clock by 1 minute"
            >
              <FastForward className="w-3 h-3 text-amber-600" />
              +1m
            </button>
            <button
              onClick={() => advanceDemoTime(180)}
              className="px-2 py-0.5 bg-white hover:bg-brand-peach/40 text-brand-coral border border-brand-coral/30 font-bold rounded text-xs transition-colors flex items-center gap-1 shadow-xs"
              title="Advance virtual clock by 3 minutes (triggers grace period & escalation)"
            >
              <ShieldAlert className="w-3 h-3 text-brand-coral" />
              +3m (Overdue)
            </button>
          </div>

          {/* Simulate Arrival in Radius */}
          {activeJourney && (
            <button
              onClick={simulateArrivedAtDestination}
              className="px-2 py-1 bg-brand-aqua text-brand-teal border border-brand-teal/30 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-xs"
              title="Simulate entering destination safe radius"
            >
              <MapPin className="w-3 h-3 text-brand-teal" />
              Trigger Arrival Prompt
            </button>
          )}

          {/* Reset Demo Data */}
          <button
            onClick={resetAllDemoData}
            className="p-1 text-brand-muted hover:text-brand-coral hover:bg-brand-peach/40 rounded transition-colors"
            title="Reset demo data to initial seed state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
      />
    </div>
  );
};
