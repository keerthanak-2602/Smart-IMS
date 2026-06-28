import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Layout.module.css'

export default function Layout({ children, courseNav }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  function handleLogout() { logout(); navigate('/login') }

  const isStudent = user?.role === 'student'

  return (
    <div className={styles.layout}>
      {/* Top navbar */}
      <header className={styles.topbar}>
        <div className={styles.topLeft}>
          <button className={styles.hamburger} onClick={() => setCollapsed(c => !c)}>☰</button>
          <div className={styles.brand}>
            <img src="https://upload.wikimedia.org/wikipedia/en/thumb/b/b0/Rajalakshmi_Institute_of_Technology_logo.png/120px-Rajalakshmi_Institute_of_Technology_logo.png"
              alt="RIT" className={styles.logo} onError={e => e.target.style.display='none'} />
            <span className={styles.brandName}>RIT Learning Management System</span>
          </div>
        </div>
        <div className={styles.topRight}>
          <span className={styles.bellIcon}>🔔</span>
          <span className={styles.msgIcon}>💬</span>
          <div className={styles.userMenu}>
            <span className={styles.userName}>{user?.name} {user?.register_number || ''}</span>
            <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        {/* Left sidebar */}
        <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
          <NavLink to="/dashboard" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <span>⊞</span> Dashboard
          </NavLink>
          <NavLink to="/site-home" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <span>🏠</span> Site home
          </NavLink>
          <NavLink to="/calendar" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <span>📅</span> Calendar
          </NavLink>
          {!isStudent && (
            <NavLink to="/private-files" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <span>📄</span> Private files
            </NavLink>
          )}
          <div className={styles.navSection}>MY COURSES</div>
          {courseNav?.map(c => (
            <NavLink key={c.id} to={`/course/${c.id}`}
              className={({isActive}) => `${styles.navItem} ${styles.courseItem} ${isActive ? styles.active : ''}`}>
              <span>🎓</span> {c.course_name}
            </NavLink>
          ))}
        </aside>

        {/* Main content */}
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  )
}
