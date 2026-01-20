import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../App.css";

import logo from "../images/nw_logo.jpeg";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const staff = localStorage.getItem("staff");
    if (!staff) navigate("/staff-login");
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("staff");
    navigate("/staff-login");
  };

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
          <h2> Staff Panel</h2>
          <p>HumanXCode AI Examination System</p>
          <p><b>Role:</b> Staff</p>
        </div>

        {/* QUOTE */}
        <div className="dash-card quote-box">
          <h3>💡 Quote of the Day</h3>
          <p>
            "A good teacher can inspire hope, ignite imagination, and instill a love of learning."
          </p>
        </div>

        {/* VIEW REPORT */}
        <div
          className="dash-card exam-box"
          onClick={() => navigate("/staff-reports")}
        >
          <h2> View Student Reports</h2>
          <p>Check exam submissions and performance</p>
        </div>

        {/* SET QUESTION */}
        <div
          className="dash-card profile-box clickable"
          onClick={() => navigate("/staff-questions")}
          role="button"
        >
          <h2>📝 Set Question Paper</h2>
          <p>Create and update exam questions</p>
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
