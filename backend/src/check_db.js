import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, "users.db"));

db.serialize(() => {

  console.log("\n📦 TABLES:");
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    console.log(rows);
  });

  console.log("\n👤 USERS STRUCTURE:");
  db.all("PRAGMA table_info(users)", (err, rows) => {
    console.table(rows);
  });

  console.log("\n👤 USERS DATA:");
  db.all("SELECT id, reg_no, role, email, phone FROM users", (err, rows) => {
    console.table(rows);
  });

  console.log("\n📄 RESULTS DATA:");
  db.all("SELECT id, reg_no, student_name FROM results", (err, rows) => {
    console.table(rows);
  });

});
