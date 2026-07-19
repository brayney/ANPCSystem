import React, { useEffect, useState } from 'react';
import { SignalSlashIcon } from '@heroicons/react/24/outline';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [reconnected, setReconnected] = useState(false);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => {
      setOffline(false);
      setReconnected(true);
      const t = setTimeout(() => setReconnected(false), 2500);
      return () => clearTimeout(t);
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (!offline && !reconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 95,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: '8px 16px', fontSize: '12px', fontWeight: 600,
        background: offline ? 'var(--danger)' : 'var(--success)',
        color: '#fff', boxShadow: 'var(--shadow)',
        animation: 'slideDown 0.3s ease both',
      }}
    >
      {offline ? (
        <>
          <SignalSlashIcon style={{ width: '15px', height: '15px' }} />
          You are offline — data will sync when the connection returns.
        </>
      ) : (
        'Back online — connection restored.'
      )}
    </div>
  );
}
