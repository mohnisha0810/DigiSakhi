import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { AuthModal } from '@/components/auth/AuthModal';
import {
  Shield,
  ShieldAlert,
  Clock,
  Compass,
  Users,
  Sliders,
  EyeOff,
  Bell,
  Settings,
  LogOut,
  Map,
  Menu,
  X,
  Lock,
  LogIn,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    currentRole,
    currentScreen,
    setCurrentScreen,
    triggerQuickExit,
    notifications,
    activeIncident,
    activeCheckIn,
    signOut,
  } = useSafeSphere();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const unreadNotifications = notifications.filter((n) => n.status !== 'delivered').length;

  const handleNav = (screen: any) => {
    setCurrentScreen(screen);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-navy-950/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNav(currentRole === 'user' ? 'dashboard' : 'trusted_dashboard')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-navy-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                DigiSakhi
                <span className="inline-block w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                {currentRole === 'user' ? 'Personal Safety Platform' : 'Trusted Contact Circle'}
              </p>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {currentRole === 'user' ? (
            <>
              <button
                onClick={() => handleNav('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentScreen === 'dashboard'
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-navy-850'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => handleNav('distress_panel')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentScreen === 'distress_panel'
                    ? 'bg-coral-500/15 text-coral-300 border border-coral-500/30'
                    : 'text-slate-300 hover:text-coral-400 hover:bg-navy-850'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-coral-400" />
                Distress Codes
              </button>
              <button
                onClick={() => handleNav('checkin_active')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentScreen === 'checkin_active'
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-navy-850'
                }`}
              >
                <Clock className="w-4 h-4 text-teal-400" />
                Check-in
                {activeCheckIn && (
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                )}
              </button>
              <button
                onClick={() => handleNav('journey_active')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentScreen === 'journey_active'
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-navy-850'
                }`}
              >
                <Compass className="w-4 h-4 text-indigo-400" />
                Journeys
              </button>
              <button
                onClick={() => handleNav('map_view')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentScreen === 'map_view'
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-navy-850'
                }`}
              >
                <Map className="w-4 h-4 text-teal-400" />
                Live Map
              </button>
              <button
                onClick={() => handleNav('contacts')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentScreen === 'contacts'
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-navy-850'
                }`}
              >
                <Users className="w-4 h-4 text-slate-400" />
                Circle
              </button>
              <button
                onClick={() => handleNav('protocol_builder')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentScreen === 'protocol_builder'
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-navy-850'
                }`}
              >
                <Sliders className="w-4 h-4 text-slate-400" />
                Protocols
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleNav('trusted_dashboard')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentScreen === 'trusted_dashboard'
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-navy-850'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-teal-400" />
                Responder Console
                {activeIncident && (
                  <span className="w-2 h-2 rounded-full bg-coral-500 animate-pulse" />
                )}
              </button>
              <button
                onClick={() => handleNav('map_view')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentScreen === 'map_view'
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-navy-850'
                }`}
              >
                <Map className="w-4 h-4 text-teal-400" />
                Shared Location
              </button>
            </>
          )}
        </nav>

        {/* Right Action Icons: Quick Exit, Notifications, Settings, Profile */}
        <div className="flex items-center gap-2">
          {/* Feature 5: Discreet Quick Exit Button */}
          <button
            onClick={triggerQuickExit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-all shadow-sm border border-slate-700"
            title="Instant Discreet Quick Exit (Esc) — Hides safety dashboard behind neutral disguise without cancelling active alerts"
          >
            <EyeOff className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">Quick Exit</span>
          </button>

          {/* Notifications Inbox Button */}
          <button
            onClick={() => handleNav('notifications_inbox')}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-navy-850 transition-colors"
            title="Notification Center"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400" />
            )}
          </button>

          {/* Privacy & Discreet Settings */}
          {currentRole === 'user' && (
            <button
              onClick={() => handleNav('privacy_settings')}
              className={`p-2 rounded-lg transition-colors ${
                currentScreen === 'privacy_settings'
                  ? 'bg-teal-500/20 text-teal-300'
                  : 'text-slate-400 hover:text-white hover:bg-navy-850'
              }`}
              title="Privacy & Discreet Mode Controls"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          {/* Account Settings */}
          <button
            onClick={() => handleNav('account_settings')}
            className={`p-2 rounded-lg transition-colors ${
              currentScreen === 'account_settings'
                ? 'bg-teal-500/20 text-teal-300'
                : 'text-slate-400 hover:text-white hover:bg-navy-850'
            }`}
            title="Account & Data Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile Pill & Auth */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
            <button
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
              title="Switch profile or authenticate"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white uppercase shadow">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="text-left text-xs">
                <p className="font-semibold text-slate-200 leading-tight">
                  {currentUser.full_name}
                </p>
                <p className="text-[10px] text-teal-400 capitalize">
                  {currentRole === 'user' ? 'Protected User' : 'Trusted Contact'}
                </p>
              </div>
            </button>

            <button
              onClick={() => signOut()}
              className="p-1.5 text-slate-500 hover:text-coral-400 rounded-lg hover:bg-navy-850 transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-navy-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          <button
            onClick={() => handleNav('dashboard')}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-navy-800"
          >
            Dashboard
          </button>
          <button
            onClick={() => handleNav('distress_panel')}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-coral-300 hover:bg-navy-800 flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-coral-400" />
            Distress Codes
          </button>
          <button
            onClick={() => handleNav('checkin_active')}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-navy-800"
          >
            Smart Check-in
          </button>
          <button
            onClick={() => handleNav('journey_active')}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-navy-800"
          >
            Journeys
          </button>
          <button
            onClick={() => handleNav('trusted_dashboard')}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-navy-800"
          >
            Trusted Responder Console
          </button>
          <button
            onClick={() => handleNav('map_view')}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-navy-800"
          >
            Live Map & Geolocation
          </button>
          <button
            onClick={() => handleNav('contacts')}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-navy-800"
          >
            Trusted Circle
          </button>
          <button
            onClick={() => handleNav('protocol_builder')}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-navy-800"
          >
            Safety Protocols
          </button>
          <button
            onClick={() => handleNav('privacy_settings')}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:bg-navy-800"
          >
            Discreet & Privacy Mode
          </button>
        </div>
      )}
    </header>
  );
};
