-- ByteQuest database schema (Cloudflare D1 / SQLite)
-- Run once:  npx wrangler d1 execute bytequest-db --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  phone           TEXT,
  class_level     TEXT,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'student',   -- 'student' | 'admin'
  xp              INTEGER NOT NULL DEFAULT 0,
  streak          INTEGER NOT NULL DEFAULT 0,
  best_streak     INTEGER NOT NULL DEFAULT 0,
  last_active     TEXT,                               -- YYYY-MM-DD (Asia/Dhaka)
  created_at      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS tracks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  emoji        TEXT NOT NULL DEFAULT '🚀',
  classes      TEXT NOT NULL,            -- label, e.g. "PG · Nursery · KG"
  ages         TEXT,                     -- label, e.g. "Age 3–6"
  cambridge    TEXT,                     -- curriculum alignment label
  tagline      TEXT,
  description  TEXT,
  color        TEXT NOT NULL DEFAULT 'lime',
  price_bdt    INTEGER NOT NULL DEFAULT 0,
  sort         INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS lessons (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  track_id     INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  summary      TEXT,
  sort         INTEGER NOT NULL DEFAULT 0,
  is_free      INTEGER NOT NULL DEFAULT 1,
  xp           INTEGER NOT NULL DEFAULT 20,
  kind         TEXT NOT NULL DEFAULT 'lesson',     -- lesson | game | project | exam
  minutes      INTEGER NOT NULL DEFAULT 10,
  video_url    TEXT,
  content_md   TEXT NOT NULL DEFAULT '',
  quiz_text    TEXT NOT NULL DEFAULT '',
  is_published INTEGER NOT NULL DEFAULT 1,
  updated_at   INTEGER
);
CREATE INDEX IF NOT EXISTS idx_lessons_track ON lessons(track_id, sort);

CREATE TABLE IF NOT EXISTS progress (
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  quiz_score   INTEGER,
  completed_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS enrollments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id      INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending',   -- pending | active | rejected
  method        TEXT,                              -- bkash | nagad | cash | manual
  sender_number TEXT,
  txn_id        TEXT,
  amount        INTEGER NOT NULL DEFAULT 0,
  note          TEXT,
  created_at    INTEGER NOT NULL,
  reviewed_at   INTEGER
);
CREATE INDEX IF NOT EXISTS idx_enroll_user ON enrollments(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_enroll_txn ON enrollments(txn_id) WHERE txn_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS bookings (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER,
  student_name   TEXT NOT NULL,
  guardian_name  TEXT,
  phone          TEXT NOT NULL,
  email          TEXT,
  class_level    TEXT,
  mode           TEXT NOT NULL,                    -- online | onsite
  focus          TEXT,
  preferred_days TEXT,
  preferred_time TEXT,
  message        TEXT,
  status         TEXT NOT NULL DEFAULT 'new',      -- new | contacted | confirmed | closed
  admin_note     TEXT,
  created_at     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

-- ---------- Default site settings (edit later in Admin → Settings) ----------
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('brand_name',      'ByteQuest'),
  ('tagline',         'Cambridge-aligned coding quests from PG to O Level'),
  ('teacher_name',    'Your Name'),
  ('teacher_title',   'Computer Science Teacher · Cambridge O Level & IGCSE'),
  ('teacher_bio',     'I teach coding the way games teach you: small wins, quick feedback, and a boss level at the end. From first-time PG coders to O Level exam candidates, every student gets a clear path and real projects.'),
  ('teacher_photo',   ''),
  ('phone',           '+8801XXXXXXXXX'),
  ('whatsapp',        '8801XXXXXXXXX'),
  ('email',           'hello@example.com'),
  ('facebook_url',    ''),
  ('youtube_url',     ''),
  ('bkash_number',    '01XXXXXXXXX'),
  ('nagad_number',    '01XXXXXXXXX'),
  ('payment_note',    'Use "Send Money" to the personal number, then paste the Transaction ID (TrxID). Access unlocks after I verify it, usually within a few hours.'),
  ('onsite_location', 'Dhaka (area to be confirmed)'),
  ('online_fee',      '3,500'),
  ('online_fee_note', 'per month · 8 live classes · Google Meet / Zoom'),
  ('onsite_fee',      '5,000'),
  ('onsite_fee_note', 'per month · 8 classes · small group or 1:1'),
  ('announcement',    '🎉 New O Level 2210 Paper 2 practice quests are live!');

-- ---------- Learning tracks (class bands) ----------
INSERT OR IGNORE INTO tracks (slug, title, emoji, classes, ages, cambridge, tagline, description, color, price_bdt, sort) VALUES
  ('tiny-coders',      'Tiny Coders',      '🧸', 'PG · Nursery · KG', 'Age 3–6',  'Cambridge Early Years · pre-coding',
   'Tap, sort, and steer the robot.',
   'Screen-light, play-first logic: patterns, sequences, directions and simple instructions. Parents sit alongside and play the games together.',
   'sun', 1500, 1),
  ('little-explorers', 'Little Explorers', '🧭', 'Class 1 – 3', 'Age 6–9', 'Cambridge Primary Computing · Stages 1–3',
   'Algorithms, loops and bugs (the fun kind).',
   'Kids learn what an algorithm is, write step-by-step instructions, spot and fix bugs, and use loops to make robots do more with fewer blocks.',
   'sky', 2000, 2),
  ('junior-builders',  'Junior Builders',  '🛠️', 'Class 4 – 6', 'Age 9–12', 'Cambridge Primary Computing · Stages 4–6',
   'From blocks to real Python.',
   'Variables, inputs, decisions and loops: first in block thinking, then in real Python and HTML. Every module ends in a mini project they can show off.',
   'lime', 2500, 3),
  ('code-creators',    'Code Creators',    '⚡', 'Class 7 – 8', 'Age 12–14', 'Cambridge Lower Secondary Computing (0860)',
   'Build games, websites and data apps.',
   'Python fundamentals, lists and functions, websites with HTML/CSS/JS, plus how networks and data work. Prepares students for O Level Computer Science.',
   'pink', 3000, 4),
  ('olevel-cs',        'O Level CS 2210',  '🎓', 'Class 9 – 11', 'Age 14–17', 'Cambridge O Level Computer Science 2210 · IGCSE 0478',
   'Boss level: exam-ready theory + Paper 2 programming.',
   'Full Paper 1 (Computer Systems) and Paper 2 (Algorithms, Programming & Logic) coverage: data representation, hardware, networks, security, pseudocode, trace tables, SQL and logic gates, with exam-style practice.',
   'violet', 5000, 5);
