export type ErrInfo = { http: number, code: string, message: string }
const M: Record<string, ErrInfo> = {
  unauthorized: { http: 401, code: 'unauthorized', message: 'Authentication required' },
  forbidden:     { http: 403, code: 'forbidden', message: 'Insufficient permissions' },
  not_found:     { http: 404, code: 'not_found', message: 'Resource not found' },
  rate_limited:  { http: 429, code: 'rate_limited', message: 'Too many requests' },
  server_error:  { http: 500, code: 'server_error', message: 'Unexpected server error' },
}
export function getError(code: string, fallback='server_error'): ErrInfo {
  return M[code] || M[fallback]
}
