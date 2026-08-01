import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import toast from 'react-hot-toast';
import LogoSplash from '../components/common/LogoSplash';

const LogoMark = () => (
  <img src="/logo.png" alt="ANPC Logo" style={{ height: 52, objectFit: 'contain' }} />
);

const EyeIcon = ({ open }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const ChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const PersonIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="7" r="3.25" />
    <path d="M5.5 21a6.5 6.5 0 0113 0" />
  </svg>
);

const GroupIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="7" r="3" />
    <circle cx="5" cy="10" r="2.5" />
    <circle cx="19" cy="10" r="2.5" />
    <path d="M6.5 21a5.5 5.5 0 0111 0M1.5 21a4.5 4.5 0 014-4.4M22.5 21a4.5 4.5 0 00-4-4.4" />
  </svg>
);

export default function LoginPage() {
  const [open, setOpen] = useState(true);
  const [loginType, setLoginType] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [invalidCredentials, setInvalidCredentials] = useState(false);
  const [attemptState, setAttemptState] = useState({ attemptsRemaining: null, lockUntil: null });
  const [backgroundImages, setBackgroundImages] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('loginBgImages') || '[]');
      return Array.isArray(saved) && saved.length ? saved : (localStorage.getItem('loginBgImage') ? [localStorage.getItem('loginBgImage')] : []);
    } catch { return []; }
  });
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [initializing, setInitializing] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          if (data?.user) {
            navigate(data.user.role === 'super_admin' ? '/company-admin' : '/dashboard');
            return;
          }
        } catch (err) {
          // ignore invalid token
        }
      }
      setInitializing(false);
    };
    verify();
  }, [navigate]);

  useEffect(() => {
    const fetchBackground = async () => {
      try {
        const { data } = await api.get('/settings/login-background');
        const images = data.images?.map(image => image.imageUrl) || (data.data?.imageUrl ? [data.data.imageUrl] : []);
        if (data.success && images.length) {
          setBackgroundImages(images);
          setBackgroundIndex(0);
          localStorage.setItem('loginBgImages', JSON.stringify(images));
          localStorage.removeItem('loginBgImage');
        } else {
          setBackgroundImages([]);
          localStorage.removeItem('loginBgImages');
          localStorage.removeItem('loginBgImage');
        }
      } catch (err) {
        // ignore
      }
    };
    fetchBackground();
  }, []);

  useEffect(() => {
    if (backgroundImages.length < 2) return undefined;
    const timer = setInterval(() => setBackgroundIndex(index => (index + 1) % backgroundImages.length), 8000);
    return () => clearInterval(timer);
  }, [backgroundImages.length]);

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, []);

  if (initializing) {
    return <div style={{ background: 'var(--sidebar-bg, #0b1220)', minHeight: '100vh' }} />;
  }

  if (isSigningIn) {
    return <LogoSplash label="Signing you in..." />;
  }

  const slideshowImages = backgroundImages.length
    ? backgroundImages
    : ['https://images.unsplash.com/photo-1659952801569-a8aebf1eef22?w=1800&h=900&fit=crop&auto=format'];
  const lockedUntilDate = attemptState.lockUntil ? new Date(attemptState.lockUntil) : null;
  const isLocked = lockedUntilDate ? lockedUntilDate > Date.now() : false;

  const fetchAttempts = async (value) => {
    if (!value) return;
    try {
      const { data } = await api.get(`/auth/attempts?email=${encodeURIComponent(value)}`);
      setAttemptState({ attemptsRemaining: data.attemptsRemaining ?? null, lockUntil: data.lockUntil ?? null });
    } catch (err) {
      // ignore
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInvalidCredentials(false);

    const result = await login(email, password, loginType);
    setAttemptState({ attemptsRemaining: result.attemptsRemaining ?? null, lockUntil: result.lockUntil ?? null });

    if (result.success) {
      try {
        setIsSigningIn(true);
        const { data } = await api.get('/dashboard');
        toast.success('Welcome back!');
        navigate(loginType === 'super_admin' ? '/company-admin' : '/dashboard', { replace: true, state: { dashboardData: data?.data || null } });
      } catch (err) {
        toast.success('Welcome back!');
        navigate(loginType === 'super_admin' ? '/company-admin' : '/dashboard', { replace: true });
      }
      return;
    }

    if (result.status === 403) {
      toast.error(result.message || 'This account cannot sign in here.');
      return;
    }

    if (result.status === 401) {
      setInvalidCredentials(true);
    }
  };

  const chooseLoginType = (type) => {
    setLoginType(type);
    setEmail('');
    setPassword('');
    setShowPw(false);
    setInvalidCredentials(false);
    setAttemptState({ attemptsRemaining: null, lockUntil: null });
  };

  const returnToLoginTypeSelection = () => {
    setLoginType(null);
    setEmail('');
    setPassword('');
    setShowPw(false);
    setInvalidCredentials(false);
    setAttemptState({ attemptsRemaining: null, lockUntil: null });
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {slideshowImages.map((imageUrl, index) => (
        <div
          key={imageUrl}
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: '#0b1220',
            filter: 'brightness(0.45) saturate(0.8)',
            opacity: index === backgroundIndex ? 1 : 0,
            transform: index === backgroundIndex && open ? 'scale(1.03)' : 'scale(1)',
            transition: 'opacity 1.4s ease-in-out, transform 8s ease-out, filter 0.9s ease',
            willChange: 'opacity, transform',
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(105deg, rgba(7,9,26,0.82) 0%, rgba(7,9,26,0.55) 55%, rgba(7,9,26,0.15) 100%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: open
            ? 'linear-gradient(to left, rgba(7,9,26,0.9) 0%, transparent 55%)'
            : 'linear-gradient(to left, rgba(7,9,26,0.4) 0%, transparent 60%)',
          transition: 'background 0.8s ease',
          pointerEvents: 'none',
        }}
      />
      <div
        className="noise"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.025,
          pointerEvents: 'none',
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          backgroundSize: '128px 128px',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 'clamp(1.75rem, 4vw, 3.5rem)',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 12,
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'opacity 0.6s ease 0.05s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.05s',
            pointerEvents: 'auto',
            marginTop: '-0.75rem',
            marginLeft: '-0.25rem',
          }}
        >
          <LogoMark />
          <div>
            <div
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#e8eaf6',
                letterSpacing: '-0.01em',
                lineHeight: 1,
              }}
            >
              ANPC
            </div>
            <div
              style={{
                fontSize: '0.625rem',
                letterSpacing: '0.14em',
                color: 'rgba(232,234,246,0.4)',
                textTransform: 'uppercase',
                marginTop: 2,
              }}
            >
              Yard Operations
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 620, width: '100%', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100%', paddingTop: '1rem', marginRight: 'auto', paddingLeft: 'clamp(0.5rem, 3vw, 1.5rem)', alignItems: 'flex-start', textAlign: 'left' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              background: 'rgba(124,110,247,0.15)',
              border: '1px solid rgba(124,110,247,0.3)',
              borderRadius: 999,
              marginBottom: '0.85rem',
              alignSelf: 'flex-start',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.65s ease 0.2s, transform 0.65s cubic-bezier(0.16,1,0.3,1) 0.2s',
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#a594f9',
                display: 'inline-block',
                boxShadow: '0 0 6px #a594f9',
              }}
            />
            <span
              style={{
                fontSize: '0.72rem',
                letterSpacing: '0.05em',
                color: '#c4b5fd',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Now Online — SarensNass
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 'clamp(3.1rem, 6.8vw, 5.25rem)',
               fontWeight: 900,
               textShadow: '0 2px 4px rgba(0,0,0,0.25)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: '#f0f2ff',
              margin: '0 0 1rem',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.7s ease 0.32s, transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.32s',
            }}
          >
            Yard Operations
            <br />
            <em
              style={{
                fontStyle: 'italic',
                fontWeight: 300,
                background: 'linear-gradient(90deg, #a594f9 0%, #e9b96e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Command Center
            </em>
          </h1>

          <p
            style={{
              fontSize: 'clamp(0.9375rem, 1.5vw, 1.0625rem)',
              lineHeight: 1.7,
              color: 'rgba(240,242,255,0.55)',
              fontWeight: 300,
              margin: '0 0 1.75rem',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.65s ease 0.44s, transform 0.65s cubic-bezier(0.16,1,0.3,1) 0.44s',
              maxWidth: '36rem',
            }}
          >
            ANPC brings crane rental operations into one secure, real-time command center where teams can manage equipment, track transactions, monitor availability, and keep every workflow aligned from planning to delivery.
          </p>

        </div>
      </div>

      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close sign-in panel' : 'Open sign-in panel'}
        style={{
          position: 'fixed',
          right: open ? 400 : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 50,
          width: 40,
          height: 88,
          background: 'rgba(14,18,48,0.85)',
          border: '1px solid rgba(124,110,247,0.3)',
          borderRadius: '12px 0 0 12px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          color: 'rgba(232,234,246,0.7)',
          backdropFilter: 'blur(16px)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
          transition: 'right 0.5s cubic-bezier(0.16,1,0.3,1), background 0.2s ease, color 0.2s ease',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(124,110,247,0.25)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(14,18,48,0.85)';
          e.currentTarget.style.color = 'rgba(232,234,246,0.7)';
        }}
      >
        {open ? <ChevronRight /> : <ChevronLeft />}
        <span
          style={{
            fontSize: '0.6rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 600,
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            lineHeight: 1,
            marginTop: 2,
          }}
        >
          {open ? 'Close' : 'Sign in'}
        </span>
      </button>

      <div
        style={{
          position: 'fixed',
          top: 0,
          right: open ? 0 : -420,
          width: 400,
          height: '100vh',
          background: 'rgba(7,9,26,0.88)',
          backdropFilter: 'blur(28px)',
          borderLeft: '1px solid rgba(124,110,247,0.18)',
          boxShadow: '-24px 0 80px rgba(0,0,0,0.6)',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '2rem 2.25rem',
          transition: 'right 0.55s cubic-bezier(0.16,1,0.3,1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '15%',
            right: '15%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(124,110,247,0.6), transparent)',
          }}
        />

        <div
          style={{
            marginBottom: '2rem',
            opacity: open ? 1 : 0,
            transform: open ? 'translateX(0)' : 'translateX(24px)',
            transition: 'opacity 0.5s ease 0.15s, transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
            <LogoMark />
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: '1rem', fontWeight: 600, color: '#e8eaf6' }}>ANPC</span>
          </div>
          <h2
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: '1.75rem',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: '#f0f2ff',
              margin: '1.25rem 0 0.375rem',
            }}
          >
            {loginType ? 'Welcome back' : 'Choose your sign-in'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'rgba(232,234,246,0.4)', margin: 0, fontWeight: 300 }}>
            {loginType === 'super_admin'
              ? 'Sign in to manage company branches.'
              : loginType === 'branch'
                ? 'Sign in to your branch command center.'
                : 'Select your administrator access before entering your credentials.'}
          </p>
        </div>

        {loginType ? (
          <form
            onSubmit={handleSubmit}
          style={{
            opacity: open ? 1 : 0,
            transform: open ? 'translateX(0)' : 'translateX(24px)',
            transition: 'opacity 0.5s ease 0.3s, transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.3s',
          }}
        >
          <button
            type="button"
            onClick={returnToLoginTypeSelection}
            style={{ background: 'none', border: 'none', padding: 0, margin: '0 0 1.25rem', color: '#c4b5fd', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
          >
            ← Change administrator type
          </button>
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'rgba(232,234,246,0.45)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
              }}
            >
              Email Address
            </label>
            <input
              className="login-input"
              type="email"
              placeholder="admin@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => fetchAttempts(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <label
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'rgba(232,234,246,0.45)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Password
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                className="login-input"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '3rem' }}
                autoComplete="current-password"
                disabled={loading || isLocked}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                disabled={loading || isLocked}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.28)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.28)';
                }}
              >
                <EyeIcon open={showPw} />
              </button>
            </div>
          </div>

          <div style={{ minHeight: '28px', margin: '0 0 1rem' }}>
            {isLocked ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: '#fca5a5', fontWeight: 700 }}>
                Too many attempts. Try again later.
              </div>
            ) : invalidCredentials ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: '#fca5a5', fontWeight: 700 }}>
                Invalid email or password.
              </div>
            ) : (
              <div style={{ fontSize: '0.9rem', color: 'rgba(232,234,246,0.55)' }}>
                Enter your credentials to sign in.
              </div>
            )}
          </div>

          <button className="login-btn" type="submit" disabled={loading || isLocked}>
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Authenticating…
              </span>
            ) : (
              'Sign in to Command Center'
            )}
          </button>
          </form>
        ) : (
          <div
            style={{
              opacity: open ? 1 : 0,
              transform: open ? 'translateX(0)' : 'translateX(24px)',
              transition: 'opacity 0.5s ease 0.3s, transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.3s',
              display: 'grid',
              gap: '0.85rem',
            }}
          >
            {[
              { type: 'super_admin', title: 'Company Admin', description: 'Manage branches and company-level administration.', icon: <PersonIcon /> },
              { type: 'branch', title: 'Branch Admin', description: 'Access your branch operations command center.', icon: <GroupIcon /> },
            ].map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={() => chooseLoginType(option.type)}
                style={{
                  width: '100%', textAlign: 'left', padding: '1rem', cursor: 'pointer',
                  background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.3)',
                  borderRadius: 12, color: '#f0f2ff', transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,110,247,0.22)'; e.currentTarget.style.borderColor = 'rgba(196,181,253,0.75)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(124,110,247,0.1)'; e.currentTarget.style.borderColor = 'rgba(124,110,247,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 10, color: '#c4b5fd', background: 'rgba(124,110,247,0.18)' }}>
                    {option.icon}
                  </span>
                  <span style={{ fontSize: '1rem', fontWeight: 700 }}>{option.title}</span>
                </span>
                <span style={{ display: 'block', fontSize: '0.8rem', lineHeight: 1.45, color: 'rgba(232,234,246,0.58)' }}>{option.description}</span>
              </button>
            ))}
          </div>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center', opacity: open ? 1 : 0, transition: 'opacity 0.5s ease 0.4s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.75rem', color: 'rgba(232,234,246,0.28)' }}>
            <ShieldIcon />
            256-bit encrypted · All data is secure and private
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '15%',
            right: '15%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(124,110,247,0.4), transparent)',
          }}
        />
      </div>
    </div>
  );
}
