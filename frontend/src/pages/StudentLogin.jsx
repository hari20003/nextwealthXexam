import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../auth.css";
import logo from "../images/nw_logo.jpeg";   // ✅ add logo

const API = "http://localhost:4000/api";

function StudentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      const res = await fetch(`${API}/student/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("student", JSON.stringify(data));
        navigate("/student-dashboard");
      } else {
        alert(data.msg || "Login failed");
      }
    } catch {
      alert("Backend not reachable");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* ✅ LOGO */}
        <img src={logo} alt="HumanXCode AI" className="login-logo" />

        <h2>Student Login</h2>
        <p className="auth-subtitle">Login to continue to HumanXCode AI</p>

        <input 
          placeholder="Email" 
          value={email}
          onChange={e => setEmail(e.target.value)} 
        />

        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={e => setPassword(e.target.value)} 
        />

        <button onClick={handleLogin}>Login</button>

        <div className="auth-links">
          <p>New user? <Link to="/student-register">Register</Link></p>
          <p><Link to="/staff-login">Staff Login</Link></p>
        </div>

      </div>
    </div>
  );
}

export default StudentLogin;
