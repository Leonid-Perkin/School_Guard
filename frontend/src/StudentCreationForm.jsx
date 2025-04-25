import { useState } from "react";
import axios from "axios";

function StudentCreationForm({ token, setStudents }) {
  const [newStudent, setNewStudent] = useState({ fio: "", pass_id: "" });
  const [error, setError] = useState("");

  const handleCreateStudent = async () => {
    if (!newStudent.fio || !newStudent.pass_id) {
      setError("Заполните ФИО и ID пропуска!");
      return;
    }

    const studentData = {
      ...newStudent,
      last_pass_date: new Date().toISOString().split("T")[0],
      gate_pass: false,
      turnstile_pass: false,
      cabinet_pass: false,
      cabinet_number: 0,
    };

    try {
      const response = await axios.post("http://127.0.0.1:8000/students", studentData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStudents((prevStudents) => [...prevStudents, response.data]);
      setNewStudent({ fio: "", pass_id: "" });
      setError("");
      alert("Ученик добавлен!");
    } catch (error) {
      setError("Ошибка создания ученика: " + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div>
      <h3>Добавить ученика</h3>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <input
        type="text"
        placeholder="ФИО"
        value={newStudent.fio}
        onChange={(e) => setNewStudent((prev) => ({ ...prev, fio: e.target.value }))}
      />
      <input
        type="text"
        placeholder="ID пропуска"
        value={newStudent.pass_id}
        onChange={(e) => setNewStudent((prev) => ({ ...prev, pass_id: e.target.value }))}
      />
      <button onClick={handleCreateStudent}>Добавить</button>
    </div>
  );
}

export default StudentCreationForm;