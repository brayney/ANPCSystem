import React, { useEffect, useState } from 'react';

export default function ConnectionStatus() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <div
      title={online ? 'Connected' : 'You are offline — changes may not save'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '4px 9px', borderRadius: '999px',
        fontSize: '11px', fontWeight: 600,
        border: `1px solid ${online ? 'var(--success)' : 'var(--danger)'}`,
        background: online ? 'var(--success-bg)' : 'var(--danger-bg)',
        color: online ? 'var(--success)' : 'var(--danger)',
        transition: 'background 0.2s, color 0.2s, border-color 0.2s',
      }}
    >
      <span
        style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: online ? 'var(--success)' : 'var(--danger)',
          boxShadow: `0 0 6px ${online ? 'var(--success)' : 'var(--danger)'}`,
        }}
      />
      {online ? 'Online' : 'Offline'}
    </div>
  );
}
