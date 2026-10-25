import React, { useState, useRef, useEffect } from 'react';
import { useSafeSphere, NavigationScreen } from '@/store/SafeSphereContext';
import { DigiSakhiLogo } from '@/components/common/DigiSakhiLogo';
import { AuthModal } from '@/components/auth/AuthModal';
import { EmergencyMessageModal } from '@/components/safety/EmergencyMessageModal';
import { EmergencyCallModal } from '@/components/safety/EmergencyCallModal';
import {
  LayoutDashboard,
  Compass,
  Users,
  Sliders,
  Clock,
  Settings,
  Shield,
  ShieldAlert,
  PhoneCall,
  EyeOff,
  LogOut,
  Radio,
  ChevronRight,
  ChevronUp,
  UserCheck,
  Lock,
  Bell,
  HelpCircle,
} from 'lucide-react';

export const SidebarNav: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    currentUser,
    currentRole,
    contacts,
    notifications,
    activeCheckIn,
    activeJourney,
    activeIncident,
    triggerQuickExit,
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

  // 6 Core Navigation Sections (Consistent, Simple, Uncluttered)
  const navItems = [
    {
      id: 'home',
      screen: 'home' as NavigationScreen,
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'journeys',
      screen: 'journeys' as NavigationScreen,
      label: 'My Journeys',
      icon: Compass,
      badge: activeJourney ? 'Active' : undefined,
    },
    {
      id: 'circle',
      screen: 'circle' as NavigationScreen,
      label: 'Trusted Circle',
      icon: Users,
      badge: acceptedContacts.length > 0 ? `${acceptedContacts.length}` : undefined,
    },
    {
      id: 'safety_setup',
      screen: 'safety_setup' as NavigationScreen,
      label: 'Safety Setup',
      icon: Sliders,
      badge: activeCheckIn ? 'Active' : undefined,
    },
    {
      id: 'history',
      screen: 'history' as NavigationScreen,
      label: 'Activity History',
      icon: Clock,
    },
    {
      id: 'settings',
      screen: 'settings' as NavigationScreen,
      label: 'Profile & Settings',
      icon: Settings,
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
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-white border-r border-[#E8E1F3] h-screen sticky top-0 shrink-0 z-30 justify-between p-5 select-none shadow-subtle">
      {/* Top Header & Brand */}
      <div className="space-y-6">
        {/* Brand Logo with Official Image & Tagline */}
        <div
          onClick={() => setCurrentScreen('home')}
          className="cursor-pointer group"
        >
          <DigiSakhiLogo
            size="md"
            subtitle={currentRole === 'user' ? 'For Her. With Her. Always.' : 'Trusted Responder'}
          />
        </div>

        {/* Protection Status Indicator Pill */}
        <div className="p-3 rounded-2xl bg-[#F2EDFF]/60 border border-[#E8E1F3] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${activeIncident ? 'bg-[#D92D45] animate-ping' : 'bg-[#16865C]'}`} />
            <span className="font-bold text-[#351078]">
              {activeIncident ? 'Alert Dispatched' : 'Active Protection'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-[#5517C8] bg-white px-2 py-0.5 rounded-full border border-[#E8E1F3]">
            {currentRole === 'user' ? 'User' : 'Contact'}
          </span>
        </div>

        {/* 6 Core Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isCurrentActive(item.id);

            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.screen)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between text-left cursor-pointer border ${
                  active
                    ? 'bg-[#F2EDFF] text-[#351078] font-bold border-[#E8E1F3] shadow-xs'
                    : 'border-transparent text-[#716B80] hover:text-[#211638] hover:bg-[#F2EDFF]/40 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {/* Small purple indicator bar on active item */}
                  {active && (
                    <span className="w-1 h-4 rounded-full bg-[#5517C8] shrink-0" />
                  )}
                  <Icon className={`w-4 h-4 ${active ? 'text-[#5517C8]' : 'text-[#716B80]'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      active
                        ? 'bg-[#5517C8] text-white'
                        : 'bg-[#F2EDFF] text-[#5517C8]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Responder Console Link for Trusted Contact role */}
          <div className="pt-2 border-t border-[#E8E1F3]">
            <button
              onClick={() => setCurrentScreen('trusted_dashboard')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                currentScreen === 'trusted_dashboard'
                  ? 'bg-[#F2EDFF] text-[#351078] border-[#E8E1F3]'
                  : 'border-transparent text-[#716B80] hover:text-[#211638] hover:bg-[#FAF9FF]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-[#365BFF]" />
                <span>Responder Console</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#716B80]" />
            </button>
          </div>
        </nav>
      </div>

      {/* Bottom Sidebar: Emergency Actions, Quick Exit & Profile Dropdown */}
      <div className="space-y-2.5 pt-4 border-t border-[#E8E1F3] relative" ref={menuRef}>
        {/* Emergency SOS & Call 112 Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setIsEmergencyMessageOpen(true)}
            className="py-2.5 px-2 rounded-xl bg-[#D92D45] hover:bg-[#B71C32] text-white text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
            title="Send Emergency SOS message with live GPS location"
          >
            <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
            <span>SOS Alert</span>
          </button>

          <button
            onClick={() => setIsEmergencyCallOpen(true)}
            className="py-2.5 px-2 rounded-xl bg-[#211638] hover:bg-black text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
            title="Dial 112 National Emergency Helpline or Primary Contact"
          >
            <PhoneCall className="w-3.5 h-3.5 text-[#08C9E8]" />
            <span>Call 112</span>
          </button>
        </div>

        {/* Quick Exit Disguise Button */}
        <button
          onClick={triggerQuickExit}
          className="w-full py-2.5 px-3.5 rounded-xl bg-[#FAF9FF] hover:bg-[#F2EDFF] text-[#211638] border border-[#E8E1F3] text-xs font-bold transition-colors flex items-center justify-center gap-2 group cursor-pointer"
          title="Instant camouflage disguise (Esc) — Hides dashboard behind weather planner without cancelling active safety sessions"
        >
          <EyeOff className="w-4 h-4 text-[#D92D45] group-hover:scale-110 transition-transform" />
          <span>Quick Exit (Esc)</span>
        </button>

        {/* Profile Card & Settings Dropdown Trigger */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-full p-2.5 rounded-2xl bg-[#FAF9FF] hover:bg-[#F2EDFF] border border-[#E8E1F3] text-left transition-colors flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5517C8] to-[#365BFF] text-white font-extrabold text-xs flex items-center justify-center uppercase shadow-xs">
                {currentUser.full_name?.charAt(0) || 'U'}
              </div>
              <div className="leading-tight">
                <p className="font-extrabold text-[#211638] text-xs truncate max-w-[120px]">
                  {currentUser.full_name}
                </p>
                <p className="text-[10px] text-[#716B80] capitalize">
                  {currentRole === 'user' ? 'Protected User' : 'Trusted Contact'}
                </p>
              </div>
            </div>
            <ChevronUp
              className={`w-4 h-4 text-[#716B80] transition-transform ${
                isProfileMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown Popover */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl border border-[#E8E1F3] shadow-elevated p-2 space-y-1 z-50 animate-fadeIn text-xs">
              <div className="px-3 py-2 border-b border-[#E8E1F3]">
                <p className="font-bold text-[#211638]">{currentUser.full_name}</p>
                <p className="text-[11px] text-[#716B80] truncate">{currentUser.email}</p>
              </div>

              <button
                onClick={() => {
                  setCurrentScreen('privacy_settings');
                  setIsProfileMenuOpen(false);
                }}
                className="w-full px-3 py-2 rounded-lg text-left text-[#211638] hover:bg-[#F2EDFF] flex items-center gap-2 font-medium"
              >
                <Lock className="w-4 h-4 text-[#5517C8]" />
                <span>Privacy & Discreet Mode</span>
              </button>

              <button
                onClick={() => {
                  setCurrentScreen('account_settings');
                  setIsProfileMenuOpen(false);
                }}
                className="w-full px-3 py-2 rounded-lg text-left text-[#211638] hover:bg-[#F2EDFF] flex items-center gap-2 font-medium"
              >
                <Settings className="w-4 h-4 text-[#365BFF]" />
                <span>Account & Medical Data</span>
              </button>

              <button
                onClick={() => {
                  setCurrentScreen('notifications_inbox');
                  setIsProfileMenuOpen(false);
                }}
                className="w-full px-3 py-2 rounded-lg text-left text-[#211638] hover:bg-[#F2EDFF] flex items-center justify-between font-medium"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#08C9E8]" />
                  <span>Notifications</span>
                </div>
                {notifications.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#F2EDFF] text-[#5517C8] font-mono text-[10px]">
                    {notifications.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setIsAuthOpen(true);
                  setIsProfileMenuOpen(false);
                }}
                className="w-full px-3 py-2 rounded-lg text-left text-[#211638] hover:bg-[#F2EDFF] flex items-center gap-2 font-medium"
              >
                <UserCheck className="w-4 h-4 text-[#5517C8]" />
                <span>Switch / Auth Account</span>
              </button>

              <div className="pt-1 border-t border-[#E8E1F3]">
                <button
                  onClick={() => {
                    signOut();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg text-left text-[#D92D45] hover:bg-[#FFF1F3] flex items-center gap-2 font-bold cursor-pointer"
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
