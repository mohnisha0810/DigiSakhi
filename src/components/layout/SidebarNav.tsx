import React, { useState, useRef, useEffect } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { EmergencyMessageModal } from '@/components/safety/EmergencyMessageModal';
import { EmergencyCallModal } from '@/components/safety/EmergencyCallModal';
import { DigiSakhiLogo } from '@/components/common/DigiSakhiLogo';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Compass,
  Users,
  Sliders,
  Clock,
  LayoutDashboard,
  EyeOff,
  Bell,
  Lock,
  Settings,
  LogOut,
  Radio,
  ChevronRight,
  UserCheck,
  ChevronUp,
  PhoneCall,
} from 'lucide-react';

export const SidebarNav: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    currentUser,
    currentRole,
    contacts,
    activeIncident,
    activeCheckIn,
    activeJourney,
    triggerQuickExit,
    notifications,
    signOut,
  } = useSafeSphere();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isEmergencyMessageOpen, setIsEmergencyMessageOpen] = useState(false);
  const [isEmergencyCallOpen, setIsEmergencyCallOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const acceptedContacts = contacts.filter((c) => c.status === 'accepted');

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    {
      id: 'home',
      screen: 'home',
      label: 'Home',
      icon: LayoutDashboard,
      activeColor: 'bg-brand-aqua text-brand-deepTeal border-teal-200',
      iconColor: 'text-brand-teal',
    },
    {
      id: 'journeys',
      screen: 'journeys',
      label: 'My Journeys',
      icon: Compass,
      activeColor: 'bg-brand-lavender text-brand-violet border-violet-200',
      iconColor: 'text-brand-violet',
      badge: activeJourney ? 'Active' : undefined,
      badgeColor: 'bg-brand-lavender text-brand-violet',
    },
    {
      id: 'circle',
      screen: 'circle',
      label: 'Trusted Circle',
      icon: Users,
      activeColor: 'bg-brand-aqua text-brand-deepTeal border-teal-200',
      iconColor: 'text-brand-teal',
      badge: `${acceptedContacts.length}`,
      badgeColor: 'bg-slate-100 text-brand-muted',
    },
    {
      id: 'safety_setup',
      screen: 'safety_setup',
      label: 'Safety Setup',
      icon: Sliders,
      activeColor: 'bg-brand-lavender text-brand-violet border-violet-200',
      iconColor: 'text-brand-violet',
      badge: activeCheckIn ? 'Active' : undefined,
      badgeColor: 'bg-brand-aqua text-brand-teal',
    },
    {
      id: 'history',
      screen: 'history',
      label: 'Activity History',
      icon: Clock,
      activeColor: 'bg-slate-100 text-brand-text border-slate-200',
      iconColor: 'text-slate-600',
    },
    {
      id: 'settings',
      screen: 'settings',
      label: 'Profile & Settings',
      icon: Settings,
      activeColor: 'bg-slate-100 text-brand-text border-slate-200',
      iconColor: 'text-slate-600',
    },
  ];

  const isCurrentActive = (itemScreen: string) => {
    if (itemScreen === 'home' && (currentScreen === 'home' || currentScreen === 'dashboard')) return true;
    if (itemScreen === 'journeys' && (currentScreen === 'journeys' || currentScreen === 'journey_active' || currentScreen === 'map_view')) return true;
    if (itemScreen === 'circle' && (currentScreen === 'circle' || currentScreen === 'contacts')) return true;
    if (itemScreen === 'safety_setup' && (currentScreen === 'safety_setup' || currentScreen === 'protocols' || currentScreen === 'protocol_builder' || currentScreen === 'my_safety' || currentScreen === 'distress_panel' || currentScreen === 'checkin_active')) return true;
    if (itemScreen === 'history' && (currentScreen === 'history' || currentScreen === 'incident_details')) return true;
    if (itemScreen === 'settings' && (currentScreen === 'settings' || currentScreen === 'privacy_settings' || currentScreen === 'account_settings' || currentScreen === 'notifications_inbox')) return true;
    return currentScreen === itemScreen;
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-white border-r border-brand-border h-screen sticky top-0 shrink-0 z-30 justify-between p-5 select-none shadow-subtle">
      {/* Top Header & Brand */}
      <div className="space-y-6">
        {/* Brand Logo */}
        <div
          onClick={() => setCurrentScreen('home')}
          className="cursor-pointer group"
        >
          <DigiSakhiLogo
            size="md"
            subtitle={currentRole === 'user' ? 'Personal Safety Circle' : 'Trusted Responder'}
          />
        </div>

        {/* Perimeter Status Indicator Pill */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-brand-aqua/40 to-brand-lavender/30 border border-teal-200/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-teal animate-ping" />
            <span className="font-extrabold text-brand-deepTeal">
              {activeIncident ? 'Alert Dispatched' : 'Active Protection'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-brand-muted">
            {acceptedContacts.length} Contacts
          </span>
        </div>

        {/* Primary Navigation Stack */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const active = isCurrentActive(item.screen);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.screen as any)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                  active
                    ? `${item.activeColor} shadow-xs font-extrabold`
                    : 'border-transparent text-brand-muted hover:text-brand-text hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      active ? 'bg-white shadow-xs' : 'bg-slate-100 text-brand-muted'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? item.iconColor : 'text-slate-500'}`} />
                  </div>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-slate-100 text-brand-muted'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Responder Console Link for Trusted Contact perspective */}
          <div className="pt-2 border-t border-brand-border/60">
            <button
              onClick={() => setCurrentScreen('trusted_dashboard')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                currentScreen === 'trusted_dashboard'
                  ? 'bg-brand-lavender text-brand-violet border-violet-200'
                  : 'border-transparent text-brand-muted hover:text-brand-text hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-violet-100 text-brand-violet flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <span>Responder Console</span>
              </div>
              <ChevronRight className="w-4 h-4 text-brand-muted" />
            </button>
          </div>
        </nav>
      </div>

      {/* Bottom Sidebar: Emergency Actions, Quick Exit & Profile Dropdown */}
      <div className="space-y-2.5 pt-4 border-t border-brand-border relative" ref={menuRef}>
        {/* Emergency SOS & Call Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setIsEmergencyMessageOpen(true)}
            className="py-2.5 px-2 rounded-xl bg-brand-coral hover:bg-red-600 text-white text-xs font-black shadow-coral transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
            title="Send Emergency SOS message with live GPS location"
          >
            <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
            <span>SOS Alert</span>
          </button>

          <button
            onClick={() => setIsEmergencyCallOpen(true)}
            className="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
            title="Dial 112 National Emergency Helpline or Primary Contact"
          >
            <PhoneCall className="w-3.5 h-3.5 text-coral-400" />
            <span>Call 112</span>
          </button>
        </div>

        {/* Quick Exit Disguise Button */}
        <button
          onClick={triggerQuickExit}
          className="w-full py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-brand-text border border-brand-border text-xs font-bold transition-colors flex items-center justify-center gap-2 group shadow-xs"
          title="Instant camouflage disguise (Esc) — Hides dashboard behind weather planner without cancelling active safety sessions"
        >
          <EyeOff className="w-4 h-4 text-brand-coral group-hover:scale-110 transition-transform" />
          <span>Quick Exit (Esc)</span>
        </button>

        {/* Profile Card & Settings Dropdown Trigger */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-brand-border text-left transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-teal to-brand-violet text-white font-extrabold text-xs flex items-center justify-center uppercase shadow-xs">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="leading-tight">
                <p className="font-extrabold text-brand-text text-xs truncate max-w-[120px]">
                  {currentUser.full_name}
                </p>
                <p className="text-[10px] text-brand-muted capitalize">
                  {currentRole === 'user' ? 'Protected User' : 'Trusted Contact'}
                </p>
              </div>
            </div>
            <ChevronUp
              className={`w-4 h-4 text-brand-muted transition-transform ${
                isProfileMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown Popover */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl border border-brand-border shadow-elevated p-2 space-y-1 z-50 animate-fadeIn text-xs">
              <div className="px-3 py-2 border-b border-brand-border">
                <p className="font-bold text-brand-text">{currentUser.full_name}</p>
                <p className="text-[11px] text-brand-muted truncate">{currentUser.email}</p>
              </div>

              <button
                onClick={() => {
                  setCurrentScreen('privacy_settings');
                  setIsProfileMenuOpen(false);
                }}
                className="w-full px-3 py-2 rounded-lg text-left text-brand-text hover:bg-slate-50 flex items-center gap-2 font-medium"
              >
                <Lock className="w-4 h-4 text-brand-teal" />
                <span>Privacy & Discreet Mode</span>
              </button>

              <button
                onClick={() => {
                  setCurrentScreen('account_settings');
                  setIsProfileMenuOpen(false);
                }}
                className="w-full px-3 py-2 rounded-lg text-left text-brand-text hover:bg-slate-50 flex items-center gap-2 font-medium"
              >
                <Settings className="w-4 h-4 text-brand-violet" />
                <span>Account & Medical Data</span>
              </button>

              <button
                onClick={() => {
                  setCurrentScreen('notifications_inbox');
                  setIsProfileMenuOpen(false);
                }}
                className="w-full px-3 py-2 rounded-lg text-left text-brand-text hover:bg-slate-50 flex items-center justify-between font-medium"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-teal" />
                  <span>Notifications</span>
                </div>
                {notifications.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-brand-aqua text-brand-teal font-mono text-[10px]">
                    {notifications.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setIsAuthOpen(true);
                  setIsProfileMenuOpen(false);
                }}
                className="w-full px-3 py-2 rounded-lg text-left text-brand-text hover:bg-slate-50 flex items-center gap-2 font-medium"
              >
                <UserCheck className="w-4 h-4 text-brand-deepTeal" />
                <span>Switch / Auth Account</span>
              </button>

              <div className="pt-1 border-t border-brand-border">
                <button
                  onClick={() => {
                    signOut();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg text-left text-brand-coral hover:bg-brand-peach flex items-center gap-2 font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <EmergencyMessageModal
        isOpen={isEmergencyMessageOpen}
        onClose={() => setIsEmergencyMessageOpen(false)}
      />
      <EmergencyCallModal
        isOpen={isEmergencyCallOpen}
        onClose={() => setIsEmergencyCallOpen(false)}
      />
    </aside>
  );
};
