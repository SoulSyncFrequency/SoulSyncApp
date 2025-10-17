let lang = (localStorage.getItem('lang')||'hr')
export function t(key:string){
  try{
    const bundle = lang==='en' ? require('../locales/en.json') : require('../locales/hr.json')
    const parts = key.split('.')
    return parts.reduce((o:any,k)=> (o||{})[k], bundle) || key
  }catch{ return key }
}
export function setLang(l:string){ lang=l; localStorage.setItem('lang',l) }
export function getLang(){ return lang }
