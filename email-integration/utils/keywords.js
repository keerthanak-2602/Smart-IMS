const EVENT_KEYWORDS = [
  'webinar', 'workshop', 'seminar', 'conference', 'hackathon',
  'bootcamp', 'guest lecture', 'training program', 'orientation',
  'symposium', 'tech talk', 'internship drive', 'placement drive',
  'event', 'fest', 'competition', 'contest', 'technical event',
  'cultural', 'sports day', 'annual day', 'induction', 'alumni meet'
]

const REGISTRATION_KEYWORDS = [
  'register', 'registration', 'apply now', 'enroll', 'google form',
  'deadline', 'last date', 'last day', 'closing date', 'fill the form',
  'link below', 'click here to register'
]

const DATE_PATTERNS = [
  // DD/MM/YYYY or DD-MM-YYYY
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g,
  // Month DD, YYYY  e.g. April 12, 2026
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})\b/gi,
  // DD Month YYYY  e.g. 12 April 2026
  /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/gi,
  // YYYY-MM-DD
  /\b(\d{4})-(\d{2})-(\d{2})\b/g,
]

const MONTH_MAP = {
  january:1, february:2, march:3, april:4, may:5, june:6,
  july:7, august:8, september:9, october:10, november:11, december:12
}

function isEventEmail(text) {
  const lower = text.toLowerCase()
  return EVENT_KEYWORDS.some(kw => lower.includes(kw))
}

function hasRegistration(text) {
  const lower = text.toLowerCase()
  return REGISTRATION_KEYWORDS.some(kw => lower.includes(kw))
}

function extractDates(text) {
  const found = []
  const lower = text.toLowerCase()

  // Try Month DD, YYYY
  const re1 = /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})\b/gi
  let m
  while ((m = re1.exec(lower)) !== null) {
    const month = String(MONTH_MAP[m[1]]).padStart(2,'0')
    const day   = String(m[2]).padStart(2,'0')
    found.push(`${m[3]}-${month}-${day}`)
  }

  // Try DD Month YYYY
  const re2 = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/gi
  while ((m = re2.exec(lower)) !== null) {
    const month = String(MONTH_MAP[m[2]]).padStart(2,'0')
    const day   = String(m[1]).padStart(2,'0')
    found.push(`${m[3]}-${month}-${day}`)
  }

  // Try YYYY-MM-DD
  const re3 = /\b(\d{4})-(\d{2})-(\d{2})\b/g
  while ((m = re3.exec(text)) !== null) {
    found.push(`${m[1]}-${m[2]}-${m[3]}`)
  }

  // Try DD/MM/YYYY
  const re4 = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g
  while ((m = re4.exec(text)) !== null) {
    const day   = String(m[1]).padStart(2,'0')
    const month = String(m[2]).padStart(2,'0')
    found.push(`${m[3]}-${month}-${day}`)
  }

  // Deduplicate and validate
  return [...new Set(found)].filter(d => {
    const dt = new Date(d)
    return !isNaN(dt.getTime())
  })
}

function detectEventType(text) {
  const lower = text.toLowerCase()
  if (lower.includes('hackathon'))       return 'hackathon'
  if (lower.includes('workshop'))        return 'workshop'
  if (lower.includes('webinar'))         return 'webinar'
  if (lower.includes('seminar'))         return 'seminar'
  if (lower.includes('placement drive')) return 'placement'
  if (lower.includes('internship'))      return 'internship'
  if (lower.includes('guest lecture'))   return 'guest lecture'
  if (lower.includes('conference'))      return 'conference'
  return 'event'
}

module.exports = {
  isEventEmail,
  hasRegistration,
  extractDates,
  detectEventType,
  EVENT_KEYWORDS,
}
