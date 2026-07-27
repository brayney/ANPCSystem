import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BellIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../utils/api';

const formatTime = (dateString) => {
  try {
    return new Date(dateString).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
};

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const menuRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    setMarkingRead(true);
    try {
      await api.put('/notifications/read');
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark notifications read', err);
    } finally {
      setMarkingRead(false);
    }
  };

  useEffect(() => {
    if (!user) return undefined;
    loadNotifications();
  }, [user, loadNotifications]);

  useEffect(() => {
    if (!open) return undefined;
    if (notifications.length === 0 && !loading) {
      loadNotifications();
    }
    const closeOnOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open, loadNotifications, notifications.length, loading]);

  if (!user) return null;

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', overflow: 'visible', zIndex: 9999 }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title="Notifications"
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '10px',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <BellIcon style={{ width: '18px', height: '18px' }} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            minWidth: '18px',
            height: '18px',
            borderRadius: '999px',
            padding: '0 5px',
            background: '#f97316',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 8px)',
          width: '320px',
          maxHeight: '420px',
          overflow: 'hidden',
          borderRadius: '16px',
          border: '1px solid rgba(148, 163, 184, 0.45)',
          background: '#ffffff',
          boxShadow: '0 28px 120px rgba(15, 23, 42, 0.30)',
          zIndex: 100001,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {loading ? 'Loading…' : `${unreadCount} unread`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <XMarkIcon style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {notifications.length === 0 && !loading ? (
              <div style={{ padding: '28px 12px', color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map((item) => (
                <div key={item._id} style={{ marginBottom: '10px' }}>
                  <Link
                    to={item.link || '/'}
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'block',
                      padding: '12px 12px 12px 10px',
                      borderRadius: '12px',
                      background: item.read ? 'rgba(255,255,255,0.4)' : 'rgba(251,146,60,0.08)',
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <strong style={{ fontSize: '13px', display: 'block' }}>{item.title}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{formatTime(item.createdAt)}</span>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.message}</p>
                  </Link>
                </div>
              ))
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={markAllRead}
              disabled={markingRead || unreadCount === 0}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '10px',
                background: 'var(--surface-2)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 700,
                padding: '8px 12px',
                cursor: unreadCount > 0 ? 'pointer' : 'not-allowed',
                opacity: unreadCount > 0 ? 1 : 0.5,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckIcon style={{ width: '14px', height: '14px' }} />
              Mark all read
            </button>
            <button
              type="button"
              onClick={loadNotifications}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
