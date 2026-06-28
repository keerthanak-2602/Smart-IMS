const twilio = require('twilio')
const db     = require('../utils/db')

async function sendEventReminders() {
  console.log('[REMINDER] Checking for event reminders to send...')

  try {
    const today = new Date().toISOString().split('T')[0]

    // Find all events where remind=true and reminder_date = today
    const [events] = await db.execute(
      `SELECT * FROM events
       WHERE remind = TRUE AND reminder_date = ?`,
      [today]
    )

    if (!events.length) {
      console.log('[REMINDER] No reminders scheduled for today.')
      return
    }

    // Get all students with phone numbers
    const [students] = await db.execute(
      `SELECT name, phone_number FROM students
       WHERE phone_number IS NOT NULL AND phone_number != ''`
    )

    if (!students.length) {
      console.log('[REMINDER] No students with phone numbers found.')
      return
    }

    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN)

    for (const event of events) {
      const regLine = event.registration_deadline
        ? `\n📝 Registration Deadline: ${event.registration_deadline}`
        : ''

      const message =
        `🎓 *RIT IMS Event Reminder*\n\n` +
        `📌 *${event.title}*\n` +
        `📅 Event Date: ${event.date}` +
        regLine +
        `\n\n${event.description ? event.description.substring(0, 100) + '...' : ''}` +
        `\n\nDon't miss it! 🚀`

      // Send to all students
      for (const student of students) {
        try {
          await client.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to:   `whatsapp:${student.phone_number}`,
            body: message,
          })
          console.log(`[REMINDER] ✅ Sent to ${student.name} (${student.phone_number}) — "${event.title}"`)
          await new Promise(r => setTimeout(r, 400))
        } catch (err) {
          console.error(`[REMINDER] ❌ Failed for ${student.phone_number}:`, err.message)
        }
      }
    }

    console.log(`[REMINDER] Done. Processed ${events.length} event reminder(s).`)
  } catch (err) {
    console.error('[REMINDER] Fatal error:', err.message)
  }
}

module.exports = { sendEventReminders }
