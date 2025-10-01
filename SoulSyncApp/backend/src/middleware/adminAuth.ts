// middleware/adminAuth.ts
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Expect header: x-api-key + x-api-scope=admin|viewer, both must be valid.
const keyHash = (k:string) => crypto.createHash("sha256").update(k).digest("hex");

const validKeys = new Map<string, {scope: "viewer"|"admin", exp?: number}>([
  // Load from env/DB. Example: ADMIN_KEY_HASH, VIEWER_KEY_HASH (sha256)
]);

export function adminAuth(requiredScope:"admin"|"viewer"="admin") {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = (req.header("x-api-key") || "").trim();
    const scope = (req.header("x-api-scope") || "").trim() as "admin"|"viewer";
    const rec = validKeys.get(keyHash(key));
    if (!rec || (rec.exp && Date.now() > rec.exp) || (requiredScope === "admin" && rec.scope !== "admin") || scope !== rec.scope) {
      return res.status(401).json({ error: "unauthorized"});
    }
    next();
  }
}
