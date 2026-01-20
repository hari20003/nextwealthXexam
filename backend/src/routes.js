import express from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import db from "./db.js";
import { runFile } from "./runner.js";
import XLSX from "xlsx";
import fs from "fs";
import path from "path";

const router = express.Router();

/* ===================== AUTH ===================== */

router.post("/student/register", async (req, res) => {
  const { first_name, last_name, email, phone, password } = req.body;
  if (!first_name || !last_name || !email || !phone || !password)
    return res.status(400).json({ msg: "All fields required" });

  db.get("SELECT id FROM users WHERE email=? OR phone=?", [email, phone], async (_, row) => {
    if (row) return res.status(400).json({ msg: "User already exists" });

    const reg_no = "STU-" + uuidv4().slice(0, 8).toUpperCase();
    const hash = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (reg_no, role, first_name, last_name, email, phone, password)
       VALUES (?, 'student', ?, ?, ?, ?, ?)`,
      [reg_no, first_name, last_name, email, phone, hash],
      () => res.json({ msg: "Registered", reg_no })
    );
  });
});

router.post("/student/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email=? AND role='student'", [email], async (_, user) => {
    if (!user) return res.status(401).json({ msg: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ msg: "Invalid credentials" });

    res.json(user);
  });
});

router.post("/staff/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email=? AND role='staff'", [email], async (_, user) => {
    if (!user) return res.status(401).json({ msg: "Invalid staff credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ msg: "Invalid staff credentials" });

    res.json({ msg: "Staff login successful" });
  });
});

/* ===================== EXAM SETTINGS ===================== */

router.get("/exam-settings", (req, res) => {
  db.get("SELECT * FROM exam_settings WHERE id=1", (_, row) => res.json(row));
});

router.post("/staff/exam-settings", (req, res) => {
  const { is_open, duration } = req.body;

  db.run(
    `UPDATE exam_settings SET is_open=?, duration=?, updated_at=datetime('now') WHERE id=1`,
    [is_open ? 1 : 0, Number(duration)],
    () => res.json({ msg: "✅ Exam settings updated" })
  );
});

/* ===================== QUESTIONS ===================== */

router.post("/staff/set-question", (req, res) => {
  const { qno, title, description, type, buggyCode } = req.body;

  db.run(
    `INSERT INTO questions (qno,title,description,type,buggyCode,created_at)
     VALUES (?,?,?,?,?,?)
     ON CONFLICT(qno) DO UPDATE SET
     title=excluded.title,
     description=excluded.description,
     type=excluded.type,
     buggyCode=excluded.buggyCode`,
    [qno, title, description, type, buggyCode || "", new Date().toISOString()],
    () => res.json({ msg: `✅ Question ${qno} saved` })
  );
});

router.get("/questions", (req, res) => {
  db.all("SELECT * FROM questions ORDER BY qno", [], (_, rows) => res.json(rows || []));
});

/* ===================== TEST CASES ===================== */

router.get("/staff/testcases/:qno", (req, res) => {
  db.all("SELECT * FROM test_cases WHERE qno=?", [req.params.qno], (_, rows) => {
    res.json(rows || []);
  });
});

router.get("/student/testcases/:qno", (req, res) => {
  db.all(
    "SELECT id,input,expected_output,marks FROM test_cases WHERE qno=?",
    [req.params.qno],
    (_, rows) => res.json(rows || [])
  );
});

router.post("/staff/testcases", (req, res) => {
  const { qno, input, expected_output, marks } = req.body;

  db.run(
    `INSERT INTO test_cases (qno,input,expected_output,marks) VALUES (?,?,?,?)`,
    [qno, input, expected_output, Number(marks || 1)],
    err => {
      if (err) return res.status(500).json({ msg: "Insert failed" });
      res.json({ msg: "✅ Test case added" });
    }
  );
});

/* ✅ DELETE FIX */
router.delete("/staff/testcases/:id", (req, res) => {
  db.run("DELETE FROM test_cases WHERE id=?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ msg: "Server error while deleting" });
    if (this.changes === 0) return res.status(404).json({ msg: "Test case not found" });
    res.json({ msg: "🗑 Test case deleted successfully" });
  });
});

/* ===================== RUN ===================== */

router.post("/run", async (req, res) => {
  const { language, code, input, qno } = req.body;

  let consoleOut = { stdout: "", stderr: "" };

  try {
    const r = await runFile(language, code ?? "", input ?? "");
    consoleOut.stdout = r.stdout || "";
    consoleOut.stderr = r.stderr || "";
  } catch (e) {
    consoleOut.stderr = e.message;
  }

  if (!qno) return res.json({ execution: consoleOut });

  const testcases = await new Promise(resolve => {
    db.all("SELECT * FROM test_cases WHERE qno=?", [qno], (_, rows) => resolve(rows || []));
  });

  let passed = 0;
  let report = [];

  for (const tc of testcases) {
    try {
      const r = await runFile(language, code, tc.input);
      if ((r.stdout || "").trim() === (tc.expected_output || "").trim()) {
        passed++;
        report.push({ status: "PASS", marks: tc.marks });
      } else {
        report.push({ status: "FAIL", marks: 0 });
      }
    } catch {
      report.push({ status: "ERROR", marks: 0 });
    }
  }

  res.json({ type: "testcase", total: testcases.length, passed, report, console: consoleOut });
});

/* ===================== SUBMIT EXAM ===================== */

router.post("/student/submit-exam", async (req, res) => {
  const { reg_no, student_name, answers } = req.body;
  
  if (!Array.isArray(answers)) {
    return res.status(400).json({ msg: "answers must be an array" });
  }

  let evaluation = [];
  let totalMarks = 0;

  for (const ans of answers) {
    const testcases = await new Promise(resolve => {
      db.all("SELECT * FROM test_cases WHERE qno=?", [ans.qno], (_, rows) => resolve(rows || []));
    });

    let score = 0;
    let total = 0;

    for (const tc of testcases) {
      total += tc.marks;
      try {
        const r = await runFile("python", ans.code, tc.input);
        if ((r.stdout || "").trim() === (tc.expected_output || "").trim()) {
          score += tc.marks;
        }
      } catch {}
    }

    totalMarks += score;
    evaluation.push({ qno: ans.qno, score, total });
  }

  db.run(
    `INSERT INTO results (reg_no, student_name, answers, outputs, ai_review, submitted_at)
     VALUES (?,?,?,?,?,?)`,
    [
      reg_no,
      student_name,
      JSON.stringify(answers),
      JSON.stringify(evaluation),
      "Auto evaluated",
      new Date().toISOString()
    ],
    () => res.json({ msg: "✅ Exam evaluated", marks: totalMarks })
  );
});

/* ===================== STAFF RESULTS ===================== */

router.get("/staff/results", (req, res) => {
  db.all(`
    SELECT results.*, users.email, users.phone
    FROM results
    LEFT JOIN users ON users.reg_no = results.reg_no
    ORDER BY results.submitted_at DESC
  `, [], (_, rows) => {

    const finalRows = (rows || []).map(r => {
      let total_marks = 0;
      let max_marks = 0;

      try {
        const evals = JSON.parse(r.outputs || "[]");
        evals.forEach(q => {
          total_marks += Number(q.score || 0);
          max_marks += Number(q.total || 0);
        });
      } catch {}

      return { ...r, total_marks, max_marks };
    });

    res.json(finalRows);
  });
});

/* ===================== TXT DOWNLOAD ===================== */

router.get("/staff/download/:id", (req, res) => {
  db.get("SELECT * FROM results WHERE id=?", [req.params.id], async (err, row) => {
    if (err || !row) return res.status(404).send("Result not found");

    const answers = JSON.parse(row.answers || "[]");
    const outputs = JSON.parse(row.outputs || "[]");

    let txt = `HUMAN X CODE AI - EXAM REPORT\n`;
    txt += `====================================\n\n`;
    txt += `Reg No : ${row.reg_no}\n`;
    txt += `Name   : ${row.student_name}\n`;
    txt += `Date   : ${new Date(row.submitted_at).toLocaleString()}\n\n`;

    for (let i = 0; i < answers.length; i++) {
      const ans = answers[i];
      const evalData = outputs.find(o => o.qno === ans.qno) || {};
      
      // 🔹 Fetch question
      const question = await new Promise(resolve => {
        db.get("SELECT * FROM questions WHERE qno=?", [ans.qno], (_, q) => resolve(q));
      });

      // 🔹 Fetch test cases
      const testcases = await new Promise(resolve => {
        db.all("SELECT * FROM test_cases WHERE qno=?", [ans.qno], (_, tcs) => resolve(tcs || []));
      });

      txt += `------------------------------------\n`;
      txt += `QUESTION ${ans.qno}\n`;
      txt += `Title: ${question?.title || ""}\n\n`;
      txt += `Question Description:\n${question?.description || ""}\n\n`;

      txt += `Code Written by Student:\n`;
      txt += `${ans.code || "No code submitted"}\n\n`;

      txt += `Test Cases:\n`;
      testcases.forEach((tc, idx) => {
        txt += `  Test Case ${idx + 1}:\n`;
        txt += `    Input: ${tc.input}\n`;
        txt += `    Expected Output: ${tc.expected_output}\n`;
        txt += `    Marks: ${tc.marks}\n`;
      });

      txt += `\nScore: ${evalData.score || 0} / ${evalData.total || 0}\n\n`;
    }

    txt += `====================================\n`;
    txt += `End of Report\n`;

    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${row.reg_no}_exam_report.txt`
    );

    res.send(txt);
  });
});

