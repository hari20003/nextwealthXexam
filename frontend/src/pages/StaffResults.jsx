import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../auth.css";

export default function StaffResults() {
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const staff = localStorage.getItem("staff");
    if (!staff) navigate("/staff-login");
  }, [navigate]);

  const loadResults = () => {
    fetch("https://nextwealthxexam.onrender.com/api/staff/results")
      .then(res => res.json())
      .then(data => setResults(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadResults();
  }, []);

  const downloadAnswerSheet = (id) => {
    window.open(`https://nextwealthxexam.onrender.com/api/staff/download/${id}`, "_blank");
  };

  const deleteResult = async (id) => {
    if (!window.confirm("Delete this submission?")) return;

    await fetch(`https://nextwealthxexam.onrender.com/api/staff/result/${id}`, {
      method: "DELETE"
    });

    loadResults();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-card" style={{ width: "95%", maxWidth: "1300px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
          <h2>📊 Student Results</h2>
          <button onClick={() => navigate("/staff-dashboard")}>⬅ Back</button>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#0072ff", color: "white" }}>
            <tr>
              <th style={th}>Reg No</th>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Phone</th>
              <th style={th}>Submitted</th>
              <th style={th}>Answer Sheet</th>
              <th style={th}>Delete</th>
            </tr>
          </thead>

          <tbody>
            {results.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: 20 }}>No data</td></tr>
            ) : results.map((s) => (
              <tr key={s.id}>
                <td style={td}>{s.reg_no}</td>
                <td style={td}>{s.student_name}</td>
                <td style={td}>{s.email}</td>
                <td style={td}>{s.phone}</td>
                <td style={td}>{new Date(s.submitted_at).toLocaleString()}</td>
                <td style={td}>
                  <button onClick={() => downloadAnswerSheet(s.id)}>⬇</button>
                </td>
                <td style={td}>
                  <button 
                    onClick={() => deleteResult(s.id)}
                    style={{ background: "#ff4d4f", color: "white" }}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
}

const th = { padding: 10, border: "1px solid #ddd" };
const td = { padding: 10, border: "1px solid #ddd", textAlign: "center" };
