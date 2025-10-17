import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const slides = [
  { icon: '🌟', title: 'Dobrodošli u SoulSync', text: 'AI platforma za terapiju, analizu i osobni rast.' },
  { icon: '📝', title: 'Direct input 🟢', text: 'Brzi unos ključnih riječi i trenutna analiza.' },
  { icon: '📋', title: 'Questionnaire 💎', text: 'Detaljan upitnik koji generira personaliziranu terapiju.' },
  { icon: '🧪', title: 'Verifier 💎', text: 'Provjera hrane, sastojaka i materijala uz F₀ ocjenu i alternative.' },
  { icon: '🎁', title: 'Early supporter perk', text: 'Kupnjom bilo koje opcije privremeno otključavate sve značajke.' },
]

export default function IntroSlides(){
  const [index,setIndex] = useState(0)
  const nav = useNavigate()
  const next = () => {
    if(index < slides.length-1){ setIndex(i=>i+1) }
    else {
      localStorage.setItem('onboardingDone','true')
      nav('/')
    }
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 text-center p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.4 }}
          className="max-w-md"
        >
          <div className="text-6xl mb-4">{slides[index].icon}</div>
          <h1 className="text-2xl font-bold mb-2">{slides[index].title}</h1>
          <p className="text-gray-600 mb-8">{slides[index].text}</p>
          <button onClick={next} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition active:scale-95">
            {index===slides.length-1 ? 'Završi' : 'Dalje'}
          </button>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-2 mt-6">
        {slides.map((_,i)=>(
          <div key={i} className={`w-2 h-2 rounded-full ${i===index?'bg-blue-600':'bg-gray-300'}`} />
        ))}
      </div>
    </div>
  )
}
