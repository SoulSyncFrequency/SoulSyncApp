// Minimal WebAuthn register+verify client helper
function b64ToArrayBuffer(b64:string){
  const bin = atob(b64.replace(/-/g,'+').replace(/_/g,'/'))
  const buf = new ArrayBuffer(bin.length)
  const view = new Uint8Array(buf)
  for(let i=0;i<bin.length;i++) view[i] = bin.charCodeAt(i)
  return buf
}
function arrayBufferToB64(buf:ArrayBuffer){
  const bytes = new Uint8Array(buf)
  let bin=''; for(const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
}
export async function registerPasskey(){
  const reg = await fetch('/auth/mfa/webauthn/register', { method:'POST', credentials:'include' })
  const options = await reg.json()
  if(!options.challenge) throw new Error('WebAuthn not available')
  options.challenge = b64ToArrayBuffer(options.challenge)
  options.user.id = new TextEncoder().encode(String(options.user.id))
  const cred:any = await (navigator as any).credentials.create({ publicKey: options })
  if(!cred) throw new Error('Credential creation failed')
  const attResp = {
    id: cred.id,
    rawId: arrayBufferToB64(cred.rawId),
    type: cred.type,
    response: {
      attestationObject: arrayBufferToB64(cred.response.attestationObject),
      clientDataJSON: arrayBufferToB64(cred.response.clientDataJSON)
    }
  }
  const verify = await fetch('/auth/mfa/webauthn/verify', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(attResp) })
  return verify.json()
}
