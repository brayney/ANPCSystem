import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';

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
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="cranes" element={<CranesPage />} />
            <Route path="cranes/:id" element={<CraneDetailPage />} />
            <Route path="counterweights" element={<CounterweightsPage />} />
            <Route path="boom-sections" element={<BoomSectionsPage />} />
            <Route path="hooks" element={<HooksPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="transactions/create" element={<CreateTransactionPage />} />
            <Route path="transactions/:id" element={<TransactionDetailPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
