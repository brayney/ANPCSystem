import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/useTranslation';
import { format } from 'date-fns';
import FloatingChat from '../common/FloatingChat';
import CommandPalette from '../common/CommandPalette';
import ConnectionStatus from '../common/ConnectionStatus';
import LogoSplash from '../common/LogoSplash';
import NotificationBell from '../common/NotificationBell';
import {
  HomeIcon, TruckIcon, ScaleIcon, LinkIcon,
  DocumentTextIcon, ChartBarIcon, Cog6ToothIcon, Bars3Icon, XMarkIcon,
  ArrowRightOnRectangleIcon, MoonIcon, SunIcon, BoltIcon, CalendarIcon, BookOpenIcon,
  MagnifyingGlassIcon, UserIcon
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/dashboard', icon: HomeIcon, labelKey: 'sidebar.dashboard' },
  { to: '/cranes', icon: TruckIcon, labelKey: 'sidebar.cranes' },
  { to: '/counterweights', icon: ScaleIcon, labelKey: 'sidebar.counterweights' },
  { to: '/boom-sections', icon: BoltIcon, labelKey: 'sidebar.boom_sections' },
  { to: '/hooks', icon: LinkIcon, labelKey: 'sidebar.hooks' },
  { to: '/transactions', icon: DocumentTextIcon, labelKey: 'sidebar.transactions' },
  { to: '/transactions/calendar', icon: CalendarIcon, labelKey: 'sidebar.calendar' },
];

