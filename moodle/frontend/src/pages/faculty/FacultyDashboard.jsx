import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import { api } from '../../api'
import styles from './FacultyDashboard.module.css'

const CARD_COLORS = [
  'linear-gradient(135deg,#4b2d8a,#6c4db8)',
  'linear-gradient(135deg,#17a2b8,#007bff)',
  'linear-gradient(135deg,#28a745,#20c997)',
  'linear-gradient(135deg,#fd7e14,#ffc107)',
  'linear-gradient(135deg,#e83e8c,#fd7e14)',
  'linear-gradient(135deg,#6f42c1,#e83e8c)',
]

export default function FacultyDashboard() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [courses,  setCourses]  = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    api('/courses/my')
      .then(d => setCourses(d.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout courseNav={courses}>
      <div className={styles.page}>
        <div className={styles.welcomeBar}>
          <div>
            <h1>Welcome, {user?.name}!</h1>
            <p className={styles.sub}>{user?.department} • Faculty</p>
          </div>
          <div className={styles.customise}>Customise this page</div>
        </div>

        <div className={styles.grid}>
          <div className={styles.left}>
            <div className={styles.sectionHeader}>
              <h2>Course overview</h2>
            </div>

            {loading ? (
              <div className={styles.loading}>Loading courses...</div>
            ) : courses.length === 0 ? (
              <div className={styles.empty}>No courses assigned yet.</div>
            ) : (
              <div className={styles.courseCards}>
                {courses.map((c, i) => (
                  <div key={c.id} className={styles.card}
                    onClick={() => navigate(`/faculty/course/${c.id}`)}>
                    <div className={styles.thumb} style={{ background: CARD_COLORS[i % CARD_COLORS.length] }}>
                      <div className={styles.thumbOverlay} />
                    </div>
                    <div className={styles.info}>
                      <div className={styles.dept}>{c.department_name || 'Common'}</div>
                      <div className={styles.name}>{c.course_name}</div>
                      <div className={styles.meta}>
                        📋 {c.assignment_count || 0} assignment(s)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.right}>
            <div className="card" style={{ padding: '16px' }}>
              <h3 className={styles.widgetTitle}>📊 Quick Stats</h3>
              <div className={styles.stat}>
                <span>Courses</span>
                <strong>{courses.length}</strong>
              </div>
              <div className={styles.stat}>
                <span>Total Assignments</span>
                <strong>{courses.reduce((s, c) => s + (c.assignment_count || 0), 0)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
