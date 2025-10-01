import React from "react";
import { Link } from "react-router-dom";

export default function Settings() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2>⚙️ Settings</h2>
      <p>Ovdje bi išle postavke korisničkog profila ili aplikacije.</p>
      <ul>
        <li>Promjena lozinke</li>
        <li>Notifikacije</li>
        <li>Tema (dark/light)</li>
      </ul>

      <div style={{ marginTop: "1rem" }}>
        <Link to="/dashboard">
          <button style={{ padding: "0.5rem 1rem" }}>⬅ Povratak na Dashboard</button>
        </Link>
      </div>
    </div>
  );
}
