export function featureFlag(name: string): boolean {
  const v = process.env[`FEATURE_${name.toUpperCase()}`]
  return String(v||'false') === 'true'
}
