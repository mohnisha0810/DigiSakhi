import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  User,
  Users,
  Sliders,
  MapPin,
  Clock,
} from 'lucide-react';

export const SetupRoadmap: React.FC = () => {
  const {
    currentUser,
    contacts,
    protocols,
    locationPermission,
    checkIns,
    activeCheckIn,
    setCurrentScreen,
  } = useSafeSphere();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Real conditions evaluated against actual state
  const isProfileComplete = Boolean(
    currentUser.full_name &&
    currentUser.phone_number &&
    (currentUser.emergency_notes || currentUser.medical_info)
  );

  const hasAcceptedContact = contacts.filter((c) => c.status === 'accepted').length >= 1;

  const hasProtocol = protocols.length >= 1;

  const hasReviewedLocation = locationPermission === 'granted' || locationPermission === 'denied';

  const hasTriedCheckIn = checkIns.length >= 1 || activeCheckIn !== null;

  const steps = [
    {
      id: 'profile',
      title: 'Complete your profile',
      description: 'Emergency medical notes & phone number for circle contacts',
      completed: isProfileComplete,
      icon: User,
      action: () => setCurrentScreen('account_settings'),
      actionLabel: 'Edit Profile',
    },
    {
      id: 'contact',
      title: 'Add a trusted contact',
      description: 'Verify at least one primary responder for escalation',
      completed: hasAcceptedContact,
      icon: Users,
      action: () => setCurrentScreen('circle'),
      actionLabel: 'Manage Circle',
    },
    {
      id: 'protocol',
      title: 'Create a safety protocol',
      description: 'Customize reminder leads, grace periods, and responder sequence',
      completed: hasProtocol,
      icon: Sliders,
      action: () => setCurrentScreen('protocols'),
      actionLabel: 'Set Protocols',
    },
    {
      id: 'location',
      title: 'Review location permissions',
      description: 'Choose when live coordinates are shared with your circle',
      completed: hasReviewedLocation,
      icon: MapPin,
      action: () => setCurrentScreen('journeys'),
      actionLabel: 'Inspect Map',
    },
    {
      id: 'checkin',
      title: 'Start a safety check-in',
      description: 'Run your first timed safety session with automatic escalation',
      completed: hasTriedCheckIn,
      icon: Clock,
      action: () => setCurrentScreen('my_safety'),
      actionLabel: 'Schedule Check-in',
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  // If all completed, users can keep it collapsed
  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-card overflow-hidden transition-all">
      {/* Roadmap Header */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-lavender text-brand-violet flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-brand-text text-sm sm:text-base">
                Set up your safety roadmap
              </h3>
              <span className="text-[11px] font-bold text-brand-teal bg-brand-aqua px-2.5 py-0.5 rounded-full border border-teal-200">
                {completedCount} of {steps.length} completed
              </span>
            </div>
            <p className="text-xs text-brand-muted mt-0.5">
              Personalize your trusted circle and automated rules for maximum protection.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-teal to-brand-violet rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-brand-text font-mono">
              {progressPercent}%
            </span>
          </div>

          <button
            type="button"
            className="p-1 text-brand-muted hover:text-brand-text"
            aria-label={isCollapsed ? 'Expand roadmap' : 'Collapse roadmap'}
          >
            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Roadmap Steps */}
      {!isCollapsed && (
        <div className="px-5 pb-5 pt-1 border-t border-brand-border/60">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-3">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.id}
                  onClick={step.action}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    step.completed
                      ? 'bg-brand-aqua/30 border-teal-200/80 hover:bg-brand-aqua/50'
                      : 'bg-slate-50/80 border-brand-border hover:border-brand-violet/50 hover:bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          step.completed
                            ? 'bg-brand-teal text-white'
                            : 'bg-white text-brand-violet border border-brand-border shadow-xs'
                        }`}
                      >
                        {step.completed ? (
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <StepIcon className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-brand-muted">
                        0{idx + 1}
                      </span>
                    </div>

                    <h4
                      className={`text-xs font-bold leading-tight ${
                        step.completed ? 'text-brand-deepTeal line-through' : 'text-brand-text'
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-brand-muted mt-1 leading-snug">
                      {step.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-brand-border/50 flex items-center justify-between text-[11px] font-bold text-brand-teal group-hover:text-brand-deepTeal">
                    <span>{step.completed ? 'Completed' : step.actionLabel}</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
