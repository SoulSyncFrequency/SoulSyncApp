import React from 'react'
import { useAtom } from 'jotai'
import { isProAtom } from '../state/billingState'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Home(){
  const [isPro] = useAtom(isProAtom)
  const nav = useNavigate()

  const cards = [
    {
      key: 'direct',
      icon: '📝',
      title: 'Direct input 🟢',
      desc: 'Brzi unos ključnih riječi i trenutna analiza.',
      locked: false,
      path: '/direct'
    },
    {
      key: 'questionnaire',
      icon: '📋',
      title: `Questionnaire 💎 ${isPro ? '✅ Otključano' : '🔒 Premium'}`,
      desc: 'Detaljan upitnik koji generira personaliziranu terapiju.',
      locked: !isPro,
      path: '/questionnaire'
    },
    {
      key: 'verifier',
      icon: '🧪',
      title: `Verifier 💎 ${isPro ? '✅ Otključano' : '🔒 Premium'}`,
      desc: 'Provjera hrane, sastojaka i materijala uz F₀ ocjenu i alternative.',
      locked: !isPro,
      path: '/verifier'
    },
  ]

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Dobrodošli u SoulSync</h1>
      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((c,i)=>(
          <motion.div
            key={c.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i*0.15 }}
            whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            className="border dark:border-gray-700 rounded-2xl shadow-sm p-5 bg-white dark:bg-gray-900 flex flex-col transition cursor-pointer"
          >
            <div className="text-3xl mb-2">{c.icon}</div>
            <h2 className="text-lg font-semibold mb-2">{c.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow">{c.desc}</p>
            <button onClick={()=>{
              if(c.locked){ nav('/paywall') } else { nav(c.path) }
            }}
              className={`px-4 py-2 rounded text-white transition active:scale-95 ${c.locked?'bg-gray-400':'bg-blue-600 hover:bg-blue-700'}`}>
              {c.locked ? 'Kupi' : 'Pokreni'}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
