import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem("student");
    if (!data) navigate("/");
    else setStudent(JSON.parse(data));
  }, [navigate]);

  if (!student) return null;

  return (
    <div style={{ padding: 30 }}>
      <h2>My Profile</h2>
      <p><b>Reg No:</b> {student.reg_no}</p>
      <p><b>Name:</b> {student.first_name} {student.last_name}</p>
      <p><b>Email:</b> {student.email}</p>
      <p><b>Phone:</b> {student.phone}</p>

      <button onClick={() => navigate("/student-dashboard")}>⬅ Back</button>
    </div>
  );
}

export default Profile;
