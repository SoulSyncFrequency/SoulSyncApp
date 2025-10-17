export function featureFlag(name: string): boolean {
  return String(process.env[`FEATURE_${name.toUpperCase()}`] || 'false') === 'true'
}
