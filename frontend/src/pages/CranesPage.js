import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { PageHeader, StatusBadge, Spinner, Pagination, EmptyState, Modal, ConfirmDialog } from '../components/common';
import CSVImport from '../components/common/CSVImport';
import api from '../utils/api';

const STATUS_OPTIONS = ['Available', 'On Hire', 'Standby', 'Under Maintenance', 'Out of Yard', 'Reserved'];

const CraneForm = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState({
    equipmentNo: '', craneModel: '', yearModel: '', capacity: '', weightKg: '', location: 'RAG YARD',
    client: '', status: 'Available', supervisor: '', division: '', comments: ''
  });
  const [saving, setSaving] = useState(false);

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
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Equipment No. *</label>
          <input type="text" className="input-field" required
            value={form.equipmentNo || ''} onChange={e => handleChange('equipmentNo', e.target.value)} />
        </div>
        <div>
          <label className="label">Crane Model</label>
          <input type="text" className="input-field"
            value={form.craneModel || ''} onChange={e => handleChange('craneModel', e.target.value)} />
        </div>
        <div>
          <label className="label">Year Model</label>
          <input type="text" className="input-field"
            value={form.yearModel || ''} onChange={e => handleChange('yearModel', e.target.value)} />
        </div>
        <div>
          <label className="label">Capacity</label>
          <input type="text" className="input-field"
            value={form.capacity || ''} onChange={e => handleChange('capacity', e.target.value)} />
        </div>
        <div>
          <label className="label">Weight (KG)</label>
          <input type="text" className="input-field"
            value={form.weightKg || ''} onChange={e => handleChange('weightKg', e.target.value)} />
        </div>
        <div>
          <label className="label">Location</label>
          <input type="text" className="input-field" value={form.location || ''} disabled
            style={{ backgroundColor: 'var(--bg-muted)', cursor: 'not-allowed' }} />
        </div>
        <div>
          <label className="label">Client</label>
          <input type="text" className="input-field"
            value={form.client || ''} onChange={e => handleChange('client', e.target.value)} />
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
          <input type="text" className="input-field"
            value={form.supervisor || ''} onChange={e => handleChange('supervisor', e.target.value)} />
        </div>
        <div>
          <label className="label">Division</label>
          <input type="text" className="input-field"
            value={form.division || ''} onChange={e => handleChange('division', e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: '16px' }}>
        <label className="label">Comments</label>
        <textarea className="input-field" rows={2} value={form.comments || ''}
          onChange={e => handleChange('comments', e.target.value)} style={{ resize: 'vertical' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-muted)' }}>
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : (initial ? 'Update Crane' : 'Create Crane')}
        </button>
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

  const fetchCranes = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/cranes', { params });
      setCranes(data.data); setPages(data.pages); setTotal(data.total);
    } catch { toast.error('Failed to load cranes'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchCranes(); }, [fetchCranes]);

  const handleDelete = async () => {
    try {
      await api.delete(`/cranes/${deleteTarget._id}`);
      toast.success('Crane deleted');
      setDeleteTarget(null); fetchCranes();
    } catch { toast.error('Delete failed'); }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/cranes/${id}`)));
      toast.success(`${selectedIds.length} crane${selectedIds.length === 1 ? '' : 's'} deleted`);
      setBulkDeleteOpen(false);
      setSelectedIds([]);
      setSelectionMode(false);
      fetchCranes();
    } catch { toast.error('Bulk delete failed'); }
  };

  const visibleIds = cranes.map(c => c._id);
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
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <CSVImport endpoint="/cranes/import" templateUrl="/templates/cranes-import-template.xlsx" onImportSuccess={fetchCranes} />
            <button onClick={() => setModal('create')} className="btn-primary">
              <PlusIcon style={{ width: '14px', height: '14px' }} /> Add Crane
            </button>
          </div>
        }
      />

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
          <button type="button" onClick={() => { setSelectionMode(!selectionMode); setSelectedIds([]); }} 
            className={selectionMode ? 'btn-secondary' : 'btn-primary'} style={{ fontSize: '12px' }}>
            {selectionMode ? 'Cancel' : 'Select'}
          </button>
          {selectionMode && selectedIds.length > 0 && (
            <button type="button" onClick={() => setBulkDeleteOpen(true)} className="btn-danger" style={{ fontSize: '12px' }}>
              <TrashIcon style={{ width: '13px', height: '13px' }} /> Delete Selected ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner size="lg" /></div>
        ) : cranes.length === 0 ? (
          <EmptyState message="No cranes found" icon="🏗️" />
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
                  {cranes.map(c => (
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
