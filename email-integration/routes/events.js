const express = require('express')
const router  = express.Router()
const db      = require('../utils/db')

// ─── FIX 1: Add CORS headers so IMS frontend (port 3000) can call this ────────
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin',  'http://localhost:3000')
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// Helper: format MySQL date to YYYY-MM-DD string safely
function formatDateField(val) {
  if (!val) return null
  // If it's already a proper YYYY-MM-DD string
  if (typeof val === 'string') return val.slice(0, 10)
  // If it's a JS Date object (MySQL driver sometimes returns these)
  if (val instanceof Date) {
    const y = val.getUTCFullYear()
    const m = String(val.getUTCMonth() + 1).padStart(2, '0')
    const d = String(val.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return null
}

// GET /events
router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
         id, title, type,
         DATE_FORMAT(date, '%Y-%m-%d') AS date,
         DATE_FORMAT(registration_deadline, '%Y-%m-%d') AS deadline,
         description, source_email,
         remind, reminder_date
       FROM events
       ORDER BY date ASC`
    )
    const data = rows.map(e => ({
      ...e,
      remind: e.remind === 1 || e.remind === true,
    }))
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /events/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM events WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ success: false, error: 'Event not found' })
    const e = rows[0]
    res.json({
      success: true,
      data: {
        ...e,
        date:                  formatDateField(e.date),
        registration_deadline: formatDateField(e.registration_deadline),
        reminder_date:         formatDateField(e.reminder_date),
        remind: e.remind === 1 || e.remind === true,
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /events/remind/:id — set reminder + calculate reminder_date
router.post('/remind/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM events WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ success: false, error: 'Event not found' })

    const event = rows[0]

    // Use registration_deadline if it exists, else use event date
    const baseDateStr = formatDateField(event.registration_deadline) || formatDateField(event.date)

    // ─── FIX 3: Parse as LOCAL date to avoid timezone shift ───────────────────
    const [y, m, d] = baseDateStr.split('-').map(Number)
    const base = new Date(y, m - 1, d)
    base.setDate(base.getDate() - 2)

    const reminderDate = `${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,'0')}-${String(base.getDate()).padStart(2,'0')}`

    await db.execute(
      'UPDATE events SET remind = TRUE, reminder_date = ? WHERE id = ?',
      [reminderDate, req.params.id]
    )

    res.json({
      success:       true,
      message:       `Reminder set! WhatsApp will be sent on ${reminderDate}`,
      reminder_date: reminderDate,
    })
  } catch (err) {
    console.error('Remind error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /events/remind/:id — cancel reminder
router.delete('/remind/:id', async (req, res) => {
  try {
    await db.execute(
      'UPDATE events SET remind = FALSE, reminder_date = NULL WHERE id = ?',
      [req.params.id]
    )
    res.json({ success: true, message: 'Reminder cancelled' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /events — manually add event
router.post('/', async (req, res) => {
  const { title, type, date, registration_deadline, description } = req.body
  if (!title || !date) {
    return res.status(400).json({ success: false, error: 'title and date required' })
  }
  try {
    const [result] = await db.execute(
      `INSERT INTO events (title, type, date, registration_deadline, description, source_email, remind)
       VALUES (?, ?, ?, ?, ?, 'manual', FALSE)`,
      [title, type || 'event', date, registration_deadline || null, description || '']
    )
    res.json({ success: true, id: result.insertId })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
