import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TruckIcon, Square3Stack3DIcon, DocumentTextIcon, ChartBarIcon, BoltIcon, LinkIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { StatCard, Spinner, StatusBadge } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n/useTranslation';
import api from '../utils/api';
import { format, differenceInDays } from 'date-fns';

const PIE_COLORS = ['#1a7f37', '#1f6feb', '#9a6700', '#bc4c00', '#cf222e', '#6e40c9'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', boxShadow: 'var(--shadow-lg)', fontSize: '12px' }}>
      {label && <p style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || 'var(--text-primary)', fontWeight: 600, marginBottom: i === payload.length - 1 ? 0 : '4px' }}>
          {p.name}: <span style={{ color: 'var(--text-primary)' }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const PerformanceIndicator = ({ value, label, trend, unit = '' }) => (
  <div style={{ padding: '12px 16px', borderRadius: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 6px 0' }}>{label}</p>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
      <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>{value}{unit}</span>
      {trend !== undefined && (
        <span style={{ fontSize: '11px', fontWeight: 600, color: trend > 0 ? '#1a7f37' : trend < 0 ? '#cf222e' : 'var(--text-secondary)' }}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
        </span>
      )}
    </div>
  </div>
);

function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await api.get('/dashboard').then(r => setData(r.data.data));
    await new Promise(r => setTimeout(r, 300));
    setRefreshing(false);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? t('dashboard.greeting') : h < 18 ? t('dashboard.good_afternoon') : t('dashboard.good_evening');
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}><Spinner size="lg" /></div>;

  const s = data?.summary || {};
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const statusChart = data?.charts?.craneStatusDist?.map(d => ({ name: d._id, value: d.count })) || [];
  const txnChart = data?.charts?.transactionsByMonth?.map(d => ({ month: monthNames[d._id - 1], count: d.count })) || [];
  const totalEquipment = (s.totalCranes || 0) + (s.totalCounterweights || 0) + (s.totalBoomSections || 0) + (s.totalHooks || 0);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, margin: 0 }}>
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {t('dashboard.complete_fleet_overview')} • {t('dashboard.updated')} {format(new Date(), 'h:mm a')}
          </p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, cursor: refreshing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: refreshing ? 0.6 : 1 }}>
          <ArrowPathIcon style={{ width: '14px', height: '14px', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? t('dashboard.refreshing') : t('dashboard.refresh')}
        </button>
      </div>

      {/* Core KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
        <StatCard title={t('dashboard.total_cranes')} value={s.totalCranes} icon={TruckIcon} color="blue" subtitle={t('dashboard.all_active_equipment')} />
        <StatCard title={t('dashboard.available_cranes')} value={s.availableCranes} icon={CheckCircleIcon} color="green" subtitle={t('dashboard.ready_for_rental')} />
        <StatCard title={t('dashboard.active_rentals')} value={s.activeRentals} icon={DocumentTextIcon} color="orange" subtitle={`${s.utilizationRate}% ${t('dashboard.utilization')}`} />
        <StatCard title={t('dashboard.under_maintenance')} value={s.maintenanceCranes} icon={ExclamationCircleIcon} color="red" subtitle={`${((s.maintenanceCranes || 0) / (s.totalCranes || 1) * 100).toFixed(1)}% ${t('dashboard.of_fleet')}`} />
      </div>

      {/* Secondary Equipment Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
        <StatCard title={t('dashboard.counterweights')} value={s.totalCounterweights} icon={Square3Stack3DIcon} color="indigo" subtitle={t('dashboard.attachments')} />
        <StatCard title={t('dashboard.boom_sections')} value={s.totalBoomSections} icon={BoltIcon} color="purple" subtitle={t('dashboard.components')} />
        <StatCard title={t('dashboard.hooks')} value={s.totalHooks} icon={LinkIcon} color="teal" subtitle={t('dashboard.rigging')} />
        <StatCard title={t('dashboard.total_assets')} value={totalEquipment} icon={ChartBarIcon} color="red" subtitle={t('dashboard.full_inventory')} />
      </div>

      {/* Performance & Health Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <PerformanceIndicator label="Pending Returns" value={s.pendingReturns || 0} />
        <PerformanceIndicator label="Monthly Transactions" value={s.monthlyTransactions || 0} trend={parseFloat(s.monthlyGrowth) || 0} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>{t('dashboard.equipment_status_distribution')}</h3>
          {statusChart.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
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
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>{d.value} ({((d.value / (statusChart.reduce((sum, x) => sum + x.value, 0))) * 100).toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>{t('dashboard.no_data_yet')}</p>}
        </div>

        <div className="card">
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>{t('dashboard.6_month_transaction_trends')}</h3>
          {txnChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={txnChart} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={32} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" name="Transactions" stroke="var(--accent)" strokeWidth={3} isAnimationActive={true} dot={{ fill: 'var(--accent)', r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>{t('dashboard.no_data_yet')}</p>}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('dashboard.recent_transactions')}</h3>
          <Link to="/transactions" style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>{t('dashboard.view_all')} →</Link>
        </div>
        {data?.recentTransactions?.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[t('common.id'), t('common.company'), t('common.equipment'), t('common.status'), t('common.date'), t('common.duration'), t('common.value')].map(h => (
                    <th key={h} style={{ padding: '12px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.slice(0, 8).map(t => {
                  const daysRented = t.returnDate ? differenceInDays(new Date(t.returnDate), new Date(t.transactionDate)) : differenceInDays(new Date(), new Date(t.transactionDate));
                  const rentalValue = (daysRented * (t.dailyRate || 0)).toFixed(2);
                  return (
                    <tr key={t._id} style={{ borderBottom: '1px solid var(--border-muted)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 700, color: 'var(--accent)' }}><Link to={`/transactions/${t._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{t.transactionNo}</Link></td>
                      <td style={{ padding: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{t.companyName}</td>
                      <td style={{ padding: '14px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--text-secondary)' }}>{t.crane}</td>
                      <td style={{ padding: '14px' }}><StatusBadge status={t.status} /></td>
                      <td style={{ padding: '14px', color: 'var(--text-secondary)', fontSize: '12px' }}>{t.transactionDate ? format(new Date(t.transactionDate), 'MMM d, yyyy') : '—'}</td>
                      <td style={{ padding: '14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>{daysRented} {daysRented !== 1 ? t('common.days') : t('common.day')}</td>
                      <td style={{ padding: '14px', fontSize: '12px', fontWeight: 600, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>${rentalValue}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>{t('dashboard.no_transactions_yet')}</p>
            <Link to="/transactions/create" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>{t('dashboard.create_first_transaction')}</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;