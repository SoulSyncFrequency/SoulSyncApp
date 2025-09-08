import { generateValidSmiles } from './smiles.js'

export type UltraInput = { disease?: string, symptoms?: string[], language?: 'en'|'hr' }
export type UltraPlan = {
  disease: string
  chakraMap: string[]
  modules: string[]
  supplements: string[]
  smiles: string
  f0_score: number
  plan5day: { day: string, chakra: string, focus: string, meals: string[] }[]
}

const CHAKRA_RULES: Record<string,string[]> = {
  depression: ['solar plexus','heart','crown'],
  anxiety: ['heart','throat'],
  insomnia: ['crown','third eye'],
  adhd: ['throat','third eye'],
  bpd: ['root','solar plexus'],
  ptsd: ['heart','third eye'],
  ocd: ['throat','third eye']
}
const SUPP_TABLE: Record<string,string[]> = {
  depression: ['Omega-3','Raw milk','Beef liver','Oysters'],
  anxiety: ['Magnesium glycinate','L-theanine','Chamomile tea'],
  insomnia: ['Glycine','Low-dose Melatonin','Valerian'],
  adhd: ['Omega-3 (EPA/DHA)','Zinc','Iron if deficient'],
  bpd: ['Collagen','Vitamin D3+K2','Electrolytes'],
  ptsd: ['Ashwagandha','Omega-3','Magnesium'],
  ocd: ['Inositol','NAC','Magnesium']
}
const MODULES = {
  base: ['Frequency + Molecule','Metabolic Awakening'],
  emdr: 'EMDR',
  psilo: 'Psilocybin (micro-dosing)',
  breath: 'Breathwork + HRV',
  dna: 'Epigenetic / DNA reprogramming'
}
function detectKey(disease: string): string {
  const d = disease.toLowerCase()
  if (d.includes('depress') || d.includes('bpd')) return 'depression'
  if (d.includes('anx') || d.includes('panic')) return 'anxiety'
  if (d.includes('insom') || d.includes('sleep')) return 'insomnia'
  if (d.includes('adhd') || d.includes('add')) return 'adhd'
  if (d.includes('ptsd')) return 'ptsd'
  if (d.includes('ocd')) return 'ocd'
  return 'depression'
}
function f0Score(disease: string, modulesCount: number): number {
  let base = 0.76
  if (/bpd|depress|anx/.test(disease)) base += 0.08
  if (/adhd|insom/.test(disease)) base += 0.04
  return Math.min(0.99, base + modulesCount * 0.03)
}
export function buildUltraPlan(input: UltraInput): UltraPlan {
  const disease = (input.disease || 'unspecified').trim()
  const key = detectKey(disease)
  const chakras = CHAKRA_RULES[key] || ['balance']
  let modules = [...MODULES.base]
  if (key === 'depression' || key === 'bpd') modules.push(MODULES.emdr)
  if (key === 'adhd') modules.push(MODULES.psilo)
  if (key === 'anxiety' || key==='ptsd') modules.push(MODULES.breath)
  modules.push(MODULES.dna)
  let supplements = SUPP_TABLE[key] || ['Electrolytes','Mineral water']
  const smiles = generateValidSmiles(disease)

  // Symptom-based combinations
  const syms = (input.symptoms || []).map(s=>s.toLowerCase())
  const has = (k:string)=> syms.some(s=>s.includes(k))
  if (key === 'ptsd' && has('insom')) {
    if (!modules.includes(MODULES.breath)) modules.push(MODULES.breath)
    if (!supplements.includes('Glycine')) supplements.push('Glycine')
  }
  // previous combos
if (key === 'ocd' && has('anx')) {
    if (!modules.includes(MODULES.emdr)) modules.push(MODULES.emdr)
    if (!supplements.includes('L-theanine')) supplements.push('L-theanine')
  }

  const score = f0Score(disease, modules.length)
  const days = ['Day 1','Day 2','Day 3','Day 4','Day 5']
  const chakraCycle = ['root','sacral','solar plexus','heart','throat','third eye','crown']
  const focusMap: Record<string,string> = {
    'root':'Grounding & safety','sacral':'Flow & creativity','solar plexus':'Energy & will',
    'heart':'Calm & connection','throat':'Focus & expression','third eye':'Clarity','crown':'Sleep & integration'
  }
  const mealPlan = (c:string)=>[
    `Breakfast: raw dairy + fruit (chakra: ${c})`,
    `Lunch: ruminant meat + organs (chakra: ${c})`,
    `Dinner: seafood + tubers (chakra: ${c})`
  ]
  const plan5day = days.map((d, i) => {
    const chakra = chakraCycle[i % chakraCycle.length]
    return { day: d, chakra, focus: focusMap[chakra], meals: mealPlan(chakra) }
  })
  return { disease, chakraMap: chakras, modules, supplements, smiles, f0_score: Number(score.toFixed(2)), plan5day }
}

  // Extra comorbidity rules
  if ((key === 'depression' || key === 'anxiety') && (has('insom') || has('sleep'))) {
    if (!modules.includes(MODULES.breath)) modules.push(MODULES.breath)
    if (!supplements.includes('Glycine')) supplements.push('Glycine')
  }
  if (key === 'adhd' && (has('anx') || has('panic'))) {
    if (!modules.includes(MODULES.breath)) modules.push(MODULES.breath)
    if (!supplements.includes('Magnesium glycinate')) supplements.push('Magnesium glycinate')
  }
  if (key === 'depression' && has('anx')) {
    if (!modules.includes(MODULES.emdr)) modules.push(MODULES.emdr)
    if (!supplements.includes('L-theanine')) supplements.push('L-theanine')
  }
