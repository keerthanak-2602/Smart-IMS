const express = require('express')
const router  = express.Router()
const jwt     = require('jsonwebtoken')
const db      = require('../db')

const SECRET = process.env.JWT_SECRET || 'rit_secret'

// POST /auth/student/login
router.post('/student/login', async (req, res) => {
  const { register_number, password } = req.body
  if (!register_number || !password) {
    return res.status(400).json({ success: false, error: 'Register number and password required' })
  }
  try {
    const [rows] = await db.execute(
      `SELECT s.*, d.name AS department_name
       FROM students s
       LEFT JOIN departments d ON d.id = s.department_id
       WHERE s.register_number = ?`,
      [register_number]
    )
    if (!rows.length) return res.status(401).json({ success: false, error: 'Student not found' })

    const student = rows[0]
    if (student.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid password' })
    }

    const token = jwt.sign(
      { id: student.id, role: 'student', name: student.name, register_number: student.register_number, department_id: student.department_id },
      SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      success: true,
      token,
      user: {
        id: student.id,
        name: student.name,
        register_number: student.register_number,
        department: student.department_name,
        role: 'student'
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /auth/faculty/login
router.post('/faculty/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' })
  }
  try {
    const [rows] = await db.execute(
      'SELECT * FROM faculty WHERE email = ?',
      [email]
    )
    if (!rows.length) return res.status(401).json({ success: false, error: 'Faculty not found' })

    const faculty = rows[0]
    if (faculty.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid password' })
    }

    const token = jwt.sign(
      { id: faculty.id, role: 'faculty', name: faculty.name, email: faculty.email },
      SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      success: true,
      token,
      user: {
        id: faculty.id,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department,
        role: 'faculty'
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
