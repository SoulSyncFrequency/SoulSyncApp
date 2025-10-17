import { logger } from "../telemetry/logger";
import { primaryMoleculeRegistry } from "../primaryMolecules.registry";
import { tokenize, vectorize, cosineSim } from "./similarity";

export type AIMoleculeProposal = { molecule: string; rationale?: string; matchedKey?: string; score?: number };

const aiCache = new Map<string, AIMoleculeProposal | null>();

// Heuristics for exact/key variants
const heuristics: Record<string, string> = {
  "ms": "Myelin peptide fragment",
  "parkinson disease": "L-DOPA",
  "type 2 diabetes": "Metformin-like fragment",
  "long covid": "NAC"
};

export async function proposePrimaryMoleculeByAI(diseaseName: string): Promise<AIMoleculeProposal | null> {
  const q = (diseaseName || "").trim().toLowerCase();
  if (!q) return null;
  if (aiCache.has(q)) return aiCache.get(q) || null;

  // 1) Exact/heuristic quick hits
  if (heuristics[q]) {
    const res = { molecule: heuristics[q], rationale: "heuristic-exact" };
    aiCache.set(q, res);
    logger.info(`[AI] Heuristic primary molecule for "${diseaseName}": ${res.molecule}`);
    return res;
  }

  // 2) Similarity to registry keys
  const qvec = vectorize(tokenize(q));
  let best: AIMoleculeProposal | null = null;

  for (const key of Object.keys(primaryMoleculeRegistry)) {
    const kvec = vectorize(tokenize(key));
    const score = cosineSim(qvec, kvec);
    if (!best || score > (best.score || 0)) {
      best = { molecule: primaryMoleculeRegistry[key].primaryMolecule, matchedKey: key, score, rationale: "similarity-to-registry" };
    }
  }

  // 3) Threshold to avoid nonsense
  if (best && (best.score || 0) >= 0.25) {
    aiCache.set(q, best);
    logger.info(`[AI] Similarity primary molecule for "${diseaseName}" ~ "${best.matchedKey}" (score=${best.score?.toFixed(2)}): ${best.molecule}`);
    return best;
  }

  aiCache.set(q, null);
  return null;
}
