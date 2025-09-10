import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { pool } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { sendResetEmail } from "../utils/email";

const router = express.Router();

function signAccessToken(payload: any) {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}
function signRefreshToken(payload: any) {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "7d" });
}

// REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exists = await pool.query("SELECT 1 FROM users WHERE email=$1", [email]);
    if (exists.rows.length) return res.status(400).json({ error: "User already exists" });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email",
      [name, email, hash]
    );

    const user = result.rows[0];
    const token = signAccessToken({ id: user.id, email: user.email });
    const refresh = signRefreshToken({ id: user.id, email: user.email });

    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token, created_at, expires_at) VALUES ($1,$2,NOW(), NOW() + INTERVAL '7 days')",
      [user.id, refresh]
    );

    res.status(201).json({ user, token, refresh });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const q = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (!q.rows.length) return res.status(401).json({ error: "Invalid email or password" });
    const user = q.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    const token = signAccessToken({ id: user.id, email: user.email });
    const refresh = signRefreshToken({ id: user.id, email: user.email });
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token, created_at, expires_at) VALUES ($1,$2,NOW(), NOW() + INTERVAL '7 days')",
      [user.id, refresh]
    );

    res.json({ token, refresh });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// REFRESH
router.post("/refresh", async (req, res) => {
  const { refresh } = req.body;
  if (!refresh) return res.status(400).json({ error: "Missing refresh token" });
  try {
    const q = await pool.query("SELECT * FROM refresh_tokens WHERE token=$1 AND revoked IS NOT TRUE AND expires_at > NOW()", [refresh]);
    if (!q.rows.length) return res.status(401).json({ error: "Invalid refresh token" });

    try {
      const decoded = jwt.verify(refresh, process.env.JWT_SECRET as string) as any;
      const token = signAccessToken({ id: decoded.id, email: decoded.email });
      return res.json({ token });
    } catch {
      return res.status(401).json({ error: "Expired refresh token" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// LOGOUT (revoke refresh)
router.post("/logout", async (req, res) => {
  const { refresh } = req.body;
  if (!refresh) return res.status(400).json({ error: "Missing refresh token" });
  try {
    await pool.query("UPDATE refresh_tokens SET revoked=TRUE WHERE token=$1", [refresh]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ME (protected)
router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const q = await pool.query("SELECT id, name, email, created_at FROM users WHERE id=$1", [req.user!.id]);
    res.json(q.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// FORGOT PASSWORD (send token)
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const q = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (!q.rows.length) return res.json({ ok: true }); // don't leak user existence

    const token = crypto.randomBytes(32).toString("hex");
    await pool.query(
      "INSERT INTO password_resets (user_id, token, created_at, expires_at) VALUES ($1,$2,NOW(), NOW() + INTERVAL '1 hour')",
      [q.rows[0].id, token]
    );

    const resetUrl = `${process.env.FRONTEND_ORIGIN || "https://app.example.com"}/reset-password?token=${token}`;
    await sendResetEmail(email, resetUrl);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// RESET PASSWORD (use token)
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: "Missing token or password" });
  try {
    const q = await pool.query("SELECT * FROM password_resets WHERE token=$1 AND used IS NOT TRUE AND expires_at > NOW()", [token]);
    if (!q.rows.length) return res.status(400).json({ error: "Invalid or expired token" });

    const row = q.rows[0];
    const hash = await bcrypt.hash(password, 10);
    await pool.query("UPDATE users SET password_hash=$1 WHERE id=$2", [hash, row.user_id]);
    await pool.query("UPDATE password_resets SET used=TRUE, used_at=NOW() WHERE id=$1", [row.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
