import { useState, useEffect } from 'react'
import styles from './DeadlineManager.module.css'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MOODLE_URL = 'http://localhost:3001'
const EMAIL_API  = 'http://localhost:5002'

function urgencyClass(deadlineStr) {
  const diff = (new Date(deadlineStr) - new Date()) / 3600000
  if (diff <= 24) return styles.evRed
  if (diff <= 72) return styles.evYellow
  return styles.evGreen
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  })
}

export default function DeadlineManager() {
  const today = new Date()
  const user  = JSON.parse(sessionStorage.getItem('ims_user') || '{}')

  const [year,        setYear]        = useState(today.getFullYear())
  const [month,       setMonth]       = useState(today.getMonth())
  const [mode,        setMode]        = useState('academic')
  const [modal,       setModal]       = useState(null)
  const [assignments, setAssignments] = useState([])
  const [events,      setEvents]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [fetching,    setFetching]    = useState(false)
  const [remindLoading, setRemindLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const promises = [fetch('/events').then(r => r.json())]
      if (user?.id) {
        promises.push(fetch(`/assignments?student_id=${user.id}`).then(r => r.json()))
      }
      const [eData, aData] = await Promise.all(promises)
      if (eData?.success) setEvents(eData.data)
      if (aData?.success) setAssignments(aData.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchEmailEvents() {
    setFetching(true)
    try {
      const res  = await fetch(`${EMAIL_API}/emails/fetch`)
      const data = await res.json()
      if (data.success) {
        alert(`✅ Email fetch complete!\n\nEmails processed: ${data.summary.emailsProcessed}\nNew events found: ${data.summary.eventsInserted}`)
        await loadData()  // Refresh events
      } else {
        alert('❌ Error: ' + data.error)
      }
    } catch (err) {
      alert('❌ Could not connect to email service. Make sure it is running on port 5002.')
    } finally {
      setFetching(false)
    }
  }

  async function handleRemindMe(event) {
    setRemindLoading(true)
    try {
      const res  = await fetch(`${EMAIL_API}/events/remind/${event.id}`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        alert(`🔔 Reminder set!\n\nYou will receive a WhatsApp notification on ${data.reminder_date}`)
        // Update local state
        setEvents(prev => prev.map(e => e.id === event.id ? { ...e, remind: true, reminder_date: data.reminder_date } : e))
        setModal(null)
      } else {
        alert('❌ ' + data.error)
      }
    } catch (err) {
      alert('❌ Could not connect to email service.')
    } finally {
      setRemindLoading(false)
    }
  }

  async function handleCancelReminder(event) {
    try {
      await fetch(`${EMAIL_API}/events/remind/${event.id}`, { method: 'DELETE' })
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, remind: false, reminder_date: null } : e))
      setModal(null)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleMarkSubmitted(assignment) {
    try {
      await fetch('/assignments/mark-submitted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: user.id, assignment_id: assignment.id }),
      })
      setAssignments(prev => prev.map(a => a.id === assignment.id ? { ...a, status: 'submitted' } : a))
      setModal(null)
    } catch (err) { console.error(err) }
  }

  function openMoodle(assignment) {
    const url = assignment.moodleRedirect || `${MOODLE_URL}/course/${assignment.course_id}/assignment/${assignment.id}`
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
  const todayStr    = today.toISOString().split('T')[0]

  function dateStr(d) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  function cellItems(d) {
    const ds = dateStr(d)
    if (mode === 'academic') {
      return assignments.filter(a => (a.deadline || '').startsWith(ds))
    }
    // Event mode: show events on their EVENT DATE
    return events.filter(e => (e.date || '').startsWith(ds))
  }

  const pendingCount   = assignments.filter(a => a.status === 'pending').length
  const submittedCount = assignments.filter(a => a.status === 'submitted' || a.status === 'late').length
  const remindCount    = events.filter(e => e.remind).length

  return (
    <div className={styles.wrap}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>🔥 Deadline Manager</h2>
          <p className={styles.sub}>
            {user?.name} • {user?.department}
            {mode === 'event' && ` • Events are same for all students`}
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
              <span className={styles.summaryItem}>🔔 Reminders Set: <strong style={{ color: '#7c3aed' }}>{remindCount}</strong></span>
              <span className={styles.summaryItem} style={{ color: '#64748b', fontSize: '11px' }}>
                Events auto-fetched from college emails every hour
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
          const ds    = dateStr(d)
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

      {loading && <div className={styles.loadingBar}>Loading your data from database...</div>}

      {/* Assignment Modal */}
      {modal?.type === 'assignment' && (() => {
        const a = modal.data
        const isSubmitted = a.status === 'submitted' || a.status === 'late'
        return (
          <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
            <div className={styles.modal}>
              <button className={styles.closeBtn} onClick={() => setModal(null)}>✕</button>
              <h3 className={styles.modalTitle}>{a.title}</h3>
              <p className={styles.modalSub}>{a.subject}</p>
              <div className={styles.modalRows}>
                <div className={styles.modalRow}><span>Deadline</span><span>{formatDate(a.deadline)}</span></div>
                <div className={styles.modalRow}>
                  <span>Status</span>
                  <span className={`${styles.badge} ${a.status === 'submitted' ? styles.badgeGreen : a.status === 'late' ? styles.badgeYellow : styles.badgeRed}`}>
                    {a.status === 'submitted' ? '✅ Submitted' : a.status === 'late' ? '⚠️ Late' : '⏳ Pending'}
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

      {/* Event Modal */}
      {modal?.type === 'event' && (() => {
        const ev = modal.data
        return (
          <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
            <div className={styles.modal}>
              <button className={styles.closeBtn} onClick={() => setModal(null)}>✕</button>

              <div className={styles.eventTypeBadge}>{ev.type?.toUpperCase() || 'EVENT'}</div>
              <h3 className={styles.modalTitle}>{ev.title}</h3>

              {ev.source_email && (
                <p className={styles.sourceEmail}>📧 Source: {ev.source_email}</p>
              )}

              <div className={styles.modalRows}>
                <div className={styles.modalRow}>
                  <span>Event Date</span>
                  <strong>{formatDate(ev.date)}</strong>
                </div>
                {ev.registration_deadline && (
                  <div className={styles.modalRow}>
                    <span>Register By</span>
                    <strong style={{ color: '#c53030' }}>{formatDate(ev.registration_deadline)}</strong>
                  </div>
                )}
                {ev.remind && ev.reminder_date && (
                  <div className={styles.modalRow}>
                    <span>Reminder On</span>
                    <strong style={{ color: '#7c3aed' }}>🔔 {formatDate(ev.reminder_date)}</strong>
                  </div>
                )}
              </div>

              {ev.description && <p className={styles.desc}>{ev.description}</p>}

              <div className={styles.modalActions}>
                {!ev.remind ? (
                  <button
                    className={styles.btnRemind}
                    onClick={() => handleRemindMe(ev)}
                    disabled={remindLoading}>
                    {remindLoading ? '⏳ Setting...' : '🔔 Remind Me'}
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

              {ev.remind && (
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
