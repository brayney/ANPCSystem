import React, { useEffect, useState, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageHeader, TableSkeleton } from '../components/common';
import { fetchWithCache } from '../utils/dataCache';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function TransactionCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const cached = await fetchWithCache('/transactions', { limit: 500 }, {
        onStale: (data) => setTransactions(data?.data || []),
      });
      setTransactions(Array.isArray(cached) ? cached : (cached?.data || []));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group transactions by date
  const transactionsByDate = {};
  transactions.forEach(txn => {
    if (txn.transactionDate) {
      const dateKey = format(new Date(txn.transactionDate), 'yyyy-MM-dd');
      if (!transactionsByDate[dateKey]) transactionsByDate[dateKey] = [];
      transactionsByDate[dateKey].push(txn);
    }
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getTransactionsForDay = (day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return transactionsByDate[dateKey] || [];
  };

  const statusColors = {
    Active: { text: '#31ef3b', bg: 'rgba(49, 239, 59, 0.1)' },
    Returned: { text: '#4a90e2', bg: 'rgba(74, 144, 226, 0.1)' },
  };

  const monthTransactions = transactions.filter(txn => {
    if (!txn.transactionDate) return false;
    const d = new Date(txn.transactionDate);
    return isSameMonth(d, currentDate) && isSameMonth(d, monthStart);
  });

  return (
    <div className="animate-fade-in calendar-fill">
      <PageHeader
        title="Transaction Calendar"
        subtitle={`View transactions for ${format(currentDate, 'MMMM yyyy')}`}
      />

      {loading && transactions.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
          <TableSkeleton rows={6} cols={7} />
        </div>
      ) : (
        <div className="card calendar-card" style={{ padding: '20px' }}>
          {/* Calendar Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                style={{ padding: '8px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-secondary)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
                aria-label="Previous month"
              >
                <ChevronLeftIcon style={{ width: '18px', height: '18px' }} />
              </button>

              <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, minWidth: '160px', textAlign: 'center' }}>
                {format(currentDate, 'MMMM yyyy')}
              </h2>

              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                style={{ padding: '8px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-secondary)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
                aria-label="Next month"
              >
                <ChevronRightIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <button
              onClick={() => setCurrentDate(new Date())}
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              Today
            </button>
          </div>

          {/* Weekday Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px' }}>
            {weekDays.map(day => (
              <div key={day} style={{ textAlign: 'center', fontWeight: 700, fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 0' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', flex: 1, minHeight: 0 }}>
            {days.map((day, idx) => {
              const dayTransactions = getTransactionsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={idx}
                  style={{
                    background: isCurrentMonth ? 'var(--surface)' : 'var(--surface-2)',
                    border: `1px solid ${isCurrentMonth ? 'var(--border)' : 'var(--border-muted)'}`,
                    padding: '8px',
                    borderRadius: '8px',
                    position: 'relative',
                    opacity: isCurrentMonth ? 1 : 0.55,
                    transition: 'background 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    overflow: 'hidden',
                  }}
                >
                  {/* Date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: isToday ? 'var(--accent)' : 'transparent',
                      color: isToday ? '#fff' : (isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)'),
                      fontWeight: isToday ? 700 : 600,
                      fontSize: '12px',
                    }}>
                      {format(day, 'd')}
                    </div>
                    {dayTransactions.length > 0 && (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {dayTransactions.length}
                      </span>
                    )}
                  </div>

                  {/* Transactions */}
                  <div className="calendar-cell-list" style={{ display: 'flex', flexDirection: 'column', gap: '3px', minHeight: 0, overflow: 'visible' }}>
                    {dayTransactions.map((txn, i) => {
                      const colors = statusColors[txn.status] || { text: 'var(--text-secondary)', bg: 'var(--surface-3)' };
                      const label = txn.transactionNo || txn._id?.slice(-6) || 'Transaction';
                      return (
                        <Link
                          key={i}
                          to={`/transactions/${txn._id}`}
                          style={{
                            padding: '3px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                            color: colors.text,
                            background: colors.bg,
                            textDecoration: 'none',
                            overflowWrap: 'anywhere',
                            lineHeight: 1.3,
                            whiteSpace: 'normal',
                            border: '1px solid',
                            borderColor: colors.text,
                          }}
                          title={`${txn.companyName || txn.customer || ''} - ${label}`}
                        >
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend + Summary */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {Object.entries(statusColors).map(([status, colors]) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '4px',
                    background: colors.bg,
                    border: `2px solid ${colors.text}`,
                  }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {status}
                  </span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{monthTransactions.length}</strong> transaction{monthTransactions.length === 1 ? '' : 's'} this month
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
