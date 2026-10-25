import React from 'react';
import {
  CheckCircle2,
  Clock,
  Radio,
  UserCheck,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export type BadgeStatus =
  | 'active'
  | 'pending'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'accepted'
  | 'declined'
  | 'acknowledged'
  | 'responding'
  | 'overdue'
  | 'in_grace_period'
  | 'escalated'
  | 'resolved'
  | 'completed'
  | 'cancelled'
  | 'urgent'
  | 'low'
  | 'medium'
  | 'high';

interface StatusBadgeProps {
  status: BadgeStatus | string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  size = 'sm',
}) => {
  const normStatus = status.toLowerCase().replace(/\s+/g, '_');

  const getSizeClasses = () =>
    size === 'md' ? 'text-xs px-3 py-1 gap-1.5' : 'text-[10px] px-2.5 py-0.5 gap-1';

  switch (normStatus) {
    case 'active':
      return (
        <span
          className={`font-bold uppercase tracking-wider rounded-full bg-[#F2EDFF] text-[#351078] border border-[#5517C8]/30 inline-flex items-center shadow-2xs ${getSizeClasses()} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#5517C8] animate-pulse" />
          <span>Active</span>
        </span>
      );

    case 'pending':
    case 'awaiting_acceptance':
    case 'notification_pending':
      return (
        <span
          className={`font-bold uppercase tracking-wider rounded-full bg-amber-50 text-[#C87912] border border-amber-300 inline-flex items-center ${getSizeClasses()} ${className}`}
        >
          <Clock className="w-3 h-3 text-[#C87912]" />
          <span>Pending</span>
        </span>
      );

    case 'sending':
      return (
        <span
          className={`font-bold uppercase tracking-wider rounded-full bg-amber-50 text-amber-800 border border-amber-300 inline-flex items-center animate-pulse ${getSizeClasses()} ${className}`}
        >
          <Clock className="w-3 h-3 text-amber-600 animate-spin" />
          <span>Sending SMS</span>
        </span>
      );

    case 'sent':
      return (
        <span
          className={`font-bold uppercase tracking-wider rounded-full bg-[#F2EDFF] text-[#365BFF] border border-[#365BFF]/30 inline-flex items-center ${getSizeClasses()} ${className}`}
        >
          <Radio className="w-3 h-3 text-[#365BFF]" />
          <span>SMS Sent</span>
        </span>
      );

    case 'delivered':
      return (
        <span
          className={`font-bold uppercase tracking-wider rounded-full bg-[#16865C]/10 text-[#16865C] border border-[#16865C]/30 inline-flex items-center ${getSizeClasses()} ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-[#16865C]" />
          <span>Delivered</span>
        </span>
      );

    case 'failed':
      return (
        <span
          className={`font-bold uppercase tracking-wider rounded-full bg-red-50 text-[#D92D45] border border-red-200 inline-flex items-center ${getSizeClasses()} ${className}`}
        >
          <AlertTriangle className="w-3 h-3 text-[#D92D45]" />
          <span>Delivery Failed</span>
        </span>
      );

    case 'accepted':
      return (
        <span
          className={`font-bold uppercase tracking-wider rounded-full bg-[#16865C]/10 text-[#16865C] border border-[#16865C]/30 inline-flex items-center ${getSizeClasses()} ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-[#16865C]" />
          <span>Accepted</span>
        </span>
      );

    case 'declined':
      return (
        <span
          className={`font-bold uppercase tracking-wider rounded-full bg-slate-100 text-brand-muted border border-brand-border inline-flex items-center ${getSizeClasses()} ${className}`}
        >
          <XCircle className="w-3 h-3 text-brand-muted" />
          <span>Declined</span>
        </span>
      );

    case 'acknowledged':
      return (
        <span
          className={`font-bold uppercase tracking-wider rounded-full bg-brand-lavender text-brand-violet border border-violet-300 inline-flex items-center ${getSizeClasses()} ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-brand-violet" />
          <span>Acknowledged</span>
        </span>
      );

    case 'responding':
      return (
        <span
          className={`font-bold uppercase tracking-wider rounded-full bg-brand-aqua text-brand-deepTeal border border-brand-teal/40 inline-flex items-center shadow-xs animate-pulse ${getSizeClasses()} ${className}`}
        >
          <Radio className="w-3 h-3 text-brand-teal" />
          <span>Responding</span>
        </span>
      );

    case 'overdue':
    case 'in_grace_period':
    case 'escalated':
      return (
        <span
          className={`font-bold uppercase tracking-wider rounded-full bg-red-50 text-[#D92D45] border border-red-300 inline-flex items-center shadow-xs animate-pulse-subtle ${getSizeClasses()} ${className}`}
        >
          <AlertTriangle className="w-3 h-3 text-[#D92D45]" />
          <span>{normStatus === 'in_grace_period' ? 'In Grace Period' : 'Overdue'}</span>
        </span>
      );

    case 'resolved':
    case 'completed':
      return (
        <span
          className={`font-bold uppercase tracking-wider rounded-full bg-slate-100 text-[#211638] border border-[#E8E1F3] inline-flex items-center ${getSizeClasses()} ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-[#16865C]" />
          <span>{normStatus === 'completed' ? 'Completed' : 'Resolved'}</span>
        </span>
      );

    case 'cancelled':
      return (
        <span
          className={`font-bold uppercase tracking-wider rounded-full bg-slate-100 text-[#716B80] border border-[#E8E1F3] inline-flex items-center ${getSizeClasses()} ${className}`}
        >
          <XCircle className="w-3 h-3 text-[#716B80]" />
          <span>Cancelled</span>
        </span>
      );

    case 'urgent':
      return (
        <span
          className={`font-bold uppercase tracking-wider rounded-full bg-[#D92D45] text-white border border-transparent shadow-xs inline-flex items-center animate-pulse ${getSizeClasses()} ${className}`}
        >
          <ShieldAlert className="w-3 h-3 text-white" />
          <span>Urgent Priority</span>
        </span>
      );

    case 'high':
      return (
        <span
          className={`font-bold uppercase tracking-wider rounded-full bg-brand-peach text-brand-coral border border-coral-200 inline-flex items-center ${getSizeClasses()} ${className}`}
        >
          <span>High Priority</span>
        </span>
      );

    case 'medium':
      return (
        <span
          className={`font-bold uppercase tracking-wider rounded-full bg-brand-lavender text-brand-violet border border-violet-200 inline-flex items-center ${getSizeClasses()} ${className}`}
        >
          <span>Medium Priority</span>
        </span>
      );

    case 'low':
    default:
      return (
        <span
          className={`font-bold uppercase tracking-wider rounded-full bg-brand-aqua/80 text-brand-deepTeal border border-teal-200 inline-flex items-center ${getSizeClasses()} ${className}`}
        >
          <span>{normStatus.replace('_', ' ')}</span>
        </span>
      );
  }
};
