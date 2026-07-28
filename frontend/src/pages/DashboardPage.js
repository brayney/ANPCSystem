import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TruckIcon, Square3Stack3DIcon, DocumentTextIcon, ChartBarIcon, BoltIcon, LinkIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid } from 'recharts';
import { StatCard, StatusBadge } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n/useTranslation';
import api from '../utils/api';
import { format, differenceInDays } from 'date-fns';
import { SunIcon, MoonIcon, CloudIcon } from '@heroicons/react/24/outline';

const PIE_COLORS = ['#1a7f37', '#1f6feb', '#9a6700', '#bc4c00', '#cf222e', '#6e40c9'];
const STATUS_COLOR_MAP = {
  'Available': '#1a7f37',
  'Active': '#1f6feb',
  'On Hire': '#1f6feb',
  'Standby': '#9a6700',
  'Under Maintenance': '#9a6700',
  'Out of Yard': '#cf222e',
  'Reserved': '#6e40c9',
  'Retired': '#6e40c9',
  'Returned': '#1a7f37',
  'Operational': '#1a7f37',
};
const STATUS_ORDER = ['Available', 'Active', 'On Hire', 'Standby', 'Under Maintenance', 'Out of Yard', 'Reserved', 'Retired', 'Returned', 'Operational'];

const readCachedDashboardData = () => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = sessionStorage.getItem('dashboardData');
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const persistDashboardData = (payload) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem('dashboardData', JSON.stringify(payload));
  } catch {
    // ignore storage failures
  }
};

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



