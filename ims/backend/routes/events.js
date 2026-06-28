const express = require('express')
const router  = express.Router()
const db      = require('../db')

// GET /events — fetch from rit_system DB (inserted by email-integration service)
router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
         id, title, type,
         DATE_FORMAT(date, '%Y-%m-%d') AS date,
         DATE_FORMAT(registration_deadline, '%Y-%m-%d') AS deadline,
         description, source_email,
         remind, reminder_date
       FROM events
       ORDER BY date ASC`
    )
    if (!rows.length) {
      return res.json({
        success: true,
        source: 'dummy',
        data: [
          { id:1, title:'AI Workshop',      date:'2026-04-12', deadline:'2026-04-10', description:'AI & ML workshop.', type:'event', remind:false },
          { id:2, title:'TCS Campus Drive', date:'2026-04-15', deadline:'2026-04-13', description:'TCS recruitment drive.', type:'event', remind:false },
          { id:3, title:'Hackathon 2026',   date:'2026-04-18', deadline:'2026-04-15', description:'24-hour hackathon.', type:'event', remind:false },
          { id:4, title:'Sports Day',       date:'2026-04-20', deadline:'2026-04-18', description:'Annual sports day.', type:'event', remind:false },
          { id:5, title:'Internal Exam 1',  date:'2026-04-22', deadline:null,         description:'Mid semester exams.', type:'exam', remind:false },
        ]
      })
    }
    res.json({ success: true, source: 'database', data: rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
