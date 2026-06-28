import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import { api, timeRemaining } from '../../api'
import styles from './Dashboard.module.css'

const CARD_COLORS = [
  'linear-gradient(135deg,#28a745,#20c997)',
  'linear-gradient(135deg,#e83e8c,#fd7e14)',
  'linear-gradient(135deg,#007bff,#6610f2)',
  'linear-gradient(135deg,#fd7e14,#ffc107)',
  'linear-gradient(135deg,#17a2b8,#007bff)',
  'linear-gradient(135deg,#6f42c1,#e83e8c)',
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [courses,  setCourses]  = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [cData, aData] = await Promise.all([
          api('/courses/my'),
          api('/assignments/student/all'),
        ])
        setCourses(cData.data)
        setUpcoming(aData.data.filter(a => a.submission_status !== 'submitted').slice(0, 5))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const now = new Date()
  const month = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1

  const deadlineDates = upcoming.map(a => new Date(a.deadline).getDate())

  return (
    <Layout courseNav={courses}>
      <div className={styles.page}>

        {/* Welcome */}
        <div className={styles.welcomeBar}>
          <div>
            <h1 className={styles.welcome}>Welcome back, {user?.name}!</h1>
            <p className={styles.sub}>{user?.department} • {user?.register_number}</p>
          </div>
          <div className={styles.customiseBtn}>Customise this page</div>
        </div>

        <div className={styles.grid}>
          <div className={styles.left}>

            {/* Course overview */}
            <section>
              <div className={styles.sectionHeader}>
                <h2>Course overview</h2>
                <select className={styles.filterSelect}>
                  <option>All (except removed from view)</option>
                </select>
              </div>

              {loading ? (
                <div className={styles.loading}>Loading courses...</div>
              ) : courses.length === 0 ? (
                <div className={styles.empty}>No courses enrolled yet.</div>
              ) : (
                <div className={styles.courseCards}>
                  {courses.map((c, i) => (
                    <div key={c.id} className={styles.courseCard}
                      onClick={() => navigate(`/course/${c.id}`)}>
                      <div className={styles.courseThumb}
                        style={{ background: CARD_COLORS[i % CARD_COLORS.length] }}>
                        <div className={styles.thumbPattern} />
                      </div>
                      <div className={styles.courseInfo}>
                        <div className={styles.courseSection}>{c.department_name || 'Common'}</div>
                        <div className={styles.courseName}>{c.course_name}</div>
                        {c.assignment_count > 0 && (
                          <div className={styles.assignmentCount}>
                            📋 {c.assignment_count} assignment(s)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className={styles.right}>
            {/* Upcoming deadlines */}
            <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
              <h3 className={styles.widgetTitle}>⏰ Upcoming Deadlines</h3>
              {upcoming.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No pending assignments</p>
              ) : (
                upcoming.map(a => {
                  const tr = timeRemaining(a.deadline)
                  return (
                    <div key={a.id} className={styles.deadlineItem}
                      onClick={() => navigate(`/course/${a.course_id}/assignment/${a.id}`)}>
                      <div className={styles.deadlineName}>{a.title}</div>
                      <div className={styles.deadlineCourse}>{a.course_name}</div>
                      <div className={styles.deadlineTime} style={{ color: tr.color }}>
                        {tr.text}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Mini Calendar */}
            <div className="card" style={{ padding: '16px' }}>
              <h3 className={styles.widgetTitle}>📅 Calendar — {month}</h3>
              <div className={styles.miniCal}>
                {['M','T','W','T','F','S','S'].map((d,i) => (
                  <div key={i} className={styles.calHead}>{d}</div>
                ))}
                {Array.from({length: offset}).map((_,i) => <div key={`e${i}`} />)}
                {Array.from({length: daysInMonth}, (_,i) => i+1).map(d => (
                  <div key={d} className={`${styles.calDay}
                    ${d === now.getDate() ? styles.calToday : ''}
                    ${deadlineDates.includes(d) ? styles.calDeadline : ''}`}>
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