function DashboardPage() {
  const location = useLocation();
  const initialData = useMemo(() => location.state?.dashboardData || readCachedDashboardData(), [location.state?.dashboardData]);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());
  const { user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const applyDashboardData = (payload) => {
      setData(payload);
      persistDashboardData(payload);
    };

    if (location.state?.dashboardData) {
      applyDashboardData(location.state.dashboardData);
      setLoading(false);
      return;
    }

    if (initialData) {
      setData(initialData);
    }

    api.get('/dashboard')
      .then(r => {
        const payload = r.data?.data || null;
        if (payload) {
          applyDashboardData(payload);
        }
      })
      .catch(() => {
        // Keep the existing cached data visible if the refresh fails.
      })
      .finally(() => setLoading(false));
  }, [initialData, location.state?.dashboardData]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { data: response } = await api.get('/dashboard');
      const payload = response?.data || null;
      setData(payload);
      persistDashboardData(payload);
    } catch (err) {
      // ignore refresh errors and keep current data visible
    }
    await new Promise(r => setTimeout(r, 300));
    setRefreshing(false);
  };

  const hour = now.getHours();
  const partOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const greetingKey = partOfDay === 'morning' ? 'dashboard.greeting' : partOfDay === 'afternoon' ? 'dashboard.good_afternoon' : 'dashboard.good_evening';
  const PartIcon = partOfDay === 'morning' ? SunIcon : partOfDay === 'afternoon' ? CloudIcon : MoonIcon;
  const partColor = partOfDay === 'morning' ? '#f59e0b' : partOfDay === 'afternoon' ? '#1f6feb' : '#6e40c9';
  const firstName = user?.name?.split(' ')[0] || 'Admin';

  const hasData = Boolean(data);
  const isHydrating = loading && !hasData;

  const s = data?.summary || {};
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const rawStatusChart = (data?.charts?.craneStatusDist || []).length > 0
    ? data.charts.craneStatusDist.map(d => ({ name: d._id, value: d.count }))
    : [
        { name: t('dashboard.available'), value: s.availableCranes || 0 },
        { name: t('dashboard.active'), value: s.activeRentals || 0 },
        { name: t('dashboard.maintenance'), value: s.maintenanceCranes || 0 },
        { name: t('dashboard.retired_label'), value: s.retiredCranes || 0 }
      ];
  const statusChart = rawStatusChart
    .map(item => ({
      ...item,
      color: STATUS_COLOR_MAP[item.name] || STATUS_COLOR_MAP[item.name.replace(/\s+/g, ' ')] || '#9a6700',
    }))
    .sort((a, b) => {
      const aIndex = STATUS_ORDER.indexOf(a.name);
      const bIndex = STATUS_ORDER.indexOf(b.name);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  const txnChart = (data?.charts?.transactionsByMonth || []).length > 0
    ? data.charts.transactionsByMonth.map(d => ({ month: monthNames[d._id - 1] || `M${d._id}`, count: d.count }))
    : [];
  const fleetHealthChart = (data?.charts?.fleetHealthBreakdown || []).length > 0
    ? data.charts.fleetHealthBreakdown
    : [
        { name: 'Operational', value: (s.availableCranes || 0) + (s.activeRentals || 0), color: '#1a7f37' },
        { name: 'Under Maintenance', value: s.maintenanceCranes || 0, color: '#9a6700' }
      ];
  const weeklyActivityChart = (data?.charts?.weeklyJobActivity || []).length > 0
    ? data.charts.weeklyJobActivity
    : Array.from({ length: 7 }, (_, index) => ({ day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index], jobs: 0 }));
  const peakDayIndex = data?.charts?.peakDayIndex ?? -1;
  const totalEquipment = (s.totalCranes || 0) + (s.totalCounterweights || 0) + (s.totalBoomSections || 0) + (s.totalHooks || 0);
  const kpiTiles = data?.charts?.kpiTiles || [
    { label: 'Avg Rental Duration', value: s.avgRentalDuration || 0, unit: 'days', color: '#1f6feb' },
    { label: 'Utilization Rate', value: parseFloat(s.utilizationRate || 0), unit: '%', color: '#1a7f37' },
    { label: 'Under Maintenance', value: s.maintenanceCranes || 0, unit: 'units', color: '#9a6700' },
    { label: 'Assets Tracked', value: totalEquipment, unit: 'total', color: '#6e40c9' }
  ];
  const overdueCount = s.pendingReturns || 0;

  const recentLogs = (data?.recentLogs || []).filter(log => {
    const detail = (log.details || '').trim();
    return !(
      detail.includes('Deleted transaction ANPC-TXN-00001-2026') ||
      detail.includes('Transaction ANPC-TXN-00001-2026 for Bryne Corp.')
    );
  });

  const activityItems = recentLogs.slice(0, 6).map(log => {
    const dateTimeStr = log.createdAt ? format(new Date(log.createdAt), 'MMM d, yyyy • h:mm a') : '';
    const actionLower = (log.action || '').toLowerCase();
    let actionLabel = log.action || 'Activity';
    if (actionLower.includes('create')) actionLabel = 'Created';
    else if (actionLower.includes('update') || actionLower.includes('edit')) actionLabel = 'Updated';
    else if (actionLower.includes('delete')) actionLabel = 'Deleted';
    else if (actionLower.includes('return')) actionLabel = 'Returned';
    else if (actionLower.includes('login')) actionLabel = 'Logged in';
    return { ...log, shortLabel: actionLabel, dateTimeStr };
  });

  return (
    <div className="animate-fade-in">
      {isHydrating && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--text-secondary)', fontSize: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.2s ease-in-out infinite' }} />
          Refreshing dashboard data…
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6" style={{ padding: '0 0 10px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          <div style={{
            width: '52px', height: '52px', flexShrink: 0, borderRadius: '14px',
            background: `color-mix(in srgb, ${partColor} 16%, transparent)`,
            border: `1px solid color-mix(in srgb, ${partColor} 30%, transparent)`,
            color: partColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PartIcon style={{ width: '26px', height: '26px' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(22px, 2.6vw, 30px)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, margin: 0, letterSpacing: 0 }}>
              {t(greetingKey)}, {firstName} <span style={{ display: 'inline-block', animation: 'msgIn 0.4s ease' }}>👋</span>
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '5px', marginBottom: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t(`dashboard.greeting_subtitle_${partOfDay}`)} · {format(now, 'EEEE, h:mm a')}
            </p>
          </div>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, cursor: refreshing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: refreshing ? 0.6 : 1, flexShrink: 0 }}>
          <ArrowPathIcon style={{ width: '14px', height: '14px', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? t('dashboard.refreshing') : t('dashboard.refresh')}
        </button>
      </div>

      {overdueCount > 0 && (
        <div className="card mb-4" style={{ borderLeft: '4px solid var(--danger)', background: 'color-mix(in srgb, var(--danger-bg) 60%, var(--surface-raised))' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <ExclamationCircleIcon style={{ width: '20px', height: '20px', color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', fontSize: '13px' }}>{t('dashboard.overdue_alert_title')}</p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t('dashboard.overdue_alert_message', { count: overdueCount })}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5 stagger">
        <StatCard title={t('dashboard.total_cranes')} value={s.totalCranes} icon={TruckIcon} color="blue" subtitle={t('dashboard.all_active_equipment')} />
        <StatCard title={t('dashboard.available_cranes')} value={s.availableCranes} icon={CheckCircleIcon} color="green" subtitle={t('dashboard.ready_for_rental')} />
        <StatCard title={t('dashboard.active_rentals')} value={s.activeRentals} icon={DocumentTextIcon} color="orange" subtitle={`${s.utilizationRate}% ${t('dashboard.utilization')}`} />
        <StatCard title={t('dashboard.under_maintenance')} value={s.maintenanceCranes} icon={ExclamationCircleIcon} color="red" subtitle={`${((s.maintenanceCranes || 0) / (s.totalCranes || 1) * 100).toFixed(1)}% ${t('dashboard.of_fleet')}`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5 stagger">
        <StatCard title={t('dashboard.counterweights')} value={s.totalCounterweights} icon={Square3Stack3DIcon} color="indigo" subtitle={t('dashboard.attachments')} />
        <StatCard title={t('dashboard.boom_sections')} value={s.totalBoomSections} icon={BoltIcon} color="purple" subtitle={t('dashboard.components')} />
        <StatCard title={t('dashboard.hooks')} value={s.totalHooks} icon={LinkIcon} color="teal" subtitle={t('dashboard.rigging')} />
        <StatCard title={t('dashboard.total_assets')} value={totalEquipment} icon={ChartBarIcon} color="red" subtitle={t('dashboard.full_inventory')} />
      </div>

      

      

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>{t('dashboard.equipment_status_distribution')}</h3>
          {statusChart.length > 0 ? (
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div style={{ width: '100%', minWidth: 220, flex: '0 0 45%' }}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusChart} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2}>
                    {statusChart.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {statusChart.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color || PIE_COLORS[i % PIE_COLORS.length] }} />
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
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>{t('dashboard.6_month_transaction_trends')}</h3>
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>{t('dashboard.fleet_health_breakdown')}</h3>
          {/* KPI mini-tiles inside Fleet Health card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px', marginBottom: '12px' }}>
            {kpiTiles.map((tile, idx) => (
              <div key={idx} style={{ padding: '10px', borderRadius: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 6px 0' }}>{tile.label}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: tile.color, fontFamily: "'JetBrains Mono', monospace" }}>{tile.value}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>{tile.unit}</span>
                </div>
              </div>
            ))}
          </div>
          {fleetHealthChart.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {fleetHealthChart.map((item, idx) => {
                const total = fleetHealthChart.reduce((sum, i) => sum + i.value, 0);
                const percentage = total > 0 ? (item.value / total * 100).toFixed(0) : 0;
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>{item.value} ({percentage}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--surface-2)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: item.color || 'var(--accent)',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>{t('dashboard.no_data_yet')}</p>}
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>{t('dashboard.weekly_job_activity')}</h3>
          {weeklyActivityChart.length > 0 ? (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyActivityChart.map((d, idx) => ({ ...d, isPeak: idx === peakDayIndex }))} margin={{ top: 8, right: 10, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="jobs" radius={[4, 4, 0, 0]}>
                    {weeklyActivityChart.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={index === peakDayIndex ? '#6e40c9' : 'var(--accent)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>{t('dashboard.no_data_yet')}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('dashboard.recent_activity')}</h3>
          </div>
          {activityItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activityItems.map((item, idx) => (
                <div key={item._id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '6px', background: 'var(--surface-2)', border: '1px solid var(--border-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--accent-subtle)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: 700 }}>{item.shortLabel?.charAt(0)}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.details || item.action || t('dashboard.no_activity')}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{item.userName || 'System'}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' }}>{item.dateTimeStr}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{t('dashboard.no_activity')}</p>
            </div>
          )}
        </div>


        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('dashboard.recent_transactions')}</h3>
            <Link to="/transactions" style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>{t('dashboard.view_all')}</Link>
          </div>
          {data?.recentTransactions?.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {[t('common.id'), t('common.company'), t('common.equipment'), t('common.status'), t('common.date'), t('common.duration')].map(h => (
                      <th key={h} style={{ padding: '12px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.slice(0, 8).map(txn => {
                    const daysRented = txn.returnDate ? differenceInDays(new Date(txn.returnDate), new Date(txn.transactionDate)) : differenceInDays(new Date(), new Date(txn.transactionDate));
                    return (
                      <tr key={txn._id} style={{ borderBottom: '1px solid var(--border-muted)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '14px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 700, color: 'var(--accent)' }}>
                          <Link to={`/transactions/${txn._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{txn.transactionNo}</Link>
                        </td>
                        <td style={{ padding: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{txn.companyName}</td>
                        <td style={{ padding: '14px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--text-secondary)' }}>{txn.crane}</td>
                        <td style={{ padding: '14px' }}><StatusBadge status={txn.status} /></td>
                        <td style={{ padding: '14px', color: 'var(--text-secondary)', fontSize: '12px' }}>{txn.transactionDate ? format(new Date(txn.transactionDate), 'MMM d, yyyy') : '-'}</td>
                        <td style={{ padding: '14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>{daysRented} {daysRented !== 1 ? t('common.days') : t('common.day')}</td>
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
    </div>
  );
}

export default DashboardPage;
