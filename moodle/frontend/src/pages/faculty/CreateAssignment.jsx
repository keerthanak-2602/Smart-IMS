import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { Toast, useToast } from '../../components/Toast'
import { api } from '../../api'
import styles from './CreateAssignment.module.css'

export default function CreateAssignment() {
  const { courseId } = useParams()
  const navigate     = useNavigate()
  const { toast, showToast } = useToast()
  const [courses,  setCourses]  = useState([])
  const [course,   setCourse]   = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', deadline: '', moodle_link: ''
  })

  useEffect(() => {
    Promise.all([api('/courses/my'), api(`/courses/${courseId}`)])
      .then(([c, single]) => { setCourses(c.data); setCourse(single.data) })
      .catch(console.error)
  }, [courseId])

  function change(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title || !form.deadline) {
      showToast('Title and deadline are required', 'error'); return
    }
    setSaving(true)
    try {
      const data = await api('/assignments', {
        method: 'POST',
        body: JSON.stringify({ course_id: courseId, ...form })
      })
      showToast(`Assignment created! ${data.message}`)
      setTimeout(() => navigate(`/faculty/course/${courseId}`), 1500)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout courseNav={courses}>
      <Toast toast={toast} />
      <div className={styles.page}>
        <div className={styles.breadcrumb}>
          <span className={styles.link} onClick={() => navigate('/faculty/dashboard')}>Dashboard</span>
          <span> / </span>
          <span className={styles.link} onClick={() => navigate(`/faculty/course/${courseId}`)}>
            {course?.course_name}
          </span>
          <span> / </span>
          <span>Add Assignment</span>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1>📝 Add New Assignment</h1>
            <p>Course: <strong>{course?.course_name}</strong></p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.group}>
              <label>Assignment Title <span className={styles.req}>*</span></label>
              <input type="text" placeholder="e.g. DBMS Assignment 1 — Normalization"
                value={form.title} onChange={e => change('title', e.target.value)} required />
            </div>

            <div className={styles.group}>
              <label>Description / Instructions</label>
              <textarea rows={5} placeholder="Describe the assignment requirements, submission format, etc."
                value={form.description} onChange={e => change('description', e.target.value)} />
            </div>

            <div className={styles.row2}>
              <div className={styles.group}>
                <label>Deadline <span className={styles.req}>*</span></label>
                <input type="datetime-local"
                  value={form.deadline} onChange={e => change('deadline', e.target.value)} required />
              </div>
              <div className={styles.group}>
                <label>Moodle Link (optional)</label>
                <input type="url" placeholder="https://moodle.rit.edu/..."
                  value={form.moodle_link} onChange={e => change('moodle_link', e.target.value)} />
              </div>
            </div>

            <div className={styles.infoBox}>
              ℹ️ After creating, pending submission rows will be <strong>automatically created</strong> for all students enrolled in this course.
            </div>

            <div className={styles.actions}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '⏳ Saving...' : '✅ Save Assignment'}
              </button>
              <button type="button" className="btn btn-secondary"
                onClick={() => navigate(`/faculty/course/${courseId}`)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
