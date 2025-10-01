
export type Dose = { name: string, mg?: number, timesPerDay?: number }
export type Plan = { doses: Dose[] }
export type Warning = { level: 'info'|'caution'|'danger', code: string, message: string }

const MAX = {
  'Progest-E': 300,       // illustrative example mg/day
  'Pregnenolone': 100     // illustrative example mg/day
}

export function lintPlan(plan: Plan): Warning[]{
  const warns: Warning[] = []
  const total: Record<string, number> = {}
  for (const d of (plan.doses||[])){
    const mg = Math.max(0, Number(d.mg||0)) * Math.max(1, Number(d.timesPerDay||1))
    total[d.name] = (total[d.name]||0) + mg
  }
  for (const [name, mg] of Object.entries(total)){
    const cap = (MAX as any)[name]
    if (cap && mg > cap){
      warns.push({ level:'danger', code:'max_exceeded', message: `${name}: ~${Math.round(mg)}mg/day exceeds suggested cap ${cap}mg/day` })
    }else if (cap && mg > 0.8*cap){
      warns.push({ level:'caution', code:'near_cap', message: `${name}: near suggested cap (${Math.round(mg)}/${cap}mg/day)` })
    }
  }
  // Combo heuristic
  if ((total['Progest-E']||0) > 0 && (total['Pregnenolone']||0) > 0){
    warns.push({ level:'info', code:'combo_note', message:'Progest-E + Pregnenolone: monitor mood/sleep; informational only' })
  }
  return warns
}


export type LintInput = { doses: Dose[], weightKg?: number }

export function lintPlanEnhanced(input: LintInput): Warning[]{
  const warns: Warning[] = []
  const plan = { doses: input.doses || [] }
  const total: Record<string, number> = {}
  for (const d of plan.doses){
    const times = Math.max(1, Number(d.timesPerDay||1))
    if (times > 12){
      warns.push({ level:'caution', code:'freq_high', message: `${d.name}: timesPerDay=${times} seems high; double-check schedule` })
    }
    const mg = Math.max(0, Number(d.mg||0)) * times
    total[d.name] = (total[d.name]||0) + mg
  }
  const weight = Number(input.weightKg||0)
  const MAX_PER_KG:any = { 'Pregnenolone': 1.5 } // illustrative mg/kg/day guardrail
  for (const [name, mg] of Object.entries(total)){
    const cap = (MAX as any)[name]
    if (cap && mg > cap){
      warns.push({ level:'danger', code:'max_exceeded', message: `${name}: ~${Math.round(mg)}mg/day exceeds suggested cap ${cap}mg/day` })
    }else if (cap && mg > 0.8*cap){
      warns.push({ level:'caution', code:'near_cap', message: `${name}: near suggested cap (${Math.round(mg)}/${cap}mg/day)` })
    }
    const perkg = MAX_PER_KG[name]
    if (perkg && weight>0){
      const limit = perkg*weight
      if (mg > limit){
        warns.push({ level:'caution', code:'perkg_guardrail', message: `${name}: ~${Math.round(mg)}mg/day > ${perkg}mg/kg/day guardrail for ${weight}kg` })
      }
    }
  }
  if ((total['Progest-E']||0) > 0 && (total['Pregnenolone']||0) > 0){
    warns.push({ level:'info', code:'combo_note', message:'Progest-E + Pregnenolone: monitor mood/sleep; informational only' })
  }
  return warns
}
