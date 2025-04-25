import { useState } from "react";
import "./Login.css";
import logo from "/vite.png";

function Login({ setToken }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!username || !password) {
            setError("Пожалуйста, заполните все поля.");
            return;
        }

        if (password.length < 4) {
            setError("Пароль должен содержать не менее 4 символов.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("http://127.0.0.1:8000/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    username,
                    password,
                }),
            });

            if (!response.ok) {
                throw new Error("Неправильные данные для входа.");
            }

            const data = await response.json();
            setToken(data.access_token);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>Авторизация</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Логин:</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="Введите логин"
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Пароль:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Введите пароль"
                            disabled={loading}
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <button type="submit" disabled={loading || !username || !password}>
                        {loading ? "Загрузка..." : "Войти"}
                    </button>
                </form>
            </div>
            <div className="logo-container">
                <img src={logo} alt="Логотип" className="logo" />
                <h2 className="logo-title">School Guard</h2>
            </div>
        </div>
    );
}

export default Login;