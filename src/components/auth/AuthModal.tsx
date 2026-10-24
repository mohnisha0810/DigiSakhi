import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { backendMode } from '@/lib/backend';
import {
  Shield,
  Lock,
  Mail,
  User,
  Phone,
  AlertCircle,
  X,
  LogIn,
  UserPlus,
  ArrowRight,
} from 'lucide-react';

export const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { signIn, signUp, allProfiles, switchUserAccount, currentUser } = useSafeSphere();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [medicalInfo, setMedicalInfo] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
        onClose();
      } else {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.');
        }
        await signUp({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phoneNumber: phone.trim() || undefined,
          medicalInfo: medicalInfo.trim() || undefined,
        });
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (profId: string) => {
    switchUserAccount(profId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-brand-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-brand-muted hover:text-brand-text transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-aqua text-brand-teal flex items-center justify-center shadow-xs">
            <Shield className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-brand-text">
              {mode === 'signin' ? 'Sign In to SafeSphere' : 'Create Protected Account'}
            </h3>
            <p className="text-xs text-brand-muted">
              {backendMode === 'supabase_cloud'
                ? 'Authenticated via Supabase Auth & PostgreSQL'
                : 'Local Development Auth (Persistent Storage)'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-brand-peach/70 border border-brand-coral/40 rounded-xl text-brand-coral text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab switch */}
        <div className="flex border-b border-brand-border mb-4">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${
              mode === 'signin'
                ? 'border-brand-teal text-brand-teal'
                : 'border-transparent text-brand-muted hover:text-brand-text'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${
              mode === 'signup'
                ? 'border-brand-teal text-brand-teal'
                : 'border-transparent text-brand-muted hover:text-brand-text'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg pl-9 pr-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="name@safesphere.demo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-lg pl-9 pr-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-lg pl-9 pr-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg pl-9 pr-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1">
                  Medical & Emergency Info (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Asthma, Blood type A+"
                  value={medicalInfo}
                  onChange={(e) => setMedicalInfo(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              'Authenticating...'
            ) : mode === 'signin' ? (
              <>
                <LogIn className="w-4 h-4" />
                Sign In to SafeSphere
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Account & Initialize Protocols
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Accounts Selection */}
        <div className="mt-6 pt-4 border-t border-brand-border">
          <p className="text-[11px] font-bold text-brand-muted uppercase tracking-wider mb-2">
            Quick Fast-Login (Demo Profiles)
          </p>
          <div className="space-y-1.5">
            {allProfiles.map((p) => {
              const isCurrent = p.id === currentUser.id;
              const isElena = p.id === 'usr_elena_01';
              return (
                <button
                  key={p.id}
                  onClick={() => handleQuickDemoLogin(p.id)}
                  className={`w-full p-2 rounded-xl text-left text-xs transition-colors flex items-center justify-between border ${
                    isCurrent
                      ? 'bg-brand-aqua/40 border-brand-teal/40 text-brand-teal'
                      : 'bg-brand-bg border-brand-border text-brand-text hover:bg-brand-lavender/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center font-bold text-[10px]">
                      {p.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-brand-text">
                        {p.full_name} {isElena ? '(User)' : '(Contact)'}
                      </p>
                      <p className="text-[10px] text-brand-muted">{p.email}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-brand-muted" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
