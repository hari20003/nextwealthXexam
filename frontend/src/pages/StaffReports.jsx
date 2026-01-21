import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../auth.css";
import "../App.css";

export default function StaffReports() {
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  /* ================= PROTECT ROUTE ================= */
  useEffect(() => {
    const staff = localStorage.getItem("staff");
    if (!staff) {
      navigate("/staff-login");
      return;
    }
    loadResults();
  }, [navigate]);

  /* ================= LOAD RESULTS ================= */
  const loadResults = async () => {
    try {
      const res = await fetch("https://nextwealthxexam.onrender.com/api/staff/results");
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load results failed:", err);
    }
  };

  /* ================= DOWNLOAD TXT ================= */
  const downloadAnswerSheet = (id) => {
    window.open(`https://nextwealthxexam.onrender.com/api/staff/download/${id}`, "_blank");
  };

  /* ================= DOWNLOAD EXCEL ================= */
  const downloadExcel = () => {
    window.open("https://nextwealthxexam.onrender.com/api/staff/download-excel", "_blank");
  };

  /* ================= DELETE ================= */
  const deleteResult = async (id) => {
    if (!window.confirm("Are you sure you want to delete this submission?")) return;

    try {
      const res = await fetch(`https://nextwealthxexam.onrender.com/api/staff/result/${id}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.msg || "Delete failed");
        return;
      }

      alert("✅ Deleted successfully");
      loadResults();

    } catch (err) {
      console.error(err);
      alert("Server error while deleting");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="reports-root">
      <div className="reports-card">

        {/* HEADER */}
        <div className="reports-header">
          <div>
            <h2>Student Reports</h2>
            <p className="reports-sub">HumanXCode AI – Examination Results</p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="excel-btn" onClick={downloadExcel}>
              📥 Download Excel
            </button>

            <button className="back-btn" onClick={() => navigate("/staff-dashboard")}>
              ⬅ Back
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Reg No</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Marks</th>
                <th>Submitted At</th>
                <th>Answer Sheet</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: 25, opacity: 0.7 }}>
                    No submissions yet.
                  </td>
                </tr>
              ) : results.map((r) => (
                <tr key={r.id}>
                  <td>{r.reg_no}</td>
                  <td>{r.student_name}</td>
                  <td>{r.email || "—"}</td>
                  <td>{r.phone || "—"}</td>

                  <td style={{ fontWeight: "bold", color: "#22c55e" }}>
                    {r.total_marks} / {r.max_marks}
                  </td>

                  <td>{new Date(r.submitted_at).toLocaleString()}</td>

                  <td>
                    <button
                      className="download-btn"
                      onClick={() => downloadAnswerSheet(r.id)}
                    >
                      ⬇ TXT
                    </button>
                  </td>

                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => deleteResult(r.id)}
                    >
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>
    </div>
  );
}
