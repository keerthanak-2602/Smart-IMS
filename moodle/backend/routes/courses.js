const express = require('express')
const router  = express.Router()
const db      = require('../db')
const { authMiddleware } = require('../middleware/auth')

// GET /courses/my — courses for logged-in student
router.get('/my', authMiddleware, async (req, res) => {
  try {
    let rows
    if (req.user.role === 'student') {
      ;[rows] = await db.execute(
        `SELECT c.*, d.name AS department_name,
                COUNT(DISTINCT a.id) AS assignment_count
         FROM courses c
         JOIN student_courses sc ON sc.course_id = c.id AND sc.student_id = ?
         LEFT JOIN departments d ON d.id = c.department_id
         LEFT JOIN assignments a ON a.course_id = c.id
         GROUP BY c.id`,
        [req.user.id]
      )
    } else {
      ;[rows] = await db.execute(
        `SELECT c.*, d.name AS department_name,
                COUNT(DISTINCT a.id) AS assignment_count
         FROM courses c
         JOIN faculty_courses fc ON fc.course_id = c.id AND fc.faculty_id = ?
         LEFT JOIN departments d ON d.id = c.department_id
         LEFT JOIN assignments a ON a.course_id = c.id
         GROUP BY c.id`,
        [req.user.id]
      )
    }
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /courses/:id — single course detail
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT c.*, d.name AS department_name
       FROM courses c
       LEFT JOIN departments d ON d.id = c.department_id
       WHERE c.id = ?`,
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ success: false, error: 'Course not found' })
    res.json({ success: true, data: rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
