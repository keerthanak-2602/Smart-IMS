require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const path    = require('path')

const authRoutes        = require('./routes/auth')
const courseRoutes      = require('./routes/courses')
const assignmentRoutes  = require('./routes/assignments')

const app = express()

app.use(cors({ origin: 'http://localhost:3001' }))
app.use(express.json())

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
app.use('/auth',        authRoutes)
app.use('/courses',     courseRoutes)
app.use('/assignments', assignmentRoutes)

app.get('/', (_, res) => res.json({ status: 'RIT Moodle Backend running 🎓', time: new Date() }))

const PORT = process.env.PORT || 5001
app.listen(PORT, () => console.log(`🚀 Moodle Backend on http://localhost:${PORT}`))
