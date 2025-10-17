// Minimal browser client helper
export async function getCsrfToken(baseUrl=''){
  const res = await fetch(baseUrl + '/csrf-token', { credentials:'include' })
  const data = await res.json().catch(()=>({}))
  return data.csrfToken
}

export async function refresh(baseUrl=''){
  const csrf = await getCsrfToken(baseUrl)
  const res = await fetch(baseUrl + '/auth/refresh', {
    method: 'POST',
    headers: { 'x-csrf-token': csrf, 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ refreshToken: getCookie('refreshToken') || '' })
  })
  const rid = res.headers.get('x-request-id')
  const data = await res.json().catch(()=>({}))
  return { ok: res.ok, data, requestId: rid }
}

export function getCookie(name){
  const m = document.cookie.match('(?:^|; )' + name + '=([^;]*)')
  return m ? decodeURIComponent(m[1]) : null
}

export async function apiFetch(path, { baseUrl='', method='GET', headers={}, body } = {}){
  const res = await fetch(baseUrl + path, {
    method,
    headers: { ...headers, 'content-type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined
  })
  const rid = res.headers.get('x-request-id')
  const data = await res.json().catch(()=>({}))
  return { ok: res.ok, data, requestId: rid }
}
