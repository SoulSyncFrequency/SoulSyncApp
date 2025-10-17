import { Request, Response, NextFunction } from "express";
export function ipAllowlist(list: string){
  const ips = list.split(",").map(s=>s.trim()).filter(Boolean);
  return function(req: Request, res: Response, next: NextFunction){
    if (ips.length === 0) return next();
    const ip = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").toString();
    const ok = ips.some(allow => ip.includes(allow));
    if (!ok) return res.status(403).json({ error: "IP not allowed" });
    next();
  };
}
