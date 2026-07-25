import React from 'react';
import { createRoot } from 'react-dom/client';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function confirm(message, options = {}) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      // fallback to window.confirm on non-DOM environments
      const ok = typeof window !== 'undefined' ? window.confirm(message) : false;
      resolve(ok);
      return;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const cleanup = () => {
      setTimeout(() => {
        try {
          root.unmount();
        } catch (e) {}
        if (container.parentNode) container.parentNode.removeChild(container);
      }, 50);
    };

    const handleConfirm = () => {
      resolve(true);
      cleanup();
    };

    const handleCancel = () => {
      resolve(false);
      cleanup();
    };

    root.render(
      <ConfirmDialog
        message={message}
        confirmLabel={options.confirmLabel || 'OK'}
        cancelLabel={options.cancelLabel || 'Cancel'}
        title={options.title || 'Confirm'}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  });
}
