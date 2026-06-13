import React, { useState } from 'react';
import {
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '../components/common';

const tutorials = [
  {
    id: 'overview',
    title: 'System Flow',
    icon: ClipboardDocumentListIcon,
    summary: 'Understand the daily flow from equipment setup to transaction monitoring.',
    steps: [
      'Check the Dashboard for active transactions, equipment availability, and recent activity.',
      'Keep the Cranes, Counterweights, Boom Sections, and Hooks pages updated before creating transactions.',
      'Create a transaction when equipment is released or assigned to a customer or project.',
      'Open the transaction details to review assigned equipment, print or share records, and track status.',
      'Mark equipment as returned once the transaction is completed so it becomes available again.',
      'Use Reports and Calendar to review operational history and upcoming schedules.',
    ],
  },
  {
    id: 'inventory',
    title: 'Managing Equipment',
    icon: TruckIcon,
    summary: 'Add and maintain the equipment records used in transactions.',
    steps: [
      'Open the equipment tab you need: Cranes, Counterweights, Boom Sections, or Hooks.',
      'Review the list to confirm whether the item already exists.',
      'Add or update the item details, including equipment number, description, and current condition.',
      'Keep unavailable, damaged, or archived items updated so they are not selected by mistake.',
      'Use the detail pages to check assigned equipment and related records.',
    ],
  },
  {
    id: 'transactions',
    title: 'Creating Transactions',
    icon: DocumentTextIcon,
    summary: 'Create clear transaction records with the right equipment attached.',
    steps: [
      'Go to Transactions and select the create action.',
      'Enter the transaction details such as customer, project, location, dates, and remarks.',
      'Select the crane and any related counterweights, boom sections, and hooks.',
      'Review all selected equipment before saving.',
      'After saving, open the transaction detail page to verify the final record.',
      'Share, print, or keep the transaction record as needed for operations.',
    ],
  },
  {
    id: 'returns',
    title: 'Return And Status Tracking',
    icon: CheckCircleIcon,
    summary: 'Keep equipment availability accurate after work is completed.',
    steps: [
      'Open the active transaction from the Transactions list, Calendar, or Dashboard.',
      'Confirm that the equipment has physically returned or the job is completed.',
      'Use the return action to mark the transaction as returned.',
      'Check that the assigned equipment is available again in its equipment page.',
      'Review any notes or status changes before closing the transaction.',
    ],
  },
  {
    id: 'reports',
    title: 'Reports And Calendar',
    icon: DocumentChartBarIcon,
    summary: 'Use reports and calendar views to understand activity over time.',
    steps: [
      'Open Reports to review transaction and equipment activity.',
      'Use filters when available to narrow records by date, equipment, or status.',
      'Open Calendar to see scheduled transaction activity by date.',
      'Use these views during planning to avoid double-booking equipment.',
    ],
  },
  {
    id: 'messages',
    title: 'Messages',
    icon: ChatBubbleLeftRightIcon,
    summary: 'Use chat to coordinate with other system users.',
    steps: [
      'Open the floating Messages button at the lower-right side of the screen.',
      'Use Chats to continue an existing conversation.',
      'Use Accounts to start a conversation with another user.',
      'Open the three-dot menu inside a conversation to search previous messages.',
      'Check date dividers and message times to understand when conversations happened.',
    ],
  },
  {
    id: 'accounts',
    title: 'Accounts And Settings',
    icon: Cog6ToothIcon,
    summary: 'Manage access, profile settings, and system preferences.',
    steps: [
      'Open Settings to manage account details and system preferences.',
      'Create accounts only for users who need system access.',
      'Update passwords and account status when roles or access requirements change.',
      'Log out when leaving a shared device or workstation.',
    ],
  },
];

export default function TutorialsPage() {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const filteredTutorials = normalizedQuery
    ? tutorials.filter(section => (
        section.title.toLowerCase().includes(normalizedQuery) ||
        section.summary.toLowerCase().includes(normalizedQuery) ||
        section.steps.some(step => step.toLowerCase().includes(normalizedQuery))
      ))
    : tutorials;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Instructions"
        subtitle="Step-by-step guides for using the system and following the main operational flow."
        actions={
          <div style={{ position: 'relative', minWidth: '260px' }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search instructions"
              className="input-field"
              style={{ paddingLeft: '32px' }}
            />
          </div>
        }
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px',
        marginBottom: '18px',
      }}>
        {tutorials.slice(0, 4).map(section => {
          const Icon = section.icon;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="card"
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', textDecoration: 'none', color: 'inherit', borderRadius: '8px' }}
            >
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: '18px', height: '18px' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{section.title}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{section.summary}</p>
              </div>
            </a>
          );
        })}
      </div>

      <div style={{ display: 'grid', gap: '14px' }}>
        {filteredTutorials.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
            <BookOpenIcon style={{ width: '34px', height: '34px', margin: '0 auto 10px', color: 'var(--text-muted)' }} />
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>No instructions match your search.</p>
          </div>
        ) : (
          filteredTutorials.map(section => {
            const Icon = section.icon;
            return (
              <section key={section.id} id={section.id} className="card" style={{ borderRadius: '8px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'var(--accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: '20px', height: '20px' }} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '17px' }}>{section.title}</h2>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>{section.summary}</p>
                  </div>
                </div>

                <ol style={{ margin: 0, paddingLeft: '22px', display: 'grid', gap: '10px' }}>
                  {section.steps.map((step, index) => (
                    <li key={index} style={{ color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.55, paddingLeft: '4px' }}>
                      {step}
                    </li>
                  ))}
                </ol>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
