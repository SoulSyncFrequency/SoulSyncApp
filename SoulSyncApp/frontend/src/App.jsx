import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useSearchParams,
  Link,
} from "react-router-dom";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import Settings from "./components/Settings";
import Navigation from "./components/Navigation";
import { getToken, setToken, clearToken } from "./api";

function ResetPasswordWrapper() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  return <ResetPassword initialToken={token} onDone={() => (window.location.href = "/")} />;
}

export default function App() {
  const [token, setTokenState] = useState(null);

  useEffect(() => {
    const t = getToken();
    if (t) setTokenState(t);
  }, []);

  function handleLogin(t) {
    setToken(t);
    setTokenState(t);
    window.location.href = "/dashboard";
  }

  function handleLogout() {
    clearToken();
    setTokenState(null);
    window.location.href = "/";
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage onLogin={handleLogin} />} />
        <Route path="/forgot-password" element={<ForgotPassword onDone={() => (window.location.href = "/")} />} />
        <Route path="/reset-password" element={<ResetPasswordWrapper />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <>
                <Navigation onLogout={handleLogout} />
                <Dashboard token={token} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <>
                <Navigation onLogout={handleLogout} />
                <Settings />
              </>
            </ProtectedRoute>
          }
        />
      </Routes>

      {!token && (
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link to="/forgot-password">Zaboravljena lozinka?</Link>
        </div>
      )}
    </Router>
  );
}
