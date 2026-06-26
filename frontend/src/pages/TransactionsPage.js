import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusIcon, MagnifyingGlassIcon, EyeIcon, ArrowPathIcon, PencilIcon, TrashIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { PageHeader, StatusBadge, Spinner, Pagination, EmptyState, ConfirmDialog, Modal } from '../components/common';
import api from '../utils/api';
import { format } from 'date-fns';

const getTransactionCraneLabel = (transaction) => (
  transaction.cranes?.length
    ? transaction.cranes.map(crane => crane.equipmentNo).join(', ')
    : transaction.crane
);

export default function TransactionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('active');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [returnTarget, setReturnTarget] = useState(null);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [returnScope, setReturnScope] = useState('this');

  const isActiveGroupingRow = (transaction) => transaction?.status === 'Returned' && tab === 'active' && (transaction.childTransactions || []).some(child => child.status === 'Active');
  const isReturnedGroupingRow = (transaction) => transaction?.status === 'Active' && tab === 'returned' && (transaction.childTransactions || []).some(child => child.status !== 'Active');
  const isGroupingRow = (transaction) => isActiveGroupingRow(transaction) || isReturnedGroupingRow(transaction);
  const getDisplayedChildTransactions = (transaction) => (
    tab === 'returned'
      ? (transaction.childTransactions || []).filter(child => child.status !== 'Active')
      : isActiveGroupingRow(transaction)
        ? (transaction.childTransactions || []).filter(child => child.status === 'Active')
        : (transaction.childTransactions || [])
  );

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      params.status = tab === 'active' ? 'Active' : 'Returned';
      const { data } = await api.get('/transactions', { params });
      setItems(data.data); setPages(data.pages); setTotal(data.total);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [page, search, tab]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleReturn = async () => {
    try {
      await api.put(`/transactions/${returnTarget._id}/return`, { scope: returnScope });
      toast.success(returnScope === 'linked' ? 'Linked transactions marked as returned' : 'Transaction marked as returned');
      setReturnTarget(null);
      setReturnScope('this');
      fetchItems();
    } catch { toast.error('Failed to process return'); }
  };

  const handleEditOpen = (transaction) => {
    setEditForm({
      _id: transaction._id,
      companyName: transaction.companyName,
      companyAddress: transaction.companyAddress,
      contactPerson: transaction.contactPerson,
      contactNumber: transaction.contactNumber,
      driverName: transaction.driverName,
      vehicleType: transaction.vehicleType,
      vehiclePlateNo: transaction.vehiclePlateNo,
      pullOutLocation: transaction.pullOutLocation,
      deliveryLocation: transaction.deliveryLocation,
      transactionDate: transaction.transactionDate ? format(new Date(transaction.transactionDate), 'yyyy-MM-dd') : '',
      transactionTime: transaction.transactionTime || '',
      expectedReturnDate: transaction.expectedReturnDate ? format(new Date(transaction.expectedReturnDate), 'yyyy-MM-dd') : '',
      purpose: transaction.purpose,
      remarks: transaction.remarks,
      status: transaction.status
    });
    setModal('edit');
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    try {
      await api.put(`/transactions/${editForm._id}`, editForm);
      toast.success('Transaction updated');
      setModal(null);
      setEditForm({});
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update transaction');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/transactions/${deleteTarget._id}`);
      toast.success('Transaction deleted');
      setDeleteTarget(null);
      fetchItems();
    } catch { toast.error('Failed to delete transaction'); }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Transactions" subtitle={`${total} total ${tab === 'active' ? 'active' : 'returned'} records`}
        actions={
          <Link to="/transactions/create" className="btn-primary" style={{ textDecoration: 'none' }}>
            <PlusIcon style={{ width: '14px', height: '14px' }} /> New Transaction
          </Link>
        }
      />

      {/* Filters & Tabs */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <MagnifyingGlassIcon style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
          <input className="input-field" style={{ paddingLeft: '34px' }} placeholder="Search transaction no, company, crane..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div style={{ display: 'flex', gap: '4px', borderLeft: '1px solid var(--border-muted)', paddingLeft: '16px' }}>
          <button
            onClick={() => { setTab('active'); setPage(1); }}
            style={{
              padding: '6px 12px',
              minWidth: '74px',
              borderRadius: '4px',
              border: 'none',
              background: tab === 'active' ? 'var(--accent)' : 'transparent',
              color: tab === 'active' ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s, box-shadow 0.2s'
            }}
          >
            Active
          </button>
          <button
            onClick={() => { setTab('returned'); setPage(1); }}
            style={{
              padding: '6px 12px',
              minWidth: '74px',
              borderRadius: '4px',
              border: 'none',
              background: tab === 'returned' ? 'var(--accent)' : 'transparent',
              color: tab === 'returned' ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s, box-shadow 0.2s'
            }}
          >
            Returned
          </button>
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
                    {['TXN No.', 'Company', 'Crane', 'Pull-Out Location', 'Date', tab === 'active' ? 'Expected Return' : 'Actual Return', 'Status', ''].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(t => (
                    <React.Fragment key={t._id}>
                    <tr key={t._id} style={{ transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="table-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {getDisplayedChildTransactions(t).length > 0 && (
                            <button type="button" title={expandedRows[t._id] ? 'Hide added transactions' : 'Show added transactions'}
                              onClick={() => setExpandedRows(prev => ({ ...prev, [t._id]: !prev[t._id] }))}
                              style={{ padding: '3px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer', display: 'flex' }}>
                              <ChevronDownIcon style={{ width: '12px', height: '12px', transform: expandedRows[t._id] ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }} />
                            </button>
                          )}
                          {isGroupingRow(t) ? (
                            <span style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 600 }}>
                              {t.transactionNo}
                            </span>
                          ) : (
                            <Link to={`/transactions/${t._id}`} style={{ color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                              {t.transactionNo}
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="table-cell" style={{ fontWeight: 500 }}>{t.companyName}</td>
                      <td className="table-cell"><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--accent)' }}>{getTransactionCraneLabel(t)}</span></td>
                      <td className="table-cell" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{t.pullOutLocation || '—'}</td>
                      <td className="table-cell" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {t.transactionDate ? format(new Date(t.transactionDate), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="table-cell" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {tab === 'active'
                          ? (t.expectedReturnDate ? format(new Date(t.expectedReturnDate), 'MMM d, yyyy') : '—')
                          : (t.actualReturnDate ? format(new Date(t.actualReturnDate), 'MMM d, yyyy h:mm a') : '—')
                        }
                      </td>
                      <td className="table-cell"><StatusBadge status={isGroupingRow(t) ? (tab === 'active' ? 'Active' : 'Returned') : t.status} /></td>
                      <td className="table-cell">
                        {isGroupingRow(t) ? (
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Link to={`/transactions/${t._id}`} title="View"
                              style={{ padding: '5px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', color: 'var(--accent)', textDecoration: 'none' }}>
                              <EyeIcon style={{ width: '13px', height: '13px' }} />
                            </Link>
                            {!t.sourceTransactionId && t.status === 'Active' && (
                              <Link
                                to="/transactions/create"
                                state={{ sourceTransactionId: t._id }}
                                title="Add transaction from this active transaction"
                                style={{ padding: '5px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', color: 'var(--success)', textDecoration: 'none' }}
                              >
                                <PlusIcon style={{ width: '13px', height: '13px' }} />
                              </Link>
                            )}
                            <button onClick={() => handleEditOpen(t)} title="Edit"
                              style={{ padding: '5px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'background 0.15s' }}>
                              <PencilIcon style={{ width: '13px', height: '13px' }} />
                            </button>
                            <button onClick={() => setDeleteTarget(t)} title="Delete"
                              style={{ padding: '5px', borderRadius: '5px', border: '1px solid var(--danger-bg)', background: 'var(--danger-bg)', display: 'flex', color: 'var(--danger)', cursor: 'pointer', transition: 'opacity 0.15s' }}>
                              <TrashIcon style={{ width: '13px', height: '13px' }} />
                            </button>
                            {t.status === 'Active' && (
                              <button onClick={() => { setReturnTarget(t); setReturnScope('this'); }}
                                style={{ padding: '4px 8px', borderRadius: '5px', border: '1px solid var(--success)', background: 'var(--success-bg)', color: 'var(--success)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <ArrowPathIcon style={{ width: '11px', height: '11px' }} /> Return
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                    {expandedRows[t._id] && getDisplayedChildTransactions(t).map(child => (
                      <tr key={child._id} style={{ background: 'var(--surface-2)' }}>
                        <td className="table-cell" colSpan={8}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingLeft: '28px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>Added</span>
                              <Link to={`/transactions/${child._id}`} style={{ color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                                {child.transactionNo}
                              </Link>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{child.companyName}</span>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                {(child.counterweights?.length || 0)} CW / {(child.boomSections?.length || 0)} Boom / {(child.hooks?.length || 0)} Hooks
                              </span>
                              <StatusBadge status={child.status} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Link to={`/transactions/${child._id}`} title="View added transaction"
                                style={{ padding: '5px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', color: 'var(--accent)', textDecoration: 'none' }}>
                                <EyeIcon style={{ width: '13px', height: '13px' }} />
                              </Link>
                              <button onClick={() => handleEditOpen(child)} title="Edit added transaction"
                                style={{ padding: '5px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'background 0.15s' }}>
                                <PencilIcon style={{ width: '13px', height: '13px' }} />
                              </button>
                              <button onClick={() => setDeleteTarget(child)} title="Delete added transaction"
                                style={{ padding: '5px', borderRadius: '5px', border: '1px solid var(--danger-bg)', background: 'var(--danger-bg)', display: 'flex', color: 'var(--danger)', cursor: 'pointer', transition: 'opacity 0.15s' }}>
                                <TrashIcon style={{ width: '13px', height: '13px' }} />
                              </button>
                              {child.status === 'Active' && (
                                <button onClick={() => { setReturnTarget(child); setReturnScope('this'); }}
                                  style={{ padding: '4px 8px', borderRadius: '5px', border: '1px solid var(--success)', background: 'var(--success-bg)', color: 'var(--success)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <ArrowPathIcon style={{ width: '11px', height: '11px' }} /> Return
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={pages} total={total} onPage={setPage} />
          </>
        )}
      </div>

      <ConfirmDialog open={!!returnTarget} onClose={() => { setReturnTarget(null); setReturnScope('this'); }} onConfirm={handleReturn}
        title="Confirm Return"
        message={`Choose how to handle ${returnTarget?.transactionNo || 'this transaction'}.`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '4px' }}>
          <label className="label" style={{ marginBottom: 0 }}>Return scope</label>
          <select className="input-field" value={returnScope} onChange={(e) => setReturnScope(e.target.value)}>
            <option value="this">This transaction only</option>
            <option value="linked">This transaction and linked transaction(s)</option>
          </select>
        </div>
      </ConfirmDialog>

      <Modal open={!!modal && modal === 'edit'} onClose={() => { setModal(null); setEditForm({}); }}
        title={`Edit ${editForm.companyName || 'Transaction'}`} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleEditSave(); }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Company Name *</label>
              <input type="text" className="input-field" required
                value={editForm.companyName || ''} onChange={e => setEditForm({ ...editForm, companyName: e.target.value })} />
            </div>
            <div>
              <label className="label">Contact Person</label>
              <input type="text" className="input-field"
                value={editForm.contactPerson || ''} onChange={e => setEditForm({ ...editForm, contactPerson: e.target.value })} />
            </div>
            <div>
              <label className="label">Contact Number</label>
              <input type="text" className="input-field"
                value={editForm.contactNumber || ''} onChange={e => setEditForm({ ...editForm, contactNumber: e.target.value })} />
            </div>
            <div>
              <label className="label">Driver Name</label>
              <input type="text" className="input-field"
                value={editForm.driverName || ''} onChange={e => setEditForm({ ...editForm, driverName: e.target.value })} />
            </div>
            <div>
              <label className="label">Vehicle Type</label>
              <input type="text" className="input-field"
                value={editForm.vehicleType || ''} onChange={e => setEditForm({ ...editForm, vehicleType: e.target.value })} />
            </div>
            <div>
              <label className="label">Vehicle Plate No</label>
              <input type="text" className="input-field"
                value={editForm.vehiclePlateNo || ''} onChange={e => setEditForm({ ...editForm, vehiclePlateNo: e.target.value })} />
            </div>
            <div>
              <label className="label">Pull-Out Location</label>
              <input type="text" className="input-field"
                value={editForm.pullOutLocation || ''} onChange={e => setEditForm({ ...editForm, pullOutLocation: e.target.value })} />
            </div>
            <div>
              <label className="label">Delivery Location</label>
              <input type="text" className="input-field"
                value={editForm.deliveryLocation || ''} onChange={e => setEditForm({ ...editForm, deliveryLocation: e.target.value })} />
            </div>
            <div>
              <label className="label">Transaction Date</label>
              <input type="date" className="input-field"
                value={editForm.transactionDate || ''} onChange={e => setEditForm({ ...editForm, transactionDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Expected Return Date</label>
              <input type="date" className="input-field"
                value={editForm.expectedReturnDate || ''} onChange={e => setEditForm({ ...editForm, expectedReturnDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Purpose</label>
              <input type="text" className="input-field"
                value={editForm.purpose || ''} onChange={e => setEditForm({ ...editForm, purpose: e.target.value })} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={editForm.status || 'Active'} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Returned">Returned</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <label className="label">Remarks</label>
            <textarea className="input-field" rows={2} value={editForm.remarks || ''}
              onChange={e => setEditForm({ ...editForm, remarks: e.target.value })} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-muted)' }}>
            <button type="button" onClick={() => { setModal(null); setEditForm({}); }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={editSaving} className="btn-primary">
              {editSaving ? 'Saving...' : 'Update Transaction'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} danger
        title="Delete Transaction" message={`Are you sure you want to delete transaction ${deleteTarget?.transactionNo}? This action cannot be undone.`} />
    </div>
  );
}
