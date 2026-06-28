const BASE = ''  // uses Vite proxy

export async function api(path, options = {}) {
  const token = localStorage.getItem('moodle_token')
  const headers = { ...(options.headers || {}) }

  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(BASE + path, { ...options, headers })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Request failed')
  return data
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export function timeRemaining(deadlineStr) {
  const diff = new Date(deadlineStr) - new Date()
  if (diff < 0) return { text: 'Overdue', color: '#dc3545', urgent: true }
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return { text: `${hours}h remaining`, color: '#dc3545', urgent: true }
  const days = Math.floor(hours / 24)
  if (days <= 3) return { text: `${days} day(s) remaining`, color: '#ffc107', urgent: false }
  return { text: `${days} days remaining`, color: '#28a745', urgent: false }
}
