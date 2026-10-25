import React, { useState } from 'react';
import { DigiSakhiLogo } from '@/components/common/DigiSakhiLogo';
import { AuthModal } from './AuthModal';
import {
  ShieldCheck,
  Clock,
  MapPin,
  EyeOff,
  PhoneCall,
  Users,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  const handleGetStarted = () => {
    setAuthMode('signup');
    setIsAuthOpen(true);
  };

  const handleLogIn = () => {
    setAuthMode('signin');
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col font-sans selection:bg-brand-aqua selection:text-brand-deepTeal">
      {/* 1. Header Navigation */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-brand-border/60">
        <DigiSakhiLogo size="md" subtitle="Your Safety. Your Sakhi." />
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogIn}
            className="px-4 py-2 text-xs font-bold text-brand-text hover:text-brand-teal transition-colors rounded-xl hover:bg-white"
          >
            Log In
          </button>
          <button
            onClick={handleGetStarted}
            className="px-4 py-2 bg-brand-teal hover:bg-brand-deepTeal text-white text-xs font-extrabold rounded-xl shadow-teal transition-all active:scale-95"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex flex-col items-center text-center">
        {/* Soft Ambient Glow Accent */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-400 to-violet-500 opacity-20 blur-xl" />
          <div className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-brand-border shadow-xs">
            <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
            <span className="text-xs font-extrabold text-brand-teal tracking-wide uppercase">
              Your Safety. Your Sakhi.
            </span>
          </div>
        </div>

        {/* Primary Headline */}
        <h1 className="text-3xl sm:text-5xl font-black text-brand-text tracking-tight max-w-3xl leading-tight sm:leading-tight mb-5">
          Your personal safety companion,{' '}
          <span className="bg-gradient-to-r from-brand-teal via-teal-700 to-brand-violet bg-clip-text text-transparent">
            wherever life takes you.
          </span>
        </h1>

        {/* Subtitle / Mission Statement */}
        <p className="text-sm sm:text-base text-brand-muted max-w-2xl leading-relaxed mb-8 sm:mb-10">
          DigiSakhi provides intelligent automated check-ins during transit, discreet emergency SOS broadcasts to your trusted circle, and instant 1-touch dialer for the 112 National Emergency Helpline.
        </p>

        {/* Primary Call-to-Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mb-12 sm:mb-16">
          <button
            onClick={handleGetStarted}
            className="w-full sm:w-auto px-8 py-3.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-2xl text-sm font-extrabold shadow-teal transition-all flex items-center justify-center gap-2 active:scale-95 group cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={handleLogIn}
            className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-brand-text border border-brand-border rounded-2xl text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Log In to Existing Account</span>
          </button>
        </div>

        {/* 3. Four Core Value Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full text-left">
          {/* Card 1: Smart Check-ins */}
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs hover:border-brand-teal/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-brand-aqua text-brand-teal flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-brand-text mb-1">
              Automated Check-Ins
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Regular safety prompts during commutes. A simple "I'm Okay" resets the timer; missed check-ins notify your circle.
            </p>
          </div>

          {/* Card 2: Custom Journeys */}
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs hover:border-brand-teal/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-brand-lavender text-brand-violet flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-brand-text mb-1">
              Monitored Journeys
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Set transit destinations with customizable intervals, live countdowns, and automatic safe arrival prompts.
            </p>
          </div>

          {/* Card 3: Emergency Calling & SOS */}
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs hover:border-brand-coral/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-brand-peach text-brand-coral flex items-center justify-center mb-3">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-brand-text mb-1">
              SOS & Call 112
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Instant 1-touch dialer for 112 Helpline and emergency SMS/WhatsApp dispatches with live GPS location coordinates.
            </p>
          </div>

          {/* Card 4: Discreet Quick Exit */}
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs hover:border-slate-400 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-brand-text mb-1">
              Discreet Disguise
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Press Escape or tap Exit for an immediate weather disguise, masking your safety screen without cancelling active alerts.
            </p>
          </div>
        </div>

        {/* 4. Privacy & Transparency Seal */}
        <div className="mt-12 w-full p-4 sm:p-5 rounded-2xl bg-white/70 border border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-muted">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-aqua/80 text-brand-teal flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <p className="text-left leading-relaxed">
              <strong className="text-brand-text font-bold">Privacy-First Architecture:</strong> DigiSakhi never monitors you in the background. GPS location is only accessed when you start a journey or trigger an emergency dispatch.
            </p>
          </div>

          <button
            onClick={() => {
              setAuthMode('signin');
              setIsAuthOpen(true);
            }}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-brand-text font-bold text-[11px] transition-colors"
          >
            Demo / Evaluation Logins
          </button>
        </div>
      </main>

      {/* 5. Footer */}
      <footer className="w-full border-t border-brand-border/60 py-6 text-center text-xs text-brand-muted">
        <p>© {new Date().getFullYear()} DigiSakhi. Your Safety. Your Sakhi. Built with care for women's safety.</p>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
};
