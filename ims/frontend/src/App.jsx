import { Routes, Route, Navigate } from 'react-router-dom'
import Login          from './pages/Login'
import Layout         from './components/Layout'
import Dashboard      from './pages/Dashboard'
import DeadlineManager from './pages/DeadlineManager'
import PlaceholderPage from './pages/PlaceholderPage'

function PrivateRoute({ children }) {
  const isAuth = sessionStorage.getItem('ims_auth') === 'true'
  return isAuth ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Layout><Dashboard /></Layout>
        </PrivateRoute>
      }/>
      <Route path="/deadline-manager" element={
        <PrivateRoute>
          <Layout><DeadlineManager /></Layout>
        </PrivateRoute>
      }/>
      <Route path="/page/:name" element={
        <PrivateRoute>
          <Layout><PlaceholderPage /></Layout>
        </PrivateRoute>
      }/>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
