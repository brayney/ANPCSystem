import React from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import { EllipsisVerticalIcon, XMarkIcon } from '@heroicons/react/24/outline';

// ── Status Badge ──────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const styles = {
    'Available':          'bg-[var(--success-bg)] text-[var(--success)] border-[color:var(--success)]',
    'On Hire':            'bg-[var(--accent-subtle)] text-[var(--accent-text)] border-[color:var(--accent)]',
    'Standby':            'bg-[var(--warning-bg)] text-[var(--warning)] border-[color:var(--warning)]',
    'Under Maintenance':  'bg-[var(--orange-bg)] text-[var(--orange)] border-[color:var(--orange)]',
    'Out of Yard':        'bg-[var(--danger-bg)] text-[var(--danger)] border-[color:var(--danger)]',
    'Reserved':           'bg-[var(--purple-bg)] text-[var(--purple)] border-[color:var(--purple)]',
    'Active':             'bg-[var(--accent-subtle)] text-[var(--accent-text)] border-[color:var(--accent)]',
    'Returned':           'bg-[var(--success-bg)] text-[var(--success)] border-[color:var(--success)]',
    'Overdue':            'bg-[var(--danger-bg)] text-[var(--danger)] border-[color:var(--danger)]',
    'Cancelled':          'bg-[var(--surface-3)] text-[var(--text-secondary)] border-[color:var(--border)]',
    'Allocated':          'bg-[var(--purple-bg)] text-[var(--purple)] border-[color:var(--purple)]',
    'In Use':             'bg-[var(--accent-subtle)] text-[var(--accent-text)] border-[color:var(--accent)]',
    'OK':                 'bg-[var(--success-bg)] text-[var(--success)] border-[color:var(--success)]',
    'Ok':                 'bg-[var(--success-bg)] text-[var(--success)] border-[color:var(--success)]',
    'NOT OK':             'bg-[var(--danger-bg)] text-[var(--danger)] border-[color:var(--danger)]',
    'For Repair':         'bg-[var(--orange-bg)] text-[var(--orange)] border-[color:var(--orange)]',
  };
  const dotColors = {
    'Available': '#1a7f37', 'On Hire': '#1f6feb', 'Active': '#1f6feb',
    'Returned': '#1a7f37', 'Overdue': '#cf222e', 'Out of Yard': '#cf222e',
    'Under Maintenance': '#bc4c00', 'For Repair': '#bc4c00',
    'Standby': '#9a6700', 'Reserved': '#6e40c9', 'Allocated': '#6e40c9',
    'In Use': '#1f6feb', 'OK': '#1a7f37', 'Ok': '#1a7f37', 'NOT OK': '#cf222e',
  };

  return (
    <span className={`badge ${styles[status] || 'bg-[var(--surface-3)] text-[var(--text-secondary)] border-[color:var(--border)]'}`}
      style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'currentColor', opacity: 1 }}>
      <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0"
        style={{ backgroundColor: dotColors[status] || '#9198a1' }} />
      {status || 'Unknown'}
    </span>
  );
};

// ── Spinner ───────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md' }) => {
  const s = size === 'sm' ? '14px' : size === 'lg' ? '36px' : '20px';
  return (
    <div style={{
      width: s, height: s, flexShrink: 0,
      borderRadius: '50%',
      border: `2px solid var(--border)`,
      borderTopColor: 'var(--accent)',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
};

// ── Page Header ───────────────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h1 style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: '22px',
        fontWeight: 800,
        color: 'var(--text-primary)',
        lineHeight: 1.2,
        margin: 0,
      }}>{title}</h1>
      {subtitle && (
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
          {subtitle}
        </p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
  </div>
);

export const ActionMenu = ({ actions }) => {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef(null);
  const visibleActions = actions.filter(Boolean);

  React.useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  if (visibleActions.length === 0) {
    return <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>;
  }

  const menuItemStyle = (danger) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    border: 'none',
    background: 'transparent',
    color: danger ? 'var(--danger)' : 'var(--text-secondary)',
    fontSize: '12px',
    fontWeight: 600,
    textAlign: 'left',
    textDecoration: 'none',
    cursor: 'pointer',
  });

  const renderAction = (action) => {
    const Icon = action.icon;
    const content = (
      <>
        {Icon && <Icon style={{ width: '13px', height: '13px' }} />}
        {action.label}
      </>
    );

    if (action.to) {
      return (
        <Link key={action.label} to={action.to} style={menuItemStyle(action.danger)} onClick={() => setOpen(false)}>
          {content}
        </Link>
      );
    }

    return (
      <button key={action.label} type="button" style={menuItemStyle(action.danger)} onClick={() => { setOpen(false); action.onClick(); }}>
        {content}
      </button>
    );
  };

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        title="Actions"
        onClick={() => setOpen(prev => !prev)}
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          background: open ? 'var(--surface-3)' : 'var(--surface-2)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <EllipsisVerticalIcon style={{ width: '15px', height: '15px' }} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 4px)',
            minWidth: '128px',
            padding: '4px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            background: 'var(--surface)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 30,
          }}
        >
          {visibleActions.map(renderAction)}
        </div>
      )}
    </div>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
