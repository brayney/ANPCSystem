import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, EyeIcon, TruckIcon } from '@heroicons/react/24/outline';
import { PageHeader, StatusBadge, Pagination, EmptyState, Modal, ConfirmDialog, TableSkeleton } from '../components/common';
import CSVImport from '../components/common/CSVImport';
import { fetchWithCache, invalidateCache } from '../utils/dataCache';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const STATUS_OPTIONS = ['Available', 'On Hire', 'Standby', 'Under Maintenance', 'Out of Yard', 'Reserved'];

const CraneForm = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState({
    equipmentNo: '', craneModel: '', yearModel: '', capacity: '', weightKg: '', location: 'RAG YARD',
    client: '', status: 'Available', supervisor: '', division: '', comments: ''
  });
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const steps = [
    { title: 'Basic info', description: 'Capture the crane identity and specs.' },
    { title: 'Assignment', description: 'Add location, client, and operational status.' },
    { title: 'Review', description: 'Confirm everything before saving.' }
  ];

  useEffect(() => {
    if (initial) {
      setForm(initial);
    }
  }, [initial]);

  const handleChange = useCallback((name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setSaving(true);
    try {
      if (initial?._id) { 
        await api.put(`/cranes/${initial._id}`, form); 
        toast.success('Crane updated'); 
      } else { 
        await api.post('/cranes', form); 
        toast.success('Crane created'); 
      }
      onSave();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Error saving crane'); 
    }
    finally { 
      setSaving(false); 
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
      <div className="wizard-shell" style={{ marginBottom: '0px' }}>
        <div className="wizard-header">
          <div className="wizard-title-block">
            <div className="wizard-kicker">Step {step} of {steps.length}</div>
            <div className="wizard-title">{steps[step - 1].title}</div>
          </div>
          <div className="wizard-description">{steps[step - 1].description}</div>
        </div>
        <div className="wizard-progress-track">
          <div className="wizard-progress-fill" style={{ width: `${(step / steps.length) * 100}%` }} />
        </div>
      </div>

      <div className="wizard-form-body">
      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Equipment No. *</label>
            <input type="text" className="input-field" required value={form.equipmentNo || ''} onChange={e => handleChange('equipmentNo', e.target.value)} />
          </div>
          <div>
            <label className="label">Crane Model</label>
            <input type="text" className="input-field" value={form.craneModel || ''} onChange={e => handleChange('craneModel', e.target.value)} />
          </div>
          <div>
            <label className="label">Year Model</label>
            <input type="text" className="input-field" value={form.yearModel || ''} onChange={e => handleChange('yearModel', e.target.value)} />
          </div>
          <div>
            <label className="label">Capacity</label>
            <input type="text" className="input-field" value={form.capacity || ''} onChange={e => handleChange('capacity', e.target.value)} />
          </div>
          <div>
            <label className="label">Weight (KG)</label>
            <input type="text" className="input-field" value={form.weightKg || ''} onChange={e => handleChange('weightKg', e.target.value)} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Location</label>
            <input type="text" className="input-field" value={form.location || ''} disabled style={{ backgroundColor: 'var(--bg-muted)', cursor: 'not-allowed' }} />
          </div>
          <div>
            <label className="label">Client</label>
            <input type="text" className="input-field" value={form.client || ''} onChange={e => handleChange('client', e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input-field" value={form.status || ''} onChange={e => handleChange('status', e.target.value)}>
              <option value="">Select...</option>
              {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Supervisor</label>
            <input type="text" className="input-field" value={form.supervisor || ''} onChange={e => handleChange('supervisor', e.target.value)} />
          </div>
          <div>
            <label className="label">Division</label>
            <input type="text" className="input-field" value={form.division || ''} onChange={e => handleChange('division', e.target.value)} />
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'grid', gap: '12px' }}>
          <div>
            <label className="label">Comments</label>
            <textarea className="input-field" rows={3} value={form.comments || ''} onChange={e => handleChange('comments', e.target.value)} style={{ resize: 'vertical' }} />
          </div>
          <div className="wizard-section-card wizard-summary-card">
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick review</div>
            <div style={{ display: 'grid', gap: '6px', fontSize: '13px', color: 'var(--text-primary)' }}>
              <div><strong>Equipment:</strong> {form.equipmentNo || '—'}</div>
              <div><strong>Model:</strong> {form.craneModel || '—'}</div>
              <div><strong>Status:</strong> {form.status || '—'}</div>
              <div><strong>Client:</strong> {form.client || '—'}</div>
            </div>
          </div>
        </div>
      )}

      </div>
      <div className="wizard-actions">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        {step > 1 && (
          <button type="button" onClick={() => setStep(prev => Math.max(prev - 1, 1))} className="btn-secondary">Back</button>
        )}
        {step < steps.length ? (
          <button type="button" onClick={() => setStep(prev => Math.min(prev + 1, steps.length))} className="btn-primary">Next</button>
        ) : (
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : (initial ? 'Update Crane' : 'Create Crane')}
          </button>
        )}
      </div>
    </form>
  );
};

