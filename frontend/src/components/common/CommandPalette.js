import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import {
  HomeIcon, TruckIcon, ScaleIcon, BoltIcon, LinkIcon,
  DocumentTextIcon, CalendarIcon, ChartBarIcon, Cog6ToothIcon,
  BookOpenIcon, MagnifyingGlassIcon, PlusIcon, ArrowRightEndOnRectangleIcon,
  UserCircleIcon, GlobeAltIcon, UsersIcon, UserPlusIcon, PhotoIcon, KeyIcon, InformationCircleIcon,
} from '@heroicons/react/24/outline';

const NAV_COMMANDS = [
  { to: '/dashboard', icon: HomeIcon, labelKey: 'sidebar.dashboard' },
  { to: '/cranes', icon: TruckIcon, labelKey: 'sidebar.cranes' },
  { to: '/counterweights', icon: ScaleIcon, labelKey: 'sidebar.counterweights' },
  { to: '/boom-sections', icon: BoltIcon, labelKey: 'sidebar.boom_sections' },
  { to: '/hooks', icon: LinkIcon, labelKey: 'sidebar.hooks' },
  { to: '/transactions', icon: DocumentTextIcon, labelKey: 'sidebar.transactions' },
  { to: '/transactions/calendar', icon: CalendarIcon, labelKey: 'sidebar.calendar' },
  { to: '/reports', icon: ChartBarIcon, labelKey: 'sidebar.reports' },
  { to: '/tutorials', icon: BookOpenIcon, labelKey: 'sidebar.instructions' },
  { to: '/settings', icon: Cog6ToothIcon, labelKey: 'sidebar.settings' },
];

const SETTINGS_COMMANDS = [
  { to: '/settings#profile', icon: UserCircleIcon, labelKey: 'command.settings_profile' },
  { to: '/settings#language', icon: GlobeAltIcon, labelKey: 'command.settings_language' },
  { to: '/settings#accounts', icon: UsersIcon, labelKey: 'command.settings_accounts' },
  { to: '/settings#create', icon: UserPlusIcon, labelKey: 'command.settings_create_account' },
  { to: '/settings#login-background', icon: PhotoIcon, labelKey: 'command.settings_login_background' },
  { to: '/settings#password', icon: KeyIcon, labelKey: 'command.settings_password' },
  { to: '/settings#system', icon: InformationCircleIcon, labelKey: 'command.settings_system' },
];

export default function CommandPalette({ open, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const commands = useMemo(() => {
    const base = NAV_COMMANDS.map(c => ({ ...c, group: 'navigation' }));
    const settings = SETTINGS_COMMANDS.map(c => ({ ...c, group: 'settings' }));
    const tLabel = (key) => {
      try { return t(key); } catch { return key; }
    };
    const quick = [
      { to: '/transactions/create', icon: PlusIcon, label: tLabel('command.new_transaction') || 'New Transaction', labelKey: 'command.new_transaction', group: 'actions' },
      { action: 'logout', icon: ArrowRightEndOnRectangleIcon, label: tLabel('command.logout') || 'Log out', labelKey: 'command.logout', group: 'actions' },
    ];
    const all = [...quick, ...base, ...settings];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(c => (c.label || tLabel(c.labelKey)).toLowerCase().includes(q));
  }, [query, t]);

  const tLabel = (key) => {
    try { return t(key); } catch { return key; }
  };

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!commands.length) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex(prev => Math.min(prev, commands.length - 1));
  }, [commands.length]);

  useEffect(() => {
    const node = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, commands.length]);

  if (!open) return null;

  const run = (cmd) => {
    onClose();
    if (cmd.action === 'logout') {
      const ev = new CustomEvent('anpc:logout');
      window.dispatchEvent(ev);
      return;
    }
    if (cmd.to) navigate(cmd.to);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!commands.length) return;
      setActiveIndex(i => Math.min(i + 1, commands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!commands.length) return;
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (commands[activeIndex]) run(commands[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '8vh 16px 16px', background: 'rgba(1,4,9,0.58)', backdropFilter: 'blur(3px)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="animate-scale-in"
        onClick={e => e.stopPropagation()}
        onKeyDown={onKeyDown}
        style={{ width: '100%', maxWidth: '560px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 20px', borderBottom: '1px solid var(--border-muted)' }}>
          <MagnifyingGlassIcon style={{ width: '22px', height: '22px', color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label={tLabel('command.placeholder') || 'Search pages and actions...'}
            placeholder={tLabel('command.placeholder') || 'Search pages and actions...'}
            autoComplete="off"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '17px', fontFamily: 'inherit' }}
          />
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '5px', padding: '2px 6px', background: 'var(--surface-2)' }}>ESC</span>
        </div>

        <div ref={listRef} className="app-scrollbar" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '8px' }}>
          {commands.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>{tLabel('command.no_results') || 'No results found'}</div>
          ) : (
            <>
              {['actions', 'navigation', 'settings'].map(group => {
                const groupCommands = commands.filter(c => c.group === group);
                if (groupCommands.length === 0) return null;
                const groupLabel = group === 'actions' ? (tLabel('command.action') || 'Action') : group === 'settings' ? 'Settings' : (tLabel('command.navigate') || 'Navigate');
                return (
                  <div key={group}>
                    <div style={{ padding: '6px 12px 4px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{groupLabel}</div>
                    {groupCommands.map((cmd, i) => {
                      const globalIndex = commands.indexOf(cmd);
                      const Icon = cmd.icon;
                      const label = cmd.label || tLabel(cmd.labelKey);
                      const isActive = globalIndex === activeIndex;
                      return (
                        <button
                          key={cmd.to || cmd.action}
                          data-index={globalIndex}
                          onClick={() => run(cmd)}
                          onMouseEnter={() => setActiveIndex(globalIndex)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
                            background: isActive ? 'var(--accent-subtle)' : 'transparent', color: isActive ? 'var(--accent-text)' : 'var(--text-primary)',
                          }}
                        >
                          <Icon style={{ width: '16px', height: '16px', flexShrink: 0, opacity: 0.8 }} />
                          <span style={{ fontSize: '13px', fontWeight: 600, flex: 1 }}>{label}</span>
                          {group === 'actions' && <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{tLabel('command.action') || 'Action'}</span>}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 16px', borderTop: '1px solid var(--border-muted)', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><kbd style={kbdStyle}>↑</kbd><kbd style={kbdStyle}>↓</kbd> {tLabel('command.navigate') || 'Navigate'}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><kbd style={kbdStyle}>↵</kbd> {tLabel('command.select') || 'Select'}</span>
        </div>
      </div>
    </div>
  );
}

const kbdStyle = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '11px',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  padding: '1px 5px',
  background: 'var(--surface-2)',
  color: 'var(--text-secondary)',
};
