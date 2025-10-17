export function isFeatureEnabled(flag: string): boolean {
  const v = process.env[`FEATURE_${flag.toUpperCase()}_ENABLED`]
  if (!v) return false
  return v === '1' || v.toLowerCase() === 'true' || v.toLowerCase() === 'yes'
}
