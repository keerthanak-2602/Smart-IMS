import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { api, formatDate, timeRemaining } from '../../api'
import styles from './CoursePage.module.css'

const SECTIONS = ['General','VISION-MISSION','NAME LIST','ASSIGNMENTS','ACTIVITY BASED LEARNING','NOTES','QUESTION BANK','CAT MARKS','PEC CLASS','ASSIGNMENT MARKS','SKILL RACK PROGRESS']

export default function CoursePage() {
  const { courseId } = useParams()
  const navigate     = useNavigate()
  const [course,      setCourse]      = useState(null)
  const [assignments, setAssignments] = useState([])
  const [courses,     setCourses]     = useState([])
  const [activeSection, setActiveSection] = useState('ASSIGNMENTS')
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

  if (loading) return <Layout courseNav={[]}><div className={styles.loading}>Loading course...</div></Layout>

  return (
    <Layout courseNav={courses}>
      <div className={styles.page}>
        {/* Course header */}
        <div className={styles.courseHeader}>
          <div className={styles.breadcrumb}>
            <span onClick={() => navigate('/dashboard')} className={styles.breadLink}>Dashboard</span>
            <span> / </span>
            <span className={styles.breadCurrent}>{course?.course_name}</span>
          </div>
        </div>

        <div className={styles.layout}>
          {/* Left: section nav (like real Moodle) */}
          <aside className={styles.sectionsNav}>
            <div className={styles.courseTitle}>{course?.course_name}</div>
            <div className={`${styles.sectionItem} ${activeSection === 'Grades' ? styles.sectionActive : ''}`}
              onClick={() => setActiveSection('Grades')}>
              <span>⊞</span> Grades
            </div>
            {SECTIONS.map(s => (
              <div key={s}
                className={`${styles.sectionItem} ${activeSection === s ? styles.sectionActive : ''}`}
                onClick={() => setActiveSection(s)}>
                <span>🗂</span> {s}
              </div>
            ))}
            <div className={styles.navDivider} />
            <div className={styles.sectionItem} onClick={() => navigate('/dashboard')}><span>⊞</span> Dashboard</div>
            <div className={styles.sectionItem}><span>🏠</span> Site home</div>
            <div className={styles.sectionItem}><span>📅</span> Calendar</div>
            <div className={styles.sectionItem}><span>📄</span> Private files</div>
          </aside>

          {/* Right: content area */}
          <div className={styles.content}>
            {activeSection === 'ASSIGNMENTS' ? (
              <div>
                <h2 className={styles.contentTitle}>📋 Assignments</h2>
                {assignments.length === 0 ? (
                  <div className={styles.empty}>No assignments yet for this course.</div>
                ) : (
                  <div className={styles.assignmentList}>
                    {assignments.map(a => {
                      const tr     = timeRemaining(a.deadline)
                      const status = a.submission_status || 'pending'
                      return (
                        <div key={a.id} className={styles.assignmentRow}
                          onClick={() => navigate(`/course/${courseId}/assignment/${a.id}`)}>
                          <div className={styles.assignIcon}>📝</div>
                          <div className={styles.assignInfo}>
                            <div className={styles.assignTitle}>{a.title}</div>
                            <div className={styles.assignMeta}>
                              Due: {formatDate(a.deadline)}
                              <span className={styles.dot}>•</span>
                              <span style={{ color: tr.color }}>{tr.text}</span>
                            </div>
                          </div>
                          <div className={styles.assignStatus}>
                            <span className={`badge badge-${status}`}>
                              {status === 'submitted' ? '✅ Submitted' :
                               status === 'late'      ? '⚠️ Late'     : '⏳ Pending'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.sectionPlaceholder}>
                <div className={styles.placeholderIcon}>🗂️</div>
                <h3>{activeSection}</h3>
                <p>This section has no content yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
