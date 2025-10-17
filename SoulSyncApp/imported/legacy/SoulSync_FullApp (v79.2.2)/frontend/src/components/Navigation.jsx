import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearToken } from "../api";

export default function Navigation({ onLogout }) {
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    if (onLogout) onLogout();
    navigate("/");
  }

  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.75rem 1.5rem",
      backgroundColor: "#f5f5f5",
      borderBottom: "1px solid #ddd",
      marginBottom: "1rem"
    }}>
      <div>
        <Link to="/dashboard" style={{ marginRight: "1rem" }}>🏠 Dashboard</Link>
        <Link to="/settings">⚙️ Settings</Link>
      </div>
      <button onClick={handleLogout} style={{ padding: "0.4rem 1rem" }}>
        🚪 Logout
      </button>
      <a href="/profile" className="text-sm text-gray-700 hover:underline">👤 Profile</a>
</nav>
  );
}
