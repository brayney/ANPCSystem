// Branch administration page
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserIcon, HomeIcon, BuildingOffice2Icon, Bars3Icon, MapPinIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Spinner, ConfirmDialog } from '../components/common';
import LogoSplash from '../components/common/LogoSplash';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const number = new Intl.NumberFormat().format;
const statusColor = (status) => status === 'Active' ? 'var(--accent-text)' : status === 'Returned' ? 'var(--success)' : 'var(--text-secondary)';
const locationList = (payload) => Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
const hasCoordinates = (branch) => ['latitude', 'longitude'].every(key => branch[key] !== null && branch[key] !== undefined && branch[key] !== '' && Number.isFinite(Number(branch[key])));

export default function BranchAdministrationPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [form, setForm] = useState({ branchName: '', branchCode: '', country: 'Philippines', region: '', province: '', city: '', name: '', email: '', password: '' });
  const [edit, setEdit] = useState({ name: '', code: '', country: 'Philippines', region: '', province: '', city: '' });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [editCities, setEditCities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [locatingBranches, setLocatingBranches] = useState(false);
  const [pendingBranchStatusChange, setPendingBranchStatusChange] = useState(null);
  const autoLocationAttempted = useRef(false);
  const mapRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/branches');
      setBranches(data.branches || []);
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to load branches';
      toast.error(message);
      if (error.response?.status === 403) {
        await logout();
        navigate('/company-admin/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const needsLocations = branches.some(branch => !hasCoordinates(branch) && [branch.address, branch.city, branch.province, branch.region, branch.country].some(Boolean));

    if (loading || autoLocationAttempted.current || !needsLocations) return;
    autoLocationAttempted.current = true;

    const locate = async () => {
      setLocatingBranches(true);
      try {
        const { data } = await api.post('/branches/geocode-missing');
        if (data.updated) {
          toast.success(`${data.updated} branch location${data.updated === 1 ? '' : 's'} added to the map`);
          await load();
        }
      } catch {
        // The map stays available and the manual action remains visible.
      } finally {
        setLocatingBranches(false);
      }
    };

    locate();
  }, [branches, loading, load]);

  useEffect(() => { fetch('https://countriesnow.space/api/v0.1/countries/states').then(response => response.json()).then(payload => setCountries(locationList(payload))).catch(() => toast.error('Unable to load countries')); }, []);
  useEffect(() => {
    const country = countries.find(item => item.name === form.country);
    setRegions(country?.states || []);
    if (!form.country) return setCities([]);
    fetch(`https://countriesnow.space/api/v0.1/countries/cities/q?country=${encodeURIComponent(form.country)}`).then(response => response.json()).then(payload => setCities(locationList(payload))).catch(() => setCities([]));
  }, [form.country, countries]);
  useEffect(() => {
    if (!edit.country) return setEditCities([]);
    fetch(`https://countriesnow.space/api/v0.1/countries/cities/q?country=${encodeURIComponent(edit.country)}`).then(response => response.json()).then(payload => setEditCities(locationList(payload))).catch(() => setEditCities([]));
  }, [edit.country]);

  useEffect(() => {
    if (!profileMenuOpen) return;

    const handleClick = (event) => {
      if (event.target instanceof Element && event.target.closest('[data-company-admin-profile-root]')) return;
      setProfileMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileMenuOpen]);

  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.toggle('dark');
    setDarkMode(prev => !prev);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    await new Promise(resolve => setTimeout(resolve, 300));
    navigate('/company-admin/login', { replace: true });
  };

  const openAddBranch = () => {
    setActiveView('add');
    setSelected(null);
    setDetails(null);
    setTimeout(() => document.getElementById('new-branch-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const openBranches = () => {
    setActiveView('manage');
    setSelected(null);
    setDetails(null);
  };

  const goBackToCards = () => {
    setActiveView('manage');
    setSelected(null);
    setDetails(null);
  };

  const review = async (branch, view = 'view') => {
    setActiveView(view);
    setSelected(branch);
    setEdit({ name: branch.name, code: branch.code, country: branch.country || 'Philippines', region: branch.region || '', province: branch.province || '', city: branch.city || '' });
    setDetails(null);
    setLoadingDetails(true);
    try {
      const { data } = await api.get(`/branches/${branch._id}/summary`);
      setDetails(data.data);
    } catch {
      toast.error('Unable to load branch summary');
    } finally {
      setLoadingDetails(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/branches', form);
      toast.success('Branch and administrator created');
      setForm({ branchName: '', branchCode: '', country: 'Philippines', region: '', province: '', city: '', name: '', email: '', password: '' });
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create branch');
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.put(`/branches/${selected._id}`, edit);
      toast.success(data.message);
      const next = { ...selected, ...data.branch };
      setSelected(next);
      setDetails(current => current ? { ...current, branch: data.branch } : current);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update branch');
    }
  };

  const toggle = (branch) => {
    setPendingBranchStatusChange(branch);
  };

  const confirmBranchStatusChange = async () => {
    const branch = pendingBranchStatusChange;
    if (!branch) return;
    setPendingBranchStatusChange(null);

    try {
      await api.put(`/branches/${branch._id}/toggle-status`);
      toast.success(`Branch ${branch.isActive ? 'deactivated' : 'activated'}`);
      load();
      if (selected?._id === branch._id) {
        review({ ...branch, isActive: !branch.isActive }, activeView);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update branch');
    }
  };

  const removeBranch = async (branch) => {
    if (!window.confirm(`Delete ${branch.name}? This is only available for branches with no accounts or operational records.`)) return;
    try {
      const { data } = await api.delete(`/branches/${branch._id}`);
      toast.success(data.message);
      setSelected(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete branch');
    }
  };

  const locateExistingBranches = async () => {
    setLocatingBranches(true);
    try {
      const { data } = await api.post('/branches/geocode-missing');
      toast.success(data.message);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to locate existing branches');
    } finally {
      setLocatingBranches(false);
    }
  };

  const focusBranchOnMap = (branch) => {
    if (!hasCoordinates(branch)) {
      toast.error('This branch does not have a map location yet');
      return;
    }

    mapRef.current?.panTo([Number(branch.latitude), Number(branch.longitude)], { animate: true, duration: 0.75 });
  };

  const renderContent = () => {
    const branchesWithCoordinates = branches.filter(hasCoordinates);
    const center = branchesWithCoordinates.length > 0 ? [
      branchesWithCoordinates.reduce((total, branch) => total + Number(branch.latitude), 0) / branchesWithCoordinates.length,
      branchesWithCoordinates.reduce((total, branch) => total + Number(branch.longitude), 0) / branchesWithCoordinates.length,
    ] : [12.8797, 121.7740];

    if (!activeView) {
      return null;
    }

    if (activeView === 'dashboard') {
      const activeBranches = branches.filter(branch => branch.isActive).length;
      const totalAccounts = branches.reduce((total, branch) => total + (branch.accountCount || 0), 0);

      return (
        <div className="company-admin-dashboard">
          <section className="company-admin-dashboard-hero">
            <div>
              <span className="company-admin-dashboard-eyebrow">Company overview</span>
              <h2>Welcome back, {user?.name?.split(' ')[0] || 'Admin'}</h2>
              <p>Monitor your branch network and keep company information up to date.</p>
            </div>
          </section>

          {loading ? <div className="card"><Spinner size="sm" /></div> : (
            <>
              <section className="company-admin-stat-grid" aria-label="Company summary">
                <div className="company-admin-stat-card"><span>Total branches</span><strong>{number(branches.length)}</strong><small>All company locations</small></div>
                <div className="company-admin-stat-card"><span>Active branches</span><strong>{number(activeBranches)}</strong><small>{branches.length - activeBranches} inactive</small></div>
                <div className="company-admin-stat-card"><span>Branch accounts</span><strong>{number(totalAccounts)}</strong><small>Administrator and staff accounts</small></div>
              </section>

              <section className="card company-admin-dashboard-branches">
                <div className="company-admin-section-heading">
                  <div><h3>Branches</h3><p>Latest branch information at a glance.</p></div>
                  <button type="button" className="btn-secondary" onClick={openBranches}>Manage branches</button>
                </div>
                {branches.length === 0 ? <p className="company-admin-empty-state">No branches have been added yet.</p> : (
                  <div className="company-admin-dashboard-list">
                    {branches.slice(0, 5).map(branch => (
                      <button type="button" className="company-admin-dashboard-branch" key={branch._id} onClick={() => review(branch)}>
                        <span><strong>{branch.name}</strong><small>{branch.code} · {branch.accountCount || 0} accounts</small></span>
                        <span className={`branch-admin-status-pill ${branch.isActive ? 'active' : 'inactive'}`}>{branch.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      );
    }

    if (activeView === 'view' && !selected) {
      return (
        <div className="company-admin-view-branches">
          <section className="card company-admin-map-card">
            <div className="company-admin-section-heading"><div><h2>Branch locations</h2><p>Every branch with a completed address is located here automatically.</p></div></div>
            <div className="company-admin-global-map">
              {branches.length === 0 ? (
                <div className="company-admin-map-empty"><p>No branches have been created yet.</p></div>
              ) : (
                <>
                  <MapContainer center={center} zoom={4} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} keyboard={false} zoomControl={false} className="company-admin-map-surface" ref={mapRef}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      subdomains="abcd"
                      maxZoom={20}
                    />
                    {branchesWithCoordinates.map(branch => (
                      <Marker
                        key={branch._id}
                        position={[Number(branch.latitude), Number(branch.longitude)]}
                        icon={L.divIcon({
                          html: `<div class="company-admin-map-marker-pin ${branch.isActive ? '' : 'inactive'}"><span class="company-admin-map-marker-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/></svg></span><span class="company-admin-map-marker-text">${branch.name}</span></div>`,
                          className: '',
                          iconSize: [0, 0],
                          iconAnchor: [12, 24],
                        })}
                        eventHandlers={{ click: () => review(branch) }}
                      />
                    ))}
                  </MapContainer>
                  <div className="company-admin-map-summary" aria-label="Map coverage">
                    <span className="company-admin-map-summary-dot" aria-hidden="true" />
                    <strong>{branchesWithCoordinates.length}</strong>
                    <span>{branchesWithCoordinates.length === 1 ? 'branch mapped' : 'branches mapped'}</span>
                  </div>
                  {branches.length > 0 && branchesWithCoordinates.length < branches.length && (
                    <button type="button" className="company-admin-map-locate" onClick={locateExistingBranches} disabled={locatingBranches}>
                      {locatingBranches ? 'Locating branches...' : 'Locate missing pins'}
                    </button>
                  )}
                </>
              )}
            </div>
          </section>
          <section className="card company-admin-view-list">
            <div className="company-admin-section-heading"><div><h2>Find a branch</h2><p>Select a branch to center the map on its saved address.</p></div></div>
            {loading ? <Spinner size="sm" /> : branches.length === 0 ? <p className="company-admin-empty-state">No branches yet.</p> : branches.map(branch => (
              <button type="button" className="company-admin-dashboard-branch" key={branch._id} onClick={() => focusBranchOnMap(branch)}>
                <span><strong>{branch.name}</strong><small>{branch.address || 'No address added'} · {branch.accountCount || 0} accounts</small></span>
                <span className={`branch-admin-status-pill ${branch.isActive ? 'active' : 'inactive'}`}>{branch.isActive ? 'Active' : 'Inactive'}</span>
              </button>
            ))}
          </section>
        </div>
      );
    }

    if (activeView === 'add') {
      return (
        <div style={{ display: 'grid', gap: 16 }}>
          <button type="button" className="branch-admin-text-action" onClick={goBackToCards}>← Back</button>
          <form id="new-branch-form" className="card" onSubmit={submit} style={{ display: 'grid', gap: 14, gridColumn: '1 / -1' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16 }}>New branch</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>Complete the address below and the branch will be located automatically on the map.</p>
          </div>
          {[['Branch name', 'branchName', 'text'], ['Branch code', 'branchCode', 'text'], ['Country', 'country', 'text'], ['State / province / region', 'region', 'text'], ['City', 'city', 'text'], ['Administrator name', 'name', 'text'], ['Administrator email', 'email', 'email'], ['Temporary password', 'password', 'password']].map(([label, key, type]) => (
            <div key={key}>
              <label className="label">{label} *</label>
              {key === 'country' ? <select required className="input-field" value={form.country} onChange={e => setForm({ ...form, country: e.target.value, region: '', city: '' })}>{countries.map(item => <option key={item.iso3} value={item.name}>{item.name}</option>)}</select>
                : key === 'region' ? <select required className="input-field" value={form.region} onChange={e => setForm({ ...form, region: e.target.value, province: '', city: '' })}><option value="">Select region</option>{regions.map(item => <option key={item.code} value={item.name}>{item.name}</option>)}</select>
                : key === 'city' ? <select required disabled={!form.country} className="input-field" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}><option value="">Select city</option>{cities.map(item => <option key={typeof item === 'string' ? item : item.code} value={typeof item === 'string' ? item : item.name}>{typeof item === 'string' ? item : item.name}</option>)}</select>
                : <input required className="input-field" type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />}
            </div>
          ))}
          <button className="btn-primary" disabled={saving}>{saving ? <><Spinner size="sm" /> Creating...</> : 'Create branch administrator'}</button>
          </form>
        </div>
      );
    }

    return (
      <div className="branch-admin-detail-shell" style={{ width: '100%', display: 'grid', gap: 20 }}>
        {!selected ? (
          <div style={{ display: 'grid', gap: 20, width: '100%' }}>
            <div id="branch-list-card" className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20 }}>Manage branches</h2>
                  <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>Add, edit, deactivate, or delete branches.</p>
                </div>
                <button type="button" className="btn-primary" onClick={openAddBranch}>Add branch</button>
              </div>
              {loading ? <Spinner size="sm" /> : branches.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No branches yet.</p> : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {branches.map(branch => (
                    <div key={branch._id} className="branch-admin-card-item">
                      <button type="button" className="branch-admin-card-button" onClick={() => review(branch, 'manage')}>
                        <div className="branch-admin-card-header">
                          <div className="branch-admin-card-title">
                            <strong>{branch.name}</strong>
                            <span className={`branch-admin-status-pill ${branch.isActive ? 'active' : 'inactive'}`}>{branch.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                        <div className="branch-admin-card-meta">{branch.code} · {branch.accountCount} accounts</div>
                        <div className="branch-admin-card-footer">
                          <span>Edit branch</span>
                          <span className="branch-admin-card-arrow">→</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className={branch.isActive ? 'btn-danger branch-admin-toggle-btn' : 'btn-success branch-admin-toggle-btn'}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggle(branch);
                        }}
                      >
                        {branch.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button type="button" className="btn-danger branch-admin-toggle-btn" onClick={() => removeBranch(branch)} title="Delete branch"><TrashIcon style={{ width: 15, height: 15 }} /> Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card" style={{ width: '100%', padding: '24px', borderRadius: '18px' }}>
            {loadingDetails ? <Spinner size="sm" /> : details && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20 }}>{details.branch.name} overview</h2>
                    <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>Branch processes, transactions, and account activity.</p>
                  </div>
                  <button type="button" className="branch-admin-text-action" onClick={() => setSelected(null)}>← Back</button>
                </div>

                {activeView === 'manage' && <form onSubmit={saveEdit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(180px, 1fr)) auto', gap: 12, alignItems: 'end', marginBottom: 24 }}>
                  <div>
                    <label className="label">Branch name</label>
                    <input className="input-field" value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Code</label>
                    <input className="input-field" value={edit.code} onChange={e => setEdit({ ...edit, code: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Country</label>
                    <select required className="input-field" value={edit.country} onChange={e => setEdit({ ...edit, country: e.target.value, region: '', city: '' })}>{countries.map(item => <option key={item.iso3} value={item.name}>{item.name}</option>)}</select>
                  </div>
                  <div>
                    <label className="label">State / province / region</label>
                    <select required className="input-field" value={edit.region} onChange={e => setEdit({ ...edit, region: e.target.value, province: '' })}><option value="">Select state / province / region</option>{(countries.find(item => item.name === edit.country)?.states || []).map(item => <option key={item.state_code || item.name} value={item.name}>{item.name}</option>)}</select>
                  </div>
                  <div>
                    <label className="label">City</label>
                    <select required disabled={!edit.country} className="input-field" value={edit.city} onChange={e => setEdit({ ...edit, city: e.target.value })}><option value="">Select city</option>{editCities.map(item => <option key={typeof item === 'string' ? item : item.code} value={typeof item === 'string' ? item : item.name}>{typeof item === 'string' ? item : item.name}</option>)}</select>
                  </div>
                  <button className="btn-primary">Save</button>
                </form>}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
                  {[['Cranes', details.summary.cranes], ['Attachments', details.summary.counterweights + details.summary.boomSections + details.summary.hooks], ['Active transactions', details.summary.activeTransactions], ['Completed', details.summary.completedTransactions]].map(([label, value]) => (
                    <div key={label} style={{ padding: 14, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 24, fontWeight: 800 }}>{number(value)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(240px, .8fr)', gap: 20 }}>
                  <div>
                    <h3 style={{ fontSize: 14 }}>Recent transactions</h3>
                    {details.recentTransactions.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No transactions yet — this branch is fresh.</p> : (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {details.recentTransactions.map(txn => (
                          <div key={txn._id} style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                            <div>
                              <strong style={{ fontSize: 13 }}>{txn.transactionNo}</strong>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{txn.companyName} · {txn.crane}</div>
                            </div>
                            <span style={{ fontSize: 12, color: statusColor(txn.status), fontWeight: 700 }}>{txn.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14 }}>Process status</h3>
                    {details.statusBreakdown.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No process activity yet.</p> : details.statusBreakdown.map(item => (
                      <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-muted)' }}>
                        <span>{item._id}</span>
                        <strong>{item.count}</strong>
                      </div>
                    ))}
                    <h3 style={{ fontSize: 14, marginTop: 20 }}>Branch accounts</h3>
                    {details.users.map(user => (
                      <div key={user._id} style={{ fontSize: 13, padding: '6px 0' }}>{user.name} <span style={{ color: 'var(--text-secondary)' }}>({user.role})</span></div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoggingOut) {
    return <LogoSplash label="Signing you out..." />;
  }

  return (
    <div className={`company-admin-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="company-admin-sidebar">
        <div className="company-admin-sidebar-brand">
          <img src="/logo.png" alt="ANPC Logo" />
          {!sidebarCollapsed && <div><strong>ANPC</strong><span>Company Admin</span></div>}
        </div>
        <div className="company-admin-sidebar-label">{!sidebarCollapsed && 'Navigation'}</div>
        <nav className="company-admin-sidebar-nav" aria-label="Company administration">
          <button type="button" className={activeView === 'dashboard' ? 'active' : ''} onClick={() => { setActiveView('dashboard'); setSelected(null); setDetails(null); }} title="Dashboard">
            <HomeIcon aria-hidden="true" /> {!sidebarCollapsed && <span>Dashboard</span>}
          </button>
          <button type="button" className={activeView === 'view' ? 'active' : ''} onClick={() => { setActiveView('view'); setSelected(null); setDetails(null); }} title="View branches">
            <MapPinIcon aria-hidden="true" /> {!sidebarCollapsed && <span>View branches</span>}
          </button>
          <button type="button" className={activeView === 'manage' || activeView === 'add' ? 'active' : ''} onClick={openBranches} title="Branches">
            <BuildingOffice2Icon aria-hidden="true" /> {!sidebarCollapsed && <span>Branches</span>}
          </button>
        </nav>
        <div className="company-admin-sidebar-footer">
          {!sidebarCollapsed && <span>Company administration</span>}
        </div>
      </aside>
      <div className="company-admin-main">
      <header className="company-admin-topbar">
        <div className="company-admin-topbar-brand">
          <button type="button" className="company-admin-sidebar-toggle" onClick={() => setSidebarCollapsed(prev => !prev)} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <Bars3Icon aria-hidden="true" />
          </button>
        </div>

        <div className="company-admin-topbar-actions" data-company-admin-profile-root>
          <button type="button" className="company-admin-theme-toggle" onClick={toggleTheme}>
            {darkMode ? '☀️ Light mode' : '🌙 Dark mode'}
          </button>

          <div className="company-admin-profile-menu-wrap">
            <button type="button" className="company-admin-profile-trigger app-header-profile-trigger" onClick={() => setProfileMenuOpen(prev => !prev)}>
              {user?.avatar?.cloudinaryUrl ? (
                <img src={user.avatar.cloudinaryUrl} alt="Profile" className="company-admin-profile-avatar" />
              ) : (
                <div className="company-admin-profile-avatar">
                  <UserIcon style={{ width: '20px', height: '20px' }} aria-hidden="true" />
                </div>
              )}
              <div className="company-admin-profile-copy">
                <strong>{user?.name || 'Admin'}</strong>
              </div>
            </button>

            {profileMenuOpen && (
              <div className="company-admin-profile-dropdown">
                <button type="button" className="company-admin-profile-dropdown-item" onClick={() => { toggleTheme(); setProfileMenuOpen(false); }}>
                  {darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                </button>
                <button type="button" className="company-admin-profile-dropdown-item company-admin-profile-dropdown-item-danger" onClick={() => { setProfileMenuOpen(false); setShowLogoutConfirm(true); }}>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <ConfirmDialog
        open={Boolean(pendingBranchStatusChange)}
        onClose={() => setPendingBranchStatusChange(null)}
        onConfirm={confirmBranchStatusChange}
        title={pendingBranchStatusChange?.isActive ? 'Deactivate branch?' : 'Activate branch?'}
        message={pendingBranchStatusChange?.isActive
          ? `${pendingBranchStatusChange.name} and its assigned accounts will no longer be able to sign in.`
          : `${pendingBranchStatusChange?.name} and its assigned accounts will be able to sign in again.`}
        danger={pendingBranchStatusChange?.isActive}
      />
      {showLogoutConfirm && (
        <div className="company-admin-modal-backdrop" role="presentation" onClick={() => setShowLogoutConfirm(false)}>
          <div className="company-admin-modal" role="dialog" aria-modal="true" aria-labelledby="logout-confirmation-title" onClick={event => event.stopPropagation()}>
            <h2 id="logout-confirmation-title">Log out of Company Admin?</h2>
            <p>Your current session will end and you’ll return to the Company Admin sign-in page.</p>
            <div className="company-admin-modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button type="button" className="btn-danger" onClick={handleLogout}>Log out</button>
            </div>
          </div>
        </div>
      )}

      <div className="branch-admin-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        {renderContent()}
      </div>
      </div>
    </div>
  );
}
