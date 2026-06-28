const db = require('./db')
const { sendWhatsApp } = require('./routes/whatsapp')

let alreadySent = false

async function sendDailyReminders() {
  if (alreadySent) {
    console.log('[REMINDERS] Already sent once today. Skipping.')
    return
  }
  try {
    const [rows] = await db.execute(
      `SELECT
         a.id AS assignment_id, a.title, a.deadline,
         c.course_name AS subject,
         st.name AS student_name, st.phone_number,
         COALESCE(s.status, 'pending') AS status
       FROM assignments a
       JOIN courses c ON c.id = a.course_id
       JOIN student_courses sc ON sc.course_id = a.course_id
       JOIN students st ON st.id = sc.student_id
       LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = st.id
       WHERE a.deadline BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY)
         AND COALESCE(s.status, 'pending') != 'submitted'
         AND st.phone_number IS NOT NULL
       ORDER BY a.deadline ASC`
    )

    if (!rows.length) {
      console.log('[REMINDERS] No pending deadlines in next 3 days.')
      alreadySent = true
      return
    }

    for (const row of rows) {
      const hoursLeft = (new Date(row.deadline) - new Date()) / 3600000
      const urgent    = hoursLeft <= 24
      const message   = urgent
        ? `🚨 *URGENT — RIT IMS*\n\nHi ${row.student_name},\n\nYour assignment *${row.title}* (${row.subject}) is due in less than 24 hours!\n📅 Deadline: ${row.deadline}\n\nSubmit NOW on Moodle!`
        : `📚 *RIT IMS Reminder*\n\nHi ${row.student_name},\n\nAssignment: *${row.title}* (${row.subject})\nDeadline: *${row.deadline}*\n\nPlease submit on Moodle before the deadline. ✅`

      try {
        await sendWhatsApp(row.phone_number, message)
        console.log(`[REMINDERS] ✅ Sent to ${row.student_name} (${row.phone_number}) — "${row.title}"`)
      } catch (err) {
        console.error(`[REMINDERS] ❌ Failed for ${row.phone_number}:`, err.message)
      }
      await new Promise(r => setTimeout(r, 500))
    }

    alreadySent = true
    console.log(`[REMINDERS] ✅ Done. ${rows.length} reminder(s) sent. Will not send again until restart.`)
  } catch (err) {
    console.error('[REMINDERS] Fatal error:', err.message)
  }
}

function resetFlag() {
  alreadySent = false
  console.log('[REMINDERS] 🔄 Reset.')
}

module.exports = { sendDailyReminders, resetFlag }
