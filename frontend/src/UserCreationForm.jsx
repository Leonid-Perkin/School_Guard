import { useState } from "react";
import axios from "axios";

function UserCreationForm({ token, setUsers }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleCreateUser = async () => {
    if (!username || !password) {
      setError("Заполните имя пользователя и пароль!");
      return;
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/users",
        { username, password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers((prevUsers) => [...prevUsers, response.data]);
      setUsername("");
      setPassword("");
      setError("");
      alert("Пользователь создан!");
    } catch (error) {
      setError("Ошибка создания пользователя: " + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div>
      <h3>Создание пользователя</h3>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <input
        type="text"
        placeholder="Имя пользователя"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleCreateUser}>Создать</button>
    </div>
  );
}

export default UserCreationForm;