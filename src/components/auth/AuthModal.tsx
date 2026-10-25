import React, { useState, useEffect } from 'react';
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
  Eye,
  EyeOff,
  CheckCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'signin' | 'signup';
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'signin',
  onClose,
  onSuccess,
}) => {
  const { signIn, signUp } = useSafeSphere();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [medicalInfo, setMedicalInfo] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation checks
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify both entries.');
        return;
      }
    } else {
      if (!password) {
        setErrorMsg('Please enter your password.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
        setSuccessMsg('Signed in successfully.');
        setTimeout(() => {
          onClose();
          onSuccess?.();
        }, 300);
      } else {
        await signUp({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phoneNumber: phone.trim() || undefined,
          medicalInfo: medicalInfo.trim() || undefined,
        });
        setSuccessMsg('Account created successfully! Starting safety onboarding...');
        setTimeout(() => {
          onClose();
          onSuccess?.();
        }, 400);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-brand-border rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-brand-muted hover:text-brand-text p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-teal to-teal-400 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
            <Shield className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-brand-text">
              {mode === 'signin' ? 'Sign In to DigiSakhi' : 'Create Protected Account'}
            </h3>
            <p className="text-xs text-brand-muted">
              {backendMode === 'supabase_cloud'
                ? 'Protected via Supabase Auth & PostgreSQL'
                : 'DigiSakhi Secure Storage (Encrypted & Isolated)'}
            </p>
          </div>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-brand-peach border border-brand-coral/40 rounded-xl text-brand-coral text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Success Feedback */}
        {successMsg && (
          <div className="mb-4 p-3.5 bg-brand-aqua border border-brand-teal/40 rounded-xl text-brand-deepTeal text-xs flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle className="w-4 h-4 shrink-0 text-brand-teal" />
            <span className="font-bold">{successMsg}</span>
          </div>
        )}

        {/* Tab switch */}
        <div className="flex border-b border-brand-border mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-all ${
              mode === 'signin'
                ? 'border-brand-teal text-brand-teal'
                : 'border-transparent text-brand-muted hover:text-brand-text'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-all ${
              mode === 'signup'
                ? 'border-brand-teal text-brand-teal'
                : 'border-transparent text-brand-muted hover:text-brand-text'
            }`}
          >
            Get Started (Register)
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-brand-text mb-1">
                Full Name <span className="text-brand-coral">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-brand-text mb-1">
              Email Address <span className="text-brand-coral">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="you@digisakhi.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text mb-1">
              Password <span className="text-brand-coral">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-xl pl-9 pr-10 py-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-brand-muted hover:text-brand-text"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-brand-text mb-1">
                Confirm Password <span className="text-brand-coral">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl pl-9 pr-10 py-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-brand-muted hover:text-brand-text"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-brand-text mb-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20"
                />
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="p-3 bg-brand-aqua/40 border border-brand-teal/20 rounded-xl text-[11px] text-brand-muted leading-relaxed">
            <span className="font-bold text-brand-deepTeal">Privacy Notice: </span>
            Your credentials and location coordinates are protected. Location is never shared without your active authorization.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-teal hover:bg-brand-deepTeal disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-teal transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </span>
            ) : mode === 'signin' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Log In to DigiSakhi</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Get Started & Setup Safety</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
