import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { AddContactModal } from './AddContactModal';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  triggerWhatsAppShare,
  triggerSmsShare,
  buildInvitationMessage,
} from '@/lib/messaging';
import {
  Users,
  UserPlus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Clock,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Phone,
  Mail,
  MessageSquare,
  Share2,
  RefreshCw,
} from 'lucide-react';

export const ContactList: React.FC = () => {
  const {
    contacts,
    reorderContacts,
    removeContact,
    invitations,
    currentUser,
    syncPendingInvitations,
  } = useSafeSphere();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedMsgToken, setCopiedMsgToken] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const acceptedContacts = contacts
    .filter((c) => c.status === 'accepted')
    .sort((a, b) => a.escalation_order - b.escalation_order);

  const pendingContacts = contacts.filter((c) => c.status !== 'accepted');

  const moveContact = (index: number, direction: 'up' | 'down') => {
    const newArr = [...acceptedContacts];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newArr.length) return;

    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;

    reorderContacts(newArr);
  };

  const showFeedback = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const updated = await syncPendingInvitations();
      if (!updated) {
        showFeedback('Checked invitation status: waiting for recipient to accept.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const getInviteUrl = (token: string, contact: any) => {
    const origin =
      typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost:5173')
        ? window.location.origin
        : 'https://safesphere-liart.vercel.app';
    return `${origin}/invite?token=${token}&inviter=${encodeURIComponent(currentUser.full_name)}&name=${encodeURIComponent(contact.full_name)}&rel=${encodeURIComponent(contact.relationship)}&phone=${encodeURIComponent(contact.phone_number)}`;
  };

  const getFullMessage = (token: string, contact: any) => {
    const inviteUrl = getInviteUrl(token, contact);
    return buildInvitationMessage({
      inviterName: currentUser.full_name,
      relationship: contact.relationship,
      inviteUrl,
    });
  };

  const handleWhatsApp = (contact: any, token: string) => {
    const message = getFullMessage(token, contact);
    showFeedback(`Opening WhatsApp for ${contact.full_name}...`);
    const res = triggerWhatsAppShare(contact.phone_number, message);
    if (!res.success) {
      showFeedback(res.error || 'Could not open WhatsApp.');
    }
  };

  const handleSms = (contact: any, token: string) => {
    const message = getFullMessage(token, contact);
    const res = triggerSmsShare(contact.phone_number, message);
    if (!res.success) {
      showFeedback(res.error || 'Could not open SMS.');
    } else if (!res.isMobile) {
      showFeedback(`Invitation message copied! Paste it into your messaging app to send to ${contact.full_name}.`);
    } else {
      showFeedback(`Opening Messages app for ${contact.full_name}...`);
    }
  };

  const handleCopyInviteLink = (token: string, contact: any) => {
    const url = getInviteUrl(token, contact);
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    showFeedback('Invitation link copied to clipboard!');
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleCopyMessage = (contact: any, token: string) => {
    const message = getFullMessage(token, contact);
    navigator.clipboard.writeText(message);
    setCopiedMsgToken(token);
    showFeedback(`Complete invitation message for ${contact.full_name} copied to clipboard!`);
    setTimeout(() => setCopiedMsgToken(null), 2500);
  };

  const handleOpenRecipientPage = (token: string, contact: any) => {
    const url = getInviteUrl(token, contact);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8E1F3] shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#351078] bg-[#F2EDFF] px-3 py-1 rounded-full border border-[#5517C8]/20">
            Trusted Safety Circle
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#211638] mt-2 tracking-tight">
            Trusted Circle & Escalation Order
          </h1>
          <p className="text-sm text-[#716B80] mt-1 max-w-2xl leading-relaxed">
            Contacts in your escalation chain receive alerts sequentially when check-in deadlines are missed or urgent distress is signaled. Unverified contacts cannot receive alerts.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          Add Trusted Contact
        </button>
      </div>

      {/* Floating Feedback Banner */}
      {feedbackNotice && (
        <div className="p-3 bg-[#F2EDFF] border border-[#5517C8]/20 rounded-xl text-[#351078] text-xs font-semibold flex items-center gap-2 shadow-xs animate-fadeIn">
          <Check className="w-4 h-4 text-[#5517C8] shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

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

        {contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Establish Your Trusted Safety Circle"
            description="Your circle members receive notifications sequentially during check-in escalations and distress situations."
            actionLabel="Add Trusted Contact"
            onAction={() => setIsAddModalOpen(true)}
            variant="teal"
          />
        ) : acceptedContacts.length === 0 ? (
          <div className="p-5 rounded-2xl bg-[#F2EDFF]/40 border border-[#5517C8]/20 space-y-2 text-center py-6">
            <div className="w-10 h-10 rounded-full bg-[#F2EDFF] text-[#5517C8] flex items-center justify-center mx-auto mb-2 border border-[#5517C8]/20">
              <Clock className="w-5 h-5 text-[#5517C8]" />
            </div>
            <h4 className="font-extrabold text-[#211638] text-sm">
              {pendingContacts.length} Contact(s) Saved — Awaiting Recipient Acceptance
            </h4>
            <p className="text-xs text-[#716B80] max-w-lg mx-auto leading-relaxed">
              Your trusted contacts are listed below in the Pending Invitations section. Click the <strong>WhatsApp</strong> or <strong>SMS</strong> button next to each contact to send their invite link directly to their phone.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {acceptedContacts.map((contact, index) => (
              <div
                key={contact.id}
                className="py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/80 px-3 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F2EDFF] text-[#351078] font-black text-sm flex items-center justify-center border border-[#5517C8]/20 shrink-0">
                    #{contact.escalation_order}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-extrabold text-[#211638] text-sm">{contact.full_name}</p>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-[#211638] border border-slate-200">
                        {contact.relationship}
                      </span>
                      {contact.can_view_location && (
                        <span
                          className="text-[10px] text-[#5517C8] font-bold flex items-center gap-0.5 bg-[#F2EDFF] px-2 py-0.5 rounded-full border border-[#5517C8]/20"
                          title="Authorized to view location during active incidents"
                        >
                          <MapPin className="w-3 h-3" />
                          GPS
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#716B80] mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        <Mail className="w-3 h-3" />
                        {contact.email}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3" />
                        {contact.phone_number}
                      </span>
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

      {/* Pending Invitations Section (Unverified) */}
      <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-brand-border">
          <div>
            <h3 className="font-extrabold text-brand-text text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Pending Contact Invitations (Awaiting Recipient Acceptance)</span>
            </h3>
            <p className="text-xs text-brand-muted mt-0.5">
              These contacts have been saved but have not yet accepted on their phone. Use WhatsApp, SMS, or link sharing to send their verification link.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {pendingContacts.length > 0 && (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-lg border border-[#5517C8]/30 bg-[#F2EDFF] hover:bg-[#EAF7FF] text-[#5517C8] text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                title="Check server to see if any recipient has accepted"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Checking...' : 'Check Status'}</span>
              </button>
            )}
            <span className="text-xs text-amber-600 font-mono font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              {pendingContacts.length} pending
            </span>
          </div>
        </div>

        {pendingContacts.length === 0 ? (
          <p className="text-xs text-brand-muted py-4">No pending invitations. All circle members are active and verified.</p>
        ) : (
          <div className="space-y-3">
            {pendingContacts.map((contact) => {
              const matchedInv = invitations.find(
                (i) =>
                  i.invitee_email.toLowerCase() === contact.email.toLowerCase() ||
                  (contact.phone_number && i.invitee_phone === contact.phone_number)
              );

              const token = matchedInv?.invitation_token || 'inv_pending';

              return (
                <div
                  key={contact.id}
                  className="p-4 rounded-xl bg-slate-50 border border-brand-border flex flex-wrap items-center justify-between gap-4 text-xs transition-colors hover:bg-slate-100/60"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-brand-text text-sm">{contact.full_name}</span>
                      <StatusBadge status="pending" />
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white text-brand-muted border border-brand-border">
                        {contact.relationship}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-brand-muted text-[11px] flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3" />
                        {contact.phone_number}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Mail className="w-3 h-3" />
                        {contact.email}
                      </span>
                    </div>
                  </div>

                  {/* Actions for Pending Contacts: Direct WhatsApp, SMS, Copy, Review */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {matchedInv?.invitation_token && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleWhatsApp(contact, token)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-[0.98]"
                          title="Open WhatsApp chat with pre-filled invitation"
                        >
                          <Phone className="w-3.5 h-3.5 fill-current" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSms(contact, token)}
                          className="px-3 py-1.5 bg-[#5517C8] hover:bg-[#4510AB] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-[0.98]"
                          title="Open phone Messages app (or copy message on desktop)"
                        >
                          <MessageSquare className="w-3.5 h-3.5 fill-current" />
                          <span>SMS</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyMessage(contact, token)}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-[#211638] border border-[#E8E1F3] rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                          title="Copy complete invitation text to clipboard"
                        >
                          {copiedMsgToken === token ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#16865C]" />
                              <span className="text-[#16865C]">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#716B80]" />
                              <span>Copy Msg</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyInviteLink(token, contact)}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-[#211638] border border-[#E8E1F3] rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                          title="Copy verification link only"
                        >
                          {copiedToken === token ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#16865C]" />
                              <span className="text-[#16865C]">Link!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#716B80]" />
                              <span>Link</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenRecipientPage(token, contact)}
                          className="px-2.5 py-1.5 bg-[#F2EDFF] hover:bg-[#EAF7FF] text-[#351078] border border-[#5517C8]/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                          title="Test recipient acceptance screen in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => removeContact(contact.id)}
                      className="p-1.5 text-brand-muted hover:text-brand-coral hover:bg-brand-peach rounded-lg transition-colors ml-1"
                      title="Cancel invitation and remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
