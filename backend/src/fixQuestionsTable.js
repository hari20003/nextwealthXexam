import db from "./db.js";

const queries = [

  `CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    qno INTEGER UNIQUE,
    title TEXT,
    description TEXT,
    type TEXT,
    buggyCode TEXT,
    created_at TEXT
  )`

];

queries.forEach(q => {
  db.run(q, err => {
    if (err) console.error("❌ Error:", err.message);
    else console.log("✅ Executed:", q.split("(")[0]);
  });
});

setTimeout(() => {
  console.log("\n🎉 QUESTIONS table ready. Restart backend.");
  process.exit(0);
}, 1000);
