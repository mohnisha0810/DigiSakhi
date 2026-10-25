import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { EmergencyMessageModal } from '@/components/safety/EmergencyMessageModal';
import {
  LayoutDashboard,
  ShieldAlert,
  Compass,
  Users,
  Sliders,
  Clock,
  MoreHorizontal,
  X,
  Radio,
  Settings,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { currentScreen, setCurrentScreen, currentRole, activeIncident, activeCheckIn, activeJourney, openIncidentDetails } = useSafeSphere();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  const isActive = (screenName: string) => {
    if (screenName === 'home' && (currentScreen === 'home' || currentScreen === 'dashboard')) return true;
    if (screenName === 'journeys' && (currentScreen === 'journeys' || currentScreen === 'journey_active' || currentScreen === 'map_view')) return true;
    if (screenName === 'circle' && (currentScreen === 'circle' || currentScreen === 'contacts')) return true;
    if (screenName === 'safety_setup' && (currentScreen === 'safety_setup' || currentScreen === 'protocols' || currentScreen === 'protocol_builder' || currentScreen === 'my_safety' || currentScreen === 'distress_panel' || currentScreen === 'checkin_active')) return true;
    if (screenName === 'history' && (currentScreen === 'history' || currentScreen === 'incident_details')) return true;
    if (screenName === 'settings' && (currentScreen === 'settings' || currentScreen === 'privacy_settings' || currentScreen === 'account_settings' || currentScreen === 'notifications_inbox')) return true;
    return currentScreen === screenName;
  };

  const handleCenterAction = () => {
    if (activeIncident) {
      openIncidentDetails(activeIncident.id);
    } else {
      setIsEmergencyOpen(true);
    }
  };

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-brand-border px-3 py-2 flex items-center justify-around shadow-card">
        {/* 1. Home */}
        <button
          onClick={() => setCurrentScreen(currentRole === 'user' ? 'home' : 'trusted_dashboard')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
            isActive('home') || currentScreen === 'trusted_dashboard'
              ? 'text-brand-teal'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>{currentRole === 'user' ? 'Home' : 'Console'}</span>
        </button>

        {/* 2. Journeys */}
        <button
          onClick={() => setCurrentScreen('journeys')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors relative ${
            isActive('journeys')
              ? 'text-brand-violet'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>Journeys</span>
          {activeJourney && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-brand-violet animate-pulse" />
          )}
        </button>

        {/* 3. Center Prominent Emergency SOS Action */}
        <button
          onClick={handleCenterAction}
          className="flex flex-col items-center justify-center -mt-6 group"
        >
          <div
            className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white active:scale-95 transition-transform ${
              activeIncident
                ? 'bg-brand-coral text-white shadow-coral animate-pulse'
                : 'bg-brand-coral text-white shadow-coral'
            }`}
          >
            <ShieldAlert className="w-7 h-7 stroke-[2.3]" />
          </div>
          <span className="text-[10px] font-extrabold text-brand-coral mt-1">
            {activeIncident ? 'Alert Active' : 'SOS Alert'}
          </span>
        </button>

        {/* 4. Circle */}
        <button
          onClick={() => setCurrentScreen('circle')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
            isActive('circle')
              ? 'text-brand-teal'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Circle</span>
        </button>

        {/* 5. More Menu */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
            isActive('safety_setup') || isActive('history') || isActive('settings')
              ? 'text-brand-violet'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>

      {/* More Bottom Sheet */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl p-6 border-t border-brand-border shadow-elevated space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <h4 className="font-extrabold text-brand-text text-base">More Destinations</h4>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1 text-brand-muted hover:text-brand-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => {
                setCurrentScreen('safety_setup');
                setIsMoreOpen(false);
              }}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-left text-xs font-bold text-brand-text flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-lavender text-brand-violet flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <p>Safety Setup</p>
                <p className="text-[11px] text-brand-muted font-normal">Check-ins, protocols & emergency preferences</p>
              </div>
            </button>

            <button
              onClick={() => {
                setCurrentScreen('history');
                setIsMoreOpen(false);
              }}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-left text-xs font-bold text-brand-text flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p>Activity History</p>
                <p className="text-[11px] text-brand-muted font-normal">Incident timeline and audit records</p>
              </div>
            </button>

            <button
              onClick={() => {
                setCurrentScreen('settings');
                setIsMoreOpen(false);
              }}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-left text-xs font-bold text-brand-text flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-brand-teal flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <p>Profile & Settings</p>
                <p className="text-[11px] text-brand-muted font-normal">Account, discreet mode, PIN & permissions</p>
              </div>
            </button>

            <button
              onClick={() => {
                setCurrentScreen('trusted_dashboard');
                setIsMoreOpen(false);
              }}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-left text-xs font-bold text-brand-text flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-aqua text-brand-teal flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <p>Responder Console</p>
                <p className="text-[11px] text-brand-muted font-normal">Trusted circle responder dashboard</p>
              </div>
            </button>
          </div>
        </div>
      )}

      <EmergencyMessageModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />
    </>
  );
};
