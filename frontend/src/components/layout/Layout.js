import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/useTranslation';
import FloatingChat from '../common/FloatingChat';
import {
  HomeIcon, TruckIcon, Square3Stack3DIcon, LinkIcon,
  DocumentTextIcon, ChartBarIcon, Cog6ToothIcon, Bars3Icon, XMarkIcon,
  ArrowRightOnRectangleIcon, MoonIcon, SunIcon, BoltIcon, CalendarIcon, BookOpenIcon
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/dashboard', icon: HomeIcon, labelKey: 'sidebar.dashboard' },
  { to: '/cranes', icon: TruckIcon, labelKey: 'sidebar.cranes' },
  { to: '/counterweights', icon: Square3Stack3DIcon, labelKey: 'sidebar.counterweights' },
  { to: '/boom-sections', icon: BoltIcon, labelKey: 'sidebar.boom_sections' },
  { to: '/hooks', icon: LinkIcon, labelKey: 'sidebar.hooks' },
  { to: '/transactions', icon: DocumentTextIcon, labelKey: 'sidebar.transactions' },
  { to: '/transactions/calendar', icon: CalendarIcon, labelKey: 'sidebar.calendar' },
];

const SidebarContent = ({ setSidebarOpen, onLogoutClick }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--sidebar-bg)' }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--sidebar-border)', flexShrink: 0, transition: 'all 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="/logo.png" 
            alt="NASS Logo" 
            style={{ height: '40px', objectFit: 'contain', flexShrink: 0, filter: 'brightness(1.15) contrast(1.1)' }}
          />
        </div>
      </div>

      {/* Nav Section Label */}
      <div style={{ padding: '16px 20px 8px', transition: 'all 0.3s ease' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, color: '#3d444d', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('sidebar.navigation')}</p>
      </div>

      {/* Nav Items */}
      <nav className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 10px', transition: 'all 0.3s ease' }}>
        {navItems.map(({ to, icon: Icon, labelKey }) => (
          <NavLink key={to} to={to} end
            onClick={() => setSidebarOpen && setSidebarOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 10px', borderRadius: '7px', marginBottom: '2px',
              fontSize: '13px', fontWeight: isActive ? 600 : 400,
              color: isActive ? '#f0f6fc' : 'var(--sidebar-text)',
              background: isActive ? 'var(--accent)' : 'transparent',
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
                <span>{t(labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Settings link */}
      <div style={{ padding: '10px', borderTop: '1px solid var(--sidebar-border)', transition: 'all 0.3s ease' }}>
        <NavLink to="/tutorials"
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 10px', borderRadius: '7px', marginBottom: '2px',
            fontSize: '13px', fontWeight: isActive ? 600 : 400,
            color: isActive ? '#f0f6fc' : 'var(--sidebar-text)',
            background: isActive ? 'var(--accent)' : 'transparent',
            textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
          })}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = '#f0f6fc'; }}
          onMouseLeave={e => { if (!window.location.pathname.startsWith('/tutorials')) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)'; } }}>
          {({ isActive }) => (<><BookOpenIcon style={{ width: '16px', height: '16px', opacity: isActive ? 1 : 0.7 }} /><span>{t('sidebar.instructions')}</span></>)}
        </NavLink>
        <NavLink to="/reports"
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 10px', borderRadius: '7px', marginBottom: '2px',
            fontSize: '13px', fontWeight: isActive ? 600 : 400,
            color: isActive ? '#f0f6fc' : 'var(--sidebar-text)',
            background: isActive ? 'var(--accent)' : 'transparent',
            textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
          })}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = '#f0f6fc'; }}
          onMouseLeave={e => { if (!window.location.pathname.startsWith('/reports')) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)'; } }}>
          {({ isActive }) => (<><ChartBarIcon style={{ width: '16px', height: '16px', opacity: isActive ? 1 : 0.7 }} /><span>{t('sidebar.reports')}</span></>)}
        </NavLink>
        <NavLink to="/settings"
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 10px', borderRadius: '7px',
            fontSize: '13px', fontWeight: isActive ? 600 : 400,
            color: isActive ? '#f0f6fc' : 'var(--sidebar-text)',
            background: isActive ? 'var(--accent)' : 'transparent',
            textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
          })}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = '#f0f6fc'; }}
          onMouseLeave={e => { if (!window.location.pathname.startsWith('/settings')) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)'; } }}>
          {({ isActive }) => (<><Cog6ToothIcon style={{ width: '16px', height: '16px', opacity: isActive ? 1 : 0.7 }} /><span>{t('sidebar.settings')}</span></>)}
        </NavLink>
      </div>

      {/* User footer */}
      <div style={{ padding: '10px', borderTop: '1px solid var(--sidebar-border)', flexShrink: 0, transition: 'all 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '7px', background: 'rgba(255,255,255,0.04)' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
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
      </div>
    </div>
  );
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDark(!dark);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
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
      <aside className="hidden lg:block no-print" style={{ width: sidebarCollapsed ? '60px' : '220px', flexShrink: 0, borderRight: '1px solid var(--sidebar-border)', overflow: 'hidden', transition: 'width 0.3s ease' }}>
        {sidebarCollapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--sidebar-bg)', alignItems: 'center', padding: '12px 0', transition: 'all 0.3s ease' }}>
            {/* Collapsed Logo */}
            <div style={{ padding: '10px', marginBottom: '16px', transition: 'all 0.3s ease' }}>
              <img 
                src="/logo.png" 
                alt="NASS Logo" 
                style={{ height: '30px', objectFit: 'contain', flexShrink: 0, filter: 'brightness(1.15) contrast(1.1)' }}
              />
            </div>
            
            {/* Collapsed Nav Items */}
            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', transition: 'all 0.3s ease' }}>
              {navItems.map(({ to, icon: Icon, labelKey }) => (
                <NavLink key={to} to={to}
                  end
                  title={t(labelKey)}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '10px', borderRadius: '7px',
                    color: isActive ? '#f0f6fc' : 'var(--sidebar-text)',
                    background: isActive ? 'var(--accent)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'background 0.15s, color 0.15s',
                    boxShadow: isActive ? '0 2px 8px rgba(31,107,235,0.3)' : 'none',
                  })}
                  onMouseEnter={e => { if (window.location.pathname !== to) { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = '#f0f6fc'; } }}
                  onMouseLeave={e => {
                    const isActive = window.location.pathname === to;
                    if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)'; }
                  }}
                >
                  {({ isActive }) => (
                    <Icon style={{ width: '18px', height: '18px', flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                  )}
                </NavLink>
              ))}
            </nav>
            
            {/* Collapsed Footer Icons & User */}
            <div style={{ padding: '10px', borderTop: '1px solid var(--sidebar-border)', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center', transition: 'all 0.3s ease' }}>
              <NavLink to="/tutorials" title={t('sidebar.instructions')}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '10px', borderRadius: '7px',
                  color: isActive ? '#f0f6fc' : 'var(--sidebar-text)',
                  background: isActive ? 'var(--accent)' : 'transparent',
                  textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
                })}
                onMouseEnter={e => { if (!window.location.pathname.startsWith('/tutorials')) { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = '#f0f6fc'; } }}
                onMouseLeave={e => { if (!window.location.pathname.startsWith('/tutorials')) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)'; } }}>
                {({ isActive }) => (<BookOpenIcon style={{ width: '18px', height: '18px', opacity: isActive ? 1 : 0.7 }} />)}
              </NavLink>
              <NavLink to="/reports" title={t('sidebar.reports')}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '10px', borderRadius: '7px',
                  color: isActive ? '#f0f6fc' : 'var(--sidebar-text)',
                  background: isActive ? 'var(--accent)' : 'transparent',
                  textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
                })}
                onMouseEnter={e => { if (!window.location.pathname.startsWith('/reports')) { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = '#f0f6fc'; } }}
                onMouseLeave={e => { if (!window.location.pathname.startsWith('/reports')) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)'; } }}>
                {({ isActive }) => (<ChartBarIcon style={{ width: '18px', height: '18px', opacity: isActive ? 1 : 0.7 }} />)}
              </NavLink>
              <NavLink to="/settings" title={t('sidebar.settings')}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '10px', borderRadius: '7px',
                  color: isActive ? '#f0f6fc' : 'var(--sidebar-text)',
                  background: isActive ? 'var(--accent)' : 'transparent',
                  textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
                })}
                onMouseEnter={e => { if (!window.location.pathname.startsWith('/settings')) { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = '#f0f6fc'; } }}
                onMouseLeave={e => { if (!window.location.pathname.startsWith('/settings')) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)'; } }}>
                {({ isActive }) => (<Cog6ToothIcon style={{ width: '18px', height: '18px', opacity: isActive ? 1 : 0.7 }} />)}
              </NavLink>
            </div>

            {/* Collapsed User Avatar */}
            <div style={{ padding: '10px', borderTop: '1px solid var(--sidebar-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }} title={`${user?.name || 'Admin'} (${user?.role || 'user'})`}>
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </div>
              </div>
            </div>

            {/* Logout button for collapsed view */}
            <div style={{ padding: '10px', display: 'flex', justifyContent: 'center' }}>
              <button onClick={handleLogout} title="Logout" style={{ padding: '8px', borderRadius: '5px', border: '1px solid var(--sidebar-border)', background: 'transparent', cursor: 'pointer', color: '#3d444d', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f85149'; e.currentTarget.style.borderColor = '#f85149'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#3d444d'; e.currentTarget.style.borderColor = 'var(--sidebar-border)'; }}>
                <ArrowRightOnRectangleIcon style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>
        ) : (
          <SidebarContent onLogoutClick={handleLogout} />
        )}
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden no-print">
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(1,4,9,0.7)', backdropFilter: 'blur(2px)' }} onClick={() => setSidebarOpen(false)} />
          <div className="animate-slide-in" style={{ position: 'relative', width: '220px', height: '100%', flexShrink: 0, borderRight: '1px solid var(--sidebar-border)', overflow: 'hidden' }}>
            <SidebarContent setSidebarOpen={setSidebarOpen} onLogoutClick={handleLogout} />
            <button onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', top: '14px', right: '14px', padding: '4px', background: 'var(--sidebar-hover)', border: '1px solid var(--sidebar-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--sidebar-text)' }}>
              <XMarkIcon style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
      )}

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top Bar */}
        <header className="no-print" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 16px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden" style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Bars3Icon style={{ width: '16px', height: '16px' }} />
            </button>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex" title={sidebarCollapsed ? 'Expand' : 'Collapse'} style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-secondary)', alignItems: 'center', justifyContent: 'center' }}>
              <Bars3Icon style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>ANPC Yard — Internal Operations Dashboard</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <Outlet />
        </main>
      </div>

      {/* Floating Chat */}
      {user && <FloatingChat user={user} />}

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
