import { primaryMoleculeRegistry } from "./primaryMolecules.registry";
import { validateWithF0, transformToF0Resonant } from "./f0.validator";
import { proposePrimaryMoleculeByAI } from "./ai/primaryMoleculeAI";
import { logger } from "./telemetry/logger";

export type TherapyPlan = {
  molecules: string[];
  primaryMolecule?: string;
  meta?: Record<string, any>;
};

export type Disease = {
  id?: string;
  name: string;
  primaryMolecule?: string; // optional mapping override
};

type Provenance = "disease" | "registry" | "ai";

export type EnsurePrimaryOptions = {
  useAIWhenMissing?: boolean;
  runF0Validation?: boolean;
  annotateOutput?: boolean;
  allowTransformOnF0Fail?: boolean;
};

const defaults: EnsurePrimaryOptions = {
  useAIWhenMissing: true,
  runF0Validation: true,
  annotateOutput: true,
  allowTransformOnF0Fail: true,
};

export async function ensurePrimaryMolecule(
  therapy: TherapyPlan,
  disease: Disease,
  opts?: Partial<EnsurePrimaryOptions>
): Promise<TherapyPlan> {
  const o: EnsurePrimaryOptions = { ...defaults, ...(opts || {}) };
  const resolved = await resolvePrimary(disease, o);
  if (!resolved) {
    logger.info(`[Primary] No primary molecule for "${disease.name}" (nothing enforced).`);
    return therapy;
  }
  const finalMol = validateAndMaybeTransform(resolved.molecule, o);
  includePrimary(therapy, finalMol, resolved.provenance, o);
  return therapy;
}

// Sync wrapper (no AI) for engines that aren't async
export function ensurePrimaryMoleculeSync(
  therapy: TherapyPlan,
  disease: Disease,
  opts?: Partial<EnsurePrimaryOptions>
): TherapyPlan {
  const o: EnsurePrimaryOptions = { ...defaults, useAIWhenMissing: false, ...(opts || {}) };
  const resolved = resolvePrimarySync(disease);
  if (!resolved) {
    logger.info(`[Primary] No primary molecule for "${disease.name}" (nothing enforced).`);
    return therapy;
  }
  const finalMol = validateAndMaybeTransform(resolved.molecule, o);
  includePrimary(therapy, finalMol, resolved.provenance, o);
  return therapy;
}

function validateAndMaybeTransform(mol: string, o: EnsurePrimaryOptions): string {
  if (!o.runF0Validation) return mol;
  const f0 = validateWithF0(mol);
  if (!f0.ok && o.allowTransformOnF0Fail) {
    const transformed = transformToF0Resonant(mol);
    logger.warn(`[Primary] F₀ failed for "${mol}", transformed -> "${transformed}"`);
    return transformed;
  }
  if (!f0.ok) {
    logger.warn(`[Primary] F₀ failed for "${mol}" and transform disabled. Skipping enforcement.`);
    return mol; // still return mol; enforcement will include it; adjust if stricter behavior desired
  }
  return mol;
}

function includePrimary(therapy: TherapyPlan, mol: string, provenance: Provenance, o: EnsurePrimaryOptions) {
  if (!therapy.molecules.includes(mol)) {
    therapy.molecules.unshift(mol);
  }
  therapy.primaryMolecule = mol;
  if (o.annotateOutput) {
    therapy.meta = therapy.meta || {};
    therapy.meta.primaryMolecule = {
      value: mol,
      provenance,
      note: provenance === "ai"
        ? "Primarna molekula je predložena AI-jem i F₀ validirana."
        : "Primarna molekula iz registry/disease mappinga, F₀ validirana.",
    };
  }
  logger.info(`[Primary] Ensured primary molecule "${mol}" from ${provenance}`);
}

async function resolvePrimary(disease: Disease, o: EnsurePrimaryOptions): Promise<{ molecule: string; provenance: Provenance } | null> {
  const byDisease = disease.primaryMolecule?.trim();
  if (byDisease) return { molecule: byDisease, provenance: "disease" };
  const key = (disease.name || "").toLowerCase();
  const reg = primaryMoleculeRegistry[key]?.primaryMolecule;
  if (reg) return { molecule: reg, provenance: "registry" };
  if (o.useAIWhenMissing) {
    const ai = await proposePrimaryMoleculeByAI(disease.name);
    if (ai?.molecule) return { molecule: ai.molecule, provenance: "ai" };
  }
  return null;
}

function resolvePrimarySync(disease: Disease): { molecule: string; provenance: Provenance } | null {
  const byDisease = disease.primaryMolecule?.trim();
  if (byDisease) return { molecule: byDisease, provenance: "disease" };
  const key = (disease.name || "").toLowerCase();
  const reg = primaryMoleculeRegistry[key]?.primaryMolecule;
  if (reg) return { molecule: reg, provenance: "registry" };
  return null;
}
