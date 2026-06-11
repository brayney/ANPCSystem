import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PageHeader, Spinner, StatusBadge } from '../components/common';
import api from '../utils/api';
import { format } from 'date-fns';

const COLORS = ['#1f6feb','#1a7f37','#9a6700','#cf222e','#6e40c9','#0e7a6e','#bc4c00'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', boxShadow: 'var(--shadow-lg)', fontSize: '12px' }}>
      {label && <p style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.value} rentals</p>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const [tab, setTab] = useState('rental');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [utilData, setUtilData] = useState([]);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', crane: '', company: '' });

  const fetchRentalHistory = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.crane) params.crane = filters.crane;
      if (filters.company) params.company = filters.company;
      const { data: res } = await api.get('/reports/rental-history', { params });
      setData(res.data);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  const fetchUtilization = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/reports/crane-utilization');
      setUtilData(res.data);
    } catch { toast.error('Failed to load utilization'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === 'rental') fetchRentalHistory();
    if (tab === 'utilization') fetchUtilization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleExportCSV = () => {
    if (data.length === 0) { toast.error('No data to export'); return; }
    const headers = ['TXN No.', 'Company', 'Crane', 'Date', 'Status', 'Pull-Out', 'Delivery', 'Driver'];
    const rows = data.map(t => [t.transactionNo, t.companyName, t.crane, t.transactionDate ? format(new Date(t.transactionDate), 'yyyy-MM-dd') : '', t.status, t.pullOutLocation, t.deliveryLocation, t.driverName]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `anpc-rental-history-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const tabs = [{ key: 'rental', label: 'Rental History' }, { key: 'utilization', label: 'Crane Utilization' }];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Reports" subtitle="Analytics and operational history"
        actions={tab === 'rental' && data.length > 0 ? (
          <button onClick={handleExportCSV} className="btn-secondary" style={{ fontSize: '12px' }}>
            ↓ Export CSV
          </button>
        ) : null}
      />

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '3px', width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'background 0.15s, color 0.15s', background: tab === t.key ? 'var(--accent)' : 'transparent', color: tab === t.key ? '#fff' : 'var(--text-secondary)', boxShadow: tab === t.key ? '0 1px 4px rgba(31,107,235,0.3)' : 'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Rental History */}
      {tab === 'rental' && (
        <div className="animate-fade-in">
          <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[['Start Date', 'startDate', 'date'], ['End Date', 'endDate', 'date'], ['Crane No.', 'crane', 'text'], ['Company', 'company', 'text']].map(([label, name, type]) => (
                <div key={name}>
                  <label className="label">{label}</label>
                  <input type={type} className="input-field" value={filters[name]}
                    onChange={e => setFilters({ ...filters, [name]: e.target.value })} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={fetchRentalHistory} className="btn-primary" style={{ fontSize: '12px' }}>Apply Filters</button>
              <button onClick={() => setFilters({ startDate: '', endDate: '', crane: '', company: '' })} className="btn-secondary" style={{ fontSize: '12px' }}>Reset</button>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{data.length} records found</span>
            </div>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner size="lg" /></div>
            ) : data.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: '13px' }}>No records for selected filters</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['TXN No.', 'Company', 'Crane', 'Date', 'Status', 'Pull-Out', 'Delivery'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {data.map(t => (
                      <tr key={t._id} style={{ transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td className="table-cell"><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>{t.transactionNo}</span></td>
                        <td className="table-cell" style={{ fontWeight: 500 }}>{t.companyName}</td>
                        <td className="table-cell"><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 600 }}>{t.crane}</span></td>
                        <td className="table-cell" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{t.transactionDate ? format(new Date(t.transactionDate), 'MMM d, yyyy') : '—'}</td>
                        <td className="table-cell"><StatusBadge status={t.status} /></td>
                        <td className="table-cell" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{t.pullOutLocation || '—'}</td>
                        <td className="table-cell" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{t.deliveryLocation || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Utilization */}
      {tab === 'utilization' && (
        <div className="animate-fade-in">
          <div className="card">
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', margin: '0 0 16px' }}>Top Cranes by Rental Count</h3>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner size="lg" /></div>
            ) : utilData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: '13px' }}>No transaction data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={utilData} layout="vertical" margin={{ left: 90, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="_id" type="category" tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="totalRentals" radius={[0, 4, 4, 0]}>
                    {utilData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {utilData.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '16px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Crane No.', 'Total Rentals', 'Companies'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {utilData.map(r => (
                      <tr key={r._id} style={{ transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td className="table-cell"><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--accent)', fontWeight: 700 }}>{r._id}</span></td>
                        <td className="table-cell" style={{ fontWeight: 700 }}>{r.totalRentals}</td>
                        <td className="table-cell" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{r.companies?.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
