import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { DigiSakhiLogo } from '@/components/common/DigiSakhiLogo';
import {
  Shield,
  EyeOff,
  Bell,
  Settings,
  Lock,
  LogOut,
  UserCheck,
  X,
  Menu,
} from 'lucide-react';

export const MobileHeader: React.FC = () => {
  const {
    currentUser,
    currentRole,
    triggerQuickExit,
    setCurrentScreen,
    notifications,
    signOut,
  } = useSafeSphere();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <header className="lg:hidden bg-white/95 backdrop-blur border-b border-brand-border sticky top-0 z-30 px-4 h-16 flex items-center justify-between shadow-subtle">
      {/* Brand */}
      <div
        onClick={() => setCurrentScreen('home')}
        className="cursor-pointer"
      >
        <DigiSakhiLogo size="sm" subtitle="" />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Exit */}
        <button
          onClick={triggerQuickExit}
          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-brand-text border border-brand-border text-xs font-bold flex items-center gap-1.5 transition-colors"
          title="Instant camouflage disguise"
        >
          <EyeOff className="w-3.5 h-3.5 text-brand-coral" />
          <span>Exit</span>
        </button>

        {/* Profile Trigger */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-teal to-brand-violet text-white text-xs font-bold flex items-center justify-center uppercase shadow-xs"
        >
          {currentUser.full_name.charAt(0)}
        </button>
      </div>

      {/* Mobile Profile & Settings Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl p-6 border-t border-brand-border shadow-elevated space-y-4 max-h-[85vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-teal to-brand-violet text-white font-extrabold flex items-center justify-center">
                  {currentUser.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-brand-text text-sm">
                    {currentUser.full_name}
                  </h4>
                  <p className="text-xs text-brand-muted">{currentUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 text-brand-muted hover:text-brand-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs font-bold">
              <button
                onClick={() => {
                  setCurrentScreen('privacy_settings');
                  setIsMenuOpen(false);
                }}
                className="w-full p-3 rounded-xl bg-slate-50 text-left text-brand-text flex items-center gap-2.5"
              >
                <Lock className="w-4 h-4 text-brand-teal" />
                <span>Privacy & Discreet Camouflage Settings</span>
              </button>

              <button
                onClick={() => {
                  setCurrentScreen('account_settings');
                  setIsMenuOpen(false);
                }}
                className="w-full p-3 rounded-xl bg-slate-50 text-left text-brand-text flex items-center gap-2.5"
              >
                <Settings className="w-4 h-4 text-brand-violet" />
                <span>Account & Medical Information</span>
              </button>

              <button
                onClick={() => {
                  setCurrentScreen('notifications_inbox');
                  setIsMenuOpen(false);
                }}
                className="w-full p-3 rounded-xl bg-slate-50 text-left text-brand-text flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-brand-teal" />
                  <span>Notification Center</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-brand-aqua text-brand-teal font-mono">
                  {notifications.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setIsAuthOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full p-3 rounded-xl bg-slate-50 text-left text-brand-text flex items-center gap-2.5"
              >
                <UserCheck className="w-4 h-4 text-brand-deepTeal" />
                <span>Switch / Authenticate Account</span>
              </button>

              <button
                onClick={() => {
                  signOut();
                  setIsMenuOpen(false);
                }}
                className="w-full p-3 rounded-xl bg-brand-peach text-left text-brand-coral flex items-center gap-2.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </header>
  );
};
