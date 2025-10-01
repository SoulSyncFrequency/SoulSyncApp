// middleware/backpressure.ts
import { Request, Response, NextFunction } from "express";

export function createBackpressure(maxConcurrent = 4) {
  let inFlight = 0;
  const queue: Array<() => void> = [];
  const acquire = () => new Promise<void>((resolve) => {
    if (inFlight < maxConcurrent) { inFlight++; resolve(); }
    else if (queue.length < (parseInt(process.env.MAX_QUEUE || "100",10))) queue.push(resolve);
    else resolve(); // we'll reject in middleware if saturated
  });
  const release = () => {
    inFlight--;
    const next = queue.shift();
    if (next) { inFlight++; next(); }
  };
  return async function backpressure(req: Request, res: Response, next: NextFunction) {
    const before = inFlight;
    await acquire();
    if (before >= maxConcurrent && queue.length === 0) {
      return res.setHeader('Retry-After','1'); res.setHeader('X-Backpressure','true'); res.status(503).json({ error: "queue_full", message: "Server busy, try later" });
    }
    res.on("finish", release);
    next();
  };
}
