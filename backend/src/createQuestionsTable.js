import db from "./db.js";

db.run(`
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  description TEXT,
  type TEXT,
  buggyCode TEXT,
  created_at TEXT
)
`, (err) => {
  if (err) {
    console.error("❌ Failed to create questions table", err);
  } else {
    console.log("✅ questions table ready");
  }
});
