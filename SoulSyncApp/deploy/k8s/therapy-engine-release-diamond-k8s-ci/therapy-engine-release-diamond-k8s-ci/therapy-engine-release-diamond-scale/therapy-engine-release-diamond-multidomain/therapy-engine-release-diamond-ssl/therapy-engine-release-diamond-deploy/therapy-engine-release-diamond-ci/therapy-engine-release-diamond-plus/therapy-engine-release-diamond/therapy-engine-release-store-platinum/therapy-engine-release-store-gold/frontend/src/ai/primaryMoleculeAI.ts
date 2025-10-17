import { logger } from "../telemetry/logger";

export type AIMoleculeProposal = { molecule: string; rationale?: string };

// TODO: wire to your embeddings / ontology / rules-based predictor
export async function proposePrimaryMoleculeByAI(diseaseName: string): Promise<AIMoleculeProposal | null> {
  const heuristics: Record<string, string> = {
    "multiple sclerosis": "Myelin peptide fragment",
    "parkinson": "Dopamine precursor (L-DOPA)",
  };
  const key = (diseaseName || "").toLowerCase();
  const suggestion = heuristics[key];
  if (!suggestion) return null;
  logger.info(`[AI] Proposed primary molecule for "${diseaseName}": ${suggestion}`);
  return { molecule: suggestion, rationale: "heuristic-demo" };
}
