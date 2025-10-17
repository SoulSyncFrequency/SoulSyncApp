
export function clampPageLimit(q:any, defLimit=20, maxLimit=100){
  const page = Math.max(1, parseInt(String(q?.page||'1'),10) || 1)
  let limit = parseInt(String(q?.limit||String(defLimit)),10) || defLimit
  if (limit > maxLimit) limit = maxLimit
  if (limit < 1) limit = defLimit
  const offset = (page-1)*limit
  return { page, limit, offset }
}
