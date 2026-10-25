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
import { WelcomeScreen } from '@/components/auth/WelcomeScreen';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import {
  AlertCircle,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';

const MainScreenRouter: React.FC = () => {
  const { currentScreen, isLoading, error, successMessage, dismissError, dismissSuccess } =
    useSafeSphere();

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

      {/* Main routed view */}
      {isLoading ? <DashboardSkeleton /> : renderScreen()}
    </div>
  );
};

const AppShell: React.FC = () => {
  const { isAuthenticated, currentUser, isLoading } = useSafeSphere();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  // 1. Unauthenticated visitors -> Dedicated Welcome Screen
  if (!isAuthenticated) {
    return (
      <>
        <WelcomeScreen />
        <ToastContainer />
      </>
    );
  }

  // 2. Authenticated but onboarding incomplete -> Step-by-Step 5-step Wizard
  if (!currentUser?.onboarding_completed) {
    return (
      <>
        <OnboardingWizard />
        <ToastContainer />
      </>
    );
  }

  // 3. Authenticated & Onboarding Complete -> Full personalized app layout
  return (
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
        {/* Discreet Emergency Camouflage Screen (Global Listener & Overlay) */}
        <QuickExitModal />
      </SafeSphereProvider>
    );
  }

  return (
    <SafeSphereProvider>
      <AppShell />
      {/* Discreet Emergency Camouflage Screen (Global Listener & Overlay) */}
      <QuickExitModal />
    </SafeSphereProvider>
  );
};

export default App;
