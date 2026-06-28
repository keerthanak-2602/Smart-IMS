require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const cron    = require('node-cron')

const authRoutes       = require('./routes/auth')
const dashboardRoutes  = require('./routes/dashboard')
const assignmentRoutes = require('./routes/assignments')
const eventRoutes      = require('./routes/events')
const whatsappRoutes   = require('./routes/whatsapp')
const { sendDailyReminders, resetFlag } = require('./reminders')

const app = express()

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001'] }))
app.use(express.json())

app.use('/auth',        authRoutes)
app.use('/dashboard',   dashboardRoutes)
app.use('/assignments', assignmentRoutes)
app.use('/events',      eventRoutes)
app.use('/whatsapp',    whatsappRoutes)

app.get('/', (_, res) =>
  res.json({ status: '🎓 RIT IMS Backend running', db: 'rit_system', time: new Date() })
)

// Manual reminder trigger for demo/testing
app.get('/test-reminder', async (_req, res) => {
  await sendDailyReminders()
  res.json({ success: true, message: 'Reminders triggered!' })
})

// Reset flag at midnight
cron.schedule('0 0 * * *', () => resetFlag())

// Daily reminders at 8 AM
cron.schedule('* * * * *', () => {
  console.log('[CRON] Running daily reminders...')
  sendDailyReminders()
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀  IMS Backend listening on http://localhost:${PORT}`)
  console.log(`📦  Database: ${process.env.DB_NAME || 'rit_system'}`)
})
