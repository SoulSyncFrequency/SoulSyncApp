// @ts-ignore
import packageJson from '../../package.json'
import { useEffect, useState } from 'react'
export default function About() {
  const version = packageJson.version
  const [lang, setLang] = useState('en')
  useEffect(() => { const l = localStorage.getItem('lang'); if (l) setLang(l) }, [])
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">{lang === 'en' ? 'About SoulSync' : 'O aplikaciji SoulSync'}</h1>
      <p className="mb-2">{lang === 'en' ?
        'SoulSync (Marko Jurič) — holistic therapy engine combining psychology, energy, and biology. The app provides personalized therapy modules, nutrition, and integration tools.' :
        'SoulSync (Marko Jurič) — holistički terapijski sustav koji spaja psihologiju, energiju i biologiju. Aplikacija pruža personalizirane terapijske module, prehranu i alate za integraciju.'}
      </p>
      <p className="text-sm text-gray-600">{lang === 'en' ? 'Version' : 'Verzija'}: {version}</p>
    </div>
  )
}