const SidebarContent = ({ setSidebarOpen, onLogoutClick, collapsed = false }) => {
  const { t } = useTranslation();

  // Hidden label used when the sidebar is collapsed (keeps width animation smooth)
  const labelStyle = collapsed
    ? { opacity: 0, maxWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', transition: 'opacity 0.18s ease' }
    : { opacity: 1, transition: 'opacity 0.18s ease' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--sidebar-bg)', alignItems: collapsed ? 'center' : 'stretch' }}>
      {/* Logo */}
      <div style={{ width: '100%', padding: collapsed ? '14px 0 12px' : '20px 20px 16px', borderBottom: '1px solid var(--sidebar-border)', flexShrink: 0, display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <img
          src="/logo.png"
          alt="NASS Logo"
          style={{ width: collapsed ? '40px' : 'auto', height: collapsed ? '40px' : '40px', objectFit: 'contain', flexShrink: 0, filter: 'brightness(1.15) contrast(1.1)', transition: 'all 0.32s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </div>

      {/* Nav Section Label */}
      {!collapsed && (
        <div style={{ padding: '16px 20px 8px' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#3d444d', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '2px', borderRadius: '999px', background: 'linear-gradient(90deg, #fb923c, #f59e0b)', boxShadow: '0 0 8px rgba(251, 146, 60, 0.45), 0 0 14px rgba(245, 158, 11, 0.25)' }} />
            {t('sidebar.navigation')}
          </p>
        </div>
      )}

      {/* Nav Items */}
      <nav className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '14px 6px 6px' : '0 10px' }}>
        {navItems.map(({ to, icon: Icon, labelKey }) => (
          <NavLink key={to} to={to} end
            onClick={() => setSidebarOpen && setSidebarOpen(false)}
            title={collapsed ? t(labelKey) : undefined}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: '10px',
              padding: '9px 10px', borderRadius: '7px', marginBottom: '2px',
              fontSize: '13px', fontWeight: isActive ? 600 : 400,
              color: isActive ? '#f0f6fc' : 'var(--sidebar-text)',
              background: isActive ? 'var(--sidebar-active)' : 'transparent',
              textDecoration: 'none',
              transition: 'background 0.15s, color 0.15s',
              boxShadow: isActive ? '0 2px 8px rgba(31,107,235,0.3)' : 'none',
            })}
            onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = '#f0f6fc'; } }}
            onMouseLeave={e => {
              const isActive = window.location.pathname === to;
              if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)'; }
            }}
          >
            {({ isActive }) => (
              <>
                <Icon style={{ width: '16px', height: '16px', flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                <span style={labelStyle}>{t(labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Settings link */}
      <div style={{ padding: collapsed ? '8px 6px' : '10px', borderTop: '1px solid var(--sidebar-border)' }}>
        <NavLink to="/tutorials"
          title={collapsed ? t('sidebar.instructions') : undefined}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: '10px',
            padding: '9px 10px', borderRadius: '7px', marginBottom: '2px',
            fontSize: '13px', fontWeight: isActive ? 600 : 400,
            color: isActive ? '#f0f6fc' : 'var(--sidebar-text)',
            background: isActive ? 'var(--sidebar-active)' : 'transparent',
            textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
          })}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = '#f0f6fc'; }}
          onMouseLeave={e => { if (!window.location.pathname.startsWith('/tutorials')) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)'; } }}>
          {({ isActive }) => (<><BookOpenIcon style={{ width: '16px', height: '16px', opacity: isActive ? 1 : 0.7 }} /><span style={labelStyle}>{t('sidebar.instructions')}</span></>)}
        </NavLink>
        <NavLink to="/reports"
          title={collapsed ? t('sidebar.reports') : undefined}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: '10px',
            padding: '9px 10px', borderRadius: '7px', marginBottom: '2px',
            fontSize: '13px', fontWeight: isActive ? 600 : 400,
            color: isActive ? '#f0f6fc' : 'var(--sidebar-text)',
            background: isActive ? 'var(--sidebar-active)' : 'transparent',
            textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
          })}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = '#f0f6fc'; }}
          onMouseLeave={e => { if (!window.location.pathname.startsWith('/reports')) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)'; } }}>
          {({ isActive }) => (<><ChartBarIcon style={{ width: '16px', height: '16px', opacity: isActive ? 1 : 0.7 }} /><span style={labelStyle}>{t('sidebar.reports')}</span></>)}
        </NavLink>
        <NavLink to="/settings"
          title={collapsed ? t('sidebar.settings') : undefined}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: '10px',
            padding: '9px 10px', borderRadius: '7px',
            fontSize: '13px', fontWeight: isActive ? 600 : 400,
            color: isActive ? '#f0f6fc' : 'var(--sidebar-text)',
            background: isActive ? 'var(--sidebar-active)' : 'transparent',
            textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
          })}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = '#f0f6fc'; }}
          onMouseLeave={e => { if (!window.location.pathname.startsWith('/settings')) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)'; } }}>
          {({ isActive }) => (<><Cog6ToothIcon style={{ width: '16px', height: '16px', opacity: isActive ? 1 : 0.7 }} /><span style={labelStyle}>{t('sidebar.settings')}</span></>)}
        </NavLink>
      </div>


    </div>
  );
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarClosing, setSidebarClosing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const hideBranchScrollbars = location.pathname === '/company-admin';
    document.documentElement.classList.toggle('branch-admin-scroll-hidden', hideBranchScrollbars);
    document.body.classList.toggle('branch-admin-scroll-hidden', hideBranchScrollbars);

    return () => {
      document.documentElement.classList.remove('branch-admin-scroll-hidden');
      document.body.classList.remove('branch-admin-scroll-hidden');
    };
  }, [location.pathname]);

  // Global command palette shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) return;

    const handleClick = (event) => {
      if (event.target instanceof Element && event.target.closest('[data-profile-menu-root]')) return;
      setProfileMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileMenuOpen]);

  // Allow command palette to trigger logout
  useEffect(() => {
    const onLogout = () => { handleLogout(); };
    window.addEventListener('anpc:logout', onLogout);
    return () => window.removeEventListener('anpc:logout', onLogout);
  }, []);

  const toggleDark = () => {
    const root = document.documentElement;
    root.classList.toggle('dark');
    setDark(prev => !prev);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  // Animate the mobile drawer out, then unmount it
  const closeMobileSidebar = () => {
    if (sidebarClosing) return;
    setSidebarClosing(true);
    setTimeout(() => {
      setSidebarOpen(false);
      setSidebarClosing(false);
    }, 260);
  };

  const cancelLogout = () => {
    if (isLoggingOut) return;
    setShowLogoutConfirm(false);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setShowLogoutConfirm(false);
    setSidebarOpen(false);
    await new Promise(r => setTimeout(r, 300));
    navigate('/login');
  };

  if (isLoggingOut) {
    return <LogoSplash label="Signing you out..." />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--surface-2)' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block no-print" style={{ width: sidebarCollapsed ? '64px' : '220px', flexShrink: 0, borderRight: '1px solid var(--sidebar-border)', overflow: 'hidden', transition: 'width 0.32s cubic-bezier(0.22, 1, 0.36, 1)' }}>
        <SidebarContent collapsed={sidebarCollapsed} onLogoutClick={handleLogout} />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden no-print">
          <div className={`sidebar-overlay ${sidebarClosing ? 'closing' : ''}`} style={{ position: 'fixed', inset: 0, background: 'rgba(1,4,9,0.7)', backdropFilter: 'blur(3px)' }} onClick={closeMobileSidebar} />
          <div className={`sidebar-drawer ${sidebarClosing ? 'closing' : ''}`} style={{ position: 'fixed', top: 0, left: 0, width: '220px', height: '100%', flexShrink: 0, borderRight: '1px solid var(--sidebar-border)', overflow: 'hidden' }}>
            <SidebarContent setSidebarOpen={closeMobileSidebar} onLogoutClick={handleLogout} />
            <button onClick={closeMobileSidebar} style={{ position: 'absolute', top: '14px', right: '14px', padding: '4px', background: 'var(--sidebar-hover)', border: '1px solid var(--sidebar-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--sidebar-text)' }}>
              <XMarkIcon style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
      )}

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top Bar */}
        <header className="no-print" style={{ position: 'relative', zIndex: 10000, overflow: 'visible', background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)', padding: '0 18px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxShadow: 'var(--shadow-sm)', backdropFilter: 'blur(14px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden" style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}>
              <Bars3Icon style={{ width: '16px', height: '16px' }} />
            </button>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex" title={sidebarCollapsed ? 'Expand' : 'Collapse'} style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-secondary)', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}>
              <Bars3Icon style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden lg:flex"
            title="Quick search (Ctrl/⌘ + K)"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', minWidth: '220px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <MagnifyingGlassIcon style={{ width: '14px', height: '14px' }} />
            <span style={{ flex: 1, textAlign: 'left' }}>Search...</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 700, border: '1px solid var(--border)', borderRadius: '4px', padding: '1px 5px', background: 'var(--surface)', color: 'var(--text-secondary)' }}>⌘K</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <NotificationBell user={user} />
            <span className="hidden md:inline-flex" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em' }}>
              {format(now, 'h:mm:ss a')}
            </span>
            <div className="hidden md:flex items-center" style={{ gap: '8px' }}>
              <ConnectionStatus />
            </div>
            <div data-profile-menu-root style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen(prev => !prev)}
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                className="company-admin-profile-trigger app-header-profile-trigger"
              >
                {user?.avatar?.cloudinaryUrl ? (
                  <img src={user.avatar.cloudinaryUrl} alt="Profile" className="company-admin-profile-avatar" />
                ) : (
                  <div className="company-admin-profile-avatar">
                    <UserIcon style={{ width: '20px', height: '20px' }} aria-hidden="true" />
                  </div>
                )}
                <div className="company-admin-profile-copy">
                  <strong>{user?.name || 'Admin'}</strong>
                </div>
              </button>
              {profileMenuOpen && (
                <div role="menu" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', minWidth: '180px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', boxShadow: 'var(--shadow-lg)', padding: '8px', zIndex: 12000 }}>
                  <button
                    type="button"
                    onClick={() => { toggleDark(); setProfileMenuOpen(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '7px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {dark ? <SunIcon style={{ width: '15px', height: '15px' }} /> : <MoonIcon style={{ width: '15px', height: '15px' }} />}
                    <span>{dark ? 'Light mode' : 'Dark mode'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setProfileMenuOpen(false); handleLogout(); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '7px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger)', fontSize: '13px', fontWeight: 500, textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <ArrowRightOnRectangleIcon style={{ width: '15px', height: '15px' }} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={`app-scrollbar${location.pathname === '/company-admin' ? ' branch-admin-scroll-hidden' : ''}`} style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px, 2.4vw, 28px)' }}>
          <Outlet />
        </main>
      </div>

      {/* Floating Chat */}
      {user && <FloatingChat user={user} />}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {showLogoutConfirm && (
        <div
          role="presentation"
          onClick={cancelLogout}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(1,4,9,0.58)',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            className="animate-scale-in"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '360px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-lg)',
              padding: '20px',
            }}
          >
            <h2 id="logout-confirm-title" style={{ fontSize: '18px', marginBottom: '8px' }}>Confirm logout</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5, marginBottom: '18px' }}>
              Are you sure you want to log out of your account?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn-secondary" onClick={cancelLogout} disabled={isLoggingOut}>
                Cancel
              </button>
              <button type="button" className="btn-danger" onClick={confirmLogout} disabled={isLoggingOut}>
                {isLoggingOut ? 'Logging out...' : 'Log out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