export default function CranesPage() {
  const [cranes, setCranes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const { user } = useAuth();
  const canCreate = user?.role === 'admin';
  const canEditOrDelete = user?.role === 'admin';

  const fetchCranes = useCallback(async () => {
    setLoading(true);
    try {
      const pageSize = 15;
      const pageParams = { page, limit: pageSize };
      if (search) {
        pageParams.search = search;
      }
      if (statusFilter) {
        pageParams.status = statusFilter;
      }
      const pageData = await fetchWithCache('/cranes', pageParams, { inflate: false });
      const resolvedItems = Array.isArray(pageData) ? pageData : (pageData?.data || []);
      const currentTotal = Array.isArray(pageData) ? (pageData?.length || 0) : (pageData?.total ?? resolvedItems.length);
      const resolvedTotal = Math.max(currentTotal, resolvedItems.length);
      const resolvedPages = Math.max(1, Math.ceil((resolvedTotal || 0) / pageSize));
      setCranes(resolvedItems);
      setPages(resolvedPages);
      setTotal(resolvedTotal);
    } catch { toast.error('Failed to load cranes'); }
    finally { setLoading(false); }
}, [page, search, statusFilter]);

  useEffect(() => { fetchCranes(); }, [fetchCranes]);

  const handleDelete = async () => {
    try {
      await api.delete(`/cranes/${deleteTarget._id}`);
      toast.success('Crane deleted');
      setDeleteTarget(null);
      invalidateCache('/cranes');
      fetchCranes();
    } catch { toast.error('Delete failed'); }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/cranes/${id}`)));
      toast.success(`${selectedIds.length} crane${selectedIds.length === 1 ? '' : 's'} deleted`);
      setBulkDeleteOpen(false);
      setSelectedIds([]);
      setSelectionMode(false);
      invalidateCache('/cranes');
      fetchCranes();
    } catch { toast.error('Bulk delete failed'); }
  };

  const visibleCranes = cranes;
  const visibleIds = visibleCranes.map(c => c._id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
  const toggleSelectAllVisible = () => {
    setSelectedIds(allVisibleSelected
      ? selectedIds.filter(id => !visibleIds.includes(id))
      : Array.from(new Set([...selectedIds, ...visibleIds]))
    );
  };
  const toggleSelected = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Cranes" subtitle={`${total} total cranes`}
        actions={canCreate && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <CSVImport endpoint="/cranes/import" templateUrl="/templates/cranes-import-template.xlsx" onImportSuccess={fetchCranes} />
            <button onClick={() => setModal('create')} className="btn-primary">
              <PlusIcon style={{ width: '14px', height: '14px' }} /> Add Crane
            </button>
          </div>
        )}
      />

      {/* All Status Cards */}
      {(() => {
        const allCounts = {};
        cranes.forEach(c => {
          const s = c.status || 'Unknown';
          allCounts[s] = (allCounts[s] || 0) + 1;
        });
        const allStatuses = ['Available', 'On Hire', 'Standby', 'Under Maintenance', 'Out of Yard', 'Reserved'];
        const statusColors = {
          'Available': { bar: 'var(--success)' },
          'On Hire': { bar: 'var(--accent)' },
          'Standby': { bar: 'var(--warning)' },
          'Under Maintenance': { bar: 'var(--orange)' },
          'Out of Yard': { bar: 'var(--danger)' },
          'Reserved': { bar: 'var(--purple)' },
        };
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            {allStatuses.map(status => {
              const count = allCounts[status] || 0;
              const colorConfig = statusColors[status] || { bar: 'var(--text-muted)' };
              return (
                <div key={status} className="card" style={{ padding: '12px 14px', textAlign: 'center', borderTop: `3px solid ${colorConfig.bar}` }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{status}</p>
                  <p style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)', margin: '6px 0 0' }}>{count}</p>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Selection Info Card */}
      {selectionMode && selectedIds.length > 0 && (
        <div className="card" style={{ padding: '10px 16px', marginBottom: '16px', background: 'var(--accent-subtle)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-text)' }}>{selectedIds.length} crane(s) selected</span>
          {canEditOrDelete && (
            <button type="button" onClick={() => setBulkDeleteOpen(true)} className="btn-danger" style={{ fontSize: '12px', padding: '4px 10px' }}>
              <TrashIcon style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />Delete Selected
            </button>
          )}
          <button type="button" onClick={() => { setSelectionMode(false); setSelectedIds([]); }} className="btn-secondary" style={{ fontSize: '12px', padding: '4px 10px' }}>Clear</button>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingLeft: '34px' }} placeholder="Search equipment no, model, client..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input-field" style={{ width: '160px' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          {canEditOrDelete && (
            <button type="button" onClick={() => { setSelectionMode(!selectionMode); setSelectedIds([]); }} 
              className={selectionMode ? 'btn-secondary' : 'btn-primary'} style={{ fontSize: '12px' }}>
              {selectionMode ? 'Cancel' : 'Select'}
            </button>
          )}
          {canEditOrDelete && selectionMode && selectedIds.length > 0 && (
            <button type="button" onClick={() => setBulkDeleteOpen(true)} className="btn-danger" style={{ fontSize: '12px' }}>
              <TrashIcon style={{ width: '13px', height: '13px' }} /> Delete Selected ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && cranes.length === 0 ? (
          <TableSkeleton rows={8} cols={8} />
        ) : cranes.length === 0 ? (
          <EmptyState message="No cranes found" icon={<TruckIcon style={{ width: '22px', height: '22px' }} />} />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {selectionMode && (
                      <th className="table-header" style={{ width: '42px' }}>
                        <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} title="Select all visible" />
                      </th>
                    )}
                    {['Equipment No.', 'Model', 'Capacity', 'Weight (KG)', 'Location', 'Client', 'Status', ''].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleCranes.map(c => (
                    <tr key={c._id} style={{ transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {selectionMode && (
                        <td className="table-cell">
                          <input type="checkbox" checked={selectedIds.includes(c._id)} onChange={() => toggleSelected(c._id)} title="Select item" />
                        </td>
                      )}
                      <td className="table-cell">
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>{c.equipmentNo}</span>
                      </td>
                      <td className="table-cell" style={{ color: 'var(--text-secondary)' }}>{c.craneModel || '—'}</td>
                      <td className="table-cell" style={{ color: 'var(--text-secondary)' }}>{c.capacity || '—'}</td>
                      <td className="table-cell" style={{ color: 'var(--text-secondary)' }}>{c.weightKg ? `${c.weightKg}kg` : '—'}</td>
                      <td className="table-cell" style={{ color: 'var(--text-secondary)' }}>{c.location || '—'}</td>
                      <td className="table-cell" style={{ fontWeight: 500 }}>{c.client || '—'}</td>
                      <td className="table-cell"><StatusBadge status={c.status} /></td>
                      <td className="table-cell">
                        {canEditOrDelete ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Link to={`/cranes/${c._id}`} title="View"
                              style={{ padding: '5px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', color: 'var(--accent)', textDecoration: 'none', transition: 'background 0.15s' }}>
                              <EyeIcon style={{ width: '13px', height: '13px' }} />
                            </Link>
                            <button onClick={() => setModal(c)} title="Edit"
                              style={{ padding: '5px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'background 0.15s' }}>
                              <PencilIcon style={{ width: '13px', height: '13px' }} />
                            </button>
                            <button onClick={() => setDeleteTarget(c)} title="Delete"
                              style={{ padding: '5px', borderRadius: '5px', border: '1px solid var(--danger-bg)', background: 'var(--danger-bg)', display: 'flex', color: 'var(--danger)', cursor: 'pointer', transition: 'opacity 0.15s' }}>
                              <TrashIcon style={{ width: '13px', height: '13px' }} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Link to={`/cranes/${c._id}`} title="View"
                              style={{ padding: '5px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', color: 'var(--accent)', textDecoration: 'none', transition: 'background 0.15s' }}>
                              <EyeIcon style={{ width: '13px', height: '13px' }} />
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={pages} total={total} onPage={setPage} />
          </>
        )}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal === 'create' ? 'Add New Crane' : `Edit ${modal?.equipmentNo}`} size="xl">
        <CraneForm initial={modal === 'create' ? null : modal}
          onSave={() => { setModal(null); fetchCranes(); }} onClose={() => setModal(null)} />
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} danger
        title="Delete Crane" message={`Are you sure you want to delete ${deleteTarget?.equipmentNo}? This action is difficult to undo.`} />

      <ConfirmDialog open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} onConfirm={handleBulkDelete} danger
        title="Delete Selected Cranes" message={`Are you sure you want to delete ${selectedIds.length} crane${selectedIds.length === 1 ? '' : 's'}? This action is difficult to undo.`} />
    </div>
  );
}
