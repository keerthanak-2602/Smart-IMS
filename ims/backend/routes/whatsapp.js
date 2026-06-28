const express = require('express')
const router  = express.Router()
const twilio  = require('twilio')

async function sendWhatsApp(to, body) {
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN)
  return client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to:   `whatsapp:${to}`,
    body,
  })
}

// POST /whatsapp/send
router.post('/send', async (req, res) => {
  const { to, assignment, date } = req.body
  if (!to || !assignment || !date) {
    return res.status(400).json({ success: false, error: 'to, assignment, date required' })
  }
  try {
    const msg = await sendWhatsApp(to,
      `📚 *RIT IMS Reminder*\n\nAssignment: *${assignment}*\nDeadline: *${date}*\n\nPlease submit on time via Moodle.`
    )
    res.json({ success: true, sid: msg.sid })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /whatsapp/test
router.get('/test', async (_req, res) => {
  const to = process.env.TWILIO_TEST_TO
  if (!to) return res.status(400).json({ success: false, error: 'Set TWILIO_TEST_TO in .env' })
  try {
    const msg = await sendWhatsApp(to, `✅ *RIT IMS* — WhatsApp working!\nTime: ${new Date().toLocaleString()}`)
    res.json({ success: true, sid: msg.sid })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
module.exports.sendWhatsApp = sendWhatsApp
