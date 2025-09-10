import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth";

const app = express();
const port = process.env.PORT || 3000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "*";

app.use(helmet());
app.use(express.json());
app.use(cors({ origin: frontendOrigin, credentials: true }));

// Rate limit: 100 req / 15min by IP
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Healthcheck
app.get("/healthz", (_req, res) => res.status(200).send("OK"));

// Routes
app.use("/auth", authRoutes);

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
export default app;
