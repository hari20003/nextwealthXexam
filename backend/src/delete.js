import db from "./db.js";

console.log("⚠ Deleting all student results...");

db.serialize(() => {

  db.run("DELETE FROM results", function (err) {
    if (err) {
      console.error("❌ Failed to delete results:", err.message);
    } else {
      console.log(`✅ Deleted ${this.changes} student result records`);
    }
  });

  // Optional: reset auto increment
  db.run("DELETE FROM sqlite_sequence WHERE name='results'");

});

db.close(() => {
  console.log("🔒 Database connection closed");
});
