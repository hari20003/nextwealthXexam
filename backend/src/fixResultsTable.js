
import db from "./db.js";

const queries = [
  "ALTER TABLE results ADD COLUMN answers TEXT",
  "ALTER TABLE results ADD COLUMN outputs TEXT",
  "ALTER TABLE results ADD COLUMN ai_review TEXT",
  "ALTER TABLE results ADD COLUMN submitted_at TEXT"
];

queries.forEach((q) => {
  db.run(q, (err) => {
    if (err) {
      console.log("⚠️", err.message);
    } else {
      console.log("✅ Executed:", q);
    }
  });
});

setTimeout(() => {
  console.log("\n🎉 Database fixed. Restart backend.");
  process.exit(0);
}, 1000);
