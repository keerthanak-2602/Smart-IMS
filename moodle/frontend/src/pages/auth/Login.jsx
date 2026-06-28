import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api'
import styles from './Login.module.css'

export default function Login() {
  const [tab,      setTab]      = useState('student')
  const [form,     setForm]     = useState({ identifier: '', password: '' })
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      let data
      if (tab === 'student') {
        data = await api('/auth/student/login', {
          method: 'POST',
          body: JSON.stringify({ register_number: form.identifier, password: form.password })
        })
      } else {
        data = await api('/auth/faculty/login', {
          method: 'POST',
          body: JSON.stringify({ email: form.identifier, password: form.password })
        })
      }
      login(data.user, data.token)
      navigate(data.user.role === 'faculty' ? '/faculty/dashboard' : '/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoRow}>
            <div className={styles.logoCircle}>RIT</div>
            <div>
              <div className={styles.sysName}>RIT Learning Management System</div>
              <div className={styles.tagline}>Rajalakshmi Institute of Technology</div>
            </div>
          </div>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'student' ? styles.activeTab : ''}`}
            onClick={() => { setTab('student'); setForm({ identifier:'', password:'' }); setError('') }}>
            👨‍🎓 Student Login
          </button>
          <button className={`${styles.tab} ${tab === 'faculty' ? styles.activeTab : ''}`}
            onClick={() => { setTab('faculty'); setForm({ identifier:'', password:'' }); setError('') }}>
            👨‍🏫 Faculty Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.group}>
            <label>{tab === 'student' ? 'Register Number' : 'Email Address'}</label>
            <input
              type={tab === 'faculty' ? 'email' : 'text'}
              placeholder={tab === 'student' ? 'e.g. 21CSR101' : 'e.g. kumar@rit.edu'}
              value={form.identifier}
              onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))}
              required autoFocus
            />
          </div>
          <div className={styles.group}>
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          {error && <div className={styles.error}>⚠️ {error}</div>}
          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className={styles.hint}>
          <strong>Demo credentials:</strong><br/>
          Student: <code>21CSR101</code> / <code>1234</code><br/>
          Faculty: <code>kumar@rit.edu</code> / <code>1234</code>
        </div>
      </div>
    </div>
  )
}
