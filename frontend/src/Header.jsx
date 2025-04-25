import React from "react";

function Header({ isAdmin, activePage, setActivePage, handleLogout }) {
  return (
    <header>
      <h1>Умная система школы</h1>
      <div className="header-buttons">
        <button
          onClick={() => setActivePage("attendance")}
          className={activePage === "attendance" ? "active" : ""}
        >
          Посещаемость
        </button>
        {isAdmin && (
          <button
            onClick={() => setActivePage("admin")}
            className={activePage === "admin" ? "active" : ""}
          >
            Админ-панель
          </button>
        )}
        <button onClick={handleLogout}>Выход</button>
      </div>
    </header>
  );
}

export default Header;