import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../App.css";

import logo from "../images/nw_logo.jpeg"; // change if your logo name is different

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const data = localStorage.getItem("student");
    if (!data) navigate("/");
    else setStudent(JSON.parse(data));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("student");
    navigate("/");
  };

  if (!student) return null;

  return (
    <div className="dash-main">

      {/* ===== TOP BAR ===== */}
      <div className="dash-topbar">
        <img src={logo} alt="logo" className="dash-logo" />

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* ===== DASHBOARD GRID ===== */}
      <div className="dash-container">

        {/* USER */}
        <div className="dash-card user-box">
          <h2> Hello, {student.first_name}</h2>
          <p>Welcome to HumanXCode AI</p>
          <p><b>Reg No:</b> {student.reg_no}</p>
          <p><b>Email:</b> {student.email}</p>
        </div>

        {/* QUOTE */}
        <div className="dash-card quote-box">
          <h3>💡 Quote of the Day</h3>
          <p>
            "Success is not final, failure is not fatal.
            It is the courage to continue that counts."
          </p>
        </div>

        {/* TAKE EXAM */}
        <div className="dash-card exam-box" onClick={() => navigate("/exam")}>
          <h2>Take Exam</h2>
          <p>Start your coding assessment</p>
        </div>

        {/* PROFILE */}
        <div className="dash-card profile-box">
          <h2> View Profile</h2>
          <p><b>Name:</b> {student.first_name} {student.last_name}</p>
          <p><b>Phone:</b> {student.phone}</p>
        </div>

        {/* CALENDAR */}
        <div className="dash-card calendar-box">
          <h2>📅 Calendar</h2>

          <div className="calendar-wrapper">
            <Calendar onChange={setDate} value={date} />
          </div>
        </div>

      </div>
    </div>
  );
}
