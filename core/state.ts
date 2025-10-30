// core/state.ts
// Nervous System baseline & state management for SoulSync
// Baseline: Calm/Safety (presence-first), relational field = true

export type Presence = "soft" | "neutral" | "engaged";
export type Breath = "long_exhale" | "steady" | "shallow";
export type Tempo = "slow" | "medium" | "fast";

export interface CoreState {
  presence: Presence;
  tone: string;                 // baseline relational message
  breath: Breath;
  tempo: Tempo;
  emotionalAllowance: boolean;  // safe to feel
  overwhelmGuard: boolean;      // hard stop when intensity too high
  relationalField: boolean;     // “Netko je sa mnom”
  trend: number;                // -1..+1 regulation trend
  lastUpdate: number;           // epoch ms
  // runtime flags (derived)
  lastIntensity?: number;       // raw wave intensity (can exceed 1.0)
}

export function defaultState(): CoreState {
  return {
    presence: "soft",
    tone: "Tu sam s tobom.",
    breath: "long_exhale",
    tempo: "slow",
    emotionalAllowance: true,
    overwhelmGuard: true,
    relationalField: true,
    trend: 0,
    lastUpdate: Date.now(),
    lastIntensity: 0
  };
}

export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

// Simple trend calculator: exponential smoothing toward latest intensity comfort (lower is calmer)
export function updateTrend(prev: number, intensityWave: number): number {
  const target = 1 - Math.min(1, Math.max(0, intensityWave)); // higher intensity -> lower target
  const alpha = 0.2; // smoothing factor
  return prev + alpha * (target - prev);
}

export function withUpdate(s: CoreState, intensityWave: number): CoreState {
  return {
    ...s,
    lastUpdate: Date.now(),
    lastIntensity: intensityWave,
    trend: updateTrend(s.trend, intensityWave)
  };
}
