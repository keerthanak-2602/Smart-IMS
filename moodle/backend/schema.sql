-- ============================================================
--  RIT System — Full Schema (Moodle + IMS shared DB)
--  Run: mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS rit_system
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE rit_system;

-- ── Departments ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

-- ── Students ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(120) NOT NULL,
  register_number VARCHAR(50)  UNIQUE NOT NULL,
  password        VARCHAR(255) NOT NULL,
  phone_number    VARCHAR(20),
  department_id   INT,
  cgpa            DECIMAL(3,2) DEFAULT 0.00,
  attendance      DECIMAL(5,2) DEFAULT 0.00,
  arrears         INT          DEFAULT 0,
  leaves_taken    INT          DEFAULT 0,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- ── Faculty ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faculty (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(120) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  department VARCHAR(50)
);

-- ── Courses ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  course_name   VARCHAR(120) NOT NULL,
  department_id INT NULL,
  is_common     BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- ── Student ↔ Course enrollment ──────────────────────────
CREATE TABLE IF NOT EXISTS student_courses (
  student_id INT NOT NULL,
  course_id  INT NOT NULL,
  PRIMARY KEY (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id)  REFERENCES courses(id)  ON DELETE CASCADE
);

-- ── Faculty ↔ Course ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS faculty_courses (
  faculty_id INT NOT NULL,
  course_id  INT NOT NULL,
  PRIMARY KEY (faculty_id, course_id),
  FOREIGN KEY (faculty_id) REFERENCES faculty(id)  ON DELETE CASCADE,
  FOREIGN KEY (course_id)  REFERENCES courses(id)  ON DELETE CASCADE
);

-- ── Assignments ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  course_id   INT NOT NULL,
  faculty_id  INT,
  deadline    DATETIME NOT NULL,
  moodle_link VARCHAR(500) DEFAULT '',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id)  REFERENCES courses(id),
  FOREIGN KEY (faculty_id) REFERENCES faculty(id)
);

-- ── Submissions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  student_id    INT NOT NULL,
  assignment_id INT NOT NULL,
  file_path     VARCHAR(500),
  submitted_at  DATETIME,
  status        ENUM('pending','submitted','late') DEFAULT 'pending',
  UNIQUE KEY uq_student_assignment (student_id, assignment_id),
  FOREIGN KEY (student_id)    REFERENCES students(id)    ON DELETE CASCADE,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);

-- ── Events (IMS Calendar) ────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  title                 VARCHAR(200) NOT NULL,
  type                  VARCHAR(50)  DEFAULT 'event',
  course_id             INT NULL,
  date                  DATE NOT NULL,
  registration_deadline DATE NULL,
  description           TEXT,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  Seed Data
-- ============================================================

INSERT IGNORE INTO departments (id, name) VALUES
  (1, 'CSE'), (2, 'MECH'), (3, 'ECE');

INSERT IGNORE INTO faculty (id, name, email, password, department) VALUES
  (1, 'Dr. Kumar',  'kumar@rit.edu',  '1234', 'CSE'),
  (2, 'Dr. Meena',  'meena@rit.edu',  '1234', 'CSE'),
  (3, 'Dr. Raj',    'raj@rit.edu',    '1234', 'MECH'),
  (4, 'Dr. Priya',  'priya@rit.edu',  '1234', 'ECE');

INSERT IGNORE INTO courses (id, course_name, department_id, is_common) VALUES
  (1, 'CS23411_DBMS',            1, FALSE),
  (2, 'CS23421_DBMS_LAB',        1, FALSE),
  (3, 'CS23301_Operating_Systems',1, FALSE),
  (4, 'ME23101_Thermodynamics',  2, FALSE),
  (5, 'MA23101_Mathematics',     NULL, TRUE);

