import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import OfflineBanner from './components/common/OfflineBanner';
import { Spinner } from './components/common';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CranesPage = lazy(() => import('./pages/CranesPage'));
const CraneDetailPage = lazy(() => import('./pages/CraneDetailPage'));
const CounterweightsPage = lazy(() => import('./pages/CounterweightsPage'));
const BoomSectionsPage = lazy(() => import('./pages/BoomSectionsPage'));
const HooksPage = lazy(() => import('./pages/HooksPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const CreateTransactionPage = lazy(() => import('./pages/CreateTransactionPage'));
const TransactionDetailPage = lazy(() => import('./pages/TransactionDetailPage'));
const TransactionCalendarPage = lazy(() => import('./pages/TransactionCalendarPage'));
const PublicTransactionPage = lazy(() => import('./pages/PublicTransactionPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const TutorialsPage = lazy(() => import('./pages/TutorialsPage'));
const MobileBlockedPage = lazy(() => import('./pages/MobileBlockedPage'));

const PageLoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    minHeight: '50vh',
    padding: '24px',
    background: 'transparent',
  }}>
    <Spinner size="lg" />
  </div>
);

const isMobileBrowser = () => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;

  const userAgent = (navigator.userAgent || '').toLowerCase();
  const platform = (navigator.platform || '').toLowerCase();
  const userAgentData = navigator.userAgentData;
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const isTouchDevice = maxTouchPoints > 1 || (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches);
  const viewportWidth = window.innerWidth || 0;
  const viewportHeight = window.innerHeight || 0;
  const isSmallViewport = viewportWidth > 0 && viewportHeight > 0 && viewportWidth <= 1280 && viewportHeight <= 1600;

  if (userAgentData?.mobile !== undefined) {
    return userAgentData.mobile;
  }

  return /(android|iphone|ipad|ipod|mobile)/i.test(userAgent)
    || /(android|iphone|ipad|ipod)/i.test(platform)
    || (isTouchDevice && isSmallViewport);
};

const MobileRestrictedRoute = ({ children }) => {
  if (isMobileBrowser()) {
    return <MobileBlockedPage />;
  }

  return children;
};

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();

  if (isMobileBrowser()) {
    return <MobileBlockedPage />;
  }

  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          containerStyle={{ marginTop: '70px' }}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              boxShadow: 'var(--shadow-lg)',
              fontSize: '13px',
              fontWeight: 500,
              padding: '10px 14px',
            },
            success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--surface)' }, duration: 3500 },
            error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--surface)' }, duration: 6000 },
            // custom types
            warning: { icon: '⚠️', duration: 5000 },
            info: { icon: 'ℹ️', duration: 4500 },
          }}
        />
        <OfflineBanner />
        <Routes>
          {/* Public Routes */}
          <Route path="/public/transactions/:id" element={<Suspense fallback={<PageLoadingFallback />}><PublicTransactionPage /></Suspense>} />
            
          {/* Auth */}
          <Route path="/login" element={<Suspense fallback={<PageLoadingFallback />}><MobileRestrictedRoute><LoginPage /></MobileRestrictedRoute></Suspense>} />
            
          {/* Private Routes */}
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Suspense fallback={<PageLoadingFallback />}><DashboardPage /></Suspense>} />
            <Route path="cranes" element={<Suspense fallback={null}><CranesPage /></Suspense>} />
            <Route path="cranes/:id" element={<Suspense fallback={<PageLoadingFallback />}><CraneDetailPage /></Suspense>} />
            <Route path="counterweights" element={<Suspense fallback={null}><CounterweightsPage /></Suspense>} />
            <Route path="boom-sections" element={<Suspense fallback={null}><BoomSectionsPage /></Suspense>} />
            <Route path="hooks" element={<Suspense fallback={null}><HooksPage /></Suspense>} />
            <Route path="transactions" element={<Suspense fallback={null}><TransactionsPage /></Suspense>} />
            <Route path="transactions/calendar" element={<Suspense fallback={null}><TransactionCalendarPage /></Suspense>} />
            <Route path="transactions/create" element={<Suspense fallback={<PageLoadingFallback />}><CreateTransactionPage /></Suspense>} />
            <Route path="transactions/:id" element={<Suspense fallback={<PageLoadingFallback />}><TransactionDetailPage /></Suspense>} />
            <Route path="tutorials" element={<Suspense fallback={<PageLoadingFallback />}><TutorialsPage /></Suspense>} />
            <Route path="reports" element={<Suspense fallback={<PageLoadingFallback />}><ReportsPage /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<PageLoadingFallback />}><SettingsPage /></Suspense>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
