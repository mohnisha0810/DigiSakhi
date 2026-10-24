import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { AddContactModal } from './AddContactModal';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Users,
  UserPlus,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle2,
  Clock,
  Shield,
  MapPin,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const ContactList: React.FC = () => {
  const {
    contacts,
    reorderContacts,
    removeContact,
    acceptInvitation,
    invitations,
  } = useSafeSphere();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const acceptedContacts = contacts
    .filter((c) => c.status === 'accepted')
    .sort((a, b) => a.escalation_order - b.escalation_order);

  const pendingContacts = contacts.filter((c) => c.status === 'pending');

  const moveContact = (index: number, direction: 'up' | 'down') => {
    const newArr = [...acceptedContacts];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newArr.length) return;

    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;

    reorderContacts(newArr);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-teal bg-brand-aqua px-3 py-1 rounded-full border border-teal-200">
            Trusted Safety Circle
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-text mt-2 tracking-tight">
            Trusted Circle & Escalation Order
          </h1>
          <p className="text-sm text-brand-muted mt-1 max-w-2xl leading-relaxed">
            Contacts in your escalation chain receive alerts sequentially when check-in deadlines are missed or urgent distress is signaled. Unverified contacts cannot receive alerts.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal hover:shadow-hover transition-all flex items-center gap-2 active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          Add Trusted Contact
        </button>
      </div>

      {/* Escalation Hierarchy List */}
      <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-brand-border">
          <div>
            <h3 className="font-extrabold text-brand-text text-base">Escalation Chain Order</h3>
            <p className="text-xs text-brand-muted mt-0.5">
              Tier 1 contact is alerted first. If unacknowledged within protocol timeout, escalates to Tier 2.
            </p>
          </div>
          <span className="text-xs text-brand-muted font-mono font-bold">
            {acceptedContacts.length} verified responder{acceptedContacts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {acceptedContacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Establish Your Trusted Safety Circle"
            description="Your circle members receive notifications sequentially during check-in escalations and distress situations."
            actionLabel="Add Trusted Contact"
            onAction={() => setIsAddModalOpen(true)}
            variant="teal"
          />
        ) : (
          <div className="divide-y divide-brand-border">
            {acceptedContacts.map((contact, index) => (
              <div
                key={contact.id}
                className="py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/80 px-3 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-brand-aqua text-brand-deepTeal font-extrabold text-sm flex items-center justify-center border border-teal-200 shrink-0">
                    #{contact.escalation_order}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-extrabold text-brand-text text-sm">{contact.full_name}</p>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-brand-text border border-slate-200">
                        {contact.relationship}
                      </span>
                      {contact.can_view_location && (
                        <span
                          className="text-[10px] text-brand-teal font-bold flex items-center gap-0.5 bg-brand-aqua/80 px-2 py-0.5 rounded-full"
                          title="Authorized to view location during active incidents"
                        >
                          <MapPin className="w-3 h-3" />
                          GPS
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-muted mt-0.5">
                      {contact.email} • {contact.phone_number}
                    </p>
                  </div>
                </div>

                {/* Reorder and Delete Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-brand-muted font-mono mr-1">
                    Tier {contact.escalation_order}
                  </span>

                  <button
                    onClick={() => moveContact(index, 'up')}
                    disabled={index === 0}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-brand-text disabled:opacity-30 transition-colors"
                    title="Move higher in escalation chain"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => moveContact(index, 'down')}
                    disabled={index === acceptedContacts.length - 1}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-brand-text disabled:opacity-30 transition-colors"
                    title="Move lower in escalation chain"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => removeContact(contact.id)}
                    className="p-2 rounded-lg text-brand-muted hover:text-brand-coral hover:bg-brand-peach transition-colors ml-1"
                    title="Remove from circle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations Section */}
      <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-brand-border">
          <div>
            <h3 className="font-extrabold text-brand-text text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Pending Contact Invitations (Unverified)</span>
            </h3>
            <p className="text-xs text-brand-muted mt-0.5">
              These contacts have been invited but have not yet accepted. By DigiSakhi security rules, unverified contacts will not receive alerts.
            </p>
          </div>
          <span className="text-xs text-amber-600 font-mono font-bold">
            {pendingContacts.length} pending
          </span>
        </div>

        {pendingContacts.length === 0 ? (
          <p className="text-xs text-brand-muted py-4">No pending invitations.</p>
        ) : (
          <div className="space-y-3">
            {pendingContacts.map((contact) => {
              const matchedInv = invitations.find((i) => i.invitee_email === contact.email);
              return (
                <div
                  key={contact.id}
                  className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-brand-text">{contact.full_name}</span>
                      <StatusBadge status="pending" />
                    </div>
                    <p className="text-brand-muted mt-0.5">
                      {contact.email} • {contact.relationship}
                    </p>
                  </div>

                  {matchedInv && (
                    <button
                      onClick={() => acceptInvitation(matchedInv.id)}
                      className="px-3.5 py-2 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                      title="Test recipient acceptance directly in development mode"
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-600" />
                      Simulate Acceptance (Dev Test)
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddContactModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
