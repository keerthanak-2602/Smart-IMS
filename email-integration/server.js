require('dotenv').config()
const express  = require('express')
const cors     = require('cors')
const cron     = require('node-cron')

const authRoutes   = require('./routes/auth')
const emailRoutes  = require('./routes/emails')
const eventRoutes  = require('./routes/events')
const { sendEventReminders }    = require('./services/reminderService')
const { fetchAndProcessEmails } = require('./services/emailService')

const app = express()

// ─── FIX 1: Allow requests from IMS frontend (port 3000) ─────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json())

// ── Routes ────────────────────────────────────────────────
app.use('/auth',   authRoutes)
app.use('/emails', emailRoutes)
app.use('/events', eventRoutes)

// ── Root ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html><html>
    <head><title>RIT IMS Email Integration</title>
    <style>body{font-family:Segoe UI,sans-serif;max-width:700px;margin:40px auto;padding:20px;}
    .step{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:12px 0;}
    a.btn{display:inline-block;background:#1a73e8;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;margin:4px;}
    </style></head>
    <body>
      <h1>🎓 RIT IMS — Email Integration</h1>
      <div class="step"><h3>1. Connect Gmail</h3><a href="/auth/google" class="btn">Connect Gmail →</a><a href="/auth/status" class="btn" style="background:#6c757d;">Check Status</a></div>
      <div class="step"><h3>2. Fetch Emails</h3><a href="/emails/fetch" class="btn">Fetch 20 Emails</a><a href="/emails/fetch?max=50" class="btn" style="background:#28a745;">Fetch 50 Emails</a></div>
      <div class="step"><h3>3. View Events</h3><a href="/events" class="btn">View All Events →</a></div>
      <div class="step"><h3>Test Reminder</h3><a href="/test-reminder" class="btn" style="background:#e85d04;">Trigger Reminders Now</a></div>
    </body></html>
  `)
})

// Manual triggers for testing
app.get('/test-reminder', async (req, res) => {
  await sendEventReminders()
  res.json({ success: true, message: 'Event reminders triggered!' })
})

app.get('/fetch-now', async (req, res) => {
  const results = await fetchAndProcessEmails(20)
  res.json({ success: true, results })
})

// ── Cron: fetch emails every hour ───────────────────────
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Fetching new emails...')
  try {
    const r = await fetchAndProcessEmails(10)
    console.log(`[CRON] Done: ${r.eventsInserted} new events inserted`)
  } catch (err) {
    console.error('[CRON] Email fetch error:', err.message)
  }
})

// ── Cron: send reminders daily at 8 AM ──────────────────
cron.schedule('0 8 * * *', async () => {
  console.log('[CRON] Running event reminders...')
  await sendEventReminders()
})

const PORT = process.env.PORT || 5002
app.listen(PORT, () => {
  console.log(`\n🚀  Email Integration on http://localhost:${PORT}`)
  console.log(`✅  CORS enabled for http://localhost:3000\n`)
})
