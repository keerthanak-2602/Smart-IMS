import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import { Toast, useToast } from '../../components/Toast'
import { api, formatDate, timeRemaining } from '../../api'
import styles from './AssignmentPage.module.css'

export default function AssignmentPage() {
  const { courseId, assignmentId } = useParams()
  const navigate   = useNavigate()
  const { token }  = useAuth()
  const fileRef    = useRef()
  const { toast, showToast } = useToast()

  const [assignment, setAssignment] = useState(null)
  const [courses,    setCourses]    = useState([])
  const [file,       setFile]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [removing,   setRemoving]   = useState(false)

  async function load() {
    try {
      const [aRes, cRes] = await Promise.all([
        api(`/assignments/${assignmentId}`),
        api('/courses/my'),
      ])
      setAssignment(aRes.data)
      setCourses(cRes.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [assignmentId])

  async function handleSubmit() {
    if (!file) { showToast('Please select a file first', 'error'); return }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      showToast(data.status === 'late' ? 'Submitted (late)' : 'Submitted successfully! ✅')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      await load()
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove() {
    if (!confirm('Remove your submission?')) return
    setRemoving(true)
    try {
      await api(`/assignments/${assignmentId}/submission`, { method: 'DELETE' })
      showToast('Submission removed')
      await load()
    } catch (e) { showToast(e.message, 'error') }
    finally { setRemoving(false) }
  }

  if (loading) return <Layout courseNav={[]}><div className={styles.loading}>Loading...</div></Layout>
  if (!assignment) return <Layout courseNav={courses}><div className={styles.loading}>Assignment not found.</div></Layout>

  const status   = assignment.submission_status || 'pending'
  const tr       = timeRemaining(assignment.deadline)
  const isSubmitted = status === 'submitted' || status === 'late'
  const now      = new Date()
  const deadline = new Date(assignment.deadline)
  const overdue  = now > deadline

  return (
    <Layout courseNav={courses}>
      <Toast toast={toast} />
      <div className={styles.page}>

        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <span className={styles.breadLink} onClick={() => navigate('/dashboard')}>Dashboard</span>
          <span> / </span>
          <span className={styles.breadLink} onClick={() => navigate(`/course/${courseId}`)}>
            {assignment.course_name}
          </span>
          <span> / </span>
          <span>{assignment.title}</span>
        </div>

        {/* Assignment title */}
        <h1 className={styles.title}>{assignment.title}</h1>

        {/* Description */}
        {assignment.description && (
          <div className={styles.description}>
            <p>{assignment.description}</p>
          </div>
        )}

        {/* Submission status table — exact Moodle layout */}
        <div className={styles.statusTable}>
          <h2 className={styles.statusTitle}>Submission status</h2>
          <table className={styles.table}>
            <tbody>
              <tr className={isSubmitted ? styles.rowGreen : styles.rowDefault}>
                <td className={styles.label}>Submission status</td>
                <td className={styles.value}>
                  {status === 'submitted' ? 'Submitted for grading' :
                   status === 'late'      ? 'Submitted for grading (late)' :
                   'No submission'}
                </td>
              </tr>
              <tr>
                <td className={styles.label}>Grading status</td>
                <td className={styles.value}>Not graded</td>
              </tr>
              <tr>
                <td className={styles.label}>Due date</td>
                <td className={styles.value}>{formatDate(assignment.deadline)}</td>
              </tr>
              <tr className={overdue && !isSubmitted ? styles.rowRed : isSubmitted && overdue ? styles.rowRed : ''}>
                <td className={styles.label}>Time remaining</td>
                <td className={styles.value} style={{ color: tr.color }}>
                  {isSubmitted && overdue
                    ? `Assignment was submitted late`
                    : tr.text}
                </td>
              </tr>
              {assignment.submitted_at && (
                <tr>
                  <td className={styles.label}>Last modified</td>
                  <td className={styles.value}>{formatDate(assignment.submitted_at)}</td>
                </tr>
              )}
              <tr>
                <td className={styles.label}>File submissions</td>
                <td className={styles.value}>
                  {assignment.file_path ? (
                    <a href={`/uploads/${assignment.file_path}`}
                      target="_blank" rel="noreferrer"
                      className={styles.fileLink}>
                      📄 {assignment.file_path}
                    </a>
                  ) : (
                    <span className={styles.noFile}>No file submitted</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className={styles.label}>Submission comments</td>
                <td className={styles.value}>
                  <span className={styles.commentsLink}>▶ Comments (0)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* File upload area */}
        {!isSubmitted && (
          <div className={styles.uploadArea}>
            <h3 className={styles.uploadTitle}>File submission</h3>
            <div className={styles.dropzone}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]) }}>
              <div className={styles.dropIcon}>📁</div>
              <div className={styles.dropText}>
                {file ? file.name : 'Drop files here or click to upload'}
              </div>
              <div className={styles.dropHint}>
                Accepted: PDF, DOC, DOCX, ZIP, TXT, JPG, PNG (max 10MB)
              </div>
              <input ref={fileRef} type="file" hidden
                onChange={e => setFile(e.target.files[0])}
                accept=".pdf,.doc,.docx,.zip,.txt,.jpg,.png" />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className={styles.actions}>
          {!isSubmitted ? (
            <>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !file}>
                {submitting ? 'Submitting...' : 'Save changes'}
              </button>
              <button className="btn btn-secondary" onClick={() => navigate(`/course/${courseId}`)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => setFile(null)}>
                Edit submission
              </button>
              <button className="btn btn-danger" onClick={handleRemove} disabled={removing}>
                {removing ? 'Removing...' : 'Remove submission'}
              </button>
            </>
          )}
        </div>

        {isSubmitted && (
          <p className={styles.editNote}>You can still make changes to your submission.</p>
        )}

        {/* Navigation footer */}
        <div className={styles.navFooter}>
          <span className={styles.breadLink} onClick={() => navigate(`/course/${courseId}`)}>
            ← {assignment.course_name}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>Jump to...</span>
          <span className={styles.breadLink}>ABL CERTIFICATES ►</span>
        </div>
      </div>
    </Layout>
  )
}
