import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/useTranslation';
import { format } from 'date-fns';
import FloatingChat from '../common/FloatingChat';
import CommandPalette from '../common/CommandPalette';
import ConnectionStatus from '../common/ConnectionStatus';
import {
  HomeIcon, TruckIcon, ScaleIcon, LinkIcon,
  DocumentTextIcon, ChartBarIcon, Cog6ToothIcon, Bars3Icon, XMarkIcon,
  ArrowRightOnRectangleIcon, MoonIcon, SunIcon, BoltIcon, CalendarIcon, BookOpenIcon,
  MagnifyingGlassIcon
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
  const { user } = useAuth();
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
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#3d444d', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('sidebar.navigation')}</p>
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

      {/* User footer */}
      <div style={{ padding: collapsed ? '10px 0' : '10px', borderTop: '1px solid var(--sidebar-border)', flexShrink: 0 }}>
        {collapsed ? (
          <button onClick={onLogoutClick} title="Logout" style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '8px', borderRadius: '7px', border: '1px solid var(--sidebar-border)', background: 'transparent', cursor: 'pointer', color: '#3d444d', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f85149'; e.currentTarget.style.borderColor = '#f85149'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#3d444d'; e.currentTarget.style.borderColor = 'var(--sidebar-border)'; }}>
            <ArrowRightOnRectangleIcon style={{ width: '16px', height: '16px' }} />
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '7px', background: 'rgba(255,255,255,0.04)' }}>
            {user?.avatar?.cloudinaryUrl ? (
              <img src={user.avatar.cloudinaryUrl} alt="Profile" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#e6edf3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Admin'}</p>
              <p style={{ fontSize: '10px', color: '#3d444d', textTransform: 'capitalize' }}>{user?.role || 'user'}</p>
            </div>
            <button onClick={onLogoutClick} title="Logout" style={{ padding: '4px', borderRadius: '5px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#3d444d', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f85149'}
              onMouseLeave={e => e.currentTarget.style.color = '#3d444d'}>
              <ArrowRightOnRectangleIcon style={{ width: '15px', height: '15px' }} />
            </button>
          </div>
        )}
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
  const [now, setNow] = useState(new Date());
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

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
    setIsLoggingOut(false);
    setShowLogoutConfirm(false);
    setSidebarOpen(false);
    navigate('/login');
  };

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
        <header className="no-print" style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)', padding: '0 18px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxShadow: 'var(--shadow-sm)', backdropFilter: 'blur(14px)' }}>
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
            <span className="hidden md:inline-flex" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em' }}>
              {format(now, 'h:mm:ss a')}
            </span>
            <div className="hidden md:flex items-center">
              <ConnectionStatus />
            </div>
            <button onClick={toggleDark} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}>
              {dark
                ? <SunIcon style={{ width: '15px', height: '15px' }} />
                : <MoonIcon style={{ width: '15px', height: '15px' }} />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="app-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px, 2.4vw, 28px)' }}>
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
