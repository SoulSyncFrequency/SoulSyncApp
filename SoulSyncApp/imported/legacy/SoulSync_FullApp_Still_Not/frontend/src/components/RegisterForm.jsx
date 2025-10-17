import React, { useState } from "react";
import { register } from "../api";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function handleRegister(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const res = await register(email, password, name);
      if (res && res.id) {
        setMessage("✅ Registration successful! You can now log in.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="register-form">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
