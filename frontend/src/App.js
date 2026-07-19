import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import OfflineBanner from './components/common/OfflineBanner';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CranesPage from './pages/CranesPage';
import CraneDetailPage from './pages/CraneDetailPage';
import CounterweightsPage from './pages/CounterweightsPage';
import BoomSectionsPage from './pages/BoomSectionsPage';
import HooksPage from './pages/HooksPage';
import TransactionsPage from './pages/TransactionsPage';
import CreateTransactionPage from './pages/CreateTransactionPage';
import TransactionDetailPage from './pages/TransactionDetailPage';
import TransactionCalendarPage from './pages/TransactionCalendarPage';
import PublicTransactionPage from './pages/PublicTransactionPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import TutorialsPage from './pages/TutorialsPage';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
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
            success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--surface)' } },
            error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--surface)' } },
          }}
        />
        <OfflineBanner />
        <Routes>
          {/* Public Routes */}
          <Route path="/public/transactions/:id" element={<PublicTransactionPage />} />
           
          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
           
          {/* Private Routes */}
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="cranes" element={<CranesPage />} />
            <Route path="cranes/:id" element={<CraneDetailPage />} />
            <Route path="counterweights" element={<CounterweightsPage />} />
            <Route path="boom-sections" element={<BoomSectionsPage />} />
            <Route path="hooks" element={<HooksPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="transactions/calendar" element={<TransactionCalendarPage />} />
            <Route path="transactions/create" element={<CreateTransactionPage />} />
            <Route path="transactions/:id" element={<TransactionDetailPage />} />
            <Route path="tutorials" element={<TutorialsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
