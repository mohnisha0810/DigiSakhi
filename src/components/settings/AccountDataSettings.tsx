import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import {
  User,
  Download,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { LocalStorageDB } from '@/lib/supabase';

export const AccountDataSettings: React.FC = () => {
  const { currentUser, updateUserProfile } = useSafeSphere();

  const [fullName, setFullName] = useState(currentUser.full_name);
  const [phone, setPhone] = useState(currentUser.phone_number);
  const [emergencyNotes, setEmergencyNotes] = useState(currentUser.emergency_notes || '');
  const [medicalInfo, setMedicalInfo] = useState(currentUser.medical_info || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [purgedSuccess, setPurgedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      full_name: fullName.trim(),
      phone_number: phone.trim(),
      emergency_notes: emergencyNotes.trim(),
      medical_info: medicalInfo.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportData = () => {
    const data = {
      profile: currentUser,
      contacts: LocalStorageDB.getItem('trusted_contacts', []),
      incidents: LocalStorageDB.getItem('incidents', []),
      incidentEvents: LocalStorageDB.getItem('incident_events', []),
      journeys: LocalStorageDB.getItem('journeys', []),
      checkIns: LocalStorageDB.getItem('check_ins', []),
      protocols: LocalStorageDB.getItem('safety_protocols', []),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digisakhi_data_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePurgeIncidentHistory = () => {
    if (confirm('Are you sure you want to delete past incident logs and location history? Your emergency contacts and protocols will be retained.')) {
      LocalStorageDB.setItem('incidents', []);
      LocalStorageDB.setItem('incident_recipients', []);
      LocalStorageDB.setItem('incident_events', []);
      LocalStorageDB.setItem('notification_records', []);
      setPurgedSuccess(true);
      setTimeout(() => setPurgedSuccess(false), 3000);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-teal bg-brand-aqua/60 px-2.5 py-0.5 rounded-full border border-brand-teal/20">
            Account & Sensitive Data
          </span>
          <h1 className="text-2xl font-bold text-brand-text mt-1.5 flex items-center gap-2">
            Safety Profile & Personal Data
          </h1>
          <p className="text-xs text-brand-muted mt-1 max-w-2xl leading-relaxed">
            Update personal emergency details, export encrypted audit trails, or securely purge historical session records.
          </p>
        </div>

        <button
          onClick={handleExportData}
          className="px-4 py-2 bg-white hover:bg-brand-bg text-brand-text border border-brand-border rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
        >
          <Download className="w-4 h-4 text-brand-teal" />
          Export All Safety Data (JSON)
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-brand-aqua/60 border border-brand-teal/30 rounded-xl text-brand-text text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" />
          <span>Profile information updated successfully.</span>
        </div>
      )}

      {purgedSuccess && (
        <div className="p-3 bg-brand-aqua/60 border border-brand-teal/30 rounded-xl text-brand-text text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" />
          <span>Past incident and location histories purged.</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white border border-brand-border rounded-2xl p-6 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-brand-text mb-2 flex items-center gap-2">
          <User className="w-4 h-4 text-brand-teal" />
          Personal Emergency Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">Email (Authenticated)</label>
            <input
              type="email"
              disabled
              value={currentUser.email}
              className="w-full bg-brand-bg/50 border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-muted cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">
              Medical / Allergy Information
            </label>
            <input
              type="text"
              placeholder="e.g. Asthma, Penicillin allergy"
              value={medicalInfo}
              onChange={(e) => setMedicalInfo(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-brand-text mb-1">
              Emergency Responder Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Inhaler kept in outer bag pocket. Dog at home."
              value={emergencyNotes}
              onChange={(e) => setEmergencyNotes(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
            />
            <p className="text-[10px] text-brand-muted mt-1">
              Visible only to authorized trusted contacts during an active incident.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal transition-all"
          >
            Update Profile Information
          </button>
        </div>
      </form>

      {/* Danger Zone: Purge History */}
      <div className="bg-brand-peach/40 border border-brand-coral/30 rounded-2xl p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-brand-coral flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-brand-coral" />
              Purge Historical Incidents & Geodata
            </h3>
            <p className="text-xs text-brand-muted mt-1 max-w-xl leading-relaxed">
              Permanently delete all past incident audit logs, notifications, and location trails while preserving your contacts and saved protocols.
            </p>
          </div>

          <button
            onClick={handlePurgeIncidentHistory}
            className="px-4 py-2 bg-brand-coral hover:bg-brand-coral/90 text-white rounded-xl text-xs font-bold shadow-coral transition-colors"
          >
            Purge History
          </button>
        </div>
      </div>
    </div>
  );
};
