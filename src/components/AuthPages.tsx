import React, { useState, useEffect } from 'react';
import { Mail, Lock, User as UserIcon, ShieldAlert, ArrowRight, Eye, EyeOff, Loader2, KeyRound, CheckCircle, Info } from 'lucide-react';
import { User } from '../types.js';

interface AuthPagesProps {
  view: 'login' | 'register' | 'forgot';
  onAuthSuccess: (user: User, token: string) => void;
  darkMode: boolean;
}

export default function AuthPages({ view, onAuthSuccess, darkMode }: AuthPagesProps) {
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'forgot' | 'verify'>(view);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Verification helpers
  const [verifyToken, setVerifyToken] = useState('');

  // Register flow: email -> OTP verify -> set details & password
  const [registerStep, setRegisterStep] = useState<'email' | 'otp' | 'details'>('email');
  const [regOtpCode, setRegOtpCode] = useState('');
  const [pendingToken, setPendingToken] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Forgot Password Helpers
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetRequested, setResetRequested] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1a. Register Step 1: send an OTP to the entered email
  const handleRegisterSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not send the verification code.');
      }

      setSuccessMsg('A 6-digit verification code has been sent to your email.');
      setRegisterStep('otp');
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while sending the code.');
    } finally {
      setLoading(false);
    }
  };

  // 1b. Register Step 2: verify the OTP proves ownership of the email
  const handleRegisterVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regOtpCode) {
      setErrorMsg('Please enter the 6-digit code from your email.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: regOtpCode }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'That code did not match. Please try again.');
      }

      setPendingToken(data.token);
      setSuccessMsg('Email verified! Now finish setting up your account.');
      setRegisterStep('details');
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // 1c. Register Step 3: set the account's real name & password
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !password) {
      setErrorMsg('Please fill in your first name, last name, mobile number and a password.');
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setErrorMsg('Mobile number must be exactly 10 digits.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pendingToken}`
        },
        body: JSON.stringify({ name: fullName, phone: phone.trim(), password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not finish setting up your account.');
      }

      setSuccessMsg('Account created! Redirecting to your dashboard...');
      setTimeout(() => {
        onAuthSuccess(data.user, pendingToken);
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while finishing setup.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Verification Code
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyToken) {
      setErrorMsg('Please enter the verification code from your email.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: verifyToken }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed.');
      }

      setSuccessMsg('Your security code was confirmed. Redirecting...');
      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Code matching failed.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        // If unverified, guide to verification flow
        if (response.status === 403 && data.unverified) {
          setErrorMsg('Email verification required. A fresh code has been sent to your inbox.');
          setTimeout(() => {
            setCurrentView('verify');
          }, 800);
          return;
        }
        throw new Error(data.message || 'Incorrect email or password.');
      }

      setSuccessMsg('Logged in successfully! Loading toolkit dashboard...');
      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid details.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit Forgot Password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please specify your registered email.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not initiate reset.');
      }

      setSuccessMsg('If that email is registered, a recovery code has been sent to it.');
      setResetRequested(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Reset initiation failed.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Submit Password Reset
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryToken || !newPassword) {
      setErrorMsg('Both recovery code and matching password are required.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: recoveryToken, newPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not verify recovery actions.');
      }

      setSuccessMsg('Your password was updated! Navigate back to login.');
      setResetCompleted(true);
      setTimeout(() => {
        setCurrentView('login');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Password update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden transition-colors duration-300 ${
      darkMode ? 'bg-slate-900 text-gray-100' : 'bg-slate-50 text-gray-800'
    }`}>
      {/* Ambient floating background accents */}
      <div className="absolute top-1/4 -left-16 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl -z-0 pointer-events-none animate-floatSlow" />
      <div className="absolute bottom-1/4 -right-16 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-3xl -z-0 pointer-events-none animate-floatSlower" />

      <div className="w-full max-w-md relative z-10">

        {/* Form Card */}
        <div key={currentView} className={`w-full p-8 rounded-2xl border transition-colors duration-300 relative animate-fadeInUp ${
          darkMode ? 'bg-slate-850 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-lg'
        }`}>
          <div className="text-center mb-8">
            <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 inline-block mb-3 animate-scaleIn">
              <KeyRound className="w-6 h-6" />
            </span>

            {currentView === 'login' && (
              <>
                <h2 className="font-display text-2xl font-bold tracking-tight text-gradient-brand">Welcome Back</h2>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Sign in to download your QA templates and notes
                </p>
              </>
            )}

            {currentView === 'register' && (
              <>
                <h2 className="font-display text-2xl font-bold tracking-tight text-gradient-brand">Create Your Account</h2>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Unlock instant premium access to the full kit
                </p>
              </>
            )}

            {currentView === 'forgot' && (
              <>
                <h2 className="font-display text-2xl font-bold tracking-tight text-gradient-brand">Forgot Password</h2>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Reset your account credentials securely
                </p>
              </>
            )}

            {currentView === 'verify' && (
              <>
                <h2 className="font-display text-2xl font-bold tracking-tight text-gradient-brand">Verify Your Email</h2>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Provide the registration code to complete activation
                </p>
              </>
            )}
          </div>

          {/* Error notification banner */}
          {errorMsg && (
            <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-start gap-2.5 text-xs animate-scaleIn">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Verification Alert:</span> {errorMsg}
              </div>
            </div>
          )}

          {/* Success notification banner */}
          {successMsg && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-start gap-2.5 text-xs animate-scaleIn">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Success Processed:</span> {successMsg}
              </div>
            </div>
          )}

          {/* --- 1. LOGIN SUB-VIEW --- */}
          {currentView === 'login' && (
            <div className="space-y-4">
              <form onSubmit={handleLoginSubmit} id="auth-login-form" className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-gray-500">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className={`w-full text-sm pl-10 pr-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                      }`}
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setCurrentView('forgot')}
                      className="text-xs font-semibold text-emerald-500 hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={`w-full text-sm pl-10 pr-10 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-emerald-500"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  id="login-submit-btn"
                  className="w-full mt-2 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition flex items-center justify-center gap-2 btn-modern btn-shine cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 disabled:opacity-50 text-sm"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Sign In To Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-6 text-xs text-gray-500 font-medium">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('register');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-emerald-500 font-bold hover:underline"
                >
                  Sign Up Now
                </button>
              </div>
            </div>
          )}

          {/* --- 2. REGISTER SUB-VIEW (email verify first, then set name/password) --- */}
          {currentView === 'register' && (
            <div className="space-y-4">
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 mb-2">
                {(['email', 'otp', 'details'] as const).map((step, idx) => (
                  <React.Fragment key={step}>
                    {idx > 0 && <div className={`w-6 h-0.5 ${
                      (['email', 'otp', 'details'] as const).indexOf(registerStep) >= idx ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`} />}
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      (['email', 'otp', 'details'] as const).indexOf(registerStep) >= idx
                        ? 'bg-emerald-500 text-white'
                        : darkMode ? 'bg-slate-800 text-gray-500' : 'bg-slate-200 text-gray-500'
                    }`}>
                      {idx + 1}
                    </span>
                  </React.Fragment>
                ))}
              </div>

              {/* Step 1: Email */}
              {registerStep === 'email' && (
                <form onSubmit={handleRegisterSendOtp} id="auth-register-form" className="space-y-4">
                  <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 rounded-xl text-2xs text-emerald-500 flex items-start gap-2 leading-relaxed">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>We'll email you a 6-digit code to confirm this address belongs to you before creating your account.</div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-gray-500">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className={`w-full text-sm pl-10 pr-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    id="register-send-otp-btn"
                    className="w-full mt-2 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition flex items-center justify-center gap-2 btn-modern cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 disabled:opacity-50 text-sm"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Verify Email</span>}
                  </button>
                </form>
              )}

              {/* Step 2: OTP */}
              {registerStep === 'otp' && (
                <form onSubmit={handleRegisterVerifyOtp} className="space-y-4">
                  <div className="p-3 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/15 rounded-xl text-2xs text-indigo-400 flex items-start gap-2 leading-relaxed">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>We emailed a 6-digit code to <strong>{email}</strong>. Check your inbox (and spam folder) and enter it below.</div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-gray-500 text-center">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      value={regOtpCode}
                      onChange={(e) => setRegOtpCode(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      className={`w-full text-center text-2xl font-mono tracking-widest py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                      }`}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    id="register-verify-otp-btn"
                    className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition flex items-center justify-center gap-2 btn-modern cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50 text-sm"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Verify Code</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRegisterStep('email');
                      setRegOtpCode('');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="w-full text-center text-xs font-semibold text-gray-500 hover:text-emerald-500 hover:underline pt-1"
                  >
                    Change Email / Resend Code
                  </button>
                </form>
              )}

              {/* Step 3: Details + Password */}
              {registerStep === 'details' && (
                <form onSubmit={handleCompleteRegistration} className="space-y-4">
                  <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 rounded-xl text-2xs text-emerald-500 flex items-start gap-2 leading-relaxed">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>Email verified! Just a few more details to finish creating your account.</div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-gray-500">
                      Verified Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        readOnly
                        disabled
                        className={`w-full text-sm pl-10 pr-3 py-2.5 rounded-xl border cursor-not-allowed ${
                          darkMode ? 'bg-slate-900 border-slate-800 text-gray-400' : 'bg-slate-100 border-slate-200 text-gray-500'
                        }`}
                      />
                      <CheckCircle className="absolute right-3 top-3 w-4 h-4 text-emerald-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-gray-500">
                        First Name
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="John"
                          className={`w-full text-sm pl-10 pr-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                          }`}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-gray-500">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className={`w-full text-sm px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-gray-500">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <span className={`absolute left-3 top-2.5 text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>+91</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        maxLength={10}
                        pattern="\d{10}"
                        title="Enter a 10-digit mobile number"
                        className={`w-full text-sm pl-11 pr-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                        }`}
                        required
                      />
                    </div>
                    {phone.length > 0 && phone.length < 10 && (
                      <p className="text-[10px] text-amber-500 mt-1">Enter all 10 digits ({phone.length}/10)</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-gray-500">
                      Choose Secure Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className={`w-full text-sm pl-10 pr-10 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-emerald-500"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    id="register-submit-btn"
                    className="w-full mt-2 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition flex items-center justify-center gap-2 btn-modern cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 disabled:opacity-50 text-sm"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Create Premium Profile</span>}
                  </button>
                </form>
              )}

              <div className="text-center mt-6 text-xs text-gray-500 font-medium">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('login');
                    setRegisterStep('email');
                    setRegOtpCode('');
                    setPendingToken('');
                    setFirstName('');
                    setLastName('');
                    setPhone('');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-emerald-500 font-bold hover:underline"
                >
                  Log In
                </button>
              </div>
            </div>
          )}

          {/* --- 3. FORGOT / RESET SUB-VIEW --- */}
          {currentView === 'forgot' && (
            <div className="space-y-4">
              {!resetRequested ? (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-gray-500">
                      Your Registered Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className={`w-full text-sm pl-10 pr-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition flex items-center justify-center gap-2 btn-modern cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50 text-sm"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Request Recovery Token</span>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  {/* Reset notification details */}
                  <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/20 text-xs text-amber-500 flex items-start gap-2.5">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold">Reset Request Sent:</span> Check your email for the 6-digit recovery code, then enter it below.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-gray-500">
                      6-Digit Recovery Token
                    </label>
                    <input
                      type="text"
                      value={recoveryToken}
                      onChange={(e) => setRecoveryToken(e.target.value)}
                      placeholder="Enter Token"
                      className={`w-full text-center tracking-widest text-lg font-mono py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-gray-500">
                      Choose New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className={`w-full text-sm pl-10 pr-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 btn-modern btn-modern cursor-pointer shadow-lg text-sm"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Update Secure Password</span>}
                  </button>
                </form>
              )}

              <div className="text-center mt-6 text-xs text-gray-500 font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('login');
                    setResetRequested(false);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-emerald-500 font-bold hover:underline"
                >
                  Back To Login
                </button>
              </div>
            </div>
          )}

          {/* --- 4. VERIFY EMAIL SUB-VIEW --- */}
          {currentView === 'verify' && (
            <form onSubmit={handleVerifySubmit} className="space-y-5">
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 flex items-start gap-2.5">
                <Info className="w-4.5 h-4.5 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold">Verification Email Sent:</span> Check your inbox (and spam folder) for the activation code and enter it below.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-gray-500 text-center">
                  6-Digit Security Token
                </label>
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className={`w-full text-center text-2xl font-mono tracking-widest py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                  }`}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                id="verify-submit-btn"
                className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition flex items-center justify-center gap-2 btn-modern cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50 text-sm"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Confirm Activation</span>}
              </button>

              <div className="text-center text-xs text-gray-550 font-medium">
                Want to skip or retry?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-emerald-500 font-bold hover:underline"
                >
                  Back To Login
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
