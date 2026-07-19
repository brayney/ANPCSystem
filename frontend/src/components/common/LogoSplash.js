import React from 'react';

const LogoSplash = ({ label }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '22px',
        background: 'var(--sidebar-bg, #0b1220)',
      }}
    >
      <div style={{ position: 'relative', width: '110px', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Spinning ring */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid rgba(37,99,235,0.18)',
            borderTopColor: 'var(--accent, #2563eb)',
            animation: 'spin 0.9s linear infinite',
          }}
        />
        {/* Logo centered inside the circle */}
        <img
          src="/logo.png"
          alt="ANPC Logo"
          style={{
            width: '58px',
            height: '58px',
            objectFit: 'contain',
            filter: 'brightness(1.15) contrast(1.1)',
            animation: 'splashPulse 1.6s ease-in-out infinite',
          }}
        />
      </div>
      {label && (
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #8b949e)', letterSpacing: '0.04em' }}>
          {label}
        </p>
      )}
    </div>
  );
};

export default LogoSplash;
