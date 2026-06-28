require('dotenv').config()
const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'rit_system',
  waitForConnections: true,
  connectionLimit:    10,
})

pool.getConnection()
  .then(c => { console.log('✅  MySQL connected to rit_system'); c.release() })
  .catch(e => console.error('❌  MySQL error:', e.message))

module.exports = pool
