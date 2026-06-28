# RIT Moodle — Learning Management System

Full-stack Moodle-like LMS integrated with IMS via shared MySQL database.

---

## Project Structure

```
moodle/
├── backend/
│   ├── server.js           ← Express on port 5001
│   ├── db.js               ← MySQL pool
│   ├── schema.sql          ← Full DB schema + seed data
│   ├── .env.example
│   ├── package.json
│   ├── middleware/
│   │   └── auth.js         ← JWT middleware
│   ├── routes/
│   │   ├── auth.js         ← Student + Faculty login
│   │   ├── courses.js      ← Role-based course fetching
│   │   └── assignments.js  ← CRUD + file upload + submissions
│   └── uploads/            ← Submitted files stored here
│
└── frontend/
    ├── index.html
    ├── vite.config.js      ← Port 3001, proxies to 5001
    ├── package.json
    └── src/
        ├── App.jsx          ← All routes
        ├── api.js           ← Fetch helper + date utils
        ├── index.css        ← Moodle purple/blue theme
        ├── context/
        │   └── AuthContext.jsx
        ├── components/
        │   ├── Layout.jsx   ← Moodle sidebar + topbar
        │   └── Toast.jsx
        └── pages/
            ├── auth/Login.jsx           ← Student + Faculty tabs
            ├── student/
            │   ├── Dashboard.jsx        ← Course cards + mini calendar
            │   ├── CoursePage.jsx       ← Moodle-style sections sidebar
            │   └── AssignmentPage.jsx   ← Exact Moodle submission layout
            └── faculty/
                ├── FacultyDashboard.jsx
                ├── FacultyCourse.jsx    ← Assignment list + stats
                ├── CreateAssignment.jsx ← Add new assignment form
                └── FacultyAssignment.jsx← Submission table with filters
```

---

## Quick Start

### 1. Database

```bash
mysql -u root -p < backend/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # fill in DB_PASSWORD and JWT_SECRET
npm install
node server.js            # runs on http://localhost:5001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev               # runs on http://localhost:3001
```

---

## Login Credentials

### Students
| Register No | Password |
|-------------|----------|
| 21CSR101    | 1234     |
| 21CSR102    | 1234     |
| 21MER101    | 1234     |

### Faculty
| Email           | Password |
|-----------------|----------|
| kumar@rit.edu   | 1234     |
| meena@rit.edu   | 1234     |
| raj@rit.edu     | 1234     |

---

## API Endpoints

### Auth
| Method | Endpoint               |
|--------|------------------------|
| POST   | /auth/student/login    |
| POST   | /auth/faculty/login    |

### Courses
| Method | Endpoint     |
|--------|--------------|
| GET    | /courses/my  |
| GET    | /courses/:id |

### Assignments
| Method | Endpoint                              |
|--------|---------------------------------------|
| GET    | /assignments/course/:courseId         |
| GET    | /assignments/:id                      |
| POST   | /assignments                          |
| DELETE | /assignments/:id                      |
| GET    | /assignments/:id/submissions          |
| POST   | /assignments/:id/submit (multipart)   |
| DELETE | /assignments/:id/submission           |
| GET    | /assignments/student/all              |

---

## IMS Integration

The IMS app reads from the same `rit_system` database.

Update IMS `backend/routes/assignments.js` to query by student enrollment:

```js
// Replace the existing GET /assignments query with:
SELECT a.*, c.course_name,
       COALESCE(s.status, 'pending') AS status
FROM assignments a
JOIN courses c ON c.id = a.course_id
JOIN student_courses sc ON sc.course_id = a.course_id AND sc.student_id = ?
LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = ?
ORDER BY a.deadline ASC
```

When a student clicks a deadline in IMS calendar → redirect to:
```
http://localhost:3001/course/:courseId/assignment/:assignmentId
```

---

## Features

- ✅ JWT auth (student + faculty roles)
- ✅ Role-based course visibility
- ✅ Faculty: create assignments → auto creates pending rows for all enrolled students
- ✅ Student: submit files via drag-and-drop
- ✅ Late submission detection
- ✅ Faculty: view all submissions with filter (all / submitted / pending / late)
- ✅ File download for faculty
- ✅ Remove/edit submission
- ✅ Real Moodle-style UI (purple/blue theme, sidebar sections)
- ✅ Shared DB with IMS — no sync needed
