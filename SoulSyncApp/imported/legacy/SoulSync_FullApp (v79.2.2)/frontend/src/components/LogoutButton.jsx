import React from "react";
import { logout } from "../api";

export default function LogoutButton({ token, onLogout }) {
  async function handleLogout() {
    try {
      if (token) {
        await logout(token);
      }
    } catch (err) {
      console.error("Logout failed:", err.message);
    } finally {
      onLogout();
    }
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: "0.5rem 1rem",
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
      }}
    >
      Logout
    </button>
  );
}
