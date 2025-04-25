import { useState } from "react";
import axios from "axios";

function StudentsTable({ token, students, setStudents }) {
  const [error, setError] = useState("");

  const handleEditStudent = async (pass_id, field, value) => {
    const updatedStudents = students.map((s) =>
      s.pass_id === pass_id ? { ...s, [field]: value } : s
    );
    const studentToUpdate = updatedStudents.find((s) => s.pass_id === pass_id);

    if (!studentToUpdate) {
      setError("Ученик не найден!");
      return;
    }

    try {
      await axios.put(
        `http://127.0.0.1:8000/students/${pass_id}`,
        studentToUpdate,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStudents(updatedStudents);
      setError("");
    } catch (error) {
      setError("Ошибка обновления ученика: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteStudent = async (pass_id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/students/${pass_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStudents(students.filter((student) => student.pass_id !== pass_id));
    } catch (error) {
      setError("Ошибка удаления ученика: " + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div>
      <h3>Ученики</h3>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <table border="1">
        <thead>
          <tr>
            <th>ФИО</th>
            <th>ID пропуска</th>
            <th>Дата последнего прохода</th>
            <th>Калитка</th>
            <th>Турникет</th>
            <th>Кабинет</th>
            <th>№ Каб.</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.pass_id}>
              <td>
                <input
                  type="text"
                  value={student.fio}
                  onChange={(e) => handleEditStudent(student.pass_id, "fio", e.target.value)}
                />
              </td>
              <td>
                <input type="text" value={student.pass_id} readOnly />
              </td>
              <td>{student.last_pass_date}</td>
              <td>
                <input
                  type="checkbox"
                  checked={student.gate_pass}
                  onChange={(e) => handleEditStudent(student.pass_id, "gate_pass", e.target.checked)}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={student.turnstile_pass}
                  onChange={(e) => handleEditStudent(student.pass_id, "turnstile_pass", e.target.checked)}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={student.cabinet_pass}
                  onChange={(e) => handleEditStudent(student.pass_id, "cabinet_pass", e.target.checked)}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={student.cabinet_number}
                  onChange={(e) => handleEditStudent(student.pass_id, "cabinet_number", parseInt(e.target.value))}
                />
              </td>
              <td>
                <button onClick={() => handleDeleteStudent(student.pass_id)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentsTable;
