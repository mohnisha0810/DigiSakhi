import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { EmergencyMessageModal } from '@/components/safety/EmergencyMessageModal';
import { DigiSakhiLogo } from '@/components/common/DigiSakhiLogo';
import {
  ShieldAlert,
  EyeOff,
  Bell,
  Settings,
  Lock,
  LogOut,
  UserCheck,
  X,
  Shield,
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
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  return (
    <header className="lg:hidden bg-white/95 backdrop-blur border-b border-[#E8E1F3] sticky top-0 z-30 px-4 h-16 flex items-center justify-between shadow-subtle">
      {/* Brand Mark with Official Logo */}
      <div
        onClick={() => setCurrentScreen('home')}
        className="cursor-pointer"
      >
        <DigiSakhiLogo size="sm" subtitle="For Her. With Her. Always." />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Emergency SOS Quick Button */}
        <button
          onClick={() => setIsEmergencyOpen(true)}
          className="px-2.5 py-1.5 rounded-xl bg-[#D92D45] hover:bg-[#B71C32] text-white text-xs font-black flex items-center gap-1 shadow-xs animate-pulse active:scale-95 cursor-pointer"
          title="Instant Emergency SOS Broadcast"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>SOS</span>
        </button>

        {/* Quick Exit */}
        <button
          onClick={triggerQuickExit}
          className="px-2.5 py-1.5 rounded-xl bg-[#FAF9FF] hover:bg-[#F2EDFF] text-[#211638] border border-[#E8E1F3] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Instant camouflage disguise (Esc)"
        >
          <EyeOff className="w-3.5 h-3.5 text-[#D92D45]" />
          <span>Exit</span>
        </button>

        {/* Profile Trigger */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5517C8] to-[#365BFF] text-white text-xs font-black flex items-center justify-center uppercase shadow-xs cursor-pointer"
        >
          {currentUser.full_name?.charAt(0) || 'U'}
        </button>
      </div>

      {/* Mobile Profile & Settings Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl p-6 border-t border-[#E8E1F3] shadow-elevated space-y-4 max-h-[85vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1F3]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5517C8] to-[#365BFF] text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                  {currentUser.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h4 className="font-extrabold text-[#211638] text-sm">
                    {currentUser.full_name}
                  </h4>
                  <p className="text-xs text-[#716B80]">{currentUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 text-[#716B80] hover:text-[#211638]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs font-bold">
              <button
                onClick={() => {
                  setCurrentScreen('settings');
                  setIsMenuOpen(false);
                }}
                className="w-full p-3 rounded-xl bg-[#FAF9FF] hover:bg-[#F2EDFF] text-left text-[#211638] flex items-center gap-2.5 transition-colors"
              >
                <Settings className="w-4 h-4 text-[#5517C8]" />
                <span>Profile & Settings (Privacy, Camouflage, PIN)</span>
              </button>

              <button
                onClick={() => {
                  setCurrentScreen('safety_setup');
                  setIsMenuOpen(false);
                }}
                className="w-full p-3 rounded-xl bg-[#FAF9FF] hover:bg-[#F2EDFF] text-left text-[#211638] flex items-center gap-2.5 transition-colors"
              >
                <Shield className="w-4 h-4 text-[#365BFF]" />
                <span>Safety Setup (Check-ins, Protocols, Emergency)</span>
              </button>

              <button
                onClick={() => {
                  setIsAuthOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full p-3 rounded-xl bg-[#FAF9FF] hover:bg-[#F2EDFF] text-left text-[#211638] flex items-center gap-2.5 transition-colors"
              >
                <UserCheck className="w-4 h-4 text-[#08C9E8]" />
                <span>Switch / Authenticate Account</span>
              </button>

              <button
                onClick={() => {
                  signOut();
                  setIsMenuOpen(false);
                }}
                className="w-full p-3 rounded-xl bg-[#FFF1F3] hover:bg-red-100 text-left text-[#D92D45] flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <EmergencyMessageModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />
    </header>
  );
};
