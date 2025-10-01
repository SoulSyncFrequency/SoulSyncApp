export function hpp(){
  try{ const m = require('hpp'); return m() }catch{ return (_req:any,_res:any,next:any)=> next() }
}
