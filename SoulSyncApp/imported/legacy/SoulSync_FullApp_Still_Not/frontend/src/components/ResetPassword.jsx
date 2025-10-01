import React, { useState } from "react";
import { resetPassword } from "../api";

export default function ResetPassword({ initialToken = "", onDone }) {
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (password !== confirm) {
      setError("Lozinke se ne podudaraju.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setMessage("Lozinka je uspješno promijenjena. Sada se možeš prijaviti.");
      if (onDone) onDone();
    } catch (err) {
      setError(err.message || "Nešto je pošlo po zlu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h2>Reset lozinke</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Token iz e-maila"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
          style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
        />
        <input
          type="password"
          placeholder="Nova lozinka"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
        />
        <input
          type="password"
          placeholder="Potvrdi lozinku"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
        />
        <button type="submit" disabled={loading} style={{ padding: "0.5rem 1rem" }}>
          {loading ? "Spremanje..." : "Postavi novu lozinku"}
        </button>
      </form>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
