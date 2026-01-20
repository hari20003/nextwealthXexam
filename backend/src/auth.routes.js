const express = require("express");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const db = require("./db");

const router = express.Router();

/* ================= STUDENT REGISTER ================= */

router.post("/student/register", async (req, res) => {
  const { first_name, last_name, email, phone, password } = req.body;

  if (!first_name || !last_name || !email || !phone || !password) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  db.get(
    "SELECT * FROM users WHERE email = ? OR phone = ?",
    [email, phone],
    async (err, row) => {
      if (row) return res.status(400).json({ msg: "User already exists" });

      const reg_no = "STU-" + uuidv4().slice(0, 8).toUpperCase();
      const hash = await bcrypt.hash(password, 10);

      db.run(
        `INSERT INTO users 
         (reg_no, role, first_name, last_name, email, phone, password)
         VALUES (?, 'student', ?, ?, ?, ?, ?)`,
        [reg_no, first_name, last_name, email, phone, hash],
        () => {
          res.json({ msg: "Registered successfully", reg_no });
        }
      );
    }
  );
});

/* ================= STUDENT LOGIN ================= */

router.post("/student/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE email = ? AND role='student'",
    [email],
    async (err, user) => {
      if (!user) return res.status(401).json({ msg: "Invalid credentials" });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ msg: "Invalid credentials" });

      res.json({
        msg: "Login successful",
        reg_no: user.reg_no,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
      });
    }
  );
});

/* ================= STAFF LOGIN ================= */

router.post("/staff/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE email = ? AND role='staff'",
    [email],
    async (err, user) => {
      if (!user) return res.status(401).json({ msg: "Invalid staff credentials" });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ msg: "Invalid staff credentials" });

      res.json({ msg: "Staff login successful" });
    }
  );
});

module.exports = router;
