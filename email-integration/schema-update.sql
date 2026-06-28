-- ============================================================
--  RIT IMS — Events Table Update for Email Integration
--  Run: mysql -u root -p rit_system < schema-update.sql
-- ============================================================

USE rit_system;

-- Add new columns to existing events table
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS source_email   VARCHAR(200) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS remind         BOOLEAN      DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_date  DATE         DEFAULT NULL;

-- If events table doesn't exist at all, create it fresh:
CREATE TABLE IF NOT EXISTS events (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  title                 VARCHAR(200)  NOT NULL,
  type                  VARCHAR(50)   DEFAULT 'event',
  date                  DATE          NOT NULL,
  registration_deadline DATE          NULL,
  description           TEXT,
  source_email          VARCHAR(200)  DEFAULT NULL,
  remind                BOOLEAN       DEFAULT FALSE,
  reminder_date         DATE          DEFAULT NULL,
  created_at            TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- Verify structure
DESCRIBE events;
