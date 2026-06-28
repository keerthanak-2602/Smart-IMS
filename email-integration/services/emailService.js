const { google }    = require('googleapis')
const { getAuthenticatedClient } = require('../utils/gmail')
const { isEventEmail, hasRegistration, extractDates, detectEventType } = require('../utils/keywords')
const db            = require('../utils/db')

/**
 * Decode base64url encoded string from Gmail
 */
function decodeBase64(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
}

/**
 * Extract plain text body from Gmail message parts
 */
function extractBody(payload) {
  if (!payload) return ''

  // Direct body
  if (payload.body?.data) return decodeBase64(payload.body.data)

  // Multipart — find text/plain first, fallback to text/html
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64(part.body.data)
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        // Strip HTML tags
        return decodeBase64(part.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
      }
      // Nested parts
      if (part.parts) {
        const nested = extractBody(part)
        if (nested) return nested
      }
    }
  }

  return ''
}

/**
 * Get header value from Gmail message headers
 */
function getHeader(headers, name) {
  const h = headers?.find(h => h.name.toLowerCase() === name.toLowerCase())
  return h?.value || ''
}

/**
 * Fetch emails from Gmail and extract event data
 */
async function fetchAndProcessEmails(maxResults = 20) {
  const auth   = getAuthenticatedClient()
  const gmail  = google.gmail({ version: 'v1', auth })
  const results = { processed: 0, eventsFound: 0, eventsInserted: 0, skipped: 0, errors: [] }

  try {
    // List messages
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: '',  // fetch all recent — we filter by keywords ourselves
    })

    const messages = listRes.data.messages || []
    if (!messages.length) {
      results.errors.push('No messages found in inbox')
      return results
    }

    console.log(`[EMAIL] Fetched ${messages.length} message IDs`)

    for (const msg of messages) {
      try {
        results.processed++

        // Fetch full message
        const fullMsg = await gmail.users.messages.get({
          userId: 'me',
          id:     msg.id,
          format: 'full',
        })

        const payload = fullMsg.data.payload
        const headers = payload?.headers || []

        const subject = getHeader(headers, 'subject') || '(No Subject)'
        const from    = getHeader(headers, 'from')    || ''
        const snippet = fullMsg.data.snippet           || ''
        const body    = extractBody(payload)

        // Combine all text for analysis
        const fullText = `${subject} ${snippet} ${body}`

        // Check if event-related
        if (!isEventEmail(fullText)) {
          console.log(`[EMAIL] Skipped (no event keywords): "${subject}"`)
          results.skipped++
          continue
        }

        results.eventsFound++
        console.log(`[EMAIL] Event detected: "${subject}" from ${from}`)

        // Extract dates
        const dates = extractDates(fullText)
        if (!dates.length) {
          console.log(`[EMAIL] No dates found in: "${subject}" — skipping`)
          results.skipped++
          continue
        }

        const eventDate            = dates[0]
        const registrationDeadline = hasRegistration(fullText) && dates.length > 1
          ? dates[1]
          : (hasRegistration(fullText) ? dates[0] : null)

        // Build clean title from subject
        const title = subject
          .replace(/^(fw:|fwd:|re:)\s*/i, '')
          .replace(/\[.*?\]/g, '')
          .trim()
          .substring(0, 200)

        // Build description from snippet
        const description = snippet.substring(0, 500)

        // Extract sender email
        const sourceEmailMatch = from.match(/<(.+?)>/)
        const sourceEmail      = sourceEmailMatch ? sourceEmailMatch[1] : from.trim()

        // Detect event type
        const type = detectEventType(fullText)

        // Check for duplicates (same title + date)
        const [existing] = await db.execute(
          'SELECT id FROM events WHERE title = ? AND date = ?',
          [title, eventDate]
        )

        if (existing.length) {
          console.log(`[EMAIL] Duplicate skipped: "${title}" on ${eventDate}`)
          results.skipped++
          continue
        }

        // Insert into events table
        await db.execute(
          `INSERT INTO events
             (title, type, date, registration_deadline, description, source_email, remind, reminder_date)
           VALUES (?, ?, ?, ?, ?, ?, FALSE, NULL)`,
          [title, type, eventDate, registrationDeadline || null, description, sourceEmail]
        )

        results.eventsInserted++
        console.log(`[EMAIL] ✅ Inserted: "${title}" on ${eventDate}`)

      } catch (msgErr) {
        console.error(`[EMAIL] Error processing message ${msg.id}:`, msgErr.message)
        results.errors.push(`Message ${msg.id}: ${msgErr.message}`)
      }
    }

  } catch (err) {
    console.error('[EMAIL] Fatal fetch error:', err.message)
    results.errors.push(err.message)
  }

  return results
}

module.exports = { fetchAndProcessEmails }
