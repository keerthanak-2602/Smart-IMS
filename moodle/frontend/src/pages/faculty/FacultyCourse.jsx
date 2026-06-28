import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { api, formatDate, timeRemaining } from '../../api'
import styles from './FacultyCourse.module.css'

const SECTIONS = ['General','VISION-MISSION','NAME LIST','ASSIGNMENTS','NOTES','QUESTION BANK','CAT MARKS','ASSIGNMENT MARKS']

export default function FacultyCourse() {
  const { courseId } = useParams()
  const navigate     = useNavigate()
  const [course,      setCourse]      = useState(null)
  const [assignments, setAssignments] = useState([])
  const [courses,     setCourses]     = useState([])
  const [section,     setSection]     = useState('ASSIGNMENTS')
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [cRes, aRes, myRes] = await Promise.all([
          api(`/courses/${courseId}`),
          api(`/assignments/course/${courseId}`),
          api('/courses/my'),
        ])
        setCourse(cRes.data)
        setAssignments(aRes.data)
        setCourses(myRes.data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [courseId])

  if (loading) return <Layout courseNav={[]}><div className={styles.loading}>Loading...</div></Layout>

  const total     = assignments.reduce((s, a) => s + (a.total_students || 0), 0)
  const submitted = assignments.reduce((s, a) => s + (a.submitted_count || 0), 0)

  return (
    <Layout courseNav={courses}>
      <div className={styles.page}>
        <div className={styles.breadcrumb}>
          <span className={styles.link} onClick={() => navigate('/faculty/dashboard')}>Dashboard</span>
          <span> / </span>
          <span>{course?.course_name}</span>
        </div>

        <div className={styles.layout}>
          {/* Left section nav */}
          <aside className={styles.nav}>
            <div className={styles.navTitle}>{course?.course_name}</div>
            {SECTIONS.map(s => (
              <div key={s}
                className={`${styles.navItem} ${section === s ? styles.navActive : ''}`}
                onClick={() => setSection(s)}>
                <span>🗂</span> {s}
              </div>
            ))}
            <div className={styles.divider} />
            <div className={styles.navItem} onClick={() => navigate('/faculty/dashboard')}><span>⊞</span> Dashboard</div>
          </aside>

          {/* Content */}
          <div className={styles.content}>
            {section === 'ASSIGNMENTS' ? (
              <>
                <div className={styles.contentHeader}>
                  <h2>📋 Assignments</h2>
                  <button className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/faculty/course/${courseId}/assignment/new`)}>
                    + Add Assignment
                  </button>
                </div>

                {/* Summary row */}
                {assignments.length > 0 && (
                  <div className={styles.summaryRow}>
                    <div className={styles.summaryBox}>
                      <div className={styles.summaryNum}>{assignments.length}</div>
                      <div className={styles.summaryLabel}>Total Assignments</div>
                    </div>
                    <div className={styles.summaryBox}>
                      <div className={styles.summaryNum} style={{color:'var(--success)'}}>{submitted}</div>
                      <div className={styles.summaryLabel}>Submissions</div>
                    </div>
                    <div className={styles.summaryBox}>
                      <div className={styles.summaryNum} style={{color:'var(--danger)'}}>
                        {(total - submitted) > 0 ? total - submitted : 0}
                      </div>
                      <div className={styles.summaryLabel}>Pending</div>
                    </div>
                  </div>
                )}

                {assignments.length === 0 ? (
                  <div className={styles.empty}>
                    <p>No assignments yet.</p>
                    <button className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/faculty/course/${courseId}/assignment/new`)}>
                      Create First Assignment
                    </button>
                  </div>
                ) : (
                  <div className={styles.list}>
                    {assignments.map(a => {
                      const tr = timeRemaining(a.deadline)
                      return (
                        <div key={a.id} className={styles.row}
                          onClick={() => navigate(`/faculty/assignment/${a.id}`)}>
                          <div className={styles.rowIcon}>📝</div>
                          <div className={styles.rowInfo}>
                            <div className={styles.rowTitle}>{a.title}</div>
                            <div className={styles.rowMeta}>
                              Due: {formatDate(a.deadline)}
                              <span className={styles.dot}>•</span>
                              <span style={{color: tr.color}}>{tr.text}</span>
                            </div>
                          </div>
                          <div className={styles.rowStats}>
                            <span className="badge badge-success">{a.submitted_count || 0} submitted</span>
                            <span className="badge badge-danger" style={{marginLeft:'6px'}}>
                              {(a.total_students - a.submitted_count) > 0 ? a.total_students - a.submitted_count : 0} pending
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.placeholder}>
                <div style={{fontSize:'48px',marginBottom:'12px'}}>🗂️</div>
                <h3>{section}</h3>
                <p>No content yet in this section.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
