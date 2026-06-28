import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { api, formatDate, timeRemaining } from '../../api'
import styles from './FacultyAssignment.module.css'

export default function FacultyAssignment() {
  const { assignmentId } = useParams()
  const navigate         = useNavigate()
  const [assignment,   setAssignment]   = useState(null)
  const [submissions,  setSubmissions]  = useState([])
  const [courses,      setCourses]      = useState([])
  const [filter,       setFilter]       = useState('all')
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [aRes, sRes, cRes] = await Promise.all([
          api(`/assignments/${assignmentId}`),
          api(`/assignments/${assignmentId}/submissions`),
          api('/courses/my'),
        ])
        setAssignment(aRes.data)
        setSubmissions(sRes.data)
        setCourses(cRes.data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [assignmentId])

  if (loading) return <Layout courseNav={[]}><div className={styles.loading}>Loading...</div></Layout>
  if (!assignment) return <Layout courseNav={courses}><div className={styles.loading}>Not found.</div></Layout>

  const filtered = filter === 'all' ? submissions
    : submissions.filter(s => s.status === filter)

  const submittedCount = submissions.filter(s => s.status === 'submitted' || s.status === 'late').length
  const pendingCount   = submissions.filter(s => s.status === 'pending').length
  const lateCount      = submissions.filter(s => s.status === 'late').length
  const tr             = timeRemaining(assignment.deadline)

  return (
    <Layout courseNav={courses}>
      <div className={styles.page}>
        <div className={styles.breadcrumb}>
          <span className={styles.link} onClick={() => navigate('/faculty/dashboard')}>Dashboard</span>
          <span> / </span>
          <span className={styles.link} onClick={() => navigate(`/faculty/course/${assignment.course_id}`)}>
            {assignment.course_name}
          </span>
          <span> / </span>
          <span>{assignment.title}</span>
        </div>

        {/* Assignment info header */}
        <div className={styles.infoCard}>
          <div className={styles.infoLeft}>
            <h1 className={styles.title}>{assignment.title}</h1>
            <div className={styles.meta}>
              <span>📅 Due: {formatDate(assignment.deadline)}</span>
              <span className={styles.dot}>•</span>
              <span style={{ color: tr.color }}>{tr.text}</span>
              <span className={styles.dot}>•</span>
              <span>👨‍🏫 {assignment.faculty_name}</span>
            </div>
            {assignment.description && (
              <p className={styles.desc}>{assignment.description}</p>
            )}
          </div>
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <div className={styles.statNum}>{submissions.length}</div>
              <div className={styles.statLabel}>Total Students</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum} style={{color:'var(--success)'}}>{submittedCount}</div>
              <div className={styles.statLabel}>Submitted</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum} style={{color:'var(--danger)'}}>{pendingCount}</div>
              <div className={styles.statLabel}>Pending</div>
            </div>
            {lateCount > 0 && (
              <div className={styles.stat}>
                <div className={styles.statNum} style={{color:'var(--warning)'}}>{lateCount}</div>
                <div className={styles.statLabel}>Late</div>
              </div>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className={styles.filterTabs}>
          {['all','submitted','pending','late'].map(f => (
            <button key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}>
              {f === 'all' ? `All (${submissions.length})` :
               f === 'submitted' ? `Submitted (${submittedCount})` :
               f === 'pending'   ? `Pending (${pendingCount})` :
               `Late (${lateCount})`}
            </button>
          ))}
        </div>

        {/* Submissions table */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Student Name</th>
                <th>Register No</th>
                <th>Department</th>
                <th>Status</th>
                <th>Submitted At</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className={styles.emptyRow}>No records found.</td></tr>
              ) : (
                filtered.map((s, i) => (
                  <tr key={s.student_id} className={styles.row}>
                    <td className={styles.num}>{i + 1}</td>
                    <td className={styles.name}>{s.student_name}</td>
                    <td><code className={styles.regNo}>{s.register_number}</code></td>
                    <td className={styles.dept}>{s.department}</td>
                    <td>
                      <span className={`badge badge-${s.status}`}>
                        {s.status === 'submitted' ? '✅ Submitted' :
                         s.status === 'late'      ? '⚠️ Late'     : '❌ Pending'}
                      </span>
                    </td>
                    <td className={styles.date}>
                      {s.submitted_at ? formatDate(s.submitted_at) : '—'}
                    </td>
                    <td>
                      {s.file_path ? (
                        <a href={`/uploads/${s.file_path}`} target="_blank" rel="noreferrer"
                          className={styles.fileLink}>
                          📄 Download
                        </a>
                      ) : <span className={styles.noFile}>—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
