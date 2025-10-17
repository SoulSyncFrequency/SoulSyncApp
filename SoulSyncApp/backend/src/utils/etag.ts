import crypto from 'crypto'
export function withEtag(res:any, data:any){
  const body=typeof data==='string'?data:JSON.stringify(data)
  const hash=crypto.createHash('sha1').update(body).digest('hex')
  res.setHeader('ETag',hash)
  if(res.req.headers['if-none-match']===hash){ res.status(304).end(); return true }
  res.send(body); return false
}
export function withLastModified(res:any, last:number){
  const lm=new Date(last).toUTCString()
  res.setHeader('Last-Modified', lm)
  const since = res.req.headers['if-modified-since']
  if(since && new Date(since).getTime()>=last){ res.status(304).end(); return true }
  return false
}
