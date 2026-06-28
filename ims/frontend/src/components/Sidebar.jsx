import { useNavigate, useLocation } from 'react-router-dom'
import styles from './Sidebar.module.css'

const NAV = [
  { icon: '⊞',  label: 'Dashboard',              path: '/dashboard' },
  { icon: '📅', label: 'My Time Table',           path: '/page/timetable' },
  { icon: '📚', label: 'My Subject Registration', path: '/page/subjects' },
  { icon: '📝', label: 'Apply Leave / OD',         path: '/page/leave' },
  { icon: '👤', label: 'Attendance',               path: '/page/attendance' },
  { icon: '🪪', label: 'Apply Certificates',       path: '/page/certificates' },
  { icon: '✏️', label: 'CAT Mark',                 path: '/page/cat' },
  { icon: '🔬', label: 'LAB Mark',                 path: '/page/lab' },
  { icon: '📋', label: 'Assignment Mark',          path: '/page/assignment-mark' },
  { icon: '📊', label: 'Grade Book',               path: '/page/grades' },
  { icon: '💰', label: 'Academic Fee',              path: '/page/fee' },
  { icon: '💬', label: 'Feedbacks',                path: '/page/feedback' },
  { icon: '🎓', label: 'Class Committee',          path: '/page/committee' },
  { icon: '📄', label: 'No Due Request',           path: '/page/nodue' },
  { icon: '✉️', label: 'Messages',                 path: '/page/messages' },
  { icon: '🔑', label: 'Change Password',          path: '/page/password' },
]

export default function Sidebar({ collapsed }) {
  const navigate      = useNavigate()
  const { pathname }  = useLocation()
  const user          = JSON.parse(sessionStorage.getItem('ims_user') || '{}')

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoCircle}>RIT</div>
        <div className={styles.logoText}>
          <strong>Rajalakshmi IT</strong>
          <span>Believe in the Possibilities</span>
          <em>AN AUTONOMOUS INSTITUTION</em>
        </div>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV.map(item => (
          <div key={item.path}
            className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
            onClick={() => navigate(item.path)}>
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Deadline Manager CTA */}
      <div className={styles.footer}>
        <button
          className={`${styles.deadlineBtn} ${pathname === '/deadline-manager' ? styles.deadlineActive : ''}`}
          onClick={() => navigate('/deadline-manager')}>
           Deadline Manager
        </button>
      </div>
    </aside>
  )
}