INSERT IGNORE INTO students (id, name, register_number, password, phone_number, department_id, cgpa, attendance) VALUES
  (1,  'Lingeshwar P',   '21CSR101', '1234', '+919876500001', 1, 8.4, 87),
  (2,  'Aravind S',      '21CSR102', '1234', '+919876500002', 1, 7.9, 91),
  (3,  'Priya M',        '21CSR103', '1234', '+919876500003', 1, 9.1, 95),
  (4,  'Rahul K',        '21CSR104', '1234', '+919876500004', 1, 7.5, 82),
  (5,  'Sneha R',        '21CSR105', '1234', '+919876500005', 1, 8.8, 88),
  (6,  'Karthik M',      '21MER101', '1234', '+919876500006', 2, 7.2, 79),
  (7,  'Divya S',        '21MER102', '1234', '+919876500007', 2, 8.1, 90),
  (8,  'Arjun T',        '21ECR101', '1234', '+919876500008', 3, 7.8, 85);

-- CSE students → CSE courses + Math
INSERT IGNORE INTO student_courses VALUES
  (1,1),(1,2),(1,3),(1,5),
  (2,1),(2,2),(2,3),(2,5),
  (3,1),(3,2),(3,3),(3,5),
  (4,1),(4,2),(4,3),(4,5),
  (5,1),(5,2),(5,3),(5,5);

-- MECH students → MECH courses + Math
INSERT IGNORE INTO student_courses VALUES
  (6,4),(6,5),
  (7,4),(7,5);

-- ECE students → Math
INSERT IGNORE INTO student_courses VALUES
  (8,5);

-- Faculty course assignments
INSERT IGNORE INTO faculty_courses VALUES
  (1,1),(1,2),(1,5),
  (2,3),
  (3,4),
  (4,5);

-- Assignments
INSERT IGNORE INTO assignments (id, title, description, course_id, faculty_id, deadline, moodle_link) VALUES
  (1, 'DBMS Assignment 1 — Normalization', 'Solve all normalization problems. Submit as PDF.', 1, 1, '2026-04-10 23:59:00', 'https://moodle.rit.edu/a/1'),
  (2, 'DBMS Lab Report — ER Diagrams',     'Create ER diagrams for given scenarios.',         2, 1, '2026-04-08 23:59:00', 'https://moodle.rit.edu/a/2'),
  (3, 'OS Assignment — Process Scheduling','Compare FCFS, SJF, Round Robin algorithms.',      3, 2, '2026-04-12 23:59:00', 'https://moodle.rit.edu/a/3'),
  (4, 'Thermodynamics Assignment 1',       'Heat transfer problems. Show all calculations.',  4, 3, '2026-04-18 23:59:00', 'https://moodle.rit.edu/a/4'),
  (5, 'Mathematics — Matrix Problems',     'Solve matrix problems from chapter 3.',           5, 1, '2026-04-22 23:59:00', 'https://moodle.rit.edu/a/5');

-- Pending submissions auto-created for all enrolled students
INSERT IGNORE INTO submissions (student_id, assignment_id, status) VALUES
  (1,1,'submitted'),(2,1,'pending'),(3,1,'pending'),(4,1,'pending'),(5,1,'pending'),
  (1,2,'pending'),(2,2,'submitted'),(3,2,'pending'),(4,2,'pending'),(5,2,'pending'),
  (1,3,'pending'),(2,3,'pending'),(3,3,'submitted'),(4,3,'pending'),(5,3,'pending'),
  (6,4,'pending'),(7,4,'submitted'),
  (1,5,'pending'),(2,5,'pending'),(3,5,'pending'),(4,5,'submitted'),(5,5,'pending'),
  (6,5,'pending'),(7,5,'pending'),(8,5,'pending');

-- Events
INSERT IGNORE INTO events (title, type, date, registration_deadline, description) VALUES
  ('AI Workshop',      'event', '2026-04-12', '2026-04-10', 'AI & ML workshop. Register via student portal.'),
  ('TCS Campus Drive', 'event', '2026-04-15', '2026-04-13', 'TCS placement drive for final year students.'),
  ('Hackathon 2026',   'event', '2026-04-18', '2026-04-15', '24-hour hackathon. Teams of 4.'),
  ('Internal Exam 1',  'exam',  '2026-04-20', NULL,         'Mid semester internal examinations.');
