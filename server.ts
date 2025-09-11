import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth";
import { pool } from "./db";

const app = express();
const port = process.env.PORT || 3000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "*";

app.use(helmet());
app.use(express.json());
app.use(cors({ origin: frontendOrigin, credentials: true }));

// Basic DB check on startup (optional, logs only)
pool.connect()
  .then((c) => { c.release(); console.log("✅ DB pool ready"); })
  .catch((e) => console.warn("⚠️ DB not connected yet:", e.message));

// Rate limit
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Healthcheck
app.get("/healthz", (_req, res) => {
  res.status(200).send("OK");
});

// Routes
app.use("/auth", authRoutes);

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

export default app;
