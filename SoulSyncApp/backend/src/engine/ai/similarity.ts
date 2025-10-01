export function tokenize(s: string): string[] {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s\-\+]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function vectorize(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  tokens.forEach(t => m.set(t, (m.get(t) || 0) + 1));
  return m;
}

export function cosineSim(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let a2 = 0;
  let b2 = 0;
  for (const [k, v] of a.entries()) {
    a2 += v*v;
    const bv = b.get(k) || 0;
    dot += v * bv;
  }
  for (const v of b.values()) b2 += v*v;
  if (a2 === 0 || b2 === 0) return 0;
  return dot / (Math.sqrt(a2) * Math.sqrt(b2));
}
