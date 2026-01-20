const bcrypt = require("bcrypt");
const db = require("./db");

async function createStaff() {
  const password = await bcrypt.hash("admin123", 10);

  db.run(
    `INSERT INTO users 
     (reg_no, role, first_name, last_name, email, phone, password)
     VALUES (?, 'staff', ?, ?, ?, ?, ?)`,
    ["STAFF-001", "Admin", "User", "admin@test.com", "9999999999", password],
    () => {
      console.log("Staff user created");
    }
  );
}

createStaff();
