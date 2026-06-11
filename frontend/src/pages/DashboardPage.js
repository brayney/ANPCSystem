import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TruckIcon, Square3Stack3DIcon, DocumentTextIcon, ChartBarIcon, BoltIcon, LinkIcon } from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard, Spinner, StatusBadge, PageHeader } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import { format } from 'date-fns';

const PIE_COLORS = ['#1a7f37', '#1f6feb', '#9a6700', '#bc4c00', '#cf222e', '#6e40c9'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', boxShadow: 'var(--shadow-lg)', fontSize: '12px' }}>
      {label && <p style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || 'var(--text-primary)', fontWeight: 600 }}>{p.name}: <span style={{ color: 'var(--text-primary)' }}>{p.value}</span></p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
      <Spinner size="lg" />
    </div>
  );

  const s = data?.summary || {};
  const statusChart = data?.charts?.craneStatusDist?.map(d => ({ name: d._id, value: d.count })) || [];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const txnChart = data?.charts?.transactionsByMonth?.map(d => ({ month: monthNames[d._id - 1], count: d.count })) || [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${getGreeting()}, ${user?.name?.split(' ')[0] || 'Admin'}`}
        subtitle="Here's your yard overview for today"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
        <StatCard title="Total Cranes"   value={s.totalCranes}        icon={TruckIcon}          color="blue"   />
        <StatCard title="Counterweights" value={s.totalCounterweights} icon={Square3Stack3DIcon} color="indigo" />
        <StatCard title="Boom Sections"  value={s.totalBoomSections}   icon={BoltIcon}           color="purple" />
        <StatCard title="Hooks"          value={s.totalHooks}          icon={LinkIcon}           color="teal"   />
        <StatCard title="Active Rentals" value={s.activeRentals}       icon={DocumentTextIcon}   color="orange" subtitle="Equipment out of yard" />
        <StatCard title="Available"      value={s.availableCranes}     icon={TruckIcon}          color="green"  subtitle="Cranes ready to deploy" />
        <StatCard title="Maintenance"    value={s.maintenanceCranes}   icon={TruckIcon}          color="yellow" subtitle="Under repair" />
        <StatCard title="Total Assets"   value={(s.totalCranes || 0) + (s.totalCounterweights || 0) + (s.totalBoomSections || 0) + (s.totalHooks || 0)} icon={ChartBarIcon} color="red" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Crane Status Pie */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Crane Status Distribution</h3>
          </div>
          {statusChart.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={statusChart} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                    {statusChart.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {statusChart.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>No data yet</p>}
        </div>

        {/* Transactions Bar */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Monthly Transactions</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last 6 months</span>
          </div>
          {txnChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={txnChart} barSize={18}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Transactions" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>No transaction data yet</p>}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Recent Transactions</h3>
          <Link to="/transactions" style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
        </div>
        {data?.recentTransactions?.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Transaction No.', 'Company', 'Crane', 'Status', 'Date'].map(h => (
                    <th key={h} className="table-header" style={{ background: 'var(--surface-2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map(t => (
                  <tr key={t._id} style={{ transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="table-cell">
                      <Link to={`/transactions/${t._id}`} style={{ color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                        {t.transactionNo}
                      </Link>
                    </td>
                    <td className="table-cell" style={{ fontWeight: 500 }}>{t.companyName}</td>
                    <td className="table-cell"><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--text-secondary)' }}>{t.crane}</span></td>
                    <td className="table-cell"><StatusBadge status={t.status} /></td>
                    <td className="table-cell" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {t.transactionDate ? format(new Date(t.transactionDate), 'MMM d, yyyy') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>No transactions yet.</p>
            <Link to="/transactions/create" className="btn-primary" style={{ textDecoration: 'none' }}>Create Transaction</Link>
          </div>
        )}
      </div>
    </div>
  );
}
