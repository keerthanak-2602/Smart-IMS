# RIT IMS — Email Integration System

Auto-fetches college emails, detects events, shows in IMS calendar, sends WhatsApp reminders.

---

## Folder Structure

```
email-integration/
├── server.js                    ← Express on port 5002
├── get-token.js                 ← ONE-TIME: get Gmail refresh token
├── schema-update.sql            ← Update events table in DB
├── .env.example                 → copy to .env
├── package.json
├── utils/
│   ├── db.js                    ← MySQL connection (rit_system)
│   ├── gmail.js                 ← OAuth2 client
│   └── keywords.js              ← Event keyword detection
├── services/
│   ├── emailService.js          ← Fetch + parse Gmail emails
│   └── reminderService.js       ← WhatsApp reminder sender
├── routes/
│   ├── auth.js                  ← Google OAuth flow
│   ├── emails.js                ← Fetch emails endpoint
│   └── events.js                ← Event CRUD + remind
└── ims-events-update/
    ├── DeadlineManager.jsx      ← Replace in IMS frontend
    └── DeadlineManager.module.css
```

---

## Setup Steps (Do in Order)

### Step 1 — Update Database
```bash
mysql -u root -p rit_system < schema-update.sql
```

### Step 2 — Install dependencies
```bash
npm install
```

### Step 3 — Configure .env
```bash
cp .env.example .env
```
Fill in:
- `DB_PASSWORD` — your MySQL password
- `GOOGLE_CLIENT_ID` — from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `TWILIO_SID`, `TWILIO_AUTH_TOKEN` — from Twilio

### Step 4 — Get Gmail Refresh Token (ONCE)
```bash
node get-token.js
```
Follow the instructions printed in terminal.
Copy the refresh token and add to `.env`:
```
GMAIL_REFRESH_TOKEN=1//04xxx...
GMAIL_USER=yourmail@rit.edu
```

### Step 5 — Start the server
```bash
node server.js
```
Open: http://localhost:5002

### Step 6 — Connect Gmail (ONCE)
Visit: http://localhost:5002/auth/google
Login with college Gmail → allow access.

### Step 7 — Update IMS Frontend
Replace these 2 files in `rit-ims-v2/frontend/src/pages/`:
- `DeadlineManager.jsx`
- `DeadlineManager.module.css`

(from `ims-events-update/` folder)

---

## How It Works

```
College Gmail inbox
      ↓
GET /emails/fetch (or auto every hour)
      ↓
Keyword detection (workshop, hackathon, seminar...)
      ↓
Date extraction (regex)
      ↓
Insert into events table (rit_system DB)
      ↓
IMS calendar Event Mode shows events (same for all students)
      ↓
Student clicks "Remind Me" → POST /events/remind/:id
      ↓
reminder_date = event_date - 2 days (saved in DB)
      ↓
Cron runs daily at 8 AM
      ↓
Sends WhatsApp to ALL students with phone numbers
```

---

## API Endpoints

```
GET  /                          → Setup guide (browser)
GET  /auth/google               → Connect Gmail
GET  /auth/google/callback      → OAuth callback
GET  /auth/status               → Check connection status

GET  /emails/fetch              → Fetch + process emails
GET  /emails/fetch?max=50       → Fetch 50 emails

GET  /events                    → All events
GET  /events/:id                → Single event
POST /events/remind/:id         → Set reminder
DELETE /events/remind/:id       → Cancel reminder
POST /events                    → Manual event add

GET  /test-reminder             → Trigger reminders now (demo)
```

---

## IMS Frontend Changes

In Event Mode (toggle on calendar):
- Shows events extracted from college emails
- Click event → see title, date, registration deadline, description
- "Remind Me" button → sets WhatsApp reminder for 2 days before deadline
- Purple events = reminder already set
- "Fetch Emails" button → manually fetch new emails

---

## Notes

- Events are the SAME for all students (college-wide)
- Academic assignments are per-student (enrolled courses only)
- Emails are fetched automatically every hour via cron
- WhatsApp reminders sent at 8 AM on reminder_date
- Duplicate events (same title + date) are automatically skipped
