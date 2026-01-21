import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "../components/Editor";
import axios from "axios";

import bgHero from "../images/bg-ai-human.webp";
import logoImg from "../images/nw_logo.jpeg";
import "../App.css";
import warningSound from "../assets/warning.mp3";


const API = "https://nextwealthxexam.onrender.com/api";

export default function Exam() {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const submittedRef = useRef(false);
  const audioRef = useRef(null);
  

  /* ================= STATES ================= */
  const [language, setLanguage] = useState("javascript");
  const [current, setCurrent] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [codes, setCodes] = useState([]);

  const [input, setInput] = useState("");
  const [consoleOut, setConsoleOut] = useState("");

  const [testcases, setTestcases] = useState([]);
  const [tcResult, setTcResult] = useState(null);

  const [isRunning, setIsRunning] = useState(false);
  const [runCooldown, setRunCooldown] = useState(0);

  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examOpen, setExamOpen] = useState(false);

  const q = questions[current - 1];

  /* ================= AUTH ================= */
  useEffect(() => {
    if (!localStorage.getItem("student")) navigate("/");
  }, [navigate]);
  useEffect(() => {
    audioRef.current = new Audio(warningSound);
    audioRef.current.volume = 1;

  // unlock sound after first click (browser rule)
  const unlock = () => {
    audioRef.current.play().then(() => {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }).catch(() => {});
    document.removeEventListener("click", unlock);
  };

  document.addEventListener("click", unlock);
}, []);

  /* ================= LOAD EXAM SETTINGS ================= */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/exam-settings`);
        if (!data.is_open) {
          alert("🚫 Exam not opened");
          navigate("/student-dashboard");
        } else {
          setExamOpen(true);
          setTimeLeft(Number(data.duration) * 60);

          // ✅ AUTO FULLSCREEN
          setTimeout(() => {
            if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch(() => {});
            }
          }, 800);
        }
      } catch {
        navigate("/student-dashboard");
      }
    })();
  }, [navigate]);

  /* ================= FINAL SUBMIT ================= */
  const finalSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    } catch {}

    const student = JSON.parse(localStorage.getItem("student"));

    const answers = questions.map((q, i) => ({
      qno: q.qno,
      language,
      code: codes[i] || ""
    }));

    await axios.post(`${API}/student/submit-exam`, {
      reg_no: student.reg_no,
      student_name: student.first_name + " " + student.last_name,
      answers
    });

    alert("✅ Exam submitted");
    navigate("/student-dashboard");
  }, [questions, codes, language, navigate]);

  /* ================= FORCE SUBMIT (SECURITY) ================= */
  const forceSubmit = useCallback(() => {
    if (!submittedRef.current) {
      alert("⚠️ Malpractice detected! Exam auto submitted.");
      finalSubmit();
    }
  }, [finalSubmit]);
  const playWarningSound = () => {
  if (audioRef.current) {
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }
};


  /* ================= SECURITY CONTROLS ================= */
  useEffect(() => {
    if (!examOpen) return;

    const handleVisibility = () => {
      if (document.hidden) {
        playWarningSound();
        forceSubmit();
      }
    };

    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        playWarningSound();
        forceSubmit();
      }
    };

    const handleBeforeUnload = (e) => {
      playWarningSound();
      forceSubmit();
      e.preventDefault();
      e.returnValue = "";
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreen);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreen);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [examOpen, forceSubmit]);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (!examOpen) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [examOpen]);

  /* ================= RUN COOLDOWN ================= */
  useEffect(() => {
    if (runCooldown <= 0) return;
    const i = setInterval(() => {
      setRunCooldown(c => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(i);
  }, [runCooldown]);

  /* ================= LOAD QUESTIONS ================= */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/questions`);
        data.sort((a, b) => a.qno - b.qno);
        setQuestions(data);

        const initialCodes = data.map(q =>
          q.type === "debug" ? (q.buggyCode || "") : ""
        );

        setCodes(initialCodes);
      } catch {
        alert("Failed to load questions");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ================= LOAD TEST CASES ================= */
  useEffect(() => {
    if (!q) return;
    axios.get(`${API}/student/testcases/${q.qno}`)
      .then(res => {
        setTestcases(res.data || []);
        setTcResult(null);
        setConsoleOut("");
      });
  }, [q]);

  /* ================= FORCE PYTHON ================= */
  useEffect(() => {
    if (q?.type === "debug") setLanguage("python");
  }, [q]);

  /* ================= RUN ================= */
  const executeCode = async () => {
    if (isRunning || runCooldown > 0) return;

    setIsRunning(true);
    setRunCooldown(10);
    setConsoleOut("⏳ Running...");
    setTcResult(null);

    try {
      const res = await axios.post(`${API}/run`, {
        language: q?.type === "debug" ? "python" : language,
        code: codes[current - 1],
        input,
        qno: q.qno
      });

      if (res.data.console) {
        setConsoleOut(
          res.data.console.stdout ||
          res.data.console.stderr ||
          "No output"
        );
      }

      if (res.data.type === "testcase") {
        setTcResult(res.data);
      }
    } catch {
      setConsoleOut("⚠️ Execution failed");
    }

    setIsRunning(false);
  };

  /* ================= AUTO SUBMIT ================= */
  useEffect(() => {
    if (timeLeft === 0 && examOpen && !submittedRef.current) {
      finalSubmit();
    }
  }, [timeLeft, examOpen, finalSubmit]);

  /* ================= TIME FORMAT ================= */
  const formatTime = () => {
    const h = Math.floor(timeLeft / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    const s = timeLeft % 60;
    const pad = n => (n < 10 ? "0" + n : n);
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  if (loading) return <h2 style={{ padding: 50 }}>⏳ Loading exam...</h2>;

  /* ================= UI ================= */
  return (
    <>
      <div className="fixed-bg" style={{ backgroundImage: `url(${bgHero})` }} />
      <div className="app-content">

        <header className="hero-top">
          <img src={logoImg} alt="logo" className="hero-logo" />
          <div>
            <h1>HumanXCode AI</h1>
            <p>Online Coding Examination</p>
          </div>

          <div className="exam-top-controls">
            <select
              className="exam-lang"
              value={language}
              onChange={e => setLanguage(e.target.value)}
              disabled={q?.type === "debug"}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>

            <div className={`timer-box ${timeLeft < 300 ? "danger" : ""}`}>
              ⏱ {formatTime()}
            </div>
          </div>
        </header>

        <div className="program-nav">
          {questions.map((_, idx) => (
            <button key={idx}
              className={current === idx + 1 ? "active" : ""}
              onClick={() => setCurrent(idx + 1)}>
              Program {idx + 1}
            </button>
          ))}
        </div>

        <div className="exam-layout">

          <div className="question-panel">
            <h3>{q?.title}</h3>

            <div
              className="q-desc"
              dangerouslySetInnerHTML={{ __html: q?.description || "" }}
            />

            <p> Total Test cases: <b>{testcases.length}</b></p>

            {testcases.map((tc, i) => (
              <div key={i} className="testcase-box">
                <b>Test {i + 1}</b>
                <pre>Input: {tc.input}</pre>
                <pre>Expected: {tc.expected_output}</pre>
              </div>
            ))}

            {tcResult && <p>✅ Passed {tcResult.passed} / {tcResult.total}</p>}
          </div>

          <div className="editor-panel">

            <Editor
              key={current}
              language={q?.type === "debug" ? "python" : language}
              value={codes[current - 1]}
              onChange={(v) => {
                const arr = [...codes];
                arr[current - 1] = v;
                setCodes(arr);
              }}
              isDark
            />

            <textarea
              className="input-box dark-input"
              placeholder="Custom input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <div className="editor-actions">
              <button onClick={executeCode} disabled={isRunning || runCooldown > 0}>
                {runCooldown > 0 ? `Wait ${runCooldown}s` : isRunning ? "Running..." : "▶ Run"}
              </button>

              {current < questions.length ? (
                <button onClick={() => setCurrent(p => p + 1)}>Save & Next</button>
              ) : (
                <button onClick={finalSubmit}>🏁 Final Submit</button>
              )}
            </div>
          </div>
        </div>

        <div className="output-panel">
          <h3>Console Output</h3>
          <pre>{consoleOut || "Run to see output..."}</pre>
        </div>

        {tcResult && (
          <div className="output-panel">
            <h3> Test Case Results</h3>
            {tcResult.report.map((r, i) => (
              <div key={i}
                style={{
                  padding: "8px",
                  margin: "8px 0",
                  borderRadius: 6,
                  background: r.status === "PASS" ? "#143d22" : "#3d1414",
                  color: "#fff"
                }}>
                Test {i + 1}: {r.status === "PASS" ? "✅ PASS" : "❌ FAIL"}
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  );
}
