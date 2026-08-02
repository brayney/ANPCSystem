import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PageHeader, StatusBadge, Pagination, EmptyState, Modal, ConfirmDialog, TableSkeleton } from '../common';
import CSVImport from '../common/CSVImport';
import { fetchWithCache, invalidateCache } from '../../utils/dataCache';
import api from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

const STATUS_GROUPS = {
  'Cranes': ['Available', 'On Hire', 'Standby', 'Under Maintenance', 'Out of Yard', 'Reserved'],
  'Counterweights': ['Available', 'In Use', 'Under Maintenance', 'Out of Yard'],
  'Boom Sections': ['Available', 'In Use', 'Under Maintenance', 'Out of Yard'],
  'Hooks': ['Available', 'Allocated', 'In Use', 'Under Maintenance', 'Out of Yard'],
};

const STATUS_COLORS = {
  'Available': { bg: 'bg-[var(--success-bg)]', text: 'text-[var(--success)]', bar: 'var(--success)' },
  'On Hire': { bg: 'bg-[var(--accent-subtle)]', text: 'text-[var(--accent-text)]', bar: 'var(--accent)' },
  'Standby': { bg: 'bg-[var(--warning-bg)]', text: 'text-[var(--warning)]', bar: 'var(--warning)' },
  'Under Maintenance': { bg: 'bg-[var(--orange-bg)]', text: 'text-[var(--orange)]', bar: 'var(--orange)' },
  'Out of Yard': { bg: 'bg-[var(--danger-bg)]', text: 'text-[var(--danger)]', bar: 'var(--danger)' },
  'Reserved': { bg: 'bg-[var(--purple-bg)]', text: 'text-[var(--purple)]', bar: 'var(--purple)' },
  'In Use': { bg: 'bg-[var(--accent-subtle)]', text: 'text-[var(--accent-text)]', bar: 'var(--accent)' },
  'Allocated': { bg: 'bg-[var(--purple-bg)]', text: 'text-[var(--purple)]', bar: 'var(--purple)' },
};

