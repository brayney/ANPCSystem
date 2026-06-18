import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PageHeader, StatusBadge, Spinner, Pagination, EmptyState, Modal, ConfirmDialog } from '../common';
import CSVImport from '../common/CSVImport';
import api from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

export function createEquipmentPage({ title, endpoint, columns, FormComponent, buildQuery, templateUrl }) {
  return function EquipmentPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [modal, setModal] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const { user } = useAuth();
    const canCreate = user?.role === 'admin';
    const canEditOrDelete = user?.role === 'admin';

    const fetchItems = useCallback(async () => {
      setLoading(true);
      try {
        const params = buildQuery ? buildQuery({ page, search }) : { page, limit: 15, search: search || undefined };
        if (!search) delete params.search;
        const { data } = await api.get(endpoint, { params });
        setItems(data.data); setPages(data.pages); setTotal(data.total);
        setSelectedIds([]);
      } catch { toast.error(`Failed to load ${title}`); }
      finally { setLoading(false); }
    }, [page, search]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const handleDelete = async () => {
      try {
        await api.delete(`${endpoint}/${deleteTarget._id}`);
        toast.success('Item deleted');
        setDeleteTarget(null); fetchItems();
      } catch { toast.error('Delete failed'); }
    };

    const handleBulkDelete = async () => {
      try {
        await Promise.all(selectedIds.map(id => api.delete(`${endpoint}/${id}`)));
        toast.success(`${selectedIds.length} item${selectedIds.length === 1 ? '' : 's'} deleted`);
        setBulkDeleteOpen(false);
        setSelectedIds([]);
        fetchItems();
      } catch { toast.error('Bulk delete failed'); }
    };

    const visibleIds = items.map(item => item._id);
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
        <PageHeader title={title} subtitle={`${total} total records`}
          actions={canCreate && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {templateUrl && <CSVImport endpoint={`${endpoint}/import`} templateUrl={templateUrl} onImportSuccess={fetchItems} />}
              <button onClick={() => setModal('create')} className="btn-primary">
                <PlusIcon style={{ width: '14px', height: '14px' }} /> Add {title.slice(0, -1)}
              </button>
            </div>
          )}
        />

        {/* Search */}
        <div className="card" style={{ padding: '14px 16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingLeft: '34px' }}
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            {canEditOrDelete && selectedIds.length > 0 && (
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
          ) : items.length === 0 ? (
            <EmptyState message={`No ${title.toLowerCase()} found`} />
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {canEditOrDelete && (
                        <th className="table-header" style={{ width: '42px' }}>
                          <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} title="Select all visible" />
                        </th>
                      )}
                      {columns.map(c => <th key={c.key} className="table-header">{c.label}</th>)}
                      <th className="table-header"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item._id} style={{ transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        {canEditOrDelete && (
                          <td className="table-cell">
                            <input type="checkbox" checked={selectedIds.includes(item._id)} onChange={() => toggleSelected(item._id)} title="Select item" />
                          </td>
                        )}
                        {columns.map((c, ci) => (
                          <td key={c.key} className="table-cell">
                            {c.badge ? <StatusBadge status={item[c.key]} /> :
                              ci === 0 ?
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>{item[c.key] || '—'}</span> :
                                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                  {c.format ? c.format(item[c.key]) : (item[c.key] || '—')}
                                </span>
                            }
                          </td>
                        ))}
                        <td className="table-cell">
                          {canEditOrDelete ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button onClick={() => setModal(item)} title="Edit"
                                style={{ padding: '5px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <PencilIcon style={{ width: '13px', height: '13px' }} />
                              </button>
                              <button onClick={() => setDeleteTarget(item)} title="Delete"
                                style={{ padding: '5px', borderRadius: '5px', border: '1px solid var(--danger-bg)', background: 'var(--danger-bg)', display: 'flex', color: 'var(--danger)', cursor: 'pointer' }}>
                                <TrashIcon style={{ width: '13px', height: '13px' }} />
                              </button>
                            </div>
                          ) : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>}
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
          title={modal === 'create' ? `Add ${title.slice(0, -1)}` : 'Edit Item'} size="lg">
          {modal && (
            <FormComponent initial={modal === 'create' ? null : modal}
              onSave={() => { setModal(null); fetchItems(); }}
              onClose={() => setModal(null)} endpoint={endpoint} />
          )}
        </Modal>

        <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} danger
          title="Delete Item" message="Are you sure you want to delete this item? This is difficult to undo." />

        <ConfirmDialog open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} onConfirm={handleBulkDelete} danger
          title="Delete Selected Items" message={`Are you sure you want to delete ${selectedIds.length} item${selectedIds.length === 1 ? '' : 's'}? This is difficult to undo.`} />
      </div>
    );
  };
}
