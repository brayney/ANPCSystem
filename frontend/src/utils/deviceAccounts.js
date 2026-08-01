const SAVED_ACCOUNTS_KEY = 'anpc-device-accounts';
const NOTIFICATION_PREFERENCES_KEY = 'anpc-device-notification-preferences';
const PENDING_DEVICE_ACCOUNT_KEY = 'anpc-pending-device-account';

export const getSavedDeviceAccounts = () => {
  try {
    const accounts = JSON.parse(localStorage.getItem(SAVED_ACCOUNTS_KEY) || '[]');
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
};

export const saveDeviceAccount = (user, { branchId = '', branchName = '' } = {}) => {
  if (!user?._id) return;
  const account = {
    id: user._id,
    name: user.name || user.email || 'Account',
    email: user.email || '',
    role: user.role || 'viewer',
    avatarUrl: user.avatar?.cloudinaryUrl || '',
    branchId: branchId || user.branch || '',
    branchName,
  };
  const accounts = getSavedDeviceAccounts().filter(item => item.id !== account.id);
  localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify([account, ...accounts].slice(0, 8)));
};

export const removeDeviceAccount = (userId) => {
  localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(getSavedDeviceAccounts().filter(item => item.id !== userId)));
};

export const getPendingDeviceAccount = () => {
  try {
    return JSON.parse(localStorage.getItem(PENDING_DEVICE_ACCOUNT_KEY) || 'null');
  } catch {
    return null;
  }
};

export const setPendingDeviceAccount = (user, branch) => {
  if (!user?._id) return;
  localStorage.setItem(PENDING_DEVICE_ACCOUNT_KEY, JSON.stringify({ user, branch }));
};

export const clearPendingDeviceAccount = () => localStorage.removeItem(PENDING_DEVICE_ACCOUNT_KEY);

export const getNotificationsEnabled = (userId) => {
  try {
    const preferences = JSON.parse(localStorage.getItem(NOTIFICATION_PREFERENCES_KEY) || '{}');
    return preferences[userId] !== false;
  } catch {
    return true;
  }
};

export const setNotificationsEnabled = (userId, enabled) => {
  try {
    const preferences = JSON.parse(localStorage.getItem(NOTIFICATION_PREFERENCES_KEY) || '{}');
    localStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify({ ...preferences, [userId]: enabled }));
  } catch {
    localStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify({ [userId]: enabled }));
  }
  window.dispatchEvent(new Event('anpc-notification-preference-change'));
};
