import { useNavigate } from 'react-router-dom'
import styles from './Topbar.module.css'

export default function Topbar({ onToggle }) {
  const navigate = useNavigate()
  const user     = JSON.parse(sessionStorage.getItem('ims_user') || '{}')

  function handleLogout() {
    sessionStorage.clear()
    navigate('/login')
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.hamburger} onClick={onToggle}>☰</button>
        <button className={styles.bell}>
          🔔 <span className={styles.badge}>3</span>
        </button>
      </div>
      <button className={styles.userBtn} onClick={handleLogout} title="Click to logout">
        👤 {user?.name || 'STUDENT'}
      </button>
    </header>
  )
}
