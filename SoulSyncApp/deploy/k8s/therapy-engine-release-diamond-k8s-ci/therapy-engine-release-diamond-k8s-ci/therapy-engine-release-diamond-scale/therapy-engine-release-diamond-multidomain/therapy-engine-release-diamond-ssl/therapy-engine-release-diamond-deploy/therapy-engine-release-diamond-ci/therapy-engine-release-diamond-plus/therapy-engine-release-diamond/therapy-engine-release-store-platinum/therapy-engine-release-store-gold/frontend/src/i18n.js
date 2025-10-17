import en from './locales/en.json';
import hr from './locales/hr.json';
export function t(lang, key){ const dict = lang==='hr'? hr : en; return dict[key] || key; }
