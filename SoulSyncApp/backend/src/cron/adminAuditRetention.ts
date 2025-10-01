export function initAdminAuditRetention(){
  let cron:any=null; try{ cron = require('node-cron') }catch{ return null }
  const fs = require('fs'); const path = require('path'); const zlib = require('zlib'); const tar = require('tar-stream')
  const days = Number(process.env.ADMIN_AUDIT_RETENTION_DAYS || 60)
  const upload = process.env.ADMIN_AUDIT_UPLOAD_S3==='1'
  const bucket = process.env.STATS_S3_BUCKET || process.env.DS_S3_BUCKET
  const doUpload = upload && bucket
  let AWS:any=null; if(doUpload){ try{ AWS = require('aws-sdk') }catch{} }
  const task = cron.schedule('30 2 * * *', async ()=>{
    try{
      const base = path.join(process.cwd(),'audit','admin_actions')
      if(!fs.existsSync(base)) return
      const now = Date.now()
      // Optional: daily bundle & upload
      if(doUpload && AWS && AWS.S3){
        const tmp = path.join(process.cwd(),'tmp'); fs.mkdirSync(tmp,{recursive:true})
        const out = path.join(tmp, 'admin_actions_'+new Date().toISOString().slice(0,10)+'.tgz')
        await new Promise<void>((resolve,reject)=>{
          const pack = tar.pack(); const gzip = zlib.createGzip(); const ws = fs.createWriteStream(out)
          pack.pipe(gzip).pipe(ws)
          for(const day of fs.readdirSync(base)){
            const d = path.join(base, day)
            if(fs.statSync(d).isDirectory()){
              for(const f of fs.readdirSync(d)){
                const p = path.join(d,f); const st = fs.statSync(p)
                const rel = 'admin_actions/'+day+'/'+f
                const entry = pack.entry({ name: rel, size: st.size, type:'file' }, (err:any)=>{ if(err) reject(err) })
                fs.createReadStream(p).pipe(entry)
              }
            }
          }
          pack.finalize(); ws.on('finish', ()=> resolve()); ws.on('error', reject)
        })
        try{
          const s3 = new AWS.S3()
          const Key = 'admin_actions/'+require('path').basename(out)
          const Body = fs.readFileSync(out)
          await s3.putObject({ Bucket: bucket, Key, Body, ContentType:'application/gzip' }).promise()
          fs.unlinkSync(out)
        }catch{}
      }
      // Retention delete
      for(const day of fs.readdirSync(base)){
        const d = path.join(base, day)
        if(!fs.statSync(d).isDirectory()) continue
        const ts = Date.parse(day+'T00:00:00Z'); if(!isFinite(ts)) continue
        if(now - ts > days*86400000){
          try{ fs.rmSync(d, { recursive:true, force:true }) }catch{}
        }
      }
    }catch{}
  })
  return task
}
