import { useState, useEffect } from "react";
import axios from "axios";
import UserCreationForm from "./UserCreationForm";
import PasswordChangeForm from "./PasswordChangeForm";
import StudentCreationForm from "./StudentCreationForm";
import StudentsTable from "./StudentsTable";

function AdminPanel({ token }) {
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const usersResponse = await axios.get("http://127.0.0.1:8000/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(usersResponse.data);

        const studentsResponse = await axios.get("http://127.0.0.1:8000/students", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudents(studentsResponse.data);
      } catch (error) {
        setError("Ошибка загрузки данных: " + (error.response?.data?.detail || error.message));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);
  const deleteUser = async () => {
    if (!selectedUser) {
      alert("Выберите пользователя для удаления");
      return;
    }
    if (!window.confirm(`Вы уверены, что хотите удалить пользователя ${selectedUser}?`)) {
      return;
    }
    try {
      await axios.delete(`http://127.0.0.1:8000/users/${selectedUser}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((user) => user.username !== selectedUser));
      setSelectedUser("");
    } catch (error) {
      setError("Ошибка удаления пользователя: " + (error.response?.data?.detail || error.message));
    }
  };
  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }
  if (loading) {
    return <div>Загрузка...</div>;
  }
  return (
    <div>
      <h2>Админ-панель</h2>
      <UserCreationForm token={token} setUsers={setUsers} />
      <PasswordChangeForm token={token} users={users} />
      <StudentCreationForm token={token} setStudents={setStudents} />
      <StudentsTable token={token} students={students} setStudents={setStudents} />
      <h3>Удаление пользователя</h3>
      <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
        <option value="">Выберите пользователя</option>
        {users.map((user) => (
          <option key={user.username} value={user.username}>{user.username}</option>
        ))}
      </select>
      <button onClick={deleteUser}>Удалить</button>
    </div>
  );
}
export default AdminPanel;