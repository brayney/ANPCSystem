import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, EnvelopeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import LogoSplash from '../components/common/LogoSplash';

const formatCountdown = (ms) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [invalidCredentials, setInvalidCredentials] = useState(false);
  const [attemptState, setAttemptState] = useState({ attemptsRemaining: null, lockUntil: null });
  const [backgroundImage, setBackgroundImage] = useState(() => {
    // Initialize from localStorage to avoid flicker
    return localStorage.getItem('loginBgImage') || null;
  });
  const [initializing, setInitializing] = useState(true);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Brief logo splash while the session/token is verified
    const verify = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          if (data?.user) {
            // Already authenticated — go straight to the app
            navigate('/dashboard');
            return;
          }
        } catch (err) {
          // Invalid/expired token; stay on login
        }
      }
      setInitializing(false);
    };
    verify();
  }, [navigate]);

  useEffect(() => {
    // Fetch background image
    const fetchBackground = async () => {
      try {
        const { data } = await api.get('/settings/login-background');
        if (data.success && data.data?.imageUrl) {
          setBackgroundImage(data.data.imageUrl);
          localStorage.setItem('loginBgImage', data.data.imageUrl);
        } else {
          localStorage.removeItem('loginBgImage');
        }
      } catch (err) {
        // No background image set, use default
      }
    };
    fetchBackground();
  }, []);

  if (initializing) {
    return <LogoSplash label="Loading your workspace..." />;
  }

  if (loading) {
    return <LogoSplash label="Signing you in..." />;
  }

  const updateForm = (field, value) => {
    setInvalidCredentials(false);
    setAttemptState({ attemptsRemaining: null, lockUntil: null });
    setForm({ ...form, [field]: value });
  };

  const fetchAttempts = async (email) => {
    if (!email) return;
    try {
      const { data } = await api.get(`/auth/attempts?email=${encodeURIComponent(email)}`);
      setAttemptState({ attemptsRemaining: data.attemptsRemaining ?? null, lockUntil: data.lockUntil ?? null });
    } catch (err) {
      // ignore
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await login(form.email, form.password);
    setAttemptState({
      attemptsRemaining: result.attemptsRemaining ?? null,
      lockUntil: result.lockUntil ?? null,
    });

    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
      return;
    }

    if (result.status === 403) {
      toast.error(result.message || 'Account locked due to too many failed attempts. Try again later.');
      return;
    }

    if (result.status === 401) {
      setInvalidCredentials(true);
    }

    toast.error(result.message || 'Login failed');
  };

  const lockedUntilDate = attemptState.lockUntil ? new Date(attemptState.lockUntil) : null;
  const isLocked = lockedUntilDate ? lockedUntilDate > Date.now() : false;
  const countdown = isLocked ? formatCountdown(lockedUntilDate - Date.now()) : null;
  const attemptLabel = attemptState.attemptsRemaining === 1 ? 'attempt' : 'attempts';

  return (
    <div style={{ height: '100vh', width: '100%', backgroundColor: backgroundImage ? 'transparent' : 'var(--sidebar-bg)', backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {/* Background overlay if custom image is set */}
      {backgroundImage && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', pointerEvents: 'none' }} />
      )}

      {/* Background grid + glow (only if no custom image) */}
      {!backgroundImage && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(48,54,61,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(48,54,61,0.3) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '50%', height: '60%', background: 'radial-gradient(circle, rgba(37,99,235,0.35), transparent 70%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: '45%', height: '55%', background: 'radial-gradient(circle, rgba(110,64,201,0.28), transparent 70%)', filter: 'blur(40px)' }} />
        </div>
      )}

      {/* Left panel */}
      <div style={{ position: 'absolute', inset: '0 auto 0 0', width: 'min(42vw, 560px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px', zIndex: 1, pointerEvents: 'none' }} className="hidden xl:flex">
        {/* Brand */}
        <div style={{ marginBottom: '48px' }}>
          <img
            src="/logo.png"
            alt="NASS Logo"
            style={{ height: '80px', objectFit: 'contain', filter: 'brightness(1.2) contrast(1.15)' }}
          />
        </div>

        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '42px', fontWeight: 800, color: '#f0f6fc', lineHeight: 1.15, maxWidth: '420px', marginBottom: '20px', textShadow: '0 3px 12px rgba(0,0,0,0.7)' }}>
          Yard Operations<br />
          <span style={{ color: 'var(--accent)' }}>Command Center</span>
        </h1>
        <p style={{ fontSize: '14px', color: '#e6edf3', lineHeight: 1.7, maxWidth: '360px', marginBottom: '40px', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
          Manage cranes, hooks, and attachments with precision. Track every pull-out, return, and rental from one unified dashboard.
        </p>
      </div>

      {/* Right panel — login form */}
      <div style={{ width: '100%', maxWidth: '440px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2, transform: 'translateX(clamp(0px, 10vw, 140px))' }} className="w-full">
        <div className="animate-fade-in w-full" style={{ maxWidth: '400px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '16px', padding: '36px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.12)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(37,99,235,0.5)' }}>
                <LockClosedIcon style={{ width: '20px', height: '20px', color: '#fff' }} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 800, color: '#f0f6fc', margin: 0, lineHeight: 1.2 }}>Sign in</h2>
                <p style={{ fontSize: '12px', color: '#e6edf3', margin: 0 }}>Authorized personnel only</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ marginTop: '26px' }}>
              {/* Email */}
              <div style={{ marginBottom: '16px' }}>
                <label className="label" style={{ color: 'white' }}>Email address</label>
                <div style={{ position: 'relative', marginTop: '5px' }}>
                  <EnvelopeIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '17px', height: '17px', color: 'var(--text-muted)' }} />
                  <input
                    type="email" required className="input-field"
                    placeholder="admin@anpc.com"
                    value={form.email}
                    onChange={e => updateForm('email', e.target.value)}
                    onBlur={e => fetchAttempts(e.target.value)}
                    disabled={loading || isLocked}
                    style={{ paddingLeft: '38px', backgroundColor: 'rgba(13,17,23,0.35)', borderColor: 'rgba(255,255,255,0.18)', color: '#fff' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="label" style={{ color: 'white' }}>Password</label>
                </div>
                <div style={{ position: 'relative', marginTop: '5px' }}>
                  <LockClosedIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '17px', height: '17px', color: 'var(--text-muted)' }} />
                  <input
                    type={showPw ? 'text' : 'password'} required className={`input-field ${invalidCredentials ? 'input-field-error' : ''}`}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => updateForm('password', e.target.value)}
                    disabled={loading || isLocked}
                    style={{ paddingLeft: '38px', paddingRight: '40px', backgroundColor: 'rgba(13,17,23,0.35)', borderColor: 'rgba(255,255,255,0.18)', color: '#fff' }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} disabled={loading || isLocked}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex' }}>
                    {showPw ? <EyeSlashIcon style={{ width: '16px', height: '16px' }} /> : <EyeIcon style={{ width: '16px', height: '16px' }} />}
                  </button>
                </div>
              </div>

              {/* Status / hints */}
              <div style={{ minHeight: '20px', margin: '10px 0 16px' }}>
                {isLocked ? (
                  <p style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 600 }}>
                    Account locked. Try again in {countdown}.
                  </p>
                ) : invalidCredentials ? (
                  <p style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 600 }}>
                    Invalid credentials. {attemptState.attemptsRemaining ?? 'Few'} {attemptLabel} remaining.
                  </p>
                ) : (
                  <p style={{ fontSize: '12px', color: 'rgba(230,237,243,0.75)' }}>
                    Enter your credentials to sign in.
                  </p>
                )}
              </div>

              <button type="submit" disabled={loading || isLocked} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '14px', fontWeight: 700 }}>
                {loading ? (
                  <><span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Signing in...</>
                ) : 'Sign In'}
              </button>
            </form>

            {/* Security footer */}
            <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheckIcon style={{ width: '15px', height: '15px', color: 'var(--success)' }} />
              <p style={{ fontSize: '11px', color: '#e6edf3', margin: 0 }}>
                Secured connection — all sessions are encrypted and logged.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
