import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, "../users.db"));

db.serialize(async () => {

  console.log("📦 Initializing database...");

  // ✅ Enable foreign keys
  db.run(`PRAGMA foreign_keys = ON`);

  /* ================= USERS ================= */

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reg_no TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student','staff')),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  /* ================= QUESTIONS ================= */

  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      qno INTEGER PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL CHECK(type IN ('coding','debug')) DEFAULT 'coding',
      buggyCode TEXT DEFAULT '',
      created_at TEXT NOT NULL
    )
  `);

  // Pre-create Question slots 1–4
  for (let i = 1; i <= 4; i++) {
    db.run(
      `INSERT OR IGNORE INTO questions 
       (qno, title, description, type, buggyCode, created_at)
       VALUES (?, '', '', 'coding', '', datetime('now'))`,
      [i]
    );
  }

  /* ================= TEST CASES ================= */

  db.run(`
    CREATE TABLE IF NOT EXISTS test_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      qno INTEGER NOT NULL,
      input TEXT NOT NULL,
      expected_output TEXT NOT NULL,
      marks INTEGER DEFAULT 1,
      FOREIGN KEY(qno) REFERENCES questions(qno) ON DELETE CASCADE
    )
  `);

  /* ================= RESULTS ================= */

  db.run(`
    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reg_no TEXT NOT NULL,
      student_name TEXT NOT NULL,
      answers TEXT NOT NULL,
      outputs TEXT,
      ai_review TEXT,
      submitted_at TEXT NOT NULL
    )
  `);

  /* ================= EXAM SETTINGS ================= */

  db.run(`
    CREATE TABLE IF NOT EXISTS exam_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      is_open INTEGER DEFAULT 0,
      duration INTEGER DEFAULT 30,
      updated_at TEXT
    )
  `);

  // Ensure only one exam settings row
  db.get("SELECT id FROM exam_settings WHERE id = 1", (err, row) => {
    if (err) {
      console.error("❌ Exam settings check failed:", err);
      return;
    }

    if (!row) {
      db.run(`
        INSERT INTO exam_settings (id, is_open, duration, updated_at)
        VALUES (1, 0, 30, datetime('now'))
      `);
      console.log("⏱ Default exam settings created");
    } else {
      console.log("⏱ Exam settings loaded");
    }
  });

  /* ================= DEFAULT STAFF ================= */

  db.get("SELECT id FROM users WHERE role='staff' LIMIT 1", async (err, row) => {
    if (err) {
      console.error("❌ Staff check failed:", err);
      return;
    }

    if (!row) {
      const hash = await bcrypt.hash("12345", 10);

      db.run(
        `INSERT INTO users 
         (reg_no, role, first_name, last_name, email, phone, password)
         VALUES (?, 'staff', ?, ?, ?, ?, ?)`,
        ["STAFF-001", "MS", "Dhoni", "msdhoni@gmail.com", "9999999999", hash]
      );

      console.log("✅ Default staff created -> msdhoni@gmail.com / 12345");
    } else {
      console.log("👨‍🏫 Staff account exists");
    }
  });

});

export default db;
