const express = require('express')
const router  = express.Router()
const db      = require('../db')

// GET /dashboard/:studentId
router.get('/:studentId', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT s.*, d.name AS department_name
       FROM students s
       LEFT JOIN departments d ON d.id = s.department_id
       WHERE s.id = ?`,
      [req.params.studentId]
    )
    if (!rows.length) return res.status(404).json({ success: false, error: 'Student not found' })
    const s = rows[0]
    res.json({
      success: true,
      data: {
        cgpa:         s.cgpa,
        attendance:   s.attendance,
        arrears:      s.arrears,
        leaves_taken: s.leaves_taken,
        name:         s.name,
        department:   s.department_name,
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
