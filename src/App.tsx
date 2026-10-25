import React, { useState, useEffect } from 'react';
import { SafeSphereProvider, useSafeSphere } from '@/store/SafeSphereContext';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { MobileNav } from '@/components/layout/MobileNav';
import { QuickExitModal } from '@/components/layout/QuickExitModal';
import { SafetySetupScreen } from '@/components/safety/SafetySetupScreen';
import { ProfileAndSettingsScreen } from '@/components/settings/ProfileAndSettingsScreen';
import { UserDashboard } from '@/components/dashboard/UserDashboard';
import { JourneyScreen } from '@/components/journey/JourneyScreen';
import { ContactList } from '@/components/contacts/ContactList';
import { ActivityHistoryScreen } from '@/components/history/ActivityHistoryScreen';
import { TrustedDashboard } from '@/components/trusted/TrustedDashboard';
import { IncidentDetails } from '@/components/incidents/IncidentDetails';
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton';
import { ToastContainer } from '@/components/common/ToastContainer';
import { InvitationResponseScreen } from '@/components/contacts/InvitationResponseScreen';
import {
  AlertCircle,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';

const MainScreenRouter: React.FC = () => {
  const { currentScreen, isLoading, error, successMessage, dismissError, dismissSuccess, isCloud } =
    useSafeSphere();

  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
      case 'dashboard':
        return <UserDashboard />;
      case 'journeys':
      case 'journey_active':
      case 'map_view':
        return <JourneyScreen />;
      case 'circle':
      case 'contacts':
        return <ContactList />;
      case 'safety_setup':
      case 'protocols':
      case 'protocol_builder':
      case 'my_safety':
      case 'distress_panel':
      case 'checkin_active':
        return <SafetySetupScreen />;
      case 'history':
        return <ActivityHistoryScreen />;
      case 'incident_details':
        return <IncidentDetails />;
      case 'settings':
      case 'privacy_settings':
      case 'account_settings':
      case 'notifications_inbox':
        return <ProfileAndSettingsScreen />;
      case 'trusted_dashboard':
        return <TrustedDashboard />;
      default:
        return <UserDashboard />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Global Error Banner */}
      {error && (
        <div className="p-3.5 bg-brand-peach border border-coral-200 rounded-xl text-brand-coral text-xs flex items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-brand-coral shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            onClick={dismissError}
            className="text-brand-coral hover:text-red-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Success Banner */}
      {successMessage && (
        <div className="p-3.5 bg-brand-aqua border border-teal-200 rounded-xl text-brand-deepTeal text-xs flex items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={dismissSuccess}
            className="text-brand-deepTeal hover:text-teal-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Local Adapter Security Transparency Banner */}
      {!isCloud && showDisclaimer && (
        <div className="p-3 bg-white border border-amber-200 rounded-xl text-xs text-brand-muted flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-brand-text">Local Development Storage Active: </span>
              All safety protocols, contacts, and check-ins persist across browser refreshes.
              For production Supabase PostgreSQL and Row Level Security, supply <code className="text-brand-teal bg-brand-aqua px-1.5 py-0.2 rounded font-mono">VITE_SUPABASE_URL</code>.
            </div>
          </div>
          <button
            onClick={() => setShowDisclaimer(false)}
            className="text-brand-muted hover:text-brand-text p-1"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main routed view */}
      {isLoading ? <DashboardSkeleton /> : renderScreen()}
    </div>
  );
};

export const App: React.FC = () => {
  const [isInvitePath, setIsInvitePath] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.startsWith('/invite') ||
      new URLSearchParams(window.location.search).has('token')
    );
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const invite =
        window.location.pathname.startsWith('/invite') ||
        new URLSearchParams(window.location.search).has('token');
      setIsInvitePath(invite);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  if (isInvitePath) {
    return (
      <SafeSphereProvider>
        <InvitationResponseScreen
          onContinueToApp={() => {
            window.history.pushState({}, '', '/');
            setIsInvitePath(false);
          }}
        />
        <ToastContainer />
      </SafeSphereProvider>
    );
  }

  return (
    <SafeSphereProvider>
      <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col font-sans">
        {/* Unified Layout: Sidebar on Desktop + Header/BottomNav on Mobile */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Desktop Sidebar Navigation */}
          <SidebarNav />

          {/* Mobile Top Header */}
          <MobileHeader />

          {/* Main Content Area */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-12">
            <MainScreenRouter />
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <MobileNav />

        {/* Global Toast Notifications */}
        <ToastContainer />

        {/* Discreet Emergency Camouflage Screen (Overlay) */}
        <QuickExitModal />
      </div>
    </SafeSphereProvider>
  );
};

export default App;
