import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { notificationService } from '@/lib/notifications';
import {
  Bell,
  Eye,
  EyeOff,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import { EmptyState } from '@/components/common/EmptyState';

export const NotificationInbox: React.FC = () => {
  const { notifications, currentUser, updateUserProfile } = useSafeSphere();

  const [discreetPreview, setDiscreetPreview] = useState(currentUser.discreet_lockscreen_mask);
  const [permissionState, setPermissionState] = useState<string>(
    notificationService.getPermissionState()
  );

  const handleRequestPush = async () => {
    const res = await notificationService.requestPermission();
    setPermissionState(res);
  };

  const handleToggleDiscreet = (val: boolean) => {
    setDiscreetPreview(val);
    updateUserProfile({ discreet_lockscreen_mask: val });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-teal bg-brand-aqua/60 px-2.5 py-0.5 rounded-full border border-brand-teal/20">
            Multi-Channel Notification Center
          </span>
          <h1 className="text-2xl font-bold text-brand-text mt-1.5 flex items-center gap-2">
            Notification Delivery & Audit Tray
          </h1>
          <p className="text-xs text-brand-muted mt-1 max-w-2xl leading-relaxed">
            Realtime delivery status verification. We never falsely claim external SMS or push notifications were delivered unless confirmed by the provider.
          </p>
        </div>

        {/* Discreet preview toggle */}
        <div className="flex items-center gap-2 bg-brand-bg px-3.5 py-2 rounded-xl border border-brand-border text-xs shadow-xs">
          {discreetPreview ? (
            <EyeOff className="w-4 h-4 text-amber-600" />
          ) : (
            <Eye className="w-4 h-4 text-brand-muted" />
          )}
          <span className="text-brand-text font-semibold">Lockscreen Masking:</span>
          <button
            onClick={() => handleToggleDiscreet(!discreetPreview)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
              discreetPreview ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text'
            }`}
          >
            {discreetPreview ? 'Enabled (Masked)' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Browser Notification Permission Banner */}
      <div className="p-4 bg-white border border-brand-border rounded-2xl shadow-card flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-aqua text-brand-teal flex items-center justify-center shadow-xs">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-brand-text">
              Live Browser Push Notification Gateway
            </p>
            <p className="text-brand-muted text-[11px]">
              Status: <strong className="text-brand-teal uppercase font-bold">{permissionState}</strong>
              {permissionState !== 'granted' && ' (Currently using in-app demo safety tray)'}
            </p>
          </div>
        </div>

        {permissionState !== 'granted' && (
          <button
            onClick={handleRequestPush}
            className="px-3.5 py-1.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal transition-all"
          >
            Enable Device Push Notifications
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-brand-text text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-teal" />
            Notification Dispatch History
          </h3>
          <span className="text-xs text-brand-muted font-mono">
            {notifications.length} logged
          </span>
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No Notifications Dispatched"
            description="Trigger a distress code, smart check-in, or journey alert to see delivery audit records."
          />
        ) : (
          <div className="divide-y divide-brand-border">
            {notifications.map((notif) => (
              <div key={notif.id} className="py-4 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-brand-text">
                      To: {notif.recipient_name} ({notif.recipient_email})
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-bg text-brand-muted border border-brand-border">
                      Channel: {notif.channel}
                    </span>
                  </div>

                  <span className="text-[11px] text-brand-muted font-mono">
                    {formatDateTime(notif.created_at)} ({formatRelativeTime(notif.created_at)})
                  </span>
                </div>

                <p className="text-sm font-bold text-brand-text">
                  {discreetPreview ? notif.masked_message || notif.subject : notif.subject}
                </p>

                <p className="text-xs text-brand-muted leading-relaxed">
                  {discreetPreview
                    ? 'Calendar reminder: A scheduled appointment requires your attention.'
                    : notif.message}
                </p>

                {/* Delivery Verification Notice */}
                <div className="pt-1 flex items-center gap-2 text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1 font-bold ${
                      notif.status === 'delivered' ? 'text-brand-teal' : 'text-amber-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {notif.provider_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
