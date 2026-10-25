import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import {
  Users,
  Clock,
  ShieldAlert,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  LogIn,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const { signIn, signUp } = useSafeSphere();

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

  return (
    <div className="min-h-screen bg-[#FAF9FF] text-[#211638] flex flex-col font-sans selection:bg-[#5517C8]/20 selection:text-[#5517C8]">
      {/* 1. COMPACT TOP HEADER */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/digisakhi-official-logo.png"
            alt="DigiSakhi"
            className="h-8 sm:h-9 object-contain"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setErrorMsg(null);
          }}
          className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-[#5517C8] hover:text-[#351078] bg-[#F2EDFF] hover:bg-[#E2D6FF] rounded-xl transition-all cursor-pointer active:scale-95"
        >
          {mode === 'signin' ? 'Create Account' : 'Sign In'}
        </button>
      </header>

      {/* 2. MAIN ADAPTIVE CONTAINER
          - On mobile (< lg): flex-col with order-1 for Login Card, order-2 for Branding & Features
          - On desktop (lg+): balanced 2-column layout (Branding Left, Login Right)
      */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-between gap-8 lg:gap-12">
        
        {/* =========================================================================
            LOGIN & REGISTRATION PANEL
            - On mobile: order-1 (appears FIRST at the top of the screen)
            - On desktop: order-2 (appears on the right column)
        ========================================================================= */}
        <div className="w-full max-w-md order-1 lg:order-2">
          <div className="bg-white rounded-3xl border border-[#E8E1F3] shadow-card p-5 sm:p-7 relative">
            
            {/* Mobile-Only Brand Header inside the form card */}
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4 pb-3 border-b border-[#E8E1F3]">
              <img
                src="/digisakhi-official-logo.png"
                alt="DigiSakhi"
                className="h-7 object-contain"
              />
              <span className="text-[11px] font-bold text-[#5517C8] tracking-wide">
                • For Her. With Her. Always.
              </span>
            </div>

            {/* Tab switch: Log In vs Create Account */}
            <div className="flex bg-[#F2EDFF]/70 p-1 rounded-2xl border border-[#E8E1F3] mb-4 sm:mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
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
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white text-[#5517C8] shadow-xs'
                    : 'text-[#716B80] hover:text-[#211638]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form Heading */}
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-black text-[#211638] tracking-tight">
                {mode === 'signin' ? 'Sign in to DigiSakhi' : 'Create your account'}
              </h2>
              <p className="text-xs text-[#716B80] mt-0.5">
                {mode === 'signin'
                  ? 'Access your saved safety circle, journeys, and settings.'
                  : 'Start your protected safety journey in 30 seconds.'}
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-3.5 p-3 bg-[#FFF1F3] border border-[#D92D45]/30 rounded-xl text-[#D92D45] text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="mb-3.5 p-3 bg-[#EAF7FF] border border-[#08C9E8]/30 rounded-xl text-[#16865C] text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16865C]" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
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
                    className="absolute right-3 top-3 text-[#716B80] hover:text-[#211638] cursor-pointer"
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
                        className="absolute right-3 top-3 text-[#716B80] hover:text-[#211638] cursor-pointer"
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

              {/* Primary Purple-Blue Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 mt-1"
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

            {/* Switch Mode Toggle Link */}
            <div className="mt-4 pt-3.5 border-t border-[#E8E1F3] text-center text-xs">
              <span className="text-[#716B80]">
                {mode === 'signin' ? "Don't have an account yet?" : 'Already have an account?'}
              </span>{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setErrorMsg(null);
                }}
                className="font-extrabold text-[#5517C8] hover:text-[#351078] hover:underline cursor-pointer"
              >
                {mode === 'signin' ? 'Get Started' : 'Log In'}
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            BRANDING INTRODUCTION & THREE FEATURES
            - On mobile: order-2 (appears SECOND and THIRD underneath the login card)
            - On desktop: order-1 (appears on the left column)
        ========================================================================= */}
        <div className="flex-1 max-w-xl text-left space-y-5 order-2 lg:order-1">
          
          {/* A. Brand Logo and Tagline (Desktop & Mobile) */}
          <div className="space-y-3">
            <div className="hidden lg:inline-block p-2 bg-white rounded-2xl border border-[#E8E1F3] shadow-card">
              <img
                src="/digisakhi-official-logo.png"
                alt="DigiSakhi — For Her. With Her. Always."
                className="h-16 lg:h-18 object-contain"
              />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2EDFF] border border-[#5517C8]/20">
              <span className="w-2 h-2 rounded-full bg-[#08C9E8] animate-pulse" />
              <span className="text-xs font-bold text-[#351078] tracking-wide">
                DigiSakhi • For Her. With Her. Always.
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#211638] tracking-tight leading-tight">
              Your freedom deserves to{' '}
              <span className="bg-gradient-to-r from-[#5517C8] via-[#365BFF] to-[#08C9E8] bg-clip-text text-transparent">
                feel safe.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-[#716B80] leading-relaxed max-w-lg">
              Stay connected to your trusted circle, check in during your journeys, and access safety support when it matters.
            </p>
          </div>

          {/* B. THREE FEATURES
              - CRITICAL MANDATORY REQUIREMENT:
                Must be VERTICAL on mobile (grid-cols-1), stacked one below another.
                On desktop: lg:grid-cols-3 or balanced cards.
          */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-1">
            
            {/* Feature 1 — Trusted Circle */}
            <div className="p-3.5 bg-white rounded-2xl border border-[#E8E1F3] shadow-subtle hover:border-[#5517C8]/30 transition-all flex lg:flex-col items-center lg:items-start gap-3 lg:gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#F2EDFF] text-[#5517C8] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-[#211638] mb-0.5">
                  Trusted Circle
                </h3>
                <p className="text-[11px] text-[#716B80] leading-snug">
                  Stay connected with people you trust.
                </p>
              </div>
            </div>

            {/* Feature 2 — Smart Safety Check-ins */}
            <div className="p-3.5 bg-white rounded-2xl border border-[#E8E1F3] shadow-subtle hover:border-[#365BFF]/30 transition-all flex lg:flex-col items-center lg:items-start gap-3 lg:gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#EAF7FF] text-[#365BFF] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-[#211638] mb-0.5">
                  Smart Safety Check-ins
                </h3>
                <p className="text-[11px] text-[#716B80] leading-snug">
                  Confirm your safety during your journeys.
                </p>
              </div>
            </div>

            {/* Feature 3 — Emergency Support */}
            <div className="p-3.5 bg-white rounded-2xl border border-[#E8E1F3] shadow-subtle hover:border-[#D92D45]/30 transition-all flex lg:flex-col items-center lg:items-start gap-3 lg:gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#FFF1F3] text-[#D92D45] flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-[#211638] mb-0.5">
                  Emergency Support
                </h3>
                <p className="text-[11px] text-[#716B80] leading-snug">
                  Access your configured emergency actions when needed.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="pt-1 flex items-center gap-2 text-[11px] text-[#716B80]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16865C] shrink-0" />
            <span>Privacy-first architecture: Location is only shared upon explicit user confirmation or overdue escalation.</span>
          </div>
        </div>

      </main>

      {/* 3. CLEAN COMPACT FOOTER */}
      <footer className="w-full border-t border-[#E8E1F3] py-4 text-center text-xs text-[#716B80]">
        <p>© {new Date().getFullYear()} DigiSakhi • For Her. With Her. Always.</p>
      </footer>
    </div>
  );
};
