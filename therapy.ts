import { buildUltraPlan, UltraInput, UltraPlan } from './ultra51c.js'
export type TherapyInput = UltraInput
export type TherapyPlan = UltraPlan
export function generateTherapy(input: TherapyInput): TherapyPlan {
  return buildUltraPlan(input)
}
