import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './components/ui/Toast'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import { ReceiptsPage } from './pages/ReceiptsPage'
import { TransfersPage } from './pages/TransfersPage'
import { DeliveriesPage } from './pages/DeliveriesPage'
import { AdjustmentsPage } from './pages/AdjustmentsPage'
import { DocumentDetailPage } from './pages/DocumentDetailPage'
import { LedgerPage } from './pages/LedgerPage'
import { WarehousesPage } from './pages/WarehousesPage'
import { AlertsPage } from './pages/AlertsPage'
import { SettingsPage } from './pages/SettingsPage'
import { ProfilePage } from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import { SupabaseConnectPage } from './pages/SupabaseConnectPage'

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Supabase project connection — shown before auth */}
            <Route path="/connect" element={<SupabaseConnectPage />} />

            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected Application Routes inside AppShell Layout */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/products/:id" element={<ProductDetailPage />} />

                      {/* Operations canonical routes */}
                      <Route path="/operations/receipts" element={<ReceiptsPage />} />
                      <Route path="/operations/deliveries" element={<DeliveriesPage />} />
                      <Route path="/operations/transfers" element={<TransfersPage />} />
                      <Route path="/operations/adjustments" element={<AdjustmentsPage />} />
                      <Route path="/operations/ledger" element={<LedgerPage />} />

                      {/* Operations alias routes */}
                      <Route path="/receipts" element={<ReceiptsPage />} />
                      <Route path="/deliveries" element={<DeliveriesPage />} />
                      <Route path="/transfers" element={<TransfersPage />} />
                      <Route path="/adjustments" element={<AdjustmentsPage />} />
                      <Route path="/ledger" element={<LedgerPage />} />
                      <Route path="/movements" element={<LedgerPage />} />

                      <Route path="/documents/:id" element={<DocumentDetailPage />} />
                      <Route path="/warehouses" element={<WarehousesPage />} />
                      <Route path="/alerts" element={<AlertsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/profile" element={<ProfilePage />} />

                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </AppShell>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  )
}
