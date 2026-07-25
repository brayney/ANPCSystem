import React from 'react';

export default function ConfirmDialog({
  title = 'Please confirm',
  message = '',
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  onConfirm = () => {},
  onCancel = () => {},
}) {
  return (
    <div className="fixed inset-0 z-50">
      {/* subtle backdrop to block interaction */}
      <div className="absolute inset-0 bg-black/40" />

      {/* dialog pinned to top-center */}
      <div className="relative flex justify-center items-start pointer-events-none">
        <div className="mt-6 w-full max-w-md mx-4 pointer-events-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-700 dark:text-gray-200">{message}</p>
          </div>
          <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-blue-600 text-sm text-white hover:bg-blue-700"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
