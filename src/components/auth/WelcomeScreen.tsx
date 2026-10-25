import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { backendMode } from '@/lib/backend';
import {
  ShieldCheck,
  Clock,
  PhoneCall,
  Users,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  LogIn,
  UserPlus,
  Compass,
} from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const { signIn, signUp, allProfiles, switchUserAccount } = useSafeSphere();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

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
      } else {
        await signUp({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phoneNumber: phone.trim() || undefined,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (profId: string) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await switchUserAccount(profId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to switch demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9FF] text-[#211638] flex flex-col font-sans selection:bg-[#5517C8]/20 selection:text-[#5517C8]">
      {/* Top Navbar */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/digisakhi-official-logo.png"
            alt="DigiSakhi"
            className="h-10 sm:h-12 object-contain"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setErrorMsg(null);
            }}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-[#5517C8] hover:text-[#351078] bg-[#F2EDFF] hover:bg-[#E2D6FF] rounded-xl transition-all"
          >
            {mode === 'signin' ? 'Create Account' : 'Sign In'}
          </button>
        </div>
      </header>

      {/* Main Two-Column Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
        {/* Left / Primary Section: Brand Story & Reassuring Highlights */}
        <div className="flex-1 max-w-xl text-left space-y-6">
          {/* Official Full Logo Display */}
          <div className="space-y-4">
            <div className="inline-block p-2 bg-white rounded-2xl border border-[#E8E1F3] shadow-card">
              <img
                src="/digisakhi-official-logo.png"
                alt="DigiSakhi — For Her. With Her. Always."
                className="h-20 sm:h-24 object-contain"
              />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2EDFF] border border-[#E8E1F3]">
              <span className="w-2 h-2 rounded-full bg-[#08C9E8] animate-pulse" />
              <span className="text-xs font-bold text-[#5517C8] tracking-wide">
                For Her. With Her. Always.
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#211638] tracking-tight leading-tight">
              Your freedom deserves to{' '}
              <span className="bg-gradient-to-r from-[#5517C8] via-[#365BFF] to-[#08C9E8] bg-clip-text text-transparent">
                feel safe.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[#716B80] leading-relaxed max-w-lg">
              Stay connected to your trusted circle, check in during your journeys, and access safety support when it matters.
            </p>
          </div>

          {/* Three Focused Line-Icon Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            {/* Feature 1: Trusted Circle */}
            <div className="p-3.5 bg-white rounded-2xl border border-[#E8E1F3] shadow-subtle hover:border-[#5517C8]/30 transition-all">
              <div className="w-8 h-8 rounded-xl bg-[#F2EDFF] text-[#5517C8] flex items-center justify-center mb-2.5">
                <Users className="w-4 h-4 stroke-[2.2]" />
              </div>
              <h3 className="text-xs font-bold text-[#211638] mb-0.5">Trusted Circle</h3>
              <p className="text-[11px] text-[#716B80] leading-snug">
                Connect primary Tier 1 and backup Tier 2 responders.
              </p>
            </div>

            {/* Feature 2: Smart Check-ins */}
            <div className="p-3.5 bg-white rounded-2xl border border-[#E8E1F3] shadow-subtle hover:border-[#365BFF]/30 transition-all">
              <div className="w-8 h-8 rounded-xl bg-[#EAF7FF] text-[#365BFF] flex items-center justify-center mb-2.5">
                <Clock className="w-4 h-4 stroke-[2.2]" />
              </div>
              <h3 className="text-xs font-bold text-[#211638] mb-0.5">Safety Check-ins</h3>
              <p className="text-[11px] text-[#716B80] leading-snug">
                Configurable countdowns with gentle prompt reminders.
              </p>
            </div>

            {/* Feature 3: Emergency Support */}
            <div className="p-3.5 bg-white rounded-2xl border border-[#E8E1F3] shadow-subtle hover:border-[#D92D45]/30 transition-all">
              <div className="w-8 h-8 rounded-xl bg-[#FFF1F3] text-[#D92D45] flex items-center justify-center mb-2.5">
                <PhoneCall className="w-4 h-4 stroke-[2.2]" />
              </div>
              <h3 className="text-xs font-bold text-[#211638] mb-0.5">Emergency Support</h3>
              <p className="text-[11px] text-[#716B80] leading-snug">
                1-tap dialer for 112 Helpline & live GPS alert dispatches.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2 text-xs text-[#716B80]">
            <Lock className="w-3.5 h-3.5 text-[#5517C8]" />
            <span>Privacy-first: Location data is only shared with your explicit authorization.</span>
          </div>
        </div>

        {/* Right / Secondary Section: Refined Login & Registration Card */}
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl border border-[#E8E1F3] shadow-elevated p-6 sm:p-8 relative">
            {/* Tab switch: Log In vs Create Account */}
            <div className="flex bg-[#F2EDFF]/60 p-1 rounded-2xl border border-[#E8E1F3] mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  mode === 'signin'
                    ? 'bg-white text-[#5517C8] shadow-xs'
                    : 'text-[#716B80] hover:text-[#211638]'
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
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  mode === 'signup'
                    ? 'bg-white text-[#5517C8] shadow-xs'
                    : 'text-[#716B80] hover:text-[#211638]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-[#FFF1F3] border border-[#D92D45]/30 rounded-xl text-[#D92D45] text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="mb-4 p-3 bg-[#EAF7FF] border border-[#08C9E8]/30 rounded-xl text-[#16865C] text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16865C]" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-[#211638] mb-1">
                    Full Name <span className="text-[#D92D45]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#716B80] absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#FAF9FF] border border-[#E8E1F3] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#211638] focus:outline-none focus:border-[#5517C8] focus:ring-2 focus:ring-[#5517C8]/15"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#211638] mb-1">
                  Email Address <span className="text-[#D92D45]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#716B80] absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#FAF9FF] border border-[#E8E1F3] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#211638] focus:outline-none focus:border-[#5517C8] focus:ring-2 focus:ring-[#5517C8]/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#211638] mb-1">
                  Password <span className="text-[#D92D45]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#716B80] absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#FAF9FF] border border-[#E8E1F3] rounded-xl pl-9 pr-10 py-2.5 text-xs text-[#211638] focus:outline-none focus:border-[#5517C8] focus:ring-2 focus:ring-[#5517C8]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#716B80] hover:text-[#211638]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#211638] mb-1">
                      Confirm Password <span className="text-[#D92D45]">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#716B80] absolute left-3 top-3" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-[#FAF9FF] border border-[#E8E1F3] rounded-xl pl-9 pr-10 py-2.5 text-xs text-[#211638] focus:outline-none focus:border-[#5517C8] focus:ring-2 focus:ring-[#5517C8]/15"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-[#716B80] hover:text-[#211638]"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#211638] mb-1">
                      Mobile Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#716B80] absolute left-3 top-3" />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-[#FAF9FF] border border-[#E8E1F3] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#211638] focus:outline-none focus:border-[#5517C8] focus:ring-2 focus:ring-[#5517C8]/15"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Primary Purple Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-extrabold shadow-purple transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 mt-2"
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
                    <span>Create Protected Account</span>
                  </>
                )}
              </button>
            </form>

            {/* Toggle link */}
            <div className="mt-4 pt-4 border-t border-[#E8E1F3] text-center text-xs">
              <span className="text-[#716B80]">
                {mode === 'signin' ? "Don't have an account yet?" : 'Already have an account?'}
              </span>{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setErrorMsg(null);
                }}
                className="font-bold text-[#5517C8] hover:underline"
              >
                {mode === 'signin' ? 'Get Started' : 'Log In'}
              </button>
            </div>

            {/* Quick Demo Access for Judges */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                className="text-[11px] font-semibold text-[#716B80] hover:text-[#5517C8] transition-colors"
              >
                {showDemoAccounts ? 'Hide Demo Logins' : 'Judging / Evaluation Demo Accounts ▾'}
              </button>

              {showDemoAccounts && (
                <div className="mt-3 p-3 bg-[#FAF9FF] rounded-xl border border-[#E8E1F3] space-y-1.5 text-left animate-fadeIn">
                  <p className="text-[10px] font-bold text-[#716B80] uppercase tracking-wider">
                    Fast Evaluation Sign-In:
                  </p>
                  {allProfiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleQuickDemoLogin(p.id)}
                      disabled={loading}
                      className="w-full p-2 rounded-lg bg-white hover:bg-[#F2EDFF] border border-[#E8E1F3] text-xs flex items-center justify-between text-left transition-colors"
                    >
                      <span className="font-semibold text-[#211638]">
                        {p.full_name} <span className="text-[10px] text-[#716B80]">({p.id === 'usr_elena_01' ? 'User' : 'Contact'})</span>
                      </span>
                      <ArrowRight className="w-3 h-3 text-[#5517C8]" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#E8E1F3] py-5 text-center text-xs text-[#716B80]">
        <p>© {new Date().getFullYear()} DigiSakhi. For Her. With Her. Always.</p>
      </footer>
    </div>
  );
};
