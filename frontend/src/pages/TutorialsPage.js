import React, { useEffect, useMemo, useState } from 'react';
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
  PauseIcon,
  PlayIcon,
  ShieldCheckIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

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
      'Use report results during planning meetings or when checking previous activity.',
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

export default function TutorialsPage() {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    if (!normalizedQuery) return guideSections;

    return guideSections.filter(section => (
      section.title.toLowerCase().includes(normalizedQuery) ||
      section.summary.toLowerCase().includes(normalizedQuery) ||
      section.bestFor.toLowerCase().includes(normalizedQuery) ||
      section.steps.some(step => step.toLowerCase().includes(normalizedQuery)) ||
      section.tips.some(tip => tip.toLowerCase().includes(normalizedQuery))
    ));
  }, [normalizedQuery]);

  useEffect(() => {
    if (activeIndex >= filteredSections.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, filteredSections.length]);

  useEffect(() => {
    if (!autoPlay || filteredSections.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex(current => (current + 1) % filteredSections.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [autoPlay, filteredSections.length]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        setActiveIndex(current => Math.min(current + 1, filteredSections.length - 1));
      }
      if (event.key === 'ArrowLeft') {
        setActiveIndex(current => Math.max(current - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredSections.length]);

  const currentSlide = filteredSections[activeIndex] || null;
  const progressPercent = filteredSections.length ? ((activeIndex + 1) / filteredSections.length) * 100 : 0;
  const CurrentSlideIcon = currentSlide?.icon;

  return (
    <div className="instructions-page-shell animate-fade-in">
      <div className="instructions-topbar">
        <div className="instructions-topbar-copy">
          <span className="slideshow-pill accent">Full-page instructions</span>
           <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2, margin: '0 0 0.5rem', textShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>Instructions</h1>
          <p>Follow the system step-by-step as a full-screen presentation deck.</p>
        </div>

        <div className="instructions-search">
          <MagnifyingGlassIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search by task, page, or status"
            className="input-field"
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {filteredSections.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px', borderRadius: '8px' }}>
          <BookOpenIcon style={{ width: '34px', height: '34px', margin: '0 auto 10px', color: 'var(--text-muted)' }} />
          <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700 }}>No instructions found</p>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>Try searching for equipment, transaction, return, report, message, or account.</p>
        </div>
      ) : (
        <section className="slideshow-shell instructions-deck card">
          <div className="slideshow-toolbar">
            <div className="slideshow-toolbar-left">
              <span className="slideshow-pill">Slide {activeIndex + 1} of {filteredSections.length}</span>
              <span className="slideshow-pill accent">{currentSlide?.bestFor}</span>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setAutoPlay(value => !value)}
            >
              {autoPlay ? <PauseIcon style={{ width: '15px', height: '15px' }} /> : <PlayIcon style={{ width: '15px', height: '15px' }} />}
              {autoPlay ? 'Pause' : 'Play'}
            </button>
          </div>

          <div className="slideshow-layout">
            <aside className="slideshow-sidebar">
              {filteredSections.map((section, index) => {
                const Icon = section.icon;
                const isActive = index === activeIndex;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      setActiveIndex(index);
                      setAutoPlay(false);
                    }}
                    className={`slideshow-thumb ${isActive ? 'active' : ''}`}
                  >
                    <div className="slideshow-thumb-icon">
                      <Icon style={{ width: '16px', height: '16px' }} />
                    </div>
                    <div className="slideshow-thumb-copy">
                      <span>{section.title}</span>
                      <small>{section.time}</small>
                    </div>
                  </button>
                );
              })}
            </aside>

            <div className="slideshow-stage">
              <div className="slideshow-progress-bar">
                <span style={{ width: `${progressPercent}%` }} />
              </div>

              {currentSlide && (
                <div key={currentSlide.id} className="slideshow-slide">
                  <div className="slideshow-slide-top">
                    <div className="slideshow-icon-wrap">
                      {CurrentSlideIcon ? <CurrentSlideIcon style={{ width: '24px', height: '24px' }} /> : null}
                    </div>
                    <div>
                      <h3>{currentSlide.title}</h3>
                      <p>{currentSlide.summary}</p>
                    </div>
                  </div>

                  <div className="slideshow-grid">
                    <div className="slideshow-step-panel">
                      <div className="slideshow-step-list">
                        {currentSlide.steps.map((step, index) => (
                          <div key={step} className="slideshow-step-item">
                            <span>{index + 1}</span>
                            <p>{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <aside className="slideshow-note-panel">
                      <div className="slideshow-note-header">
                        <ShieldCheckIcon style={{ width: '18px', height: '18px', color: 'var(--success)' }} />
                        Helpful notes
                      </div>
                      <div className="slideshow-note-list">
                        {currentSlide.tips.map(tip => (
                          <div key={tip} className="slideshow-note-item">
                            <CheckCircleIcon style={{ width: '15px', height: '15px', color: 'var(--success)', flexShrink: 0 }} />
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                      <div className="slideshow-note-badge">{currentSlide.time}</div>
                    </aside>
                  </div>

                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
