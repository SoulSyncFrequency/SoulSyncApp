// core/response.ts
// Response Layer – blends Warm Presence + Calm Clarity
import { CoreState, clamp01 } from "./state";
import { ERIOutput } from "./eri";

function presenceLine(): string {
  return "Tu sam. Ne moraš ništa sada.";
  // pure presence — no instruction
}

function gentleGuideBody(): string {
  return "Možeš samo primijetiti gdje tijelo dodiruje podlogu.";
}

function gentleGuideBreath(): string {
  return "Udah kratko, izdah malo duži. Idemo polako, zajedno.";
}

function softExpand(): string {
  return "Da. Samo tako. Ovdje je prostor za tebe.";
}

export interface ResponseOut {
  text: string;
  intensityClamped: number; // 0..1 for UI gating
}

export function generateResponse(state: CoreState, eri: ERIOutput): ResponseOut {
  const I = eri.intensity;
  const ic = clamp01(I); // clamp only for UI/animations

  // Rules (dynamic mix):
  // - High intensity -> pure presence (no instructions)
  // - Medium intensity -> one micro cue (body OR breath)
  // - Low intensity -> expansion/affirmation
  if (I > 1.0 || (I > 0.75 && eri.tone !== "open")) {
    return { text: presenceLine(), intensityClamped: ic };
  }

  if (I > 0.35) {
    // choose ONE cue, prefer body unless tone is "scared" (then breath)
    const cue = (eri.tone === "scared") ? gentleGuideBreath() : gentleGuideBody();
    return { text: `Dobro. ${cue}`, intensityClamped: ic };
  }

  // Very low: keep space
  return { text: softExpand(), intensityClamped: ic };
}
