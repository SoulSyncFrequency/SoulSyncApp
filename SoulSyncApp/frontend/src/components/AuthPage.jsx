import React, { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function AuthPage({ onLogin }) {
  const [tab, setTab] = useState("login");

  return (
    <div className="auth-page" style={{ maxWidth: "400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
        <button
          onClick={() => setTab("login")}
          style={{
            padding: "0.5rem 1rem",
            marginRight: "0.5rem",
            backgroundColor: tab === "login" ? "#007bff" : "#e0e0e0",
            color: tab === "login" ? "white" : "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Login
        </button>
        <button
          onClick={() => setTab("register")}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: tab === "register" ? "#007bff" : "#e0e0e0",
            color: tab === "register" ? "white" : "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Register
        </button>
      </div>

      {tab === "login" ? <LoginForm onLogin={onLogin} /> : <RegisterForm />}
    </div>
  );
}
