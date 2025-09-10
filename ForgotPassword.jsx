import React, { useState } from "react";
import { forgotPassword } from "../api";

export default function ForgotPassword({ onDone }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await forgotPassword(email);
      setMessage("Ako račun postoji, poslan je e-mail s uputama.");
      if (onDone) onDone();
    } catch (err) {
      setError(err.message || "Nešto je pošlo po zlu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h2>Zaboravljena lozinka</h2>
      <p>Upiši e-mail adresu. Poslat ćemo ti link/token za reset lozinke.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
        />
        <button type="submit" disabled={loading} style={{ padding: "0.5rem 1rem" }}>
          {loading ? "Slanje..." : "Pošalji upute"}
        </button>
      </form>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
