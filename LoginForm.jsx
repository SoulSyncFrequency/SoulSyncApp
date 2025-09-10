import React, { useState } from "react";
import { login, getProfile } from "../api";

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await login(email, password);
      if (res.token) {
        setToken(res.token);
        if (onLogin) onLogin(res.token);
        // Odmah dohvatimo profil
        const userProfile = await getProfile(res.token);
        setProfile(userProfile);
      } else {
        setError("Login failed — no token received.");
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-form">
      <h2>Login</h2>
      {!token ? (
        <form onSubmit={handleLogin}>
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
          <button type="submit">Login</button>
        </form>
      ) : (
        <div>
          <h3>Welcome!</h3>
          {profile ? (
            <pre>{JSON.stringify(profile, null, 2)}</pre>
          ) : (
            <p>Loading profile...</p>
          )}
        </div>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
