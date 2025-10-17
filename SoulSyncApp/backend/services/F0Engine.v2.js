// F0Engine.v2 – službeni algoritam za F₀_score (SoulSync)
// © SoulSync — integrated module
function clamp(v){ return Math.max(0, Math.min(1, v)); }

function computeF0(params){
  const { Sym, Pol, Bph, Emo, Coh, Frac, Conn, Chak, Info, Safe, disease_type } = params || {};

  const threshold = 0.5;
  if (typeof Safe !== "number" || Safe < threshold) return 0;

  const values = {
    Sym: clamp(Sym ?? 0),
    Pol: clamp(Pol ?? 0),
    Bph: clamp(Bph ?? 0),
    Emo: clamp(Emo ?? 0),
    Coh: clamp(Coh ?? 0),
    Frac: clamp(Frac ?? 0),
    Conn: clamp(Conn ?? 0),
    Chak: clamp(Chak ?? 0),
    Info: clamp(Info ?? 0),
  };

  const weightProfiles = {
    neurodegenerative: { Sym:0.15, Pol:0.10, Bph:0.15, Emo:0.15, Coh:0.15, Frac:0.10, Conn:0.10, Chak:0.05, Info:0.05 },
    autoimmune:       { Sym:0.10, Pol:0.15, Bph:0.10, Emo:0.20, Coh:0.15, Frac:0.10, Conn:0.10, Chak:0.05, Info:0.05 },
    oncological:      { Sym:0.20, Pol:0.15, Bph:0.15, Emo:0.10, Coh:0.10, Frac:0.10, Conn:0.10, Chak:0.05, Info:0.05 },
    psychological:    { Sym:0.10, Pol:0.05, Bph:0.10, Emo:0.25, Coh:0.20, Frac:0.05, Conn:0.10, Chak:0.10, Info:0.05 }
  };

  const profile = weightProfiles[disease_type] || weightProfiles.psychological;

  let core = 1.0;
  for (const k in profile){
    core *= Math.pow(values[k], profile[k]);
  }

  const synergyFactor = 1 + (values.Emo * values.Coh * 0.05);
  const F0 = Math.min(1, core * synergyFactor);

  return F0;
}

module.exports = { computeF0 };
