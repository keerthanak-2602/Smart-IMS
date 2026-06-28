import { useState, useEffect } from 'react'
import styles from './DeadlineManager.module.css'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MOODLE_URL    = 'http://localhost:3001'
const IMS_API       = ''          // uses Vite proxy → port 5000
const EMAIL_API     = 'http://localhost:5002'  // direct → port 5002

// ─── FIX 3: Parse date string as LOCAL date (not UTC) ─────────────────────────
// "2026-04-22" parsed with new Date() becomes April 21 in UTC+5:30
// This function returns the correct local date
function parseLocalDate(dateStr) {
  if (!dateStr) return null
  // Take only first 10 chars — handles both "2026-04-18 23:59:00" and "2026-04-22"
  const datePart = String(dateStr).slice(0, 10)
  const parts = datePart.split('-')
  if (parts.length !== 3) return null
  const year  = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const day   = parseInt(parts[2], 10)
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null
  return new Date(year, month - 1, day)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = parseLocalDate(dateStr)
  if (!d || isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  })
}

function dateToString(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function urgencyClass(deadlineStr) {
  if (!deadlineStr) return styles.evGreen
  const d = parseLocalDate(deadlineStr)
  if (!d) return styles.evGreen
  const diff = (d - new Date()) / 3600000
  if (diff <= 24) return styles.evRed
  if (diff <= 72) return styles.evYellow
  return styles.evGreen
}

export default function DeadlineManager() {
  const today = new Date()
  const user  = JSON.parse(sessionStorage.getItem('ims_user') || '{}')

  const [year,          setYear]          = useState(today.getFullYear())
  const [month,         setMonth]         = useState(today.getMonth())
  const [mode,          setMode]          = useState('academic')
  const [modal,         setModal]         = useState(null)
  const [assignments,   setAssignments]   = useState([])
  const [events,        setEvents]        = useState([])
  const [loading,       setLoading]       = useState(true)
  const [fetching,      setFetching]      = useState(false)
  const [remindLoading, setRemindLoading] = useState(false)
  const [toast,         setToast]         = useState(null)

  useEffect(() => { loadData() }, [])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function loadData() {
    setLoading(true)
    try {
      const promises = [fetch(`${IMS_API}/events`).then(r => r.json())]
      if (user?.id) {
        promises.push(fetch(`${IMS_API}/assignments?student_id=${user.id}`).then(r => r.json()))
      }
      const [eData, aData] = await Promise.all(promises)
      if (eData?.success) setEvents(eData.data)
      if (aData?.success) setAssignments(aData.data)
    } catch (err) {
      console.error('loadData error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ─── FIX 1: Correct API call to email service on port 5002 ──────────────────
  async function handleRemindMe(event) {
    setRemindLoading(true)
    try {
      const res = await fetch(`${EMAIL_API}/events/remind/${event.id}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Server error ${res.status}: ${text}`)
      }

      const data = await res.json()

      if (data.success) {
        // Update local state so UI reflects immediately
        setEvents(prev =>
          prev.map(e => e.id === event.id
            ? { ...e, remind: true, reminder_date: data.reminder_date }
            : e
          )
        )
        // Update modal data too
        setModal(prev => prev
          ? { ...prev, data: { ...prev.data, remind: true, reminder_date: data.reminder_date } }
          : null
        )
        showToast(`🔔 Reminder set! You will receive a WhatsApp reminder on ${formatDate(data.reminder_date)} (2 days before the event).`)
      } else {
        throw new Error(data.error || 'Failed to set reminder')
      }
    } catch (err) {
      console.error('Remind error:', err)
      if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
        showToast('❌ Could not connect to email service. Make sure it is running on port 5002.', 'error')
      } else {
        showToast('❌ ' + err.message, 'error')
      }
    } finally {
      setRemindLoading(false)
    }
  }

  async function handleCancelReminder(event) {
    try {
      const res  = await fetch(`${EMAIL_API}/events/remind/${event.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setEvents(prev => prev.map(e => e.id === event.id ? { ...e, remind: false, reminder_date: null } : e))
        setModal(prev => prev
          ? { ...prev, data: { ...prev.data, remind: false, reminder_date: null } }
          : null
        )
        showToast('🔕 Reminder cancelled.')
      }
    } catch (err) {
      showToast('❌ Could not cancel reminder.', 'error')
    }
  }

  async function fetchEmailEvents() {
    setFetching(true)
    try {
      const res  = await fetch(`${EMAIL_API}/emails/fetch`)
      const data = await res.json()
      if (data.success) {
        showToast(`✅ Fetched ${data.summary.emailsProcessed} emails. ${data.summary.eventsInserted} new event(s) added.`)
        await loadData()
      } else {
        showToast('❌ ' + (data.error || 'Fetch failed'), 'error')
      }
    } catch (err) {
      showToast('❌ Could not connect to email service (port 5002).', 'error')
    } finally {
      setFetching(false)
    }
  }

  async function handleMarkSubmitted(assignment) {
    try {
      await fetch(`${IMS_API}/assignments/mark-submitted`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ student_id: user.id, assignment_id: assignment.id }),
      })
      setAssignments(prev => prev.map(a => a.id === assignment.id ? { ...a, status: 'submitted' } : a))
      setModal(null)
      showToast('✅ Assignment marked as submitted!')
    } catch (err) {
      showToast('❌ Failed to mark submitted.', 'error')
    }
  }

  function openMoodle(assignment) {
    const url = assignment.moodleRedirect ||
      `${MOODLE_URL}/course/${assignment.course_id}/assignment/${assignment.id}`
    window.open(url, '_blank')
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const firstDay    = new Date(year, month, 1).getDay()
  const offset      = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr    = dateToString(today)

  function cellDateStr(d) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

  // ─── FIX 3: Compare dates as strings (YYYY-MM-DD) to avoid timezone issues ──
  function cellItems(d) {
  const ds = cellDateStr(d)   // e.g. "2026-04-22"

  if (mode === 'academic') {
    return assignments.filter(a => {
      if (!a.deadline) return false
      return String(a.deadline).slice(0, 10) === ds
    })
  }

  return events.filter(e => {
    if (!e.date) return false
    // Force to string first, then slice — handles Date objects and strings equally
    const eventDate = String(e.date).slice(0, 10)
    return eventDate === ds
  })
}

  const pendingCount   = assignments.filter(a => a.status === 'pending').length
  const submittedCount = assignments.filter(a => a.status === 'submitted' || a.status === 'late').length
  const remindCount    = events.filter(e => e.remind).length

  return (
    <div className={styles.wrap}>

      {/* Toast notification */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>🔥 Deadline Manager</h2>
          <p className={styles.sub}>
            {user?.name} • {user?.department}
            {mode === 'event' && ' • Events are same for all students'}
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.toggle}>
            <button className={mode === 'academic' ? styles.toggleActive : ''} onClick={() => setMode('academic')}>Academic</button>
            <button className={mode === 'event'    ? styles.toggleActive : ''} onClick={() => setMode('event')}>Events</button>
          </div>
          {mode === 'event' && (
            <button className={styles.fetchBtn} onClick={fetchEmailEvents} disabled={fetching}>
              {fetching ? '⏳ Fetching...' : '📧 Fetch Emails'}
            </button>
          )}
        </div>
      </div>

      {/* Summary strip */}
      {!loading && (
        <div className={styles.summaryStrip}>
          {mode === 'academic' ? (
            <>
              <span className={styles.summaryItem}>📋 Total: <strong>{assignments.length}</strong></span>
              <span className={styles.summaryItem}>⏳ Pending: <strong style={{ color: '#c53030' }}>{pendingCount}</strong></span>
              <span className={styles.summaryItem}>✅ Submitted: <strong style={{ color: '#22a861' }}>{submittedCount}</strong></span>
            </>
          ) : (
            <>
              <span className={styles.summaryItem}>📅 Events: <strong>{events.length}</strong></span>
              <span className={styles.summaryItem}>🔔 Reminders: <strong style={{ color: '#7c3aed' }}>{remindCount}</strong></span>
              <span className={styles.summaryItem} style={{ fontSize: '11px', color: '#64748b' }}>
                Auto-fetched from college emails every hour
              </span>
            </>
          )}
        </div>
      )}

      {/* Calendar nav */}
      <div className={styles.calNav}>
        <button className={styles.navBtn} onClick={prevMonth}>‹ Prev</button>
        <h3>{MONTHS[month]} {year}</h3>
        <button className={styles.navBtn} onClick={nextMonth}>Next ›</button>
      </div>

      {/* Calendar grid */}
      <div className={styles.calGrid}>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
          <div key={d} className={styles.dayName}>{d}</div>
        ))}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`e${i}`} className={`${styles.cell} ${styles.empty}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
          const ds    = cellDateStr(d)
          const items = cellItems(d)
          return (
            <div key={d} className={`${styles.cell} ${ds === todayStr ? styles.today : ''}`}>
              <div className={`${styles.dateNum} ${ds === todayStr ? styles.todayNum : ''}`}>{d}</div>
              {items.map((item, idx) => {
                if (mode === 'academic') {
                  return (
                    <div key={idx}
                      className={`${styles.tag} ${item.status === 'submitted' ? styles.evSubmitted : urgencyClass(item.deadline)}`}
                      onClick={() => setModal({ type: 'assignment', data: item })}
                      title={item.title}>
                      {item.status === 'submitted' ? '✅ ' : ''}{item.title}
                    </div>
                  )
                }
                return (
                  <div key={idx}
                    className={`${styles.tag} ${item.remind ? styles.evReminded : styles.evBlue}`}
                    onClick={() => setModal({ type: 'event', data: item })}
                    title={item.title}>
                    {item.remind ? '🔔 ' : '📅 '}{item.title}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {mode === 'academic' ? (
          <>
            <span><span className={`${styles.swatch} ${styles.evRed}`}/>Due within 24h</span>
            <span><span className={`${styles.swatch} ${styles.evYellow}`}/>Due in 3 days</span>
            <span><span className={`${styles.swatch} ${styles.evGreen}`}/>Normal</span>
            <span><span className={`${styles.swatch} ${styles.evSubmitted}`}/>Submitted</span>
          </>
        ) : (
          <>
            <span><span className={`${styles.swatch} ${styles.evBlue}`}/>Event</span>
            <span><span className={`${styles.swatch} ${styles.evReminded}`}/>Reminder Set</span>
          </>
        )}
      </div>

      {loading && <div className={styles.loadingBar}>Loading your data...</div>}

      {/* ── Assignment Modal ─────────────────────────────────────── */}
      {modal?.type === 'assignment' && (() => {
        const a           = modal.data
        const isSubmitted = a.status === 'submitted' || a.status === 'late'
        return (
          <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
            <div className={styles.modal}>
              <button className={styles.closeBtn} onClick={() => setModal(null)}>✕</button>
              <h3 className={styles.modalTitle}>{a.title}</h3>
              <p className={styles.modalSub}>{a.subject}</p>
              <div className={styles.modalRows}>
                <div className={styles.modalRow}>
                  <span>Deadline</span>
                  <span>{formatDate(a.deadline)}</span>
                </div>
                <div className={styles.modalRow}>
                  <span>Status</span>
                  <span className={`${styles.badge} ${
                    a.status === 'submitted' ? styles.badgeGreen :
                    a.status === 'late'      ? styles.badgeYellow : styles.badgeRed}`}>
                    {a.status === 'submitted' ? '✅ Submitted' :
                     a.status === 'late'      ? '⚠️ Late'     : '⏳ Pending'}
                  </span>
                </div>
                <div className={styles.modalRow}><span>Course</span><span>{a.subject}</span></div>
              </div>
              {a.description && <p className={styles.desc}>{a.description}</p>}
              <div className={styles.modalActions}>
                {!isSubmitted && <button className={styles.btnMoodle} onClick={() => openMoodle(a)}>🎓 Submit in Moodle ↗</button>}
                {!isSubmitted && <button className={styles.btnSuccess} onClick={() => handleMarkSubmitted(a)}>✓ Mark Submitted</button>}
                <button className={styles.btnSecondary} onClick={() => setModal(null)}>Close</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Event Modal ──────────────────────────────────────────── */}
      {modal?.type === 'event' && (() => {
        const ev = modal.data
        return (
          <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
            <div className={styles.modal}>
              <button className={styles.closeBtn} onClick={() => setModal(null)}>✕</button>

              <div className={styles.eventTypeBadge}>{(ev.type || 'event').toUpperCase()}</div>
              <h3 className={styles.modalTitle}>{ev.title}</h3>

              {ev.source_email && (
                <p className={styles.sourceEmail}>📧 {ev.source_email}</p>
              )}

              <div className={styles.modalRows}>
                <div className={styles.modalRow}>
                  <span>Event Date</span>
                  <strong>{formatDate(ev.date)}</strong>
                </div>

                {/* Only show registration deadline if it actually exists */}
                {ev.deadline && (
                  <div className={styles.modalRow}>
                    <span>Register By</span>
                    <strong style={{ color: '#c53030' }}>{formatDate(ev.deadline)}</strong>
                  </div>
                )}

                {/* ─── FIX 2: Only show reminder row if remind is TRUE ─── */}
                {ev.remind === true && ev.reminder_date && (
                  <div className={styles.modalRow}>
                    <span>Reminder On</span>
                    <strong style={{ color: '#7c3aed' }}>🔔 {formatDate(ev.reminder_date)}</strong>
                  </div>
                )}
              </div>

              {ev.description && <p className={styles.desc}>{ev.description}</p>}

              <div className={styles.modalActions}>
                {/* ─── FIX 1: Call correct endpoint + show proper messages ─ */}
                {ev.remind !== true ? (
                  <button
                    className={styles.btnRemind}
                    onClick={() => handleRemindMe(ev)}
                    disabled={remindLoading}>
                    {remindLoading ? '⏳ Setting reminder...' : '🔔 Remind Me'}
                  </button>
                ) : (
                  <button
                    className={styles.btnCancelRemind}
                    onClick={() => handleCancelReminder(ev)}>
                    🔕 Cancel Reminder
                  </button>
                )}
                <button className={styles.btnSecondary} onClick={() => setModal(null)}>Close</button>
              </div>

              {/* Only show reminder note if reminder is actually set */}
              {ev.remind === true && ev.reminder_date && (
                <p className={styles.remindNote}>
                  🔔 WhatsApp reminder will be sent to all students on {formatDate(ev.reminder_date)}
                </p>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
