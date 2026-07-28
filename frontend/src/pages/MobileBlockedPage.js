import React from 'react';

const MobileBlockedPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fb 0%, #eef3ff 100%)',
      padding: '24px',
      fontFamily: 'inherit',
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        boxShadow: 'var(--shadow-lg)',
        padding: '28px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '18px',
          margin: '0 auto 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
          color: '#fff',
          fontSize: '28px',
          fontWeight: 800,
        }}>
          !
        </div>
         <h1 style={{ margin: '0 0 10px', fontSize: '24px', color: 'var(--text-primary)', fontWeight: 900, textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>Mobile access is not allowed</h1>
        <p style={{ margin: '0 0 18px', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          This system is intended for desktop and laptop browsers only. If you are reviewing a printed transaction, please use the QR code link on your phone to open the public transaction page.
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: '999px',
          background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
          color: 'var(--accent-text)',
          fontSize: '12px',
          fontWeight: 700,
        }}>
          Desktop access only • QR review remains available
        </div>
      </div>
    </div>
  );
};

export default MobileBlockedPage;
