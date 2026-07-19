import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { PageHeader, Spinner, StatusBadge, EmptyState } from '../components/common';
import api from '../utils/api';
import { format, subDays, startOfMonth } from 'date-fns';
import { MagnifyingGlassIcon, ArrowDownTrayIcon, FunnelIcon } from '@heroicons/react/24/outline';

const COLORS = ['#1f6feb','#1a7f37','#9a6700','#cf222e','#6e40c9','#0e7a6e','#bc4c00','#2563eb','#059669','#d97706'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', boxShadow: 'var(--shadow-lg)', fontSize: '12px' }}>
      {label && <p style={{ color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: i === payload.length - 1 ? 0 : '4px' }}>
          {p.name}: <span style={{ color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const colorMap = {
    blue: { bg: 'var(--accent-subtle)', text: 'var(--accent-text)', border: 'var(--accent)' },
    green: { bg: 'var(--success-bg)', text: 'var(--success)', border: 'var(--success)' },
    orange: { bg: 'var(--orange-bg)', text: 'var(--orange)', border: 'var(--orange)' },
    purple: { bg: 'var(--purple-bg)', text: 'var(--purple)', border: 'var(--purple)' },
    teal: { bg: 'var(--teal-bg)', text: 'var(--teal)', border: 'var(--teal)' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
      {Icon && (
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: c.bg, color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: '20px', height: '20px' }} />
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>{title}</p>
        <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, margin: '0 0 4px 0', fontFamily: "'JetBrains Mono', monospace" }}>{value ?? '—'}</p>
        {subtitle && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>}
      </div>
    </div>
  );
};

export default function ReportsPage() {
  const [tab, setTab] = useState('rental');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [utilData, setUtilData] = useState([]);
  const [inventoryData, setInventoryData] = useState(null);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', crane: '', company: '' });
  const [activeFilter, setActiveFilter] = useState('all');

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

  const fetchInventoryReport = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/reports/inventory');
      setInventoryData(res.data);
    } catch { toast.error('Failed to load inventory report'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === 'rental') fetchRentalHistory();
    if (tab === 'utilization') fetchUtilization();
    if (tab === 'inventory') fetchInventoryReport();
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

  const rentalStats = useMemo(() => {
    if (data.length === 0) return null;
    const companies = new Set(data.map(t => t.companyName)).size;
    const dates = data.map(t => new Date(t.transactionDate)).filter(Boolean);
    const minDate = dates.length ? format(new Date(Math.min(...dates)), 'MMM d, yyyy') : '—';
    const maxDate = dates.length ? format(new Date(Math.max(...dates)), 'MMM d, yyyy') : '—';
    const thisMonth = data.filter(t => {
      const d = new Date(t.transactionDate);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { total: data.length, companies, minDate, maxDate, thisMonth };
  }, [data]);

  const utilStats = useMemo(() => {
    if (utilData.length === 0) return null;
    const total = utilData.reduce((sum, r) => sum + r.totalRentals, 0);
    const top = utilData[0];
    return { total, unique: utilData.length, top: top?._id, topCount: top?.totalRentals, avg: (total / utilData.length).toFixed(1) };
  }, [utilData]);

  const inventoryStats = useMemo(() => {
    if (!inventoryData) return null;
    const { cranes, counterweights, boomSections, hooks } = inventoryData;
    const available = cranes?.filter(c => c.status === 'Available').length || 0;
    const onHire = cranes?.filter(c => c.status === 'On Hire').length || 0;
    const maintenance = cranes?.filter(c => c.status === 'Under Maintenance').length || 0;
    return {
      total: (cranes?.length || 0) + (counterweights?.length || 0) + (boomSections?.length || 0) + (hooks?.length || 0),
      cranes: cranes?.length || 0, available, onHire, maintenance,
      counterweights: counterweights?.length || 0,
      boomSections: boomSections?.length || 0,
      hooks: hooks?.length || 0,
    };
  }, [inventoryData]);

  const tabs = [
    { key: 'rental', label: 'Rental History' },
    { key: 'utilization', label: 'Crane Utilization' },
    { key: 'inventory', label: 'Inventory Summary' },
  ];

  const applyQuickFilter = (filter) => {
    setActiveFilter(filter);
    const now = new Date();
    let start = '';
    switch (filter) {
      case 'today':
        start = format(now, 'yyyy-MM-dd');
        break;
      case 'week':
        start = format(subDays(now, 7), 'yyyy-MM-dd');
        break;
      case 'month':
        start = format(startOfMonth(now), 'yyyy-MM-dd');
        break;
      case 'all':
      default:
        start = '';
        break;
    }
    setFilters(prev => ({ ...prev, startDate: start, endDate: filter === 'all' ? '' : prev.endDate }));
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Reports" subtitle="Analytics and operational history"
        actions={tab === 'rental' && data.length > 0 ? (
          <button onClick={handleExportCSV} className="btn-secondary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowDownTrayIcon style={{ width: '14px', height: '14px' }} />
            Export CSV
          </button>
        ) : null}
      />

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '3px', width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setActiveFilter('all'); }}
            style={{ padding: '7px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s ease', background: tab === t.key ? 'var(--accent)' : 'transparent', color: tab === t.key ? '#fff' : 'var(--text-secondary)', boxShadow: tab === t.key ? '0 1px 4px rgba(31,107,235,0.3)' : 'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Rental History */}
      {tab === 'rental' && (
        <div className="animate-fade-in">
          {rentalStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <StatCard title="Total Records" value={rentalStats.total} subtitle={`${rentalStats.companies} companies`} color="blue" />
              <StatCard title="Date Range" value={`${rentalStats.minDate}`} subtitle={`to ${rentalStats.maxDate}`} color="green" />
              <StatCard title="This Month" value={rentalStats.thisMonth} subtitle="Current month rentals" color="orange" />
              <StatCard title="Avg per Company" value={(rentalStats.total / rentalStats.companies).toFixed(1)} subtitle="Rentals per company" color="purple" />
            </div>
          )}

          <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FunnelIcon style={{ width: '16px', height: '16px', color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Filters</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="label">Start Date</label>
                <input type="date" className="input-field" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
              </div>
              <div>
                <label className="label">End Date</label>
                <input type="date" className="input-field" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
              </div>
              <div>
                <label className="label">Crane No.</label>
                <input type="text" className="input-field" placeholder="Search crane..." value={filters.crane} onChange={e => setFilters({ ...filters, crane: e.target.value })} />
              </div>
              <div>
                <label className="label">Company</label>
                <input type="text" className="input-field" placeholder="Search company..." value={filters.company} onChange={e => setFilters({ ...filters, company: e.target.value })} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="label">Quick Range</label>
                <select className="input-field" value={activeFilter} onChange={e => applyQuickFilter(e.target.value)}>
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button onClick={fetchRentalHistory} className="btn-primary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MagnifyingGlassIcon style={{ width: '14px', height: '14px' }} />
                Apply Filters
              </button>
              <button onClick={() => { setFilters({ startDate: '', endDate: '', crane: '', company: '' }); setActiveFilter('all'); }} className="btn-secondary" style={{ fontSize: '12px' }}>
                Reset
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{data.length} records found</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Scroll horizontally for more columns</span>
            </div>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner size="lg" /></div>
            ) : data.length === 0 ? (
              <EmptyState message="No records found" hint="Try adjusting your filters or selecting a different time range" />
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
          {utilStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <StatCard title="Total Rentals" value={utilStats.total} subtitle="Across all cranes" color="blue" />
              <StatCard title="Top Crane" value={utilStats.top} subtitle={`${utilStats.topCount} rentals`} color="green" />
              <StatCard title="Unique Cranes" value={utilStats.unique} subtitle="With rental history" color="purple" />
              <StatCard title="Avg per Crane" value={utilStats.avg} subtitle="Rentals per crane" color="orange" />
            </div>
          )}

          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Top Cranes by Rental Count</h3>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner size="lg" /></div>
            ) : utilData.length === 0 ? (
              <EmptyState message="No transaction data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={utilData} layout="vertical" margin={{ left: 90, right: 20, top: 10, bottom: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="_id" type="category" tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="totalRentals" radius={[0, 6, 6, 0]} barSize={20}>
                    {utilData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {utilData.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '16px' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Detailed Breakdown</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Top {utilData.length} cranes</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Crane No.', 'Total Rentals', 'Companies', 'Share'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {utilData.map((r, i) => {
                      const share = utilStats ? ((r.totalRentals / utilStats.total) * 100).toFixed(1) : 0;
                      return (
                        <tr key={r._id} style={{ transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td className="table-cell">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{r._id}</span>
                            </div>
                          </td>
                          <td className="table-cell" style={{ fontWeight: 700 }}>{r.totalRentals}</td>
                          <td className="table-cell" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{r.companies?.slice(0, 3).join(', ')}{r.companies?.length > 3 ? ` +${r.companies.length - 3} more` : ''}</td>
                          <td className="table-cell">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--surface-3)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${share}%`, background: COLORS[i % COLORS.length], borderRadius: '3px', transition: 'width 0.3s ease' }} />
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace", minWidth: '36px', textAlign: 'right' }}>{share}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inventory Summary */}
      {tab === 'inventory' && (
        <div className="animate-fade-in">
          {inventoryStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <StatCard title="Total Assets" value={inventoryStats.total} subtitle="All equipment types" color="blue" />
              <StatCard title="Cranes" value={inventoryStats.cranes} subtitle={`${inventoryStats.available} available, ${inventoryStats.onHire} on hire`} color="green" />
              <StatCard title="Under Maintenance" value={inventoryStats.maintenance} subtitle="Requires attention" color="orange" />
              <StatCard title="Attachments" value={inventoryStats.counterweights + inventoryStats.boomSections + inventoryStats.hooks} subtitle="Counterweights, booms, hooks" color="purple" />
            </div>
          )}

          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Equipment Distribution</h3>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner size="lg" /></div>
            ) : !inventoryData ? (
              <EmptyState message="No inventory data available" />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {[
                  { label: 'Cranes', data: inventoryData.cranes || [], color: '#1f6feb', statusField: 'status' },
                  { label: 'Counterweights', data: inventoryData.counterweights || [], color: '#1a7f37', statusField: 'status' },
                  { label: 'Boom Sections', data: inventoryData.boomSections || [], color: '#9a6700', statusField: 'status' },
                  { label: 'Hooks', data: inventoryData.hooks || [], color: '#6e40c9', statusField: 'inspectionStatus' },
                ].map(group => {
                  const counts = group.data.reduce((acc, item) => {
                    const key = item[group.statusField] || 'Unknown';
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                  }, {});
                  const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }));
                  return (
                    <div key={group.label} style={{ padding: '16px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: group.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{group.label}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>{group.data.length}</span>
                      </div>
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie data={chartData} cx="50%" cy="50%" innerRadius={24} outerRadius={52} dataKey="value" paddingAngle={2}>
                              {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '12px' }}>No data</div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {chartData.map((d, i) => (
                          <span key={d.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 600, background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-muted)' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                            {d.name} ({d.value})
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
