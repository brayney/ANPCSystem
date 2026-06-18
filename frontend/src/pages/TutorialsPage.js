import React, { useState } from 'react';
import {
  ArrowPathIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '../components/common';

const guideSections = [
  {
    id: 'overview',
    title: 'Daily System Flow',
    icon: ClipboardDocumentListIcon,
    summary: 'Follow this order to keep equipment records, assignments, and reports accurate.',
    time: '3 min read',
    bestFor: 'All users',
    steps: [
      'Start on the Dashboard to check active transactions, available equipment, and recent activity.',
      'Confirm that Cranes, Counterweights, Boom Sections, and Hooks are updated before creating a transaction.',
      'Create a transaction only after the customer, project, location, dates, and equipment list are confirmed.',
      'Open the transaction detail page after saving to review the final assigned equipment and record status.',
      'Mark the transaction as returned when the job is complete so the equipment becomes available again.',
      'Use Reports and Calendar when planning future work or checking previous activity.',
    ],
    tips: [
      'Use the Dashboard as the daily starting point.',
      'Keep equipment status updated before assigning items.',
    ],
  },
  {
    id: 'inventory',
    title: 'Managing Equipment',
    icon: TruckIcon,
    summary: 'Add, update, and review equipment before it is used in transactions.',
    time: '4 min read',
    bestFor: 'Yard and operations staff',
    steps: [
      'Open the correct equipment page: Cranes, Counterweights, Boom Sections, or Hooks.',
      'Search the list first to avoid creating duplicate equipment records.',
      'Add or edit the required details such as equipment number, serial number, capacity, condition, and location.',
      'Set the correct status so users can quickly see whether the item is Available, On Hire, Under Maintenance, or Reserved.',
      'Archive records only when the item should no longer appear in normal operations.',
      'Open detail pages when you need to review assigned parts, related history, or current usage.',
    ],
    tips: [
      'Use clear equipment numbers so users can identify items quickly.',
      'Update condition notes when an item needs inspection or repair.',
    ],
  },
  {
    id: 'transactions',
    title: 'Creating Transactions',
    icon: DocumentTextIcon,
    summary: 'Create a complete release or assignment record with the right equipment attached.',
    time: '5 min read',
    bestFor: 'Dispatch and admin users',
    steps: [
      'Go to Transactions and choose the create action.',
      'Enter the customer, project, location, expected dates, and any important remarks.',
      'Select the crane first, then attach the required counterweights, boom sections, and hooks.',
      'Review every selected item before saving, especially serial numbers and assigned crane compatibility.',
      'Save the transaction and open its detail page to confirm the final record.',
      'Print or share the transaction record when operations, customers, or site staff need a copy.',
    ],
    tips: [
      'Do not save until the equipment list matches the actual release plan.',
      'Use remarks for site-specific notes that are important later.',
    ],
  },
  {
    id: 'returns',
    title: 'Return And Status Tracking',
    icon: ArrowPathIcon,
    summary: 'Close completed work and return equipment to the available pool.',
    time: '3 min read',
    bestFor: 'Operations and receiving staff',
    steps: [
      'Open the active transaction from Transactions, Calendar, or Dashboard.',
      'Confirm that the job is completed or the equipment has physically returned to the yard.',
      'Review the assigned crane, counterweights, boom sections, and hooks before marking the return.',
      'Use the return action to change the transaction status to Returned.',
      'Check the related equipment pages to make sure each item is available again.',
      'Add or update notes when returned equipment needs inspection, cleaning, or repair.',
    ],
    tips: [
      'Return records as soon as the job is complete.',
      'Flag damaged equipment before it gets assigned again.',
    ],
  },
  {
    id: 'reports',
    title: 'Reports And Calendar',
    icon: DocumentChartBarIcon,
    summary: 'Review activity history and plan work without double-booking equipment.',
    time: '3 min read',
    bestFor: 'Managers and planners',
    steps: [
      'Open Reports to review transaction history and equipment activity.',
      'Use filters to narrow records by date, equipment, customer, project, or status when available.',
      'Open Calendar to see scheduled transaction activity by date.',
      'Compare upcoming schedules before assigning the same equipment to another job.',
      'Use report results during planning meetings or when checking operational history.',
    ],
    tips: [
      'Check the Calendar before confirming a new schedule.',
      'Use Reports when you need proof of previous assignments or returns.',
    ],
  },
  {
    id: 'messages',
    title: 'Messages',
    icon: ChatBubbleLeftRightIcon,
    summary: 'Coordinate with other system users without leaving the application.',
    time: '2 min read',
    bestFor: 'All users',
    steps: [
      'Open the floating Messages button at the lower-right side of the screen.',
      'Use Chats to continue an existing conversation.',
      'Use Accounts to start a conversation with another user.',
      'Open the three-dot menu inside a conversation when you need to search previous messages.',
      'Check date dividers and message times when confirming when a discussion happened.',
    ],
    tips: [
      'Keep messages short and specific when discussing equipment movement.',
      'Search older messages before asking for the same update again.',
    ],
  },
  {
    id: 'accounts',
    title: 'Accounts And Settings',
    icon: Cog6ToothIcon,
    summary: 'Manage user access, profile details, and system preferences.',
    time: '3 min read',
    bestFor: 'Administrators',
    steps: [
      'Open Settings when you need to manage account details or system preferences.',
      'Create accounts only for users who need access to the system.',
      'Assign the correct role or permission level based on the user work responsibility.',
      'Update passwords and account status when a role changes or access is no longer required.',
      'Log out when leaving a shared workstation or device.',
    ],
    tips: [
      'Review access regularly so only active users can enter the system.',
      'Use separate accounts instead of sharing one login.',
    ],
  },
];

const quickStart = [
  {
    label: 'First time using the system',
    text: 'Read Daily System Flow, then Managing Equipment, then Creating Transactions.',
    target: '#overview',
  },
  {
    label: 'Preparing a release',
    text: 'Update equipment records first, then create and review the transaction.',
    target: '#transactions',
  },
  {
    label: 'Closing completed work',
    text: 'Open the active transaction, mark the return, and confirm equipment availability.',
    target: '#returns',
  },
];

const essentials = [
  'Search before adding records.',
  'Keep equipment status current.',
  'Review transactions before saving.',
  'Return completed transactions promptly.',
];

export default function TutorialsPage() {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const filteredSections = normalizedQuery
    ? guideSections.filter(section => (
        section.title.toLowerCase().includes(normalizedQuery) ||
        section.summary.toLowerCase().includes(normalizedQuery) ||
        section.bestFor.toLowerCase().includes(normalizedQuery) ||
        section.steps.some(step => step.toLowerCase().includes(normalizedQuery)) ||
        section.tips.some(tip => tip.toLowerCase().includes(normalizedQuery))
      ))
    : guideSections;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Instructions"
        subtitle="Clear operating guides for equipment records, transactions, returns, reports, messages, and account access."
        actions={
          <div style={{ position: 'relative', width: 'min(100%, 320px)' }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by task, page, or status"
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>
        }
      />

      <section
        className="card"
        style={{
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, var(--surface), var(--surface-2))',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '18px', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
              <ShieldCheckIcon style={{ width: '15px', height: '15px', color: 'var(--success)' }} />
              Standard workflow
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
              Use these instructions to keep every equipment movement easy to trace.
            </h2>
            <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, maxWidth: '720px' }}>
              Each guide is written as a practical checklist. Start with the task you need, follow the steps in order, then use the notes to avoid common mistakes.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            {essentials.map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '10px 12px', border: '1px solid var(--border-muted)', borderRadius: '8px', background: 'var(--surface)' }}>
                <CheckCircleIcon style={{ width: '17px', height: '17px', color: 'var(--success)', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 650 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        {quickStart.map(item => (
          <a
            key={item.label}
            href={item.target}
            className="card"
            style={{ display: 'block', padding: '15px', borderRadius: '8px', textDecoration: 'none', color: 'inherit' }}
          >
            <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 800 }}>{item.label}</p>
            <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.5 }}>{item.text}</p>
          </a>
        ))}
      </section>

      <nav
        aria-label="Instruction sections"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginBottom: '18px',
        }}
      >
        {guideSections.map(section => {
          const Icon = section.icon;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="card"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', textDecoration: 'none', color: 'inherit', borderRadius: '8px' }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: '17px', height: '17px' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>{section.title}</p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>{section.time}</p>
              </div>
            </a>
          );
        })}
      </nav>

      <div style={{ display: 'grid', gap: '14px' }}>
        {filteredSections.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '36px 20px', borderRadius: '8px' }}>
            <BookOpenIcon style={{ width: '34px', height: '34px', margin: '0 auto 10px', color: 'var(--text-muted)' }} />
            <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700 }}>No instructions found</p>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>Try searching for equipment, transaction, return, report, message, or account.</p>
          </div>
        ) : (
          filteredSections.map(section => {
            const Icon = section.icon;
            return (
              <section key={section.id} id={section.id} className="card" style={{ borderRadius: '8px', padding: '18px', scrollMarginTop: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: '240px', flex: 1 }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon style={{ width: '21px', height: '21px' }} />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>{section.title}</h2>
                      <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.55 }}>{section.summary}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '5px 8px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>{section.bestFor}</span>
                    <span style={{ padding: '5px 8px', borderRadius: '8px', background: 'var(--accent-subtle)', color: 'var(--accent-text)', fontSize: '11px', fontWeight: 700 }}>{section.time}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px', alignItems: 'start' }}>
                  <ol style={{ margin: 0, padding: 0, display: 'grid', gap: '9px', listStyle: 'none' }}>
                    {section.steps.map((step, index) => (
                      <li key={step} style={{ display: 'grid', gridTemplateColumns: '30px minmax(0, 1fr)', gap: '10px', alignItems: 'start' }}>
                        <span style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>
                          {index + 1}
                        </span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.6, paddingTop: '5px' }}>{step}</span>
                      </li>
                    ))}
                  </ol>

                  <aside style={{ border: '1px solid var(--border-muted)', borderRadius: '8px', padding: '12px', background: 'var(--surface-2)' }}>
                    <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '12px', fontWeight: 800 }}>Helpful notes</p>
                    <div style={{ display: 'grid', gap: '8px', marginTop: '9px' }}>
                      {section.tips.map(tip => (
                        <div key={tip} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <CheckCircleIcon style={{ width: '15px', height: '15px', color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                          <span style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.5 }}>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </aside>
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
