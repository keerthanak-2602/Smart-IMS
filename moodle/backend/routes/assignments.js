const express = require('express')
const router  = express.Router()
const multer  = require('multer')
const path    = require('path')
const db      = require('../db')
const { authMiddleware, facultyOnly, studentOnly } = require('../middleware/auth')

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, unique + path.extname(file.originalname))
  }
})
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf','.doc','.docx','.zip','.txt','.jpg','.png']
    const ext = path.extname(file.originalname).toLowerCase()
    allowed.includes(ext) ? cb(null, true) : cb(new Error('File type not allowed'))
  }
})

// GET /assignments/course/:courseId — all assignments in a course
router.get('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.role === 'student' ? req.user.id : null
    let rows

    if (studentId) {
      // Student: include their submission status
      ;[rows] = await db.execute(
        `SELECT a.*,
                f.name AS faculty_name,
                COALESCE(s.status, 'pending') AS submission_status,
                s.submitted_at,
                s.file_path,
                s.id AS submission_id
         FROM assignments a
         LEFT JOIN faculty f ON f.id = a.faculty_id
         LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = ?
         WHERE a.course_id = ?
         ORDER BY a.deadline ASC`,
        [studentId, req.params.courseId]
      )
    } else {
      // Faculty: include submission summary counts
      ;[rows] = await db.execute(
        `SELECT a.*,
                f.name AS faculty_name,
                COUNT(DISTINCT s.id) AS submitted_count,
                COUNT(DISTINCT sc.student_id) AS total_students
         FROM assignments a
         LEFT JOIN faculty f ON f.id = a.faculty_id
         LEFT JOIN student_courses sc ON sc.course_id = a.course_id
         LEFT JOIN submissions s ON s.assignment_id = a.id AND s.status = 'submitted'
         WHERE a.course_id = ?
         GROUP BY a.id
         ORDER BY a.deadline ASC`,
        [req.params.courseId]
      )
    }
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /assignments/:id — single assignment detail
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.role === 'student' ? req.user.id : null
    const [rows] = await db.execute(
      `SELECT a.*, f.name AS faculty_name, c.course_name,
              COALESCE(s.status, 'pending') AS submission_status,
              s.submitted_at, s.file_path, s.id AS submission_id
       FROM assignments a
       LEFT JOIN faculty f ON f.id = a.faculty_id
       LEFT JOIN courses c ON c.id = a.course_id
       LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = ?
       WHERE a.id = ?`,
      [studentId || 0, req.params.id]
    )
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found' })
    res.json({ success: true, data: rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /assignments — faculty creates assignment
router.post('/', authMiddleware, facultyOnly, async (req, res) => {
  const { course_id, title, description, deadline, moodle_link } = req.body
  if (!course_id || !title || !deadline) {
    return res.status(400).json({ success: false, error: 'course_id, title, deadline required' })
  }
  try {
    // Insert assignment
    const [result] = await db.execute(
      `INSERT INTO assignments (course_id, faculty_id, title, description, deadline, moodle_link)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [course_id, req.user.id, title, description || '', deadline, moodle_link || '']
    )
    const assignmentId = result.insertId

    // Auto-create pending submission rows for all enrolled students
    const [students] = await db.execute(
      'SELECT student_id FROM student_courses WHERE course_id = ?',
      [course_id]
    )
    if (students.length) {
      const values = students.map(s => `(${s.student_id}, ${assignmentId}, 'pending')`).join(',')
      await db.execute(
        `INSERT IGNORE INTO submissions (student_id, assignment_id, status) VALUES ${values}`
      )
    }

    res.json({ success: true, id: assignmentId, message: `Assignment created. ${students.length} student(s) notified.` })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /assignments/:id — faculty deletes assignment
router.delete('/:id', authMiddleware, facultyOnly, async (req, res) => {
  try {
    await db.execute('DELETE FROM assignments WHERE id = ? AND faculty_id = ?', [req.params.id, req.user.id])
    res.json({ success: true, message: 'Assignment deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /assignments/:id/submissions — faculty views all submissions
router.get('/:id/submissions', authMiddleware, facultyOnly, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT st.id AS student_id, st.name AS student_name,
              st.register_number, d.name AS department,
              COALESCE(s.status, 'pending') AS status,
              s.submitted_at, s.file_path, s.id AS submission_id
       FROM student_courses sc
       JOIN students st ON st.id = sc.student_id
       LEFT JOIN departments d ON d.id = st.department_id
       LEFT JOIN submissions s ON s.assignment_id = ? AND s.student_id = st.id
       WHERE sc.course_id = (SELECT course_id FROM assignments WHERE id = ?)
       ORDER BY s.status DESC, st.name ASC`,
      [req.params.id, req.params.id]
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /assignments/:id/submit — student submits file
router.post('/:id/submit', authMiddleware, studentOnly, upload.single('file'), async (req, res) => {
  try {
    const assignmentId = req.params.id
    const studentId    = req.user.id

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    const filePath = req.file.filename

    const [asgn] = await db.execute(
      'SELECT * FROM assignments WHERE id = ?',
      [assignmentId]
    )
    if (!asgn.length) {
      return res.status(404).json({ success: false, error: 'Assignment not found' })
    }

    const now      = new Date()
    const deadline = new Date(asgn[0].deadline)
    const status   = now > deadline ? 'late' : 'submitted'

    await db.execute(
      `INSERT INTO submissions (student_id, assignment_id, file_path, submitted_at, status)
       VALUES (?, ?, ?, NOW(), ?)
       ON DUPLICATE KEY UPDATE
         file_path    = VALUES(file_path),
         submitted_at = NOW(),
         status       = VALUES(status)`,
      [studentId, assignmentId, filePath, status]
    )

    res.json({
      success: true,
      message: status === 'late' ? 'Submitted late' : 'Submitted successfully',
      status
    })
  } catch (err) {
    console.error('Submit error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /assignments/:id/submission — student removes their submission
router.delete('/:id/submission', authMiddleware, studentOnly, async (req, res) => {
  try {
    await db.execute(
      `UPDATE submissions SET file_path = NULL, status = 'pending', submitted_at = NULL
       WHERE assignment_id = ? AND student_id = ?`,
      [req.params.id, req.user.id]
    )
    res.json({ success: true, message: 'Submission removed' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /assignments/student/all — all assignments for a student (for IMS calendar)
router.get('/student/all', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id
    if (!studentId) {
      return res.status(400).json({ success: false, error: 'Student ID missing' })
    }
    const [rows] = await db.execute(
      `SELECT a.*, c.course_name,
              COALESCE(s.status, 'pending') AS submission_status,
              s.submitted_at
       FROM assignments a
       JOIN courses c ON c.id = a.course_id
       JOIN student_courses sc ON sc.course_id = a.course_id AND sc.student_id = ?
       LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = ?
       ORDER BY a.deadline ASC`,
      [studentId, studentId]
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
