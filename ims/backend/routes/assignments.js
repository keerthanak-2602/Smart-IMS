const express = require('express')
const router  = express.Router()
const db      = require('../db')

const MOODLE_URL = process.env.MOODLE_URL || 'http://localhost:3001'

// GET /assignments?student_id=1
router.get('/', async (req, res) => {
  const { student_id } = req.query
  if (!student_id) {
    return res.status(400).json({ success: false, error: 'student_id is required' })
  }
  try {
    const [rows] = await db.execute(
      `SELECT
         a.id, a.title, a.description, a.deadline, a.moodle_link,
         c.id          AS course_id,
         c.course_name AS subject,
         COALESCE(s.status, 'pending') AS status,
         s.submitted_at,
         s.file_path
       FROM assignments a
       JOIN courses c ON c.id = a.course_id
       JOIN student_courses sc ON sc.course_id = a.course_id AND sc.student_id = ?
       LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = ?
       ORDER BY a.deadline ASC`,
      [student_id, student_id]
    )
    const data = rows.map(r => ({
      ...r,
      moodleRedirect: `${MOODLE_URL}/course/${r.course_id}/assignment/${r.id}`,
    }))
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /assignments/mark-submitted
router.post('/mark-submitted', async (req, res) => {
  const { student_id, assignment_id } = req.body
  if (!student_id || !assignment_id) {
    return res.status(400).json({ success: false, error: 'student_id and assignment_id required' })
  }
  try {
    await db.execute(
      `INSERT INTO submissions (student_id, assignment_id, status, submitted_at)
       VALUES (?, ?, 'submitted', NOW())
       ON DUPLICATE KEY UPDATE status = 'submitted', submitted_at = NOW()`,
      [student_id, assignment_id]
    )
    res.json({ success: true, message: 'Marked as submitted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
