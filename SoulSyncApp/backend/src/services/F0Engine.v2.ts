import { recordF0Audit } from './f0Audit'
import { recordF0AuditDB } from './f0Audit.db'
// F0Engine.v2 — službeni algoritam za F₀_score (TypeScript)
export type DiseaseType = 'neurodegenerative' | 'autoimmune' | 'oncological' | 'psychological'

export interface F0Params {
  Sym: number; Pol: number; Bph: number; Emo: number; Coh: number;
  Frac: number; Conn: number; Chak: number; Info: number; Safe: number;
  disease_type: DiseaseType;
}

const clamp = (v: number) => Math.max(0, Math.min(1, v));

export function computeF0(params: Partial<F0Params>): number {
  const {
    Sym = 0, Pol = 0, Bph = 0, Emo = 0, Coh = 0, Frac = 0, Conn = 0, Chak = 0, Info = 0,
    Safe = 0.0, disease_type = 'psychological'
  } = params || {} as any;

  const threshold = Number(process.env.F0_SAFE_THRESHOLD ?? 0.5);
  if (Safe < threshold) return 0;

  const values = { Sym: clamp(Sym), Pol: clamp(Pol), Bph: clamp(Bph), Emo: clamp(Emo),
    Coh: clamp(Coh), Frac: clamp(Frac), Conn: clamp(Conn), Chak: clamp(Chak), Info: clamp(Info) };

  const weightProfiles: Record<DiseaseType, Record<keyof typeof values, number>> = {
    neurodegenerative: { Sym:0.15, Pol:0.10, Bph:0.15, Emo:0.15, Coh:0.15, Frac:0.10, Conn:0.10, Chak:0.05, Info:0.05 },
    autoimmune:       { Sym:0.10, Pol:0.15, Bph:0.10, Emo:0.20, Coh:0.15, Frac:0.10, Conn:0.10, Chak:0.05, Info:0.05 },
    oncological:      { Sym:0.20, Pol:0.15, Bph:0.15, Emo:0.10, Coh:0.10, Frac:0.10, Conn:0.10, Chak:0.05, Info:0.05 },
    psychological:    { Sym:0.10, Pol:0.05, Bph:0.10, Emo:0.25, Coh:0.20, Frac:0.05, Conn:0.10, Chak:0.10, Info:0.05 }
  };

  const profile = weightProfiles[disease_type as DiseaseType] ?? weightProfiles['psychological'];

  let core = 1.0;
  (Object.keys(profile) as (keyof typeof values)[]).forEach((k) => {
    core *= Math.pow(values[k], profile[k]);
  });

  const synergyScale = Number(process.env.F0_SYNERGY_SCALE ?? 0.05);
  const synergyFactor = 1 + (values.Emo * values.Coh * synergyScale);
  const F0 = Math.min(1, core * synergyFactor);
  return F0;
}
