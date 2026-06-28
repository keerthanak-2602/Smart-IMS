const jwt = require('jsonwebtoken')

function authMiddleware(req, res, next) {
  const header = req.headers['authorization']
  if (!header) return res.status(401).json({ success: false, error: 'No token provided' })

  const token = header.split(' ')[1]
  if (!token) return res.status(401).json({ success: false, error: 'Invalid token format' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rit_secret')
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json({ success: false, error: 'Token expired or invalid' })
  }
}

function facultyOnly(req, res, next) {
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ success: false, error: 'Faculty access only' })
  }
  next()
}

function studentOnly(req, res, next) {
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, error: 'Student access only' })
  }
  next()
}

module.exports = { authMiddleware, facultyOnly, studentOnly }
