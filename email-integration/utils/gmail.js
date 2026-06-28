require('dotenv').config()
const { google } = require('googleapis')

// In-memory token store (tokens can also be persisted to DB)
let storedTokens = null

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

function getAuthenticatedClient() {
  const client = getOAuth2Client()

  // Prefer refresh token from .env (set after running get-token.js)
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN || storedTokens?.refresh_token

  if (!refreshToken) {
    throw new Error('No Gmail refresh token found. Run: node get-token.js')
  }

  client.setCredentials({
    refresh_token: refreshToken,
    ...(storedTokens || {})
  })

  return client
}

function setTokens(tokens) {
  storedTokens = tokens
}

function getTokens() {
  return storedTokens
}

module.exports = { getOAuth2Client, getAuthenticatedClient, setTokens, getTokens }
