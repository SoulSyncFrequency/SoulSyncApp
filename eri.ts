// core/eri.ts
// ERI (Emotional Resonance Interface) — wave-based intensity + tone detection

export interface ERIInput {
  text: string;
  breath?: number;           // optional 0..1 (0 = shallow, 1 = deep/regulated)
  somatic?: string;          // e.g., 'pritisak_prsa' | 'knedla_grlo' | 'hladnoca_noge'
}

export type ERITone = "soft" | "open" | "heavy" | "scared" | "numb";

export interface ERIOutput {
  tone: ERITone;
  intensity: number;         // wave-based (can exceed 1.0 before response clamping)
  markers: string[];         // matched cues
}

const LEX = {
  heavy: [/bol(?!j)/, /teško/, /tesko/, /prazno/, /ne mogu/, /umoran/, /umorna/, /nema smisla/],
  fear:  [/strah/, /panika/, /panici/, /bojim/, /uznemiren/],
  sad:   [/tuga/, /plačem/, /placem/, /suze/],
  open:  [/ok/, /lagano/, /malo/, /može/, /moze/, /toplo/, /otvara se/, /lakše/, /lakse/],
  numb:  [/ne osjećam/, /ne osjecam/, /nista ne osjecam/, /nema ništa/, /nema nista/, /praznina/]
};

function matchAny(rxList: RegExp[], text: string, markers: string[], tag: string): number {
  let hit = 0;
  for (const rx of rxList) {
    if (rx.test(text)) {
      hit += 1;
      markers.push(tag + ":" + rx.source);
    }
  }
  return hit;
}

export function evaluateERI(input: ERIInput): ERIOutput {
  const text = (input.text || "").toLowerCase();
  const markers: string[] = [];
  let intensity = 0;

  // --- semantic contributions ---
  intensity += 0.4 * matchAny(LEX.heavy, text, markers, "heavy");
  intensity += 0.45 * matchAny(LEX.fear,  text, markers, "fear");
  intensity += 0.35 * matchAny(LEX.sad,   text, markers, "sad");
  intensity -= 0.15 * matchAny(LEX.open,  text, markers, "open");
  const numbHits = matchAny(LEX.numb, text, markers, "numb");
  if (numbHits > 0) intensity += 0.25 * numbHits;

  // --- prosody / rhythm ---
  if (/[!?]+/.test(text)) intensity += 0.12;
  if (/\.{3}/.test(text)) intensity += 0.10;   // shutdown / hesitation
  if (/^\s*$/.test(text)) intensity += 0.20;   // empty text (can be dorsal)
  const len = text.length;
  if (len > 280) intensity += 0.08;             // rumination
  if (len < 8 && len > 0) intensity += 0.05;    // clipped speech

  // --- somatic markers ---
  switch (input.somatic) {
    case "pritisak_prsa": intensity += 0.25; markers.push("somatic:chest"); break;
    case "knedla_grlo":   intensity += 0.20; markers.push("somatic:throat"); break;
    case "hladnoca_noge": intensity += 0.18; markers.push("somatic:legs"); break;
  }

  // --- breath contribution (if provided) ---
  if (typeof input.breath === "number") {
    // shallow (0) increases intensity, deep (1) reduces
    intensity += (0.5 - input.breath) * 0.3;
    markers.push("breath:"+String(input.breath));
  }

  // Tone selection heuristic
  let tone: ERITone = "soft";
  const fearLike = LEX.fear.some(rx => rx.test(text));
  const sadLike  = LEX.sad.some(rx => rx.test(text));
  const heavyLike= LEX.heavy.some(rx => rx.test(text));
  const openLike = LEX.open.some(rx => rx.test(text));
  const numbLike = LEX.numb.some(rx => rx.test(text));

  if (numbLike) tone = "numb";
  else if (fearLike) tone = "scared";
  else if (heavyLike || sadLike) tone = "heavy";
  else if (openLike) tone = "open";
  else tone = "soft";

  return { tone, intensity, markers };
}
