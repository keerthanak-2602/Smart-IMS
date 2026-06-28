import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login          from './pages/auth/Login'
import Dashboard      from './pages/student/Dashboard'
import CoursePage     from './pages/student/CoursePage'
import AssignmentPage from './pages/student/AssignmentPage'
import FacultyDashboard   from './pages/faculty/FacultyDashboard'
import FacultyCourse      from './pages/faculty/FacultyCourse'
import FacultyAssignment  from './pages/faculty/FacultyAssignment'
import CreateAssignment   from './pages/faculty/CreateAssignment'

function PrivateRoute({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />
  return children
}

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RootRedirect />} />

        {/* Student routes */}
        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        }/>
        <Route path="/course/:courseId" element={
          <PrivateRoute><CoursePage /></PrivateRoute>
        }/>
        <Route path="/course/:courseId/assignment/:assignmentId" element={
          <PrivateRoute role="student"><AssignmentPage /></PrivateRoute>
        }/>

        {/* Faculty routes */}
        <Route path="/faculty/dashboard" element={
          <PrivateRoute role="faculty"><FacultyDashboard /></PrivateRoute>
        }/>
        <Route path="/faculty/course/:courseId" element={
          <PrivateRoute role="faculty"><FacultyCourse /></PrivateRoute>
        }/>
        <Route path="/faculty/course/:courseId/assignment/new" element={
          <PrivateRoute role="faculty"><CreateAssignment /></PrivateRoute>
        }/>
        <Route path="/faculty/assignment/:assignmentId" element={
          <PrivateRoute role="faculty"><FacultyAssignment /></PrivateRoute>
        }/>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
