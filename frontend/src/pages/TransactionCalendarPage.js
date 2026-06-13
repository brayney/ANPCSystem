import React, { useEffect, useState, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageHeader, Spinner } from '../components/common';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';

export default function TransactionCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/transactions', { params: { limit: 1000 } });
      setTransactions(data.data || []);
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

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Transaction Calendar" 
        subtitle={`View transactions for ${format(currentDate, 'MMMM yyyy')}`}
      />

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="card">
          {/* Calendar Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              style={{ padding: '8px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
            >
              <ChevronLeftIcon style={{ width: '18px', height: '18px' }} />
            </button>

            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {format(currentDate, 'MMMM yyyy')}
            </h2>

            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              style={{ padding: '8px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
            >
              <ChevronRightIcon style={{ width: '18px', height: '18px' }} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '1px', background: 'var(--border)' }}>
            {weekDays.map(day => (
              <div key={day} style={{ background: 'var(--surface)', padding: '12px 8px', textAlign: 'center', fontWeight: 700, fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border)', minHeight: '600px' }}>
            {days.map((day, idx) => {
              const dayTransactions = getTransactionsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={idx}
                  style={{
                    background: isCurrentMonth ? 'var(--surface)' : 'var(--surface-2)',
                    padding: '12px 8px',
                    minHeight: '120px',
                    borderRadius: '0px',
                    position: 'relative',
                    opacity: isCurrentMonth ? 1 : 0.5,
                  }}
                >
                  {/* Date */}
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: isToday ? 'var(--accent)' : 'transparent',
                      color: isToday ? '#fff' : 'var(--text-primary)',
                      fontWeight: isToday ? 700 : 600,
                      fontSize: '13px',
                    }}>
                      {format(day, 'd')}
                    </div>
                  </div>

                  {/* Transactions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {dayTransactions.slice(0, 3).map((txn, i) => {
                      const colors = statusColors[txn.status] || { text: 'var(--text-secondary)', bg: 'var(--surface-3)' };
                      return (
                        <Link
                          key={i}
                          to={`/transactions/${txn._id}`}
                          style={{
                            padding: '4px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: colors.text,
                            background: colors.bg,
                            textDecoration: 'none',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            border: '1px solid',
                            borderColor: colors.text,
                          }}
                          title={`${txn.companyName} - ${txn.transactionNo}`}
                        >
                          {txn.transactionNo}
                        </Link>
                      );
                    })}
                    {dayTransactions.length > 3 && (
                      <div style={{ padding: '4px 6px', fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        +{dayTransactions.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {Object.entries(statusColors).map(([status, colors]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  background: colors.bg,
                  border: `2px solid ${colors.text}`,
                }} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {status}
                </span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{ marginTop: '20px', padding: '16px', borderRadius: '9px', background: 'var(--surface-2)' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              <strong>{transactions.length}</strong> total transactions {transactions.length > 0 && `from ${format(new Date(transactions[0].createdAt), 'MMM d, yyyy')}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
