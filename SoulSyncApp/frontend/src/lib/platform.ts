export function getPlatform() {
  const v = (import.meta as any).env?.VITE_APP_PLATFORM || 'store'
  return String(v).toLowerCase() === 'web' ? 'web' : 'store'
}
