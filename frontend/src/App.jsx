import { useState, useEffect } from "react";
import axios from "axios";
import Login from "./Login";
import AdminPanel from "./AdminPanel";
import AttendanceTable from "./AttendanceTable";
import Header from "./Header";
import "./App.css";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [students, setStudents] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activePage, setActivePage] = useState("attendance");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const fetchUserData = async () => {
        setLoading(true);
        setError("");
        try {
          const response = await axios.get("http://127.0.0.1:8000/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsAdmin(response.data.is_admin);
        } catch (error) {
          setError("Ошибка загрузки данных пользователя: " + (error.response?.data?.detail || error.message));
          setIsAdmin(false);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [token]);
  const fetchStudents = async () => {
    if (!token) return;
    try {
      const response = await axios.get("http://127.0.0.1:8000/students");
      setStudents(response.data);
    } catch (error) {
      setError("Ошибка загрузки данных о учениках: " + (error.response?.data?.detail || error.message));
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };
  useEffect(() => {
    if (token) {
      fetchStudents(); 
      const interval = setInterval(fetchStudents, 5000); 
      return () => clearInterval(interval);
    }
  }, [token]);
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token");
    setActivePage("attendance");
  };
  if (!token) {
    return <Login setToken={setToken} />;
  }
  if (error) {
    return <div style={{ color: "red", textAlign: "center", marginTop: "20px" }}>{error}</div>;
  }
  if (loading) {
    return <div style={{ textAlign: "center", marginTop: "20px" }}>Загрузка...</div>;
  }
  return (
    <div className="App">
      <Header
        isAdmin={isAdmin}
        activePage={activePage}
        setActivePage={setActivePage}
        handleLogout={handleLogout}
      />
      <main>
        {activePage === "attendance" && <AttendanceTable students={students} />}
        {activePage === "admin" && <AdminPanel token={token} />}
      </main>
    </div>
  );
}

export default App;