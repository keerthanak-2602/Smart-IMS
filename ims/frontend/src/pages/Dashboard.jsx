import { useEffect, useState } from 'react'
import styles from './Dashboard.module.css'

const ANNOUNCEMENTS = [
  'Internal Assessment – I scheduled for April 10–14',
  'Fee payment deadline: April 15, 2026',
  'Sports Day postponed to April 20',
]

const EVENTS = [
  'TCS On-Campus Drive – April 15, 2026',
  'AI Workshop – April 12, 2026 (Register by Apr 10)',
  'Hackathon 2026 – April 18, 2026',
]

export default function Dashboard() {
  const user    = JSON.parse(sessionStorage.getItem('ims_user') || '{}')
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    fetch(`/dashboard/${user.id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const CARDS = [
    { label: 'CGPA',               value: stats?.cgpa        ?? user?.cgpa        ?? '—',   color: '#22a861' },
    { label: 'Arrears In Hand',    value: stats?.arrears      ?? user?.arrears     ?? '0',   color: '#e8a000' },
    { label: 'Average Attendance', value: stats?.attendance   ? `${stats.attendance}%` : `${user?.attendance || 0}%`, color: '#2b9bc7' },
    { label: 'Taken Leave',        value: stats?.leaves_taken ?? user?.leaves_taken ?? '0',  color: '#c53030' },
  ]

  return (
    <div>
      {/* Welcome */}
      <div className={styles.welcomeBar}>
        <h2>Hi, welcome back!</h2>
        <p className={styles.breadcrumb}>Dashboard</p>
      </div>

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        {CARDS.map(c => (
          <div key={c.label} className={styles.statCard} style={{ background: c.color }}>
            <div className={styles.statNum}>{loading ? '...' : c.value}</div>
            <div className={styles.statLabel}>{c.label}</div>
            <div className={styles.moreInfo}>More info ➔</div>
          </div>
        ))}
      </div>

      {/* Announcements */}
      <div className={styles.infoSection}>
        <div className={styles.infoHeader}>Announcements</div>
        <div className={styles.infoBody}>
          {ANNOUNCEMENTS.map(a => <div key={a} className={styles.infoItem}>{a}</div>)}
        </div>
        <div className={styles.moreLink}>More..</div>
      </div>

      {/* Placement / Events */}
      <div className={styles.infoSection}>
        <div className={styles.infoHeader}>Placement / Events Schedule</div>
        <div className={styles.infoBody}>
          {EVENTS.map(e => <div key={e} className={styles.infoItem}>{e}</div>)}
        </div>
        <div className={styles.moreLink}>More..</div>
      </div>
    </div>
  )
}
