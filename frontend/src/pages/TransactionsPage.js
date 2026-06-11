import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusIcon, MagnifyingGlassIcon, EyeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { PageHeader, StatusBadge, Spinner, Pagination, EmptyState, ConfirmDialog } from '../components/common';
import api from '../utils/api';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['Active', 'Returned', 'Overdue', 'Cancelled'];

export default function TransactionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [returnTarget, setReturnTarget] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/transactions', { params });
      setItems(data.data); setPages(data.pages); setTotal(data.total);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleReturn = async () => {
    try {
      await api.put(`/transactions/${returnTarget._id}/return`);
      toast.success('Transaction marked as returned');
      setReturnTarget(null); fetchItems();
    } catch { toast.error('Failed to process return'); }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Transactions" subtitle={`${total} total records`}
        actions={
          <Link to="/transactions/create" className="btn-primary" style={{ textDecoration: 'none' }}>
            <PlusIcon style={{ width: '14px', height: '14px' }} /> New Transaction
          </Link>
        }
      />

      {/* Filters */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
            <input className="input-field" style={{ paddingLeft: '34px' }} placeholder="Search transaction no, company, crane..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input-field" style={{ width: '160px' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner size="lg" /></div>
        ) : items.length === 0 ? (
          <EmptyState message="No transactions found" icon="📋" />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['TXN No.', 'Company', 'Crane', 'Pull-Out Location', 'Date', 'Expected Return', 'Status', ''].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(t => (
                    <tr key={t._id} style={{ transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="table-cell">
                        <Link to={`/transactions/${t._id}`} style={{ color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                          {t.transactionNo}
                        </Link>
                      </td>
                      <td className="table-cell" style={{ fontWeight: 500 }}>{t.companyName}</td>
                      <td className="table-cell"><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--accent)' }}>{t.crane}</span></td>
                      <td className="table-cell" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{t.pullOutLocation || '—'}</td>
                      <td className="table-cell" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {t.transactionDate ? format(new Date(t.transactionDate), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="table-cell" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {t.expectedReturnDate ? format(new Date(t.expectedReturnDate), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="table-cell"><StatusBadge status={t.status} /></td>
                      <td className="table-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Link to={`/transactions/${t._id}`} title="View"
                            style={{ padding: '5px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', color: 'var(--accent)', textDecoration: 'none' }}>
                            <EyeIcon style={{ width: '13px', height: '13px' }} />
                          </Link>
                          {t.status === 'Active' && (
                            <button onClick={() => setReturnTarget(t)}
                              style={{ padding: '4px 8px', borderRadius: '5px', border: '1px solid var(--success)', background: 'var(--success-bg)', color: 'var(--success)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <ArrowPathIcon style={{ width: '11px', height: '11px' }} /> Return
                            </button>
                          )}
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

      <ConfirmDialog open={!!returnTarget} onClose={() => setReturnTarget(null)} onConfirm={handleReturn}
        title="Confirm Return"
        message={`Mark transaction ${returnTarget?.transactionNo} as returned? Equipment will be set back to Available.`} />
    </div>
  );
}
