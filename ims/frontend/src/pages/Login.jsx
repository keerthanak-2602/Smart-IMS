import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Login.module.css'

export default function Login() {
  const [registerNumber, setRegisterNumber] = useState('')
  const [password,       setPassword]       = useState('')
  const [error,          setError]          = useState('')
  const [loading,        setLoading]        = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res  = await fetch('/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ register_number: registerNumber, password }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      sessionStorage.setItem('ims_auth', 'true')
      sessionStorage.setItem('ims_user', JSON.stringify(data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoArea}>
          <div className={styles.circle}>RIT</div>
          <h2>Rajalakshmi Institute of Technology</h2>
          <p>Institute Management System</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className={styles.group}>
            <label>REGISTER NUMBER</label>
            <input
              type="text"
              placeholder="e.g. 21CSR101"
              value={registerNumber}
              onChange={e => setRegisterNumber(e.target.value)}
              autoFocus required
            />
          </div>
          <div className={styles.group}>
            <label>PASSWORD</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>
        </form>
        <p className={styles.hint}>Demo: <strong>21CSR101</strong> / <strong>1234</strong></p>
      </div>
    </div>
  )
}
