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
  Settings,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { currentScreen, setCurrentScreen, currentRole, activeIncident, activeJourney, openIncidentDetails } = useSafeSphere();
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-[#E8E1F3] px-3 py-2 flex items-center justify-around shadow-card">
        {/* 1. Home */}
        <button
          onClick={() => setCurrentScreen(currentRole === 'user' ? 'home' : 'trusted_dashboard')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer ${
            isActive('home') || currentScreen === 'trusted_dashboard'
              ? 'text-[#5517C8]'
              : 'text-[#716B80] hover:text-[#211638]'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>{currentRole === 'user' ? 'Home' : 'Console'}</span>
        </button>

        {/* 2. Journeys */}
        <button
          onClick={() => setCurrentScreen('journeys')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors relative cursor-pointer ${
            isActive('journeys')
              ? 'text-[#5517C8]'
              : 'text-[#716B80] hover:text-[#211638]'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>Journeys</span>
          {activeJourney && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-[#365BFF] animate-pulse" />
          )}
        </button>

        {/* 3. Center Emergency SOS Action */}
        <button
          onClick={handleCenterAction}
          className="flex flex-col items-center justify-center -mt-6 group cursor-pointer"
        >
          <div
            className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white active:scale-95 transition-transform ${
              activeIncident
                ? 'bg-[#D92D45] text-white shadow-coral animate-pulse'
                : 'bg-[#D92D45] text-white shadow-coral'
            }`}
          >
            <ShieldAlert className="w-7 h-7 stroke-[2.3]" />
          </div>
          <span className="text-[10px] font-extrabold text-[#D92D45] mt-1">
            {activeIncident ? 'Alert Active' : 'SOS Alert'}
          </span>
        </button>

        {/* 4. Circle */}
        <button
          onClick={() => setCurrentScreen('circle')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer ${
            isActive('circle')
              ? 'text-[#5517C8]'
              : 'text-[#716B80] hover:text-[#211638]'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Circle</span>
        </button>

        {/* 5. More menu (Safety Setup, History, Settings) */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer ${
            isActive('safety_setup') || isActive('history') || isActive('settings')
              ? 'text-[#5517C8]'
              : 'text-[#716B80] hover:text-[#211638]'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>

      {/* More Navigation Drawer */}
      {isMoreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl p-6 border-t border-[#E8E1F3] shadow-elevated space-y-3 pb-8 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1F3]">
              <h4 className="font-extrabold text-[#211638] text-sm">
                More Features
              </h4>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 text-[#716B80] hover:text-[#211638]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <button
                onClick={() => {
                  setCurrentScreen('safety_setup');
                  setIsMoreOpen(false);
                }}
                className={`p-3 rounded-2xl border transition-colors flex flex-col items-center gap-1.5 ${
                  isActive('safety_setup')
                    ? 'bg-[#F2EDFF] text-[#351078] border-[#E8E1F3]'
                    : 'bg-[#FAF9FF] text-[#211638] border-[#E8E1F3] hover:bg-[#F2EDFF]'
                }`}
              >
                <Sliders className="w-5 h-5 text-[#5517C8]" />
                <span className="text-xs font-bold">Safety Setup</span>
              </button>

              <button
                onClick={() => {
                  setCurrentScreen('history');
                  setIsMoreOpen(false);
                }}
                className={`p-3 rounded-2xl border transition-colors flex flex-col items-center gap-1.5 ${
                  isActive('history')
                    ? 'bg-[#F2EDFF] text-[#351078] border-[#E8E1F3]'
                    : 'bg-[#FAF9FF] text-[#211638] border-[#E8E1F3] hover:bg-[#F2EDFF]'
                }`}
              >
                <Clock className="w-5 h-5 text-[#365BFF]" />
                <span className="text-xs font-bold">History</span>
              </button>

              <button
                onClick={() => {
                  setCurrentScreen('settings');
                  setIsMoreOpen(false);
                }}
                className={`p-3 rounded-2xl border transition-colors flex flex-col items-center gap-1.5 ${
                  isActive('settings')
                    ? 'bg-[#F2EDFF] text-[#351078] border-[#E8E1F3]'
                    : 'bg-[#FAF9FF] text-[#211638] border-[#E8E1F3] hover:bg-[#F2EDFF]'
                }`}
              >
                <Settings className="w-5 h-5 text-[#08C9E8]" />
                <span className="text-xs font-bold">Settings</span>
              </button>
            </div>
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
