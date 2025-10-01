
const REQUIRED = ['JWT_SECRET','CORS_ALLOWED_ORIGINS']
let missing = REQUIRED.filter(k => !process.env[k] || String(process.env[k]).trim()==='')
if (missing.length){
  console.error('Missing required env vars:', missing.join(', '))
  process.exit(1)
}else{
  console.log('Env OK')
}
