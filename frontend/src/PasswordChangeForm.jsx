import { useState } from "react";
import axios from "axios";

function PasswordChangeForm({ token, users }) {
  const [selectedUser, setSelectedUser] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) {
      setError("Выберите пользователя и введите новый пароль!");
      return;
    }

    try {
      await axios.put(
        `http://127.0.0.1:8000/users/${selectedUser}/password`,
        { new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewPassword("");
      setError("");
      alert("Пароль изменён!");
    } catch (error) {
      setError("Ошибка изменения пароля: " + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div>
      <h3>Изменение пароля</h3>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <select
        value={selectedUser}
        onChange={(e) => setSelectedUser(e.target.value)}
      >
        <option value="">Выберите пользователя</option>
        {users.map((user) => (
          <option key={user.username} value={user.username}>
            {user.username}
          </option>
        ))}
      </select>
      <input
        type="password"
        placeholder="Новый пароль"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button onClick={handleChangePassword}>Изменить пароль</button>
    </div>
  );
}

export default PasswordChangeForm;