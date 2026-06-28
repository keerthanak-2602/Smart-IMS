const express = require('express')
const router  = express.Router()
const db      = require('../db')

// POST /auth/login
router.post('/login', async (req, res) => {
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
    res.json({
      success: true,
      user: {
        id:              student.id,
        name:            student.name,
        register_number: student.register_number,
        department:      student.department_name,
        department_id:   student.department_id,
        cgpa:            student.cgpa,
        attendance:      student.attendance,
        arrears:         student.arrears,
        leaves_taken:    student.leaves_taken,
        phone_number:    student.phone_number,
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
