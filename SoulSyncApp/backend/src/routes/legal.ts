import { Router } from "express";
import path from "path";

const router = Router();

router.get("/privacy", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/legal/privacy.html"));
});

router.get("/terms", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/legal/terms.html"));
});

export default router;
