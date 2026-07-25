import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import LogoSplash from '../components/common/LogoSplash';

const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

const fadeUpvariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25, ease: 'easeIn' } },
};

const staggerChildren = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" className="flex-shrink-0">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function Login() {
  const [mode, setMode] = useState('signin');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setFormError] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register: authRegister, loading } = useAuth();
  const from = location.state?.from?.pathname || '/dashboard';
  const stats = [
    { icon: '🚗', label: 'Vehicles', value: '248' },
    { icon: '📋', label: 'Active Jobs', value: '1.2K' },
    { icon: '📊', label: 'Utilization', value: '94%' },
  ];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '', password: '', fullName: '' },
  });

  useEffect(() => {
    if (mode === 'signin') {
      reset({ email: '', password: '', fullName: '' });
    } else {
      reset({ email: '', password: '', fullName: '' });
    }
  }, [mode, reset]);

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const onSubmit = async (data) => {
    setFormError(null);
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        const result = await login(data.email, data.password);
        if (result.success) {
          toast.success('Welcome back!');
          navigate(from, { replace: true });
          return;
        }
        if (result.status === 403) {
          setFormError('Account locked. Please contact support.');
          return;
        }
        if (result.status === 401) {
          setFormError('Invalid email or password.');
          return;
        }
        setFormError(result.message || 'Login failed.');
        return;
      }

      const result = await authRegister(data.fullName, data.email, data.password);
      if (result.success) {
        toast.success('Account created! Please sign in.');
        setMode('signin');
        reset();
        return;
      }
      setFormError(result.message || 'Registration failed.');
    } catch (err) {
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleClick = async () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google sign-in is not configured.');
      return;
    }
    setGoogleLoading(true);
    try {
      const { google } = window;
      if (!google || !google.accounts || !google.accounts.id) {
        toast.error('Google SDK not loaded. Please refresh the page.');
        return;
      }
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setGoogleLoading(false);
          return;
        }
        if (notification.isCompleted()) {
          const credential = notification.getCredential();
          handleGoogleCredential(credential);
        }
      });
    } catch (err) {
      setGoogleLoading(false);
      toast.error('Google sign-in failed.');
    }
  };

  const handleGoogleCredential = async (credential) => {
    if (!credential) {
      setGoogleLoading(false);
      return;
    }
    try {
      const { data } = await api.post('/auth/google', { credential });
      if (data?.success || data?.token) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        toast.success('Welcome!');
        navigate(from, { replace: true });
        return;
      }
      setGoogleLoading(false);
      toast.error('Google authentication failed.');
    } catch (err) {
      setGoogleLoading(false);
      const msg = err.response?.data?.message || 'Google sign-in failed.';
      toast.error(msg);
    }
  };

  if (loading) {
    return <LogoSplash label="Signing you in..." />;
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* ── Left Brand Panel ── */}
      <motion.div
        className="hidden sm:flex relative w-[50%] flex-col justify-between overflow-hidden"
        style={{ backgroundColor: '#101019' }}
        onMouseMove={handleMouseMove}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {/* Mouse-reactive gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, rgba(23,179,157,0.18), transparent 70%)`,
              transition: 'background 700ms ease',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 30% 20%, rgba(23,179,157,0.08), transparent 50%)',
            }}
          />
        </div>

        {/* Brand content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10 lg:p-14">
          <div>
            <motion.div
              className="flex items-center gap-3 mb-10"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="w-9 h-9 rounded-lg bg-brand-400 flex items-center justify-center">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-white font-bold text-lg tracking-wide" style={{ fontFamily: "'Syne', sans-serif" }}>
                RentHub
              </span>
            </motion.div>

            <motion.h1
              className="text-3xl lg:text-4xl font-bold text-white leading-snug mb-4"
              style={{ fontFamily: "'Syne', sans-serif" }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Manage rentals with{' '}
              <span className="text-brand-400">clarity</span> and confidence.
            </motion.h1>

            <motion.p
              className="text-ink-400 text-sm leading-relaxed max-w-md"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              Track every vehicle, monitor utilization, and streamline your rental operations — all from one powerful dashboard built for fleet managers.
            </motion.p>
          </div>

          <motion.div
            className="grid grid-cols-3 gap-6"
            variants={staggerChildren}
            initial="initial"
            animate="animate"
          >
            {stats.map((s) => (
              <motion.div key={s.label} variants={staggerItem} className="text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-white font-bold text-lg">{s.value}</div>
                <div className="text-ink-400 text-xs mt-1">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="text-ink-500 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.4 }}
          >
            © {new Date().getFullYear()} RentHub. All rights reserved.
          </motion.div>
        </div>
      </motion.div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 relative flex items-center justify-center bg-white overflow-hidden">
        {/* Blurred gradient orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] -translate-y-1/2 translate-x-1/2 bg-brand-400/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] translate-y-1/2 -translate-x-1/2 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Mobile compact logo */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-400 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-ink-900 font-bold text-sm tracking-wide" style={{ fontFamily: "'Syne', sans-serif" }}>
            RentHub
          </span>
        </div>

        {/* Form card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            className="relative w-full max-w-md px-6 sm:px-8"
            variants={fadeUpvariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Mode toggle */}
            <div className="flex items-center justify-center mb-8">
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-ink-100 w-full max-w-[280px]">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setFormError(null); }}
                  className={clsx(
                    'flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200',
                    mode === 'signin'
                      ? 'bg-white text-ink-900 shadow-sm'
                      : 'text-ink-400 hover:text-ink-600'
                  )}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setFormError(null); }}
                  className={clsx(
                    'flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200',
                    mode === 'signup'
                      ? 'bg-white text-ink-900 shadow-sm'
                      : 'text-ink-400 hover:text-ink-600'
                  )}
                >
                  Sign up
                </button>
              </div>
            </div>

            {/* Google Button */}
            <motion.button
              type="button"
              onClick={handleGoogleClick}
              disabled={googleLoading || submitting}
              className={clsx(
                'w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-ink-200 bg-white text-ink-900 text-sm font-medium transition-all duration-200',
                'hover:shadow-md hover:border-ink-300',
                (googleLoading || submitting) && 'opacity-50 cursor-not-allowed'
              )}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35 }}
            >
              <GoogleIcon />
              {googleLoading ? 'Connecting…' : 'Continue with Google'}
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-ink-200" />
              <span className="text-ink-400 text-xs font-medium uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-ink-200" />
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ExclamationTriangleIcon className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="text-rose-600 text-sm font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Name field — sign-up only */}
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 0, marginBottom: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-sm font-semibold text-ink-700 mb-1.5 uppercase tracking-wider">
                      Full name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-ink-400 pointer-events-none" />
                      <input
                        type="text"
                        {...register('fullName', {
                          required: mode === 'signup' ? 'Full name is required' : false,
                        })}
                        placeholder="Jane Smith"
                        className={clsx(
                          'w-full pl-11 pr-4 py-3 rounded-xl border border-ink-200 bg-white text-ink-900 text-sm placeholder:text-ink-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/15 transition-colors duration-200'
                        )}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="mt-1 text-rose-500 text-xs font-medium">{errors.fullName.message}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5 uppercase tracking-wider">
                  Email address
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-ink-400 pointer-events-none" />
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email address',
                      },
                    })}
                    placeholder="you@company.com"
                    className={clsx(
                      'w-full pl-11 pr-4 py-3 rounded-xl border border-ink-200 bg-white text-ink-900 text-sm placeholder:text-ink-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/15 transition-colors duration-200',
                      errors.email && 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/15'
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-rose-500 text-xs font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-ink-400 pointer-events-none" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'At least 6 characters' },
                    })}
                    placeholder="Enter your password"
                    className={clsx(
                      'w-full pl-11 pr-11 py-3 rounded-xl border border-ink-200 bg-white text-ink-900 text-sm placeholder:text-ink-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/15 transition-colors duration-200',
                      errors.password && 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/15'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 transition-colors"
                  >
                    {showPw
                      ? <EyeSlashIcon className="w-[18px] h-[18px]" />
                      : <EyeIcon className="w-[18px] h-[18px]" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-rose-500 text-xs font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Sign-in only: Remember me + Forgot password */}
              {mode === 'signin' && (
                <motion.div
                  className="flex items-center justify-between"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" className="w-4 h-4 rounded border-ink-300 text-brand-400 focus:ring-brand-400/20" />
                    <span className="text-sm text-ink-500">Remember me</span>
                  </label>
                  <button type="button" className="text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors">
                    Forgot password?
                  </button>
                </motion.div>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={submitting}
                className={clsx(
                  'w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-bold tracking-wide transition-all duration-200',
                  'hover:brightness-110 hover:shadow-lg',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2',
                  submitting && 'opacity-70 cursor-not-allowed'
                )}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.35 }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                  </span>
                ) : mode === 'signin' ? 'Sign in' : 'Create account'}
              </motion.button>
            </form>

            {/* Bottom helper text */}
            <motion.p
              className="mt-6 text-center text-ink-400 text-xs leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              {mode === 'signin'
                ? 'Don\'t have an account? '
                : 'Already have an account? '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setFormError(null); }}
                className="font-semibold text-brand-500 hover:text-brand-600 transition-colors"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}