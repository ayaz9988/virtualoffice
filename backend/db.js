import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'data.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    zoom_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL UNIQUE REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT,
    topic TEXT,
    zoom_meeting_id TEXT,
    zoom_password TEXT,
    zoom_start_url TEXT,
    zoom_join_url TEXT,
    is_open INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
try {
  db.exec(`
    ALTER TABLE rooms ADD COLUMN deleted_at DATETIME;
  `);
} catch {}

db.exec(`
  CREATE TABLE IF NOT EXISTS waiting_entries (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES rooms(id),
    student_id TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'waiting',
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS room_sessions (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES rooms(id),
    student_id TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'active',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    left_at DATETIME
  )
`);



export default db;
