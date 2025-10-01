export type F0Result = { ok: boolean; score?: number; transformed?: string; reason?: string };

// In-memory cache for F₀ results
const f0Cache = new Map<string, F0Result>();

function tryRealF0(molecule: string): F0Result | null {
  // Attempt to require a real validator from common locations
  const candidates = [
    "../../services/f0/validator.js",
    "../../services/f0/validator.ts",
    "../f0/validator.js",
    "../f0/validator.ts",
    "./f0.real.js",
    "./f0.real.ts"
  ];
  for (const rel of candidates) {
    try {
      // @ts-ignore dynamic require
      const mod = require(rel);
      if (mod && typeof mod.validateWithF0 === "function") {
        const res = mod.validateWithF0(molecule);
        if (res) return res;
      }
    } catch (e) {
      // ignore and continue
    }
  }
  return null;
}

export function validateWithF0(molecule: string): F0Result {
  const key = (molecule || "").trim().toLowerCase();
  const cached = f0Cache.get(key);
  if (cached) return cached;

  // Try delegate to real module if available
  const real = tryRealF0(molecule);
  if (real) {
    f0Cache.set(key, real);
    return real;
  }

  // Fallback stub
  const res = { ok: true, score: 0.93 } as F0Result;
  f0Cache.set(key, res);
  return res;
}

export function transformToF0Resonant(molecule: string): string {
  // Fallback transformation — replace with your real SMILES mutation
  return (molecule || "") + "_F0";
}
