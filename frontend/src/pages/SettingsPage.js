import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Spinner, ConfirmDialog } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n/useTranslation';
import api from '../utils/api';
import { UserCircleIcon, UsersIcon, UserPlusIcon, KeyIcon, InformationCircleIcon, ChevronDownIcon, ChevronUpIcon, PhotoIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const PRIMARY_ADMIN_EMAIL = 'admin@anpc.com';

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

const formatRole = (role) => {
  if (role === 'admin') return 'Administrator';
  if (role === 'manager') return 'Manager';
  if (role === 'viewer') return 'Viewer';
  return 'User';
};

const sectionHeaderStyle = { fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' };
const sectionSubtitleStyle = { fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 0, lineHeight: 1.5 };

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { t, changeLanguage, currentLanguage } = useTranslation();
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '' });
  const [editProfileMode, setEditProfileMode] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState(null);
  const [togglingStatusId, setTogglingStatusId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [expandedAccountId, setExpandedAccountId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, account: null });
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [deletingBackground, setDeletingBackground] = useState(false);
  const [loadingBackground, setLoadingBackground] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
  const selectedLanguage = currentLanguage?.split('-')[0] || 'en';

  const fetchAccounts = useCallback(async () => {
    if (user?.role !== 'admin') return;
    setLoadingAccounts(true);
    try {
      const { data } = await api.get('/auth/users');
      setAccounts(data.users || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load accounts');
    } finally {
      setLoadingAccounts(false);
    }
  }, [user?.role]);

  const fetchBackgroundImage = useCallback(async () => {
    setLoadingBackground(true);
    try {
      const { data } = await api.get('/settings/login-background');
      setBackgroundImage(data.data || null);
    } catch (err) {
      setBackgroundImage(null);
    } finally {
      setLoadingBackground(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'accounts') fetchAccounts();
    if (activeTab === 'login-background') fetchBackgroundImage();
  }, [activeTab, fetchAccounts, fetchBackgroundImage]);

  useEffect(() => {
    if (editProfileMode && user) {
      setEditProfileForm({ name: user.name || '', email: user.email || '' });
    }
  }, [editProfileMode, user]);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const validTabs = ['profile', 'language', 'accounts', 'create', 'login-background', 'password', 'system'];
    if (hash && validTabs.includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await api.put('/auth/update-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password updated successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update password'); }
    finally { setSaving(false); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editProfileForm.name?.trim()) { toast.error('Name is required'); return; }
    if (!editProfileForm.email?.trim()) { toast.error('Email is required'); return; }
    if (editProfileForm.name.trim().length < 2) { toast.error('Name must be at least 2 characters'); return; }
    setSavingProfile(true);
    const payload = { name: editProfileForm.name.trim(), email: editProfileForm.email.trim() };
    try {
      const response = await api.put('/auth/update-profile', payload);
      if (response.data?.success) {
        if (response.data?.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        toast.success('Profile updated successfully');
        setEditProfileMode(false);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(response.data?.message || 'Failed to update profile');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update profile';
      toast.error(errorMsg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelProfileEdit = () => {
    setEditProfileMode(false);
    setEditProfileForm({ name: user?.name || '', email: user?.email || '' });
  };

  const handleLanguageChange = async (newLanguage) => {
    setSavingLanguage(true);
    try {
      await changeLanguage(newLanguage);
      const { data } = await api.put('/settings/language', { language: newLanguage });
      if (data.success) {
        updateUser({ language: newLanguage });
        toast.success(`Language changed to ${newLanguage.toUpperCase()}`);
      } else {
        toast.error(data?.message || 'Failed to update language preference');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update language preference';
      toast.error(errorMsg);
    } finally {
      setSavingLanguage(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email || !userForm.password) { toast.error('All fields required'); return; }
    if (userForm.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setCreatingUser(true);
    try {
      await api.post('/auth/register', userForm);
      toast.success('Manager account created');
      setUserForm({ name: '', email: '', password: '' });
      fetchAccounts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create account'); }
    finally { setCreatingUser(false); }
  };

  const handleDeleteAccount = async (account) => {
    setConfirmDelete({ open: true, account });
  };

  const handleToggleAccountStatus = async (account) => {
    setTogglingStatusId(account._id);
    try {
      const { data } = await api.put(`/auth/users/${account._id}/toggle-status`);
      toast.success(data.message);
      setAccounts(currentAccounts =>
        currentAccounts.map(acc =>
          acc._id === account._id ? { ...acc, isActive: !acc.isActive } : acc
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update account status');
    } finally {
      setTogglingStatusId(null);
    }
  };

  const handleBackgroundUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5242880) { toast.error('Image is too large. Maximum size: 5MB'); return; }
    setPendingFile(file);
  };

  const confirmBackgroundUpload = async () => {
    if (!pendingFile) return;
    setUploadingBackground(true);
    try {
      const formData = new FormData();
      formData.append('image', pendingFile);
      const { data } = await api.post('/settings/login-background', formData);
      if (data.success) {
        toast.success('Background image uploaded successfully');
        setPendingFile(null);
        fetchBackgroundImage();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload background image');
    } finally {
      setUploadingBackground(false);
    }
  };

  const cancelBackgroundUpload = () => {
    setPendingFile(null);
    const input = document.getElementById('background-upload');
    if (input) input.value = '';
  };

  const handleDeleteBackground = async () => {
    setDeletingBackground(true);
    try {
      const { data } = await api.delete('/settings/login-background');
      if (data.success) {
        toast.success('Background image deleted');
        setBackgroundImage(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete background image');
    } finally {
      setDeletingBackground(false);
    }
  };

  const confirmDeleteAccount = async () => {
    const account = confirmDelete.account;
    setConfirmDelete({ open: false, account: null });
    setDeletingAccountId(account._id);
    try {
      await api.delete(`/auth/users/${account._id}`);
      toast.success('Account deleted');
      setAccounts(currentAccounts => currentAccounts.filter(item => item._id !== account._id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeletingAccountId(null);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image is too large. Maximum size: 5MB'); return; }
    setPendingAvatarFile(file);
  };

  const confirmAvatarUpload = async () => {
    if (!pendingAvatarFile) return;
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('image', pendingAvatarFile);
    try {
      const { data } = await api.post('/settings/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        toast.success('Profile avatar updated');
        setAvatar(data.data.avatar);
        updateUser({ avatar: data.data.avatar });
        setPendingAvatarFile(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const cancelAvatarUpload = () => {
    setPendingAvatarFile(null);
    const input = document.getElementById('avatar-upload');
    if (input) input.value = '';
  };

  const handleDeleteAvatar = async () => {
    setDeletingAvatar(true);
    try {
      const { data } = await api.delete('/settings/avatar');
      if (data.success) {
        toast.success('Profile avatar removed');
        setAvatar(null);
        updateUser({ avatar: null });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete avatar');
    } finally {
      setDeletingAvatar(false);
    }
  };

  useEffect(() => {
    if (user?.avatar) {
      setAvatar(user.avatar);
    }
  }, [user]);

  const tabs = [
    { key: 'profile', label: 'Profile', icon: UserCircleIcon },
    { key: 'language', label: 'Language', icon: GlobeAltIcon },
    ...(user?.role === 'admin' ? [{ key: 'accounts', label: 'Accounts', icon: UsersIcon }] : []),
    ...(user?.role === 'admin' ? [{ key: 'create', label: 'Create Account', icon: UserPlusIcon }] : []),
    ...(user?.role === 'admin' ? [{ key: 'login-background', label: 'Login Background', icon: PhotoIcon }] : []),
    { key: 'password', label: 'Change Password', icon: KeyIcon },
    { key: 'system', label: 'System Info', icon: InformationCircleIcon },
  ];

  const profileRows = [
    ['Full Name', user?.name || 'Not available'],
    ['Email Address', user?.email || 'Not available'],
    ['Role', formatRole(user?.role)],
    ['Account Status', user?.isActive === false ? 'Inactive' : 'Active'],
    ['Last Login', formatDateTime(user?.lastLogin)],
    ['Account Created', formatDateTime(user?.createdAt)],
    ['Last Updated', formatDateTime(user?.updatedAt)],
  ];
  const isAdmin = user?.role === 'admin';

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px' }}>
      <PageHeader title="Settings" subtitle="Account management and system information" />

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* Sidebar nav */}
        <div style={{ width: '220px', flexShrink: 0 }}>
          <div className="card" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {tabs.map(({ key, label, icon: Icon }) => {
              const isActive = activeTab === key;
              return (
                <button key={key} onClick={() => setActiveTab(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px',
                    borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: isActive ? 600 : 500,
                    background: isActive ? 'var(--accent)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                    textAlign: 'left', position: 'relative',
                  }}>
                  <Icon style={{ width: '16px', height: '16px', flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeTab === 'profile' && (
            <div className="card animate-fade-in">
              {editProfileMode ? (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <h2 style={sectionHeaderStyle}>Edit Profile</h2>
                    <p style={sectionSubtitleStyle}>Update your full name and email address</p>
                  </div>
                  <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label className="label">Full Name</label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        value={editProfileForm.name}
                        onChange={e => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Email Address</label>
                      <input
                        type="email"
                        required
                        className="input-field"
                        value={editProfileForm.email}
                        onChange={e => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <button type="submit" disabled={savingProfile} className="btn-primary" style={{ flex: 1 }}>
                        {savingProfile ? <><Spinner size="sm" /> Saving...</> : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelProfileEdit}
                        disabled={savingProfile}
                        className="btn-secondary"
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: '56px', height: '56px', borderRadius: '50%',
                        background: avatar ? 'var(--surface-2)' : 'linear-gradient(135deg, var(--accent-subtle), var(--accent))',
                        color: avatar ? 'transparent' : 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '22px', fontWeight: 800, flexShrink: 0, boxShadow: avatar ? 'none' : '0 0 0 4px var(--accent-subtle)',
                        overflow: 'hidden',
                      }}>
                        {avatar ? (
                          <img src={avatar.cloudinaryUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          user?.name?.[0]?.toUpperCase() || '?'
                        )}
                      </div>
                      <label htmlFor="avatar-upload" style={{
                        position: 'absolute', bottom: '-6px', right: '-6px',
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', boxShadow: 'var(--shadow-sm)', border: '2px solid var(--surface)',
                      }}>
                        <PhotoIcon style={{ width: '12px', height: '12px' }} />
                      </label>
                      <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{user?.name || 'Profile Information'}</h2>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{user?.email || 'Review your signed-in account details'}</p>
                    </div>
                  </div>

                  {pendingAvatarFile && (
                    <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border-muted)' }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>Preview - New Avatar</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent)', flexShrink: 0 }}>
                          <img src={URL.createObjectURL(pendingAvatarFile)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '4px 0', fontSize: '13px', color: 'var(--text-primary)' }}><strong>File:</strong> {pendingAvatarFile.name}</p>
                          <p style={{ margin: '4px 0', fontSize: '13px', color: 'var(--text-primary)' }}><strong>Size:</strong> {(pendingAvatarFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
                        <button type="button" onClick={confirmAvatarUpload} disabled={uploadingAvatar} className="btn-primary" style={{ flex: 1 }}>
                          {uploadingAvatar ? <><Spinner size="sm" /> Uploading...</> : '✓ Upload'}
                        </button>
                        <button type="button" onClick={cancelAvatarUpload} disabled={uploadingAvatar} className="btn-secondary" style={{ flex: 1 }}>
                          ✕ Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {avatar && !pendingAvatarFile && (
                    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border-muted)' }}>
                      <img src={avatar.cloudinaryUrl} alt="Current avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Current Avatar</p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>{avatar.fileName}</p>
                      </div>
                      <button type="button" onClick={handleDeleteAvatar} disabled={deletingAvatar} className="btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        {deletingAvatar ? <><Spinner size="sm" /> Removing...</> : 'Remove'}
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {profileRows.map(([label, value], index) => (
                      <div key={label} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        gap: '16px', padding: '14px 0',
                        borderBottom: index === profileRows.length - 1 ? 'none' : '1px solid var(--border-muted)'
                      }}>
                        <span style={{
                          fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
                          textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0
                        }}>{label}</span>
                        <span style={{
                          fontSize: '13px', fontWeight: 500,
                          color: label === 'Account Status' && value === 'Active' ? 'var(--success)' : 'var(--text-primary)',
                          textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word'
                        }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <button
                      type="button"
                      onClick={() => setEditProfileMode(true)}
                      className="btn-primary"
                    >
                      Edit Profile
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'language' && (
            <div className="card animate-fade-in">
              <div style={{ marginBottom: '24px' }}>
                <h2 style={sectionHeaderStyle}>{t('settings.select_language')}</h2>
                <p style={sectionSubtitleStyle}>{t('settings.choose_system_language')}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px' }}>
                {[
                  { code: 'en', name: 'English', flag: '🇪🇳' },
                  { code: 'es', name: 'Español', flag: '🇪🇸' },
                  { code: 'fr', name: 'Français', flag: '🇫🇷' },
                  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
                  { code: 'pt', name: 'Português', flag: '🇵🇹' },
                  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
                  { code: 'zh', name: '中文', flag: '🇨🇳' },
                  { code: 'ja', name: '日本語', flag: '🇯🇵' },
                ].map(({ code, name, flag }) => {
                  const isSelected = selectedLanguage === code;
                  return (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(code)}
                      disabled={savingLanguage}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: '10px', padding: '18px 12px', borderRadius: '14px',
                        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                        background: isSelected ? 'var(--accent-subtle)' : 'var(--surface)',
                        color: 'var(--text-primary)', cursor: savingLanguage ? 'not-allowed' : 'pointer',
                        opacity: savingLanguage && !isSelected ? 0.55 : 1,
                        fontWeight: isSelected ? 700 : 500, fontSize: '13px',
                        transition: 'all 0.2s ease', boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                      }}
                    >
                      <span style={{ fontSize: '28px' }}>{flag}</span>
                      <span>{name}</span>
                      {isSelected && savingLanguage && <Spinner size="sm" style={{ marginTop: '2px' }} />}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: '24px', padding: '14px 16px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <GlobeAltIcon style={{ width: '18px', height: '18px', color: 'var(--accent-text)', flexShrink: 0 }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  <strong>{t('settings.current_language')}:</strong> {selectedLanguage.toUpperCase()}
                </p>
              </div>
            </div>
          )}

          {user?.role === 'admin' && activeTab === 'accounts' && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: '18px' }}>
                <h2 style={sectionHeaderStyle}>Created Accounts</h2>
                <p style={sectionSubtitleStyle}>{accounts.length} account{accounts.length === 1 ? '' : 's'} registered</p>
              </div>

              {loadingAccounts ? (
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', padding: '20px' }}>
                  <Spinner size="sm" /> Loading accounts...
                </div>
              ) : accounts.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>No created accounts found.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {accounts.map(account => {
                    const isCurrentUser = account._id === user?._id;
                    const isPrimaryAccount = account.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL;
                    const canDeleteAccount = isAdmin && !isCurrentUser && !isPrimaryAccount;
                    const isExpanded = expandedAccountId === account._id;
                    const lastLoginDate = account.lastLogin ? new Date(account.lastLogin) : null;
                    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    const isStale = !lastLoginDate || lastLoginDate < oneWeekAgo;
                    const isLoggedIn = isCurrentUser ? true : account.isLoggedIn;
                    const statusLabel = account.isActive === false
                      ? 'Inactive'
                      : isLoggedIn === false
                        ? (isStale ? 'Inactive' : 'Logged out')
                        : (isStale ? 'Inactive' : 'Active');
                    const statusColors = statusLabel === 'Active'
                      ? { text: 'var(--success)', bg: 'var(--success-bg)' }
                      : statusLabel === 'Logged out'
                        ? { text: 'var(--text-secondary)', bg: 'var(--surface-2)' }
                        : { text: 'var(--text-muted)', bg: 'var(--surface-2)' };
                    const accountRows = [
                      ['Email', account.email || 'Not available'],
                      ['Role', formatRole(account.role)],
                      ['Status', statusLabel],
                      ['Last Login', formatDateTime(account.lastLogin)],
                      ['Created', formatDateTime(account.createdAt)],
                    ];

                    return (
                      <div key={account._id} className="card" style={{ overflow: 'hidden', borderRadius: '14px', padding: 0 }}>
                        <button
                          type="button"
                          onClick={() => setExpandedAccountId(isExpanded ? null : account._id)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px',
                            padding: '18px 20px', background: 'var(--surface)', border: 'none', cursor: 'pointer', textAlign: 'left'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                            <div style={{
                              width: '44px', height: '44px', borderRadius: '12px',
                              background: account.isActive === false ? 'var(--surface-3)' : 'var(--accent-subtle)',
                              color: account.isActive === false ? 'var(--text-muted)' : 'var(--accent-text)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '17px', fontWeight: 800, flexShrink: 0
                            }}>
                              {account.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.name || 'Unnamed Account'}</h3>
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.email || 'No email available'}</p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                            <span style={{
                              padding: '5px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                              color: statusColors.text, background: statusColors.bg, border: '1px solid var(--border-muted)'
                            }}>
                              {statusLabel}
                            </span>
                            {isExpanded ? <ChevronUpIcon style={{ width: '18px', height: '18px', color: 'var(--text-secondary)' }} /> : <ChevronDownIcon style={{ width: '18px', height: '18px', color: 'var(--text-secondary)' }} />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div style={{ padding: '20px', borderTop: '1px solid var(--border-muted)', background: 'var(--surface)' }}>
                            <div style={{ display: 'grid', gap: '10px' }}>
                              {accountRows.map(([label, value], index) => (
                                <div key={label} style={{
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  gap: '12px', padding: '10px 0',
                                  borderBottom: index === accountRows.length - 1 ? 'none' : '1px solid var(--border-muted)'
                                }}>
                                  <span style={{
                                    fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)',
                                    textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0
                                  }}>{label}</span>
                                  <span style={{
                                    fontSize: '13px', fontWeight: 500,
                                    color: label === 'Status' && value === 'Active' ? 'var(--success)' : 'var(--text-primary)',
                                    textAlign: 'right', maxWidth: '65%', wordBreak: 'break-word'
                                  }}>{value}</span>
                                </div>
                              ))}
                            </div>

                            {canDeleteAccount && (
                              <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleAccountStatus(account)}
                                  disabled={togglingStatusId === account._id}
                                  className={account.isActive ? 'btn-danger' : 'btn-success'}
                                  style={{ opacity: togglingStatusId === account._id ? 0.55 : 1 }}
                                >
                                  {togglingStatusId === account._id ? <><Spinner size="sm" /> Processing...</> : (account.isActive ? 'Deactivate' : 'Activate')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAccount(account)}
                                  disabled={deletingAccountId === account._id}
                                  className="btn-danger"
                                  style={{ opacity: deletingAccountId === account._id ? 0.55 : 1 }}
                                >
                                  {deletingAccountId === account._id ? <><Spinner size="sm" /> Deleting...</> : 'Delete Account'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {user?.role === 'admin' && activeTab === 'create' && (
            <div className="card animate-fade-in">
              <div style={{ marginBottom: '20px' }}>
                <h2 style={sectionHeaderStyle}>Create Manager Account</h2>
                <p style={sectionSubtitleStyle}>Managers can create transactions, but cannot edit or delete equipment records.</p>
              </div>
              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[['Full Name', 'name', 'text'], ['Email Address', 'email', 'email'], ['Password', 'password', 'password']].map(([label, name, type]) => (
                  <div key={name}>
                    <label className="label">{label}</label>
                    <input type={type} required className="input-field" value={userForm[name]}
                      onChange={e => setUserForm({ ...userForm, [name]: e.target.value })} />
                  </div>
                ))}
                <div>
                  <button type="submit" disabled={creatingUser} className="btn-primary">
                    {creatingUser ? <><Spinner size="sm" /> Creating...</> : 'Create Manager Account'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {user?.role === 'admin' && activeTab === 'login-background' && (
            <div className="card animate-fade-in">
              <div style={{ marginBottom: '20px' }}>
                <h2 style={sectionHeaderStyle}>Login Page Background</h2>
                <p style={sectionSubtitleStyle}>Upload an image to customize the background of the login page. Supported formats: JPEG, PNG, GIF, WebP. Maximum size: 5MB.</p>
              </div>

              {loadingBackground ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', padding: '20px' }}>
                  <Spinner size="sm" /> Loading background...
                </div>
              ) : (
                <>
                  {pendingFile ? (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ marginBottom: '10px' }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Preview - New Image</p>
                      </div>
                      <div style={{ borderRadius: '14px', overflow: 'hidden', border: '2px solid var(--accent)', maxHeight: '320px', background: 'var(--surface-2)' }}>
                        <img
                          src={URL.createObjectURL(pendingFile)}
                          alt="Pending login background"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px', display: 'flex', gap: '16px' }}>
                        <span><strong>File:</strong> {pendingFile.name}</span>
                        <span><strong>Size:</strong> {(pendingFile.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={confirmBackgroundUpload}
                          disabled={uploadingBackground}
                          className="btn-primary"
                          style={{ flex: 1 }}
                        >
                          {uploadingBackground ? <><Spinner size="sm" /> Uploading...</> : '✓ Upload'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelBackgroundUpload}
                          disabled={uploadingBackground}
                          className="btn-secondary"
                          style={{ flex: 1 }}
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    </div>
                  ) : backgroundImage ? (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ marginBottom: '10px' }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Current Background</p>
                      </div>
                      <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border)', maxHeight: '320px', background: 'var(--surface-2)' }}>
                        <img
                          src={backgroundImage.imageUrl}
                          alt="Current login background"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px', display: 'flex', gap: '16px' }}>
                        <span><strong>File:</strong> {backgroundImage.fileName}</span>
                        <span><strong>Uploaded:</strong> {new Intl.DateTimeFormat('en', {
                          year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                        }).format(new Date(backgroundImage.uploadedAt))}</span>
                      </div>
                      <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => document.getElementById('background-upload').click()}
                          disabled={uploadingBackground}
                          className="btn-primary"
                          style={{ flex: 1 }}
                        >
                          Change Image
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteBackground}
                          disabled={deletingBackground}
                          className="btn-danger"
                          style={{ flex: 1 }}
                        >
                          {deletingBackground ? <><Spinner size="sm" /> Deleting...</> : 'Set to Default'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      border: '2px dashed var(--border)', borderRadius: '14px',
                      padding: '48px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                      onClick={() => document.getElementById('background-upload').click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.background = 'var(--accent-subtle)';
                        e.currentTarget.style.borderColor = 'var(--accent)';
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'var(--border)';
                        if (e.dataTransfer.files[0]) {
                          handleBackgroundUpload(e.dataTransfer.files[0]);
                        }
                      }}
                    >
                      <PhotoIcon style={{ width: '48px', height: '48px', color: 'var(--accent)', margin: '0 auto 12px', opacity: 0.7 }} />
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>Upload Login Background</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                        Drag and drop an image here or click to browse
                      </p>
                    </div>
                  )}

                  <input
                    id="background-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        handleBackgroundUpload(e.target.files[0]);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </>
              )}
            </div>
          )}

          {activeTab === 'password' && (
            <div className="card animate-fade-in">
              <div style={{ marginBottom: '20px' }}>
                <h2 style={sectionHeaderStyle}>Change Password</h2>
                <p style={sectionSubtitleStyle}>Update your account password. Minimum 6 characters.</p>
              </div>
              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[['Current Password', 'currentPassword'], ['New Password', 'newPassword'], ['Confirm New Password', 'confirmPassword']].map(([label, name]) => (
                  <div key={name}>
                    <label className="label">{label}</label>
                    <input type="password" required className="input-field" value={pwForm[name]}
                      onChange={e => setPwForm({ ...pwForm, [name]: e.target.value })} />
                  </div>
                ))}
                <div>
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? <><Spinner size="sm" /> Updating...</> : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="card animate-fade-in">
              <h2 style={sectionHeaderStyle}>System Information</h2>
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '16px' }}>
                {[
                  ['System Name', 'ANPC Yard Internal Tracking System'],
                  ['Organization', 'Sarens NASS'],
                  ['Purpose', 'Equipment rental and pull-out tracking for yard operations'],
                  ['Key Features', 'Create transactions, track equipment, manage attachments, generate reports'],
                  ['Data Tracked', 'Cranes, boom sections, counterweights, hooks, and rental transactions'],
                  ['Your Role', user?.role === 'admin' ? 'Administrator' : 'Manager'],
                  ['Support', 'Contact system administrator for assistance'],
                ].map(([label, value], index) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: '16px', padding: '14px 0',
                    borderBottom: index === 6 ? 'none' : '1px solid var(--border-muted)'
                  }}>
                    <span style={{
                      fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
                      textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0
                    }}>{label}</span>
                    <span style={{
                      fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)',
                      textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word'
                    }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, account: null })}
        onConfirm={confirmDeleteAccount}
        title="Delete Account"
        message={`Delete ${confirmDelete.account?.name || confirmDelete.account?.email}? This account will no longer be able to sign in.`}
        danger
      />
    </div>
  );
}
