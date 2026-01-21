import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../auth.css";
import logo from "../images/nw_logo.jpeg";   // ✅ add logo

const API = "https://nextwealthxexam.onrender.com/";

function StudentRegister() {
  const [first_name, setFirst] = useState("");
  const [last_name, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!first_name || !last_name || !email || !phone || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await fetch(`${API}/student/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name,
          last_name,
          email,
          phone,
          password
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Registered Successfully!\nYour Reg No: " + data.reg_no);
        navigate("/");
      } else {
        alert(data.msg || "Registration failed");
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

        <h2>Student Registration</h2>
        <p className="auth-subtitle">Create your account to start the exam</p>

        <input 
          placeholder="First Name" 
          value={first_name}
          onChange={e => setFirst(e.target.value)} 
        />

        <input 
          placeholder="Last Name" 
          value={last_name}
          onChange={e => setLast(e.target.value)} 
        />

        <input 
          placeholder="Email" 
          value={email}
          onChange={e => setEmail(e.target.value)} 
        />

        <input 
          placeholder="Phone" 
          value={phone}
          onChange={e => setPhone(e.target.value)} 
        />

        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={e => setPassword(e.target.value)} 
        />

        <button onClick={handleRegister}>Register</button>

        <div className="auth-links">
          <p>Already have an account? <Link to="/">Login</Link></p>
        </div>

      </div>
    </div>
  );
}

export default StudentRegister;
