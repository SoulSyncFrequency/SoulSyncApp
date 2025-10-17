import { primaryMoleculeRegistry } from "./primaryMolecules.registry";
import { validateWithF0, transformToF0Resonant } from "./f0.validator";
import { proposePrimaryMoleculeByAI } from "./ai/primaryMoleculeAI";
import { logger } from "./telemetry/logger";
import { PrimaryMoleculeMetaSchema } from "../schemas/primaryMolecule";
import { therapyPrimaryMoleculeCounter } from "../metrics";

export type TherapyPlan = {
  molecules: string[];
  primaryMolecule?: string;
  meta?: Record<string, any>;
};


function derivePrimaryMoleculeDetails(label: string): { smiles: string; description: string } {
  const fallback = { smiles: (label || 'N/A'), description: `Primary molecule: ${label || 'N/A'}` }
  if (!label) return fallback
  if (/[=\[\]#@+\-()0-9]/.test(label)) return { smiles: label, description: `Primary molecule: ${label}` }
  const map: Record<string,string> = {
    'C60': 'C60',
    'CaCO3': 'O=C([O-])[O-].O=[Ca]',
    'Resveratrol': 'c1ccc(cc1)/C=C/c2ccc(O)cc2O', 
    'Lithium': '[Li+]',
    'L-DOPA': 'N[C@@H](Cc1ccc(O)c(O)c1)C(=O)O',
    'GABA': 'NCCCC(=O)O',
    'Iodine': 'I',
    'L-Arginine': 'N=C(N)NCCC[C@@H](N)C(=O)O',
    'Magnesium': '[Mg+2]',
    'Vitamin C': 'OC[C@@H]1OC(=O)C(O)=C(O)C1O',
    'NAC': 'CC(=O)NCCS'
  }
  const key = label.trim()
  const smiles = map[key] || key
  return { smiles, description: `Primary molecule: ${key}` }
}

export type Disease = {
  id?: string;
  name: string;
  primaryMolecule?: string;
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
  return mol;
}

function includePrimary(therapy: TherapyPlan, mol: string, provenance: Provenance, o: EnsurePrimaryOptions) {
  if (!therapy.molecules.includes(mol)) therapy.molecules.unshift(mol);
  therapy.primaryMolecule = mol;
  if (o.annotateOutput) {
    therapy.meta = therapy.meta || {};
    const details = derivePrimaryMoleculeDetails(mol);
    const metaObj = {
      value: mol,
      provenance,
      note: provenance === "ai"
        ? "Primarna molekula je predložena AI-jem i F₀ validirana."
        : "Primarna molekula iz registry/disease mappinga, F₀ validirana.",
      smiles: details.smiles,
      description: details.description
    };
    const parsed = PrimaryMoleculeMetaSchema.safeParse(metaObj);
    if (!parsed.success) {
      therapy.meta.primaryMolecule = {
        value: mol || 'N/A',
        provenance,
        note: 'Fallback: invalid primary molecule meta (auto-filled)',
        smiles: (details.smiles || 'N/A'),
        description: (details.description || 'N/A')
      };
      try { therapyPrimaryMoleculeCounter.labels('fallback').inc(); } catch {}
    } else {
      therapy.meta.primaryMolecule = parsed.data;
      try { therapyPrimaryMoleculeCounter.labels('valid').inc(); } catch {}
    }
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
