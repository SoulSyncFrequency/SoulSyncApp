
export function enforceF0Safe(score:number, safe:number, threshold:number){
  if (Number.isFinite(safe) && safe < threshold) return 0
  return Math.max(0, Math.min(1, score))
}