/* ===================== DELETE RESULT ===================== */

router.delete("/staff/result/:id", (req, res) => {
  db.run("DELETE FROM results WHERE id = ?", [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ msg: "Server error while deleting" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ msg: "Result not found" });
    }

    res.json({ msg: "✅ Result deleted successfully" });
  });
});

/* ===================== EXCEL DOWNLOAD ===================== */

router.get("/staff/download-excel", (req, res) => {
  db.all(`
    SELECT results.*, users.email, users.phone
    FROM results
    LEFT JOIN users ON users.reg_no = results.reg_no
  `, [], (_, rows) => {

    const excelData = (rows || []).map(r => {
      let total_marks = 0;
      let max_marks = 0;

      try {
        const evals = JSON.parse(r.outputs || "[]");
        evals.forEach(q => {
          total_marks += Number(q.score || 0);
          max_marks += Number(q.total || 0);
        });
      } catch {}

      return {
        RegNo: r.reg_no,
        Name: r.student_name,
        Email: r.email || "",
        Phone: r.phone || "",
        Marks: total_marks,
        MaxMarks: max_marks,
        SubmittedAt: new Date(r.submitted_at).toLocaleString()
      };
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");

    const filePath = path.join(process.cwd(), "Student_Results.xlsx");
    XLSX.writeFile(wb, filePath);

    res.download(filePath, "Student_Results.xlsx", () => {
      fs.unlinkSync(filePath);
    });
  });
});

/* ===================== EXPORT ===================== */

export default router;
