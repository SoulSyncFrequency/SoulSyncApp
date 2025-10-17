import { buildUltraPlan, UltraInput, UltraPlan } from './ultra51c.js'
import { ensurePrimaryMolecule, ensurePrimaryMoleculeSync } from "./ensurePrimaryMolecule";
export type TherapyInput = UltraInput
export type TherapyPlan = UltraPlan
export async function generateTherapy(input: TherapyInput): Promise<TherapyPlan> {
  // Build the base plan (if sync, wrap in Promise.resolve)
  let therapy = await Promise.resolve(buildUltraPlan(input))
  const diseaseName = (input as any)?.disease?.name ?? (input as any)?.diseaseName ?? (input as any)?.condition ?? ''
  const primaryFromInput = (input as any)?.primaryMolecule
  const disease = { name: String(diseaseName || ''), primaryMolecule: primaryFromInput } as any
  therapy = await ensurePrimaryMolecule(therapy as any, disease, { useAIWhenMissing: true, runF0Validation: true, allowTransformOnF0Fail: true, annotateOutput: true }) as any
  return therapy as any
} as any
  therapy = ensurePrimaryMoleculeSync(therapy as any, disease, { useAIWhenMissing: false, runF0Validation: true, allowTransformOnF0Fail: true, annotateOutput: true }) as any
  return therapy
}
