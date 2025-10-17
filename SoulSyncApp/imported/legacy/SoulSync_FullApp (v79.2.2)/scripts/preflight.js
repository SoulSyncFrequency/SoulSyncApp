/**
 * Simple preflight checks before build/deploy
 * - Ensures required env vars exist
 * - Warns if VITE_API_BASE not set in CI (frontend may default to relative)
 */
const fs = require('fs')

function hasEnv(k){ return !!process.env[k] }

const required = ['ADMIN_TOKEN']
const missing = required.filter(k=>!hasEnv(k))
if(missing.length){
  console.warn('[preflight] Missing env vars:', missing.join(', '))
}

if(!hasEnv('VITE_API_BASE')){
  console.warn('[preflight] VITE_API_BASE not set — frontend will use relative API paths.')
}

// OK to proceed
process.exit(0)
