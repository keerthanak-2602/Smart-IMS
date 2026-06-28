const express = require('express')
const router  = express.Router()
const { fetchAndProcessEmails } = require('../services/emailService')

// GET /emails/fetch
// Fetch emails from Gmail, detect events, insert into DB
router.get('/fetch', async (req, res) => {
  const maxResults = parseInt(req.query.max) || 20
  console.log(`[EMAIL] Starting fetch of ${maxResults} emails...`)

  try {
    const results = await fetchAndProcessEmails(maxResults)
    res.json({
      success: true,
      summary: {
        emailsProcessed: results.processed,
        eventsDetected:  results.eventsFound,
        eventsInserted:  results.eventsInserted,
        skipped:         results.skipped,
      },
      errors:  results.errors,
      message: `Processed ${results.processed} emails, inserted ${results.eventsInserted} new events.`
    })
  } catch (err) {
    console.error('[EMAIL] Fetch error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
