# RIT IMS v2 — Institute Management System

Fully integrated with Moodle via shared `rit_system` database.

---

## Project Structure

```
rit-ims-v2/
├── backend/
│   ├── server.js           ← Express on port 5000
│   ├── db.js               ← MySQL → rit_system
│   ├── reminders.js        ← WhatsApp auto-reminders
│   ├── package.json
│   ├── .env.example
│   └── routes/
│       ├── auth.js         ← Login by register_number
│       ├── dashboard.js    ← Student stats
│       ├── assignments.js  ← Filtered by enrollment
│       ├── events.js       ← Dummy events (integrate later)
│       └── whatsapp.js     ← Twilio WhatsApp
│
└── frontend/
    ├── index.html
    ├── vite.config.js      ← Port 3000, proxies to 5000
    ├── package.json
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── components/
        │   ├── Layout.jsx + Layout.module.css
        │   ├── Sidebar.jsx + Sidebar.module.css
        │   └── Topbar.jsx + Topbar.module.css
        └── pages/
            ├── Login.jsx + Login.module.css
            ├── Dashboard.jsx + Dashboard.module.css
            ├── DeadlineManager.jsx + DeadlineManager.module.css
            └── PlaceholderPage.jsx + PlaceholderPage.module.css
```

---

## Setup

### 1. Backend
```bash
cd backend
cp .env.example .env      # fill in DB_PASSWORD + Twilio keys
npm install
node server.js            # → http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev               # → http://localhost:3000
```

---

## Login
Use register number from `rit_system.students` table.

| Register No | Password |
|-------------|----------|
| 21CSR101    | 1234     |
| 21CSR102    | 1234     |
| 21MER101    | 1234     |

---

## Key Features

| Feature | Details |
|---------|---------|
| Login | Register number + password from rit_system |
| Dashboard stats | Real CGPA, attendance, arrears from DB |
| Calendar | Shows ONLY enrolled course assignments |
| Moodle redirect | Click assignment → opens Moodle page |
| Status sync | Reads from shared submissions table |
| WhatsApp | Fetches phone numbers from students table |
| Events | Dummy data (will integrate with DB later) |

---

## API Endpoints

```
POST /auth/login                     → login with register_number + password
GET  /dashboard/:studentId           → student stats
GET  /assignments?student_id=1       → filtered assignments with moodle redirect
POST /assignments/mark-submitted     → update submission status
GET  /events                         → dummy events
GET  /whatsapp/test                  → test WhatsApp
GET  /test-reminder                  → trigger reminders immediately (demo)
```

---

## Integration with Moodle

Both IMS and Moodle use `rit_system` database.
No sync needed — they read the same `submissions` table.

When a student submits in Moodle:
- `submissions.status` updates to `submitted`
- IMS calendar automatically shows it as submitted on next load

When student clicks "Submit in Moodle" in IMS:
- Opens `http://localhost:3001/course/:id/assignment/:id`
- Student submits file on Moodle
- IMS reflects it automatically
