import { BrowserRouter, Routes, Route } from "react-router-dom";
import Profile from "./pages/Profile";
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";
import StaffLogin from "./pages/StaffLogin";
import StudentDashboard from "./pages/StudentDashboard";
import Exam from "./pages/Exam";
import StaffDashboard from "./pages/StaffDashboard";
import StaffReports from "./pages/StaffReports";
import StaffQuestions from "./pages/StaffQuestions";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentLogin />} />
        <Route path="/student-register" element={<StudentRegister />} />
        <Route path="/staff-login" element={<StaffLogin />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/exam" element={<Exam />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/staff-reports" element={<StaffReports />} />
        <Route path="/staff-questions" element={<StaffQuestions />} />


      </Routes>
    </BrowserRouter>
  );
}

export default App;
