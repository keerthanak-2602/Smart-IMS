const express  = require('express')
const router   = express.Router()
const { getOAuth2Client, setTokens } = require('../utils/gmail')

// GET /auth/google → redirect to Google consent screen
router.get('/google', (req, res) => {
  const client  = getOAuth2Client()
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    prompt:      'consent',
    scope:       ['https://www.googleapis.com/auth/gmail.readonly'],
  })
  res.redirect(authUrl)
})

// GET /auth/google/callback → receive code, exchange for tokens
router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query

  if (error) {
    return res.send(`
      <h2>❌ OAuth Error</h2>
      <p>${error}</p>
      <p>Please try again: <a href="/auth/google">Connect Gmail</a></p>
    `)
  }

  if (!code) {
    return res.status(400).send('<h2>❌ No authorization code received</h2>')
  }

  try {
    const client        = getOAuth2Client()
    const { tokens }    = await client.getToken(code)
    setTokens(tokens)

    console.log('[AUTH] ✅ Gmail OAuth tokens received')
    console.log('[AUTH] Refresh token:', tokens.refresh_token ? '✅ Received' : '⚠️ Not received (may already be set in .env)')

    // If we got a refresh token, show it to copy into .env
    const refreshTokenMsg = tokens.refresh_token
      ? `<div style="background:#d1fae5;padding:16px;border-radius:8px;margin:16px 0;">
           <strong>✅ Refresh Token (copy to .env):</strong><br/>
           <code style="word-break:break-all;">${tokens.refresh_token}</code>
         </div>`
      : '<p>Using existing refresh token from .env</p>'

    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>RIT IMS — Gmail Connected</title>
      <style>body{font-family:Segoe UI,sans-serif;max-width:600px;margin:40px auto;padding:20px;}</style>
      </head>
      <body>
        <h2>✅ Gmail Connected Successfully!</h2>
        ${refreshTokenMsg}
        <p>You can now fetch emails:</p>
        <a href="/emails/fetch" style="background:#1a73e8;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
          Fetch Emails Now →
        </a>
        <br/><br/>
        <a href="/events" style="color:#1a73e8;">View All Events →</a>
      </body>
      </html>
    `)
  } catch (err) {
    console.error('[AUTH] Token exchange error:', err.message)
    res.status(500).send(`
      <h2>❌ Error getting tokens</h2>
      <p>${err.message}</p>
      <p><a href="/auth/google">Try again</a></p>
    `)
  }
})

// GET /auth/status — check if authenticated
router.get('/status', (req, res) => {
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN
  res.json({
    success:       true,
    authenticated: !!refreshToken,
    message:       refreshToken ? '✅ Gmail connected' : '❌ Not connected. Visit /auth/google',
  })
})

module.exports = router
