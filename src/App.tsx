import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Shell from './components/Shell'
import MetricsPage from './pages/MetricsPage'
import UsersPage from './pages/UsersPage'
import UserDetailPage from './pages/UserDetailPage'
import VerificationRequestsPage from './pages/VerificationRequestsPage'
import ReportedReviewsPage from './pages/ReportedReviewsPage'
import RequireAuth from './components/RequireAuth'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/metrics" replace />} />
        <Route path="metrics" element={<MetricsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="verification" element={<VerificationRequestsPage />} />
        <Route path="reviews/reported" element={<ReportedReviewsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

