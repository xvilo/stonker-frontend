import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { PerformancePage } from './pages/PerformancePage'
import { MembersPage } from './pages/MembersPage'
import { SettingsPage } from './pages/SettingsPage'
import { AcceptInvitePage } from './pages/AcceptInvitePage'

export default function App() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <div className="spinner">Loading…</div>
  }

  if (status === 'anonymous') {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/invite/:token" element={<AcceptInvitePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