export const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => {
  const accents = {
    blue:   { bg: 'var(--accent-subtle)',  icon: 'var(--accent)',   ring: 'rgba(31,107,235,0.15)' },
    green:  { bg: 'var(--success-bg)',     icon: 'var(--success)',  ring: 'rgba(26,127,55,0.15)' },
    yellow: { bg: 'var(--warning-bg)',     icon: 'var(--warning)',  ring: 'rgba(154,103,0,0.15)' },
    red:    { bg: 'var(--danger-bg)',      icon: 'var(--danger)',   ring: 'rgba(207,34,46,0.15)' },
    purple: { bg: 'var(--purple-bg)',      icon: 'var(--purple)',   ring: 'rgba(110,64,201,0.15)' },
    indigo: { bg: 'var(--purple-bg)',      icon: 'var(--purple)',   ring: 'rgba(110,64,201,0.15)' },
    orange: { bg: 'var(--orange-bg)',      icon: 'var(--orange)',   ring: 'rgba(188,76,0,0.15)' },
    teal:   { bg: 'var(--teal-bg)',        icon: 'var(--teal)',     ring: 'rgba(14,122,110,0.15)' },
  };
  const a = accents[color] || accents.blue;

  return (
    <div className="card animate-fade-in" style={{ padding: '16px 20px' }}>
      <div className="flex items-start justify-between gap-3">
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            {title}
          </p>
          <p style={{ fontSize: '28px', fontFamily: "'Syne', sans-serif", fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {value ?? '—'}
          </p>
          {subtitle && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>{subtitle}</p>}
        </div>
        {Icon && (
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: `0 0 0 4px ${a.ring}`,
          }}>
            <Icon style={{ width: '18px', height: '18px', color: a.icon }} />
          </div>
        )}
      </div>
      <div style={{ height: '3px', marginTop: '14px', borderRadius: '2px', background: a.bg, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: '60%', background: a.icon, borderRadius: '2px', opacity: 0.7 }} />
      </div>
    </div>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  React.useEffect(() => {
    if (!open) return undefined;

    const rootElement = document.querySelector('main') || document.body;
    const previousOverflow = rootElement.style.overflow;
    const previousOverflowY = rootElement.style.overflowY;

    rootElement.style.overflow = 'hidden';
    rootElement.style.overflowY = 'hidden';

    return () => {
      rootElement.style.overflow = previousOverflow;
      rootElement.style.overflowY = previousOverflowY;
    };
  }, [open]);

  if (!open) return null;
  const maxWidths = { sm: '440px', md: '540px', lg: '720px', xl: '900px', full: '1100px' };

  return ReactDOM.createPortal(
    <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px 16px' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'transparent' }} onClick={onClose} />
      <div className="animate-scale-in" style={{
        position: 'relative',
        background: 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: '14px',
        boxShadow: 'var(--shadow-lg)', width: '100%',
        maxWidth: maxWidths[size], maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}>
            <XMarkIcon style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  , document.body);
};

// ── Pagination ────────────────────────────────────────────────────────────────
export const Pagination = ({ page, pages, total, onPage }) => {
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border-muted)' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{total} records</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button onClick={() => onPage(page - 1)} disabled={page === 1} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>← Prev</button>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '0 8px', fontWeight: 600 }}>{page} / {pages}</span>
        <button onClick={() => onPage(page + 1)} disabled={page === pages} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>Next →</button>
      </div>
    </div>
  );
};

// ── Empty State ───────────────────────────────────────────────────────────────
export const EmptyState = ({ message = 'No records found', icon }) => (
  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
    <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.5 }}>{icon || '📭'}</div>
    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{message}</p>
  </div>
);

// ── Confirm Dialog ────────────────────────────────────────────────────────────
export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, danger, loading }) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', lineHeight: 1.6 }}>{message}</p>
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
      <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
      <button onClick={onConfirm} disabled={loading} className={danger ? 'btn-danger' : 'btn-primary'} style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Deleting...' : 'Confirm'}
      </button>
    </div>
  </Modal>
);
