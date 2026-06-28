/**
 * RIT IMS — Gmail OAuth Token Generator (Fixed)
 * Run: node get-token.js
 */

require('dotenv').config()
const { google } = require('googleapis')
const readline   = require('readline')
const http       = require('http')
const url        = require('url')

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI  = 'http://localhost:5002/auth/google/callback'

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env')
  process.exit(1)
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt:      'consent',
  scope:       ['https://www.googleapis.com/auth/gmail.readonly'],
})

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  RIT IMS — Gmail Token Generator (Auto Mode)')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
console.log('📋 This will start a temporary server on port 5002')
console.log('📋 It will AUTO-CAPTURE the code — no copy-pasting needed!\n')
console.log('👉 Open this URL in your browser:\n')
console.log(authUrl)
console.log('\n⏳ Waiting for you to authorize...\n')

// Start temporary HTTP server to auto-capture the OAuth code
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true)

  if (!parsedUrl.pathname.includes('callback')) {
    res.end('Waiting...')
    return
  }

  const code  = parsedUrl.query.code
  const error = parsedUrl.query.error

  if (error) {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(`<h2>❌ Error: ${error}</h2><p>Close this tab and try again.</p>`)
    server.close()
    return
  }

  if (!code) {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end('<h2>❌ No code received</h2>')
    server.close()
    return
  }

  try {
    // Exchange code IMMEDIATELY (before it expires)
    const { tokens } = await oauth2Client.getToken(code)

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅  SUCCESS! Tokens received!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (tokens.refresh_token) {
      console.log('📋 Copy this line into your .env file:\n')
      console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`)
      console.log(`GMAIL_USER=${process.env.GMAIL_USER || 'yourmail@rit.edu'}`)
    } else {
      console.log('⚠️  No refresh token received.')
      console.log('    This happens if you already authorized before.')
      console.log('    Fix: Go to https://myaccount.google.com/permissions')
      console.log('    Remove access to your app, then run this script again.')
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅  You can close the browser tab now.')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Send success page to browser
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>RIT IMS — Gmail Connected</title>
      <style>
        body { font-family: Segoe UI, sans-serif; max-width: 500px; margin: 60px auto; padding: 20px; text-align: center; }
        .success { background: #d1fae5; border-radius: 12px; padding: 32px; }
        h2 { color: #065f46; }
        p  { color: #374151; }
        code { background: #e9ecef; padding: 4px 10px; border-radius: 4px; font-size: 13px; word-break: break-all; }
      </style>
      </head>
      <body>
        <div class="success">
          <h2>✅ Gmail Connected!</h2>
          <p>Your refresh token has been printed in the terminal.</p>
          <p>Copy it to your <strong>.env</strong> file, then close this tab.</p>
          ${tokens.refresh_token ? `<br/><code>${tokens.refresh_token}</code>` : ''}
        </div>
      </body>
      </html>
    `)

  } catch (err) {
    console.error('\n❌ Error getting token:', err.message)

    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(`
      <h2>❌ Error: ${err.message}</h2>
      <p>Close this tab, go back to terminal, and run <code>node get-token.js</code> again.</p>
    `)
  }

  server.close()
  setTimeout(() => process.exit(0), 1000)
})

server.listen(5002, () => {
  console.log('🟢 Temporary server started on port 5002')
  console.log('   (Will auto-close after you authorize)\n')
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('❌ Port 5002 is already in use!')
    console.error('   Stop your other server first, then run: node get-token.js')
    process.exit(1)
  }
})
