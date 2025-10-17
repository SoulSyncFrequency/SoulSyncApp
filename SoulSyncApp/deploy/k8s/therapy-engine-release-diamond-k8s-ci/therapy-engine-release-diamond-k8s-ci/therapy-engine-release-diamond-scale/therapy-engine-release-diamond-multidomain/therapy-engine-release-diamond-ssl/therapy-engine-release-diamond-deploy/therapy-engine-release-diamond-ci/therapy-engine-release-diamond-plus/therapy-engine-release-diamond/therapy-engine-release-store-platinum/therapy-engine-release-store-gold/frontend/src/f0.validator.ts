export type F0Result = { ok: boolean; score?: number; transformed?: string; reason?: string };

export function validateWithF0(molecule: string): F0Result {
  // TODO: Replace with your real F₀ validator
  return { ok: true, score: 0.93 };
}

export function transformToF0Resonant(molecule: string): string {
  // TODO: Replace with your real SMILES transformation
  return molecule + "_F0";
}
