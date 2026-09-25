import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { FilesPage } from './pages/FilesPage'
import { LoginPage } from './pages/LoginPage'
import { SharedLinkPage } from './pages/SharedLinkPage'
import { SharedWithMePage } from './pages/SharedWithMePage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const location = useLocation()
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/s/:token" element={<SharedLinkPage />} />
      <Route
        path="/files"
        element={<ProtectedRoute><FilesPage /></ProtectedRoute>}
      />
      <Route
        path="/files/shared"
        element={<ProtectedRoute><SharedWithMePage /></ProtectedRoute>}
      />
      <Route
        path="/files/:folderId"
        element={<ProtectedRoute><FilesPage /></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to="/files" replace />} />
    </Routes>
  )
}
