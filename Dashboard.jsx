import React, { useEffect, useState } from "react";
import { me } from "../api";
import LogoutButton from "./LogoutButton";
import { Link } from "react-router-dom";

export default function Dashboard({ token, onLogout }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await me();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    }
    fetchProfile();
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2>📊 Dashboard</h2>
      {profile ? (
        <div>
          <p><b>ID:</b> {profile.id}</p>
          <p><b>Name:</b> {profile.name}</p>
          <p><b>Email:</b> {profile.email}</p>
          <p><b>Created:</b> {new Date(profile.created_at).toLocaleString()}</p>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}

      <div style={{ marginTop: "1rem" }}>
        <Link to="/settings">
          <button style={{ padding: "0.5rem 1rem" }}>⚙️ Postavke</button>
        </Link>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <LogoutButton onLogout={onLogout} />
      </div>
    </div>
  );
}