export function createEquipmentPage({ title, endpoint, columns, FormComponent, buildQuery, templateUrl, filters = [] }) {
  return function EquipmentPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterValues, setFilterValues] = useState({});
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

    const fetchItems = useCallback(async () => {
      setLoading(true);
      try {
        const pageSize = 15;
        const pageParams = buildQuery ? buildQuery({ page, search, filters: filterValues }) : { page, limit: pageSize, search: search || undefined };
        if (!search) {
          delete pageParams.search;
        }
        Object.entries(filterValues).forEach(([key, value]) => {
          if (value) {
            pageParams[key] = value;
          }
        });
        const pageData = await fetchWithCache(endpoint, pageParams, { inflate: false });
        const resolvedItems = Array.isArray(pageData) ? pageData : (pageData?.data || []);
        const currentTotal = Array.isArray(pageData) ? (pageData?.length || 0) : (pageData?.total ?? resolvedItems.length);
        const resolvedTotal = Math.max(currentTotal, resolvedItems.length);
        const resolvedPages = Math.max(1, Math.ceil((resolvedTotal || 0) / pageSize));
        setItems(resolvedItems);
        setPages(resolvedPages);
        setTotal(resolvedTotal);
      } catch { toast.error(`Failed to load ${title}`); }
      finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, search, filterValues]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const handleDelete = async () => {
      try {
        await api.delete(`${endpoint}/${deleteTarget._id}`);
        toast.success('Item deleted');
        setDeleteTarget(null);
        invalidateCache(endpoint);
        fetchItems();
      } catch { toast.error('Delete failed'); }
    };

    const handleBulkDelete = async () => {
      try {
        await Promise.all(selectedIds.map(id => api.delete(`${endpoint}/${id}`)));
        toast.success(`${selectedIds.length} item${selectedIds.length === 1 ? '' : 's'} deleted`);
        setBulkDeleteOpen(false);
        setSelectedIds([]);
        setSelectionMode(false);
        invalidateCache(endpoint);
        fetchItems();
      } catch { toast.error('Bulk delete failed'); }
    };

    const visibleItems = items;
    const visibleIds = visibleItems.map(item => item._id);
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

    const statusCounts = useMemo(() => {
      const counts = {};
      items.forEach(item => {
        const status = item.status || 'Unknown';
        counts[status] = (counts[status] || 0) + 1;
      });
      return counts;
    }, [items]);

    const allStatuses = STATUS_GROUPS[title] || [];

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

{/* All Status Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {allStatuses.map(status => {
            const colorConfig = STATUS_COLORS[status] || { bg: 'bg-[var(--surface-2)]', text: 'text-[var(--text-secondary)]', bar: 'var(--text-muted)' };
            const count = statusCounts[status] || 0;
            return (
              <div key={status} className="card" style={{ padding: '12px 14px', textAlign: 'center', borderTop: `3px solid ${colorConfig.bar}` }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{status}</p>
                <p style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)', margin: '6px 0 0' }}>{count}</p>
              </div>
            );
          })}
        </div>

        {/* Selection Info Card */}
        {selectionMode && selectedIds.length > 0 && (
          <div className="card" style={{ padding: '10px 16px', marginBottom: '16px', background: 'var(--accent-subtle)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-text)' }}>{selectedIds.length} item{selectedIds.length === 1 ? '' : 's'} selected</span>
            {canEditOrDelete && (
              <button type="button" onClick={() => setBulkDeleteOpen(true)} className="btn-danger" style={{ fontSize: '12px', padding: '4px 10px' }}>
                <TrashIcon style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />Delete Selected
              </button>
            )}
            <button type="button" onClick={() => { setSelectionMode(false); setSelectedIds([]); }} className="btn-secondary" style={{ fontSize: '12px', padding: '4px 10px' }}>Clear</button>
          </div>
        )}

        {/* Search */}
        <div className="card" style={{ padding: '14px 16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingLeft: '34px' }}
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            {filters.map(filter => (
              <select
                key={filter.key}
                className="input-field"
                style={{ width: filter.width || '160px' }}
                value={filterValues[filter.key] || ''}
                onChange={e => {
                  setFilterValues(prev => ({ ...prev, [filter.key]: e.target.value }));
                  setPage(1);
                }}
              >
                <option value="">{filter.allLabel || `All ${filter.label}`}</option>
                {filter.options.map(option => (
                  <option key={option.value || option} value={option.value || option}>
                    {option.label || option}
                  </option>
                ))}
              </select>
            ))}
            {canEditOrDelete && (
              <button type="button" onClick={() => { setSelectionMode(!selectionMode); setSelectedIds([]); }} 
                className={selectionMode ? 'btn-secondary' : 'btn-primary'} style={{ fontSize: '12px' }}>
                {selectionMode ? 'Cancel' : 'Select'}
              </button>
            )}
            {canEditOrDelete && selectionMode && selectedIds.length > 0 && (
              <button type="button" onClick={() => setBulkDeleteOpen(true)} className="btn-danger" style={{ fontSize: '12px' }}>
                <TrashIcon style={{ width: '13px', height: '13px' }} /> Delete ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading && items.length === 0 ? (
            <TableSkeleton rows={8} cols={columns.length + (selectionMode && canEditOrDelete ? 2 : 1)} />
          ) : items.length === 0 ? (
            <EmptyState message={`No ${title.toLowerCase()} found`} />
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {selectionMode && canEditOrDelete && (
                        <th className="table-header" style={{ width: '42px' }}>
                          <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} title="Select all visible" />
                        </th>
                      )}
                      {columns.map(c => <th key={c.key} className="table-header">{c.label}</th>)}
                      <th className="table-header"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleItems.map(item => (
                      <tr key={item._id} style={{ transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        {selectionMode && canEditOrDelete && (
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