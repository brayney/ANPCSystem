import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TruckIcon, Square3Stack3DIcon, DocumentTextIcon, ChartBarIcon, BoltIcon, LinkIcon,
  ArrowUpIcon, ArrowDownIcon, ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard, Spinner, StatusBadge } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import { format, differenceInDays } from 'date-fns';

const PIE_COLORS = ['#1a7f37', '#1f6feb', '#9a6700', '#bc4c00', '#cf222e', '#6e40c9'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '10px 14px',
      boxShadow: 'var(--shadow-lg)',
      fontSize: '12px'
    }}>
      {label && <p style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || 'var(--text-primary)', fontWeight: 600, marginBottom: i === payload.length - 1 ? 0 : '4px' }}>
          {p.name}: <span style={{ color: 'var(--text-primary)' }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
};



export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchDashboard = () => {
    api.get('/dashboard').then(r => setData(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

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

  // Calculate utilization rate
  const totalEquipment = (s.totalCranes || 0) + (s.totalCounterweights || 0) + (s.totalBoomSections || 0) + (s.totalHooks || 0);
  const utilizationRate = totalEquipment > 0 ? ((s.activeRentals || 0) / (s.totalCranes || 1) * 100).toFixed(1) : 0;
  const maintenanceRate = totalEquipment > 0 ? ((s.maintenanceCranes || 0) / (s.totalCranes || 1) * 100).toFixed(1) : 0;

  return (
    <div className="animate-fade-in">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            margin: 0,
          }}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'} 👋</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Fleet Overview • Updated {format(new Date(), 'h:mm a')}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: refreshing ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: refreshing ? 0.6 : 1,
          }}
        >
          <ArrowPathIcon style={{ width: '14px', height: '14px', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Primary KPIs - Top Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
        <StatCard
          title="Total Cranes"
          value={s.totalCranes}
          icon={TruckIcon}
          color="blue"
          subtitle="All active equipment"
        />
        <StatCard
          title="Available Cranes"
          value={s.availableCranes}
          icon={CheckCircleIcon}
          color="green"
          subtitle="Ready to deploy"
        />
        <StatCard
          title="Active Rentals"
          value={s.activeRentals}
          icon={DocumentTextIcon}
          color="orange"
          subtitle={`${utilizationRate}% utilization`}
        />
        <StatCard
          title="Under Maintenance"
          value={s.maintenanceCranes}
          icon={ExclamationCircleIcon}
          color="red"
          subtitle={`${maintenanceRate}% of fleet`}
        />
      </div>

      {/* Secondary KPIs - Supporting Equipment */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
        <StatCard title="Counterweights" value={s.totalCounterweights} icon={Square3Stack3DIcon} color="indigo" subtitle="Attachments" />
        <StatCard title="Boom Sections" value={s.totalBoomSections} icon={BoltIcon} color="purple" subtitle="Components" />
        <StatCard title="Hooks" value={s.totalHooks} icon={LinkIcon} color="teal" subtitle="Rigging" />
        <StatCard title="Total Assets" value={totalEquipment} icon={ChartBarIcon} color="red" subtitle="Full inventory" />
      </div>

      {/* Charts Row - Enhanced */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Crane Status Pie */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Crane Status Distribution</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Current fleet composition</p>
            </div>
          </div>
          {statusChart.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
              <ResponsiveContainer width="45%" height={180}>
                <PieChart>
                  <Pie data={statusChart} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2}>
                    {statusChart.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {statusChart.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0
                      }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{d.name}</span>
                    </div>
                    <span style={{
                      fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)',
                      fontFamily: "'JetBrains Mono', monospace", minWidth: '30px', textAlign: 'right'
                    }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No crane data available yet
            </div>
          )}
        </div>

        {/* Transactions Bar Chart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Monthly Transaction Volume</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Last 6 months activity</p>
            </div>
          </div>
          {txnChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={txnChart} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  name="Transactions"
                  fill="var(--accent)"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No transaction data available yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions - Enhanced */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Recent Transactions</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Latest rental activities</p>
          </div>
          <Link to="/transactions" style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View All
            <span>→</span>
          </Link>
        </div>
        {data?.recentTransactions?.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['ID', 'Company', 'Equipment', 'Status', 'Date', 'Duration'].map(h => (
                    <th key={h} className="table-header" style={{
                      background: 'var(--surface-2)',
                      padding: '12px 14px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      textAlign: 'left',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid var(--border)'
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.slice(0, 8).map(t => {
                  const daysRented = t.returnDate ? differenceInDays(new Date(t.returnDate), new Date(t.transactionDate)) : differenceInDays(new Date(), new Date(t.transactionDate));
                  return (
                    <tr key={t._id} style={{
                      transition: 'background 0.15s ease',
                      borderBottom: '1px solid var(--border-muted)'
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="table-cell" style={{ padding: '14px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 700, color: 'var(--accent)' }}>
                        <Link to={`/transactions/${t._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {t.transactionNo}
                        </Link>
                      </td>
                      <td className="table-cell" style={{ padding: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {t.companyName}
                      </td>
                      <td className="table-cell" style={{
                        padding: '14px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '12px',
                        color: 'var(--text-secondary)'
                      }}>
                        {t.crane}
                      </td>
                      <td className="table-cell" style={{ padding: '14px' }}>
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="table-cell" style={{
                        padding: '14px',
                        color: 'var(--text-secondary)',
                        fontSize: '12px'
                      }}>
                        {t.transactionDate ? format(new Date(t.transactionDate), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="table-cell" style={{
                        padding: '14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        fontFamily: "'JetBrains Mono', monospace"
                      }}>
                        {daysRented} day{daysRented !== 1 ? 's' : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>No transactions yet.</p>
            <Link to="/transactions/create" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Create First Transaction
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>No transactions yet.</p>
            <Link to="/transactions/create" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Create First Transaction
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
