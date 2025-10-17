
import fs from 'fs'
import path from 'path'

function opId(method:string, p:string){
  const clean = p.replace(/^\//,'').replace(/\{([^}]+)\}/g,'by_$1').replace(/[^a-z0-9]+/gi,'_')
  return method.toLowerCase() + '_' + clean
}
function main(){
  const specPath = path.join(process.cwd(),'backend','openapi','openapi.json')
  if (!fs.existsSync(specPath)) { console.log('no openapi.json'); return }
  const spec = JSON.parse(fs.readFileSync(specPath,'utf-8'))
  for (const p of Object.keys(spec.paths||{})){
    const ops = spec.paths[p]
    for (const m of Object.keys(ops||{})){
      const op = ops[m]
      if (op && typeof op==='object' && !op.operationId){
        op.operationId = opId(m, p)
      }
    }
  }
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2), 'utf-8')
  console.log('operationIds added where missing')
}
main()
