import React, { useEffect, useState } from "react";
import { getProfile } from "../api";
import LogoutButton from "./LogoutButton";

export default function Dashboard({ token, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await getProfile(token);
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (token) {
      fetchProfile();
    }
  }, [token]);

  if (!token) {
    return <p>No token found. Please log in again.</p>;
  }

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      {loading && <p>Loading profile...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {profile && (
        <pre
          style={{
            background: "#f5f5f5",
            padding: "1rem",
            borderRadius: "4px",
            textAlign: "left",
          }}
        >
          {JSON.stringify(profile, null, 2)}
        </pre>
      )}
      <LogoutButton token={token} onLogout={onLogout} />
    </div>
  );
}
