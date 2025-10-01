import React from 'react'
import { useAtom } from 'jotai'
import { ownedProductsAtom, isProAtom } from '../state/billingState'
import { useNavigate } from 'react-router-dom'

export default function Settings(){
  const [owned] = useAtom(ownedProductsAtom)
  const [isPro] = useAtom(isProAtom)
  const nav = useNavigate()

  function restartOnboarding(){
    localStorage.setItem('onboardingDone','false')
    nav('/')
    window.location.reload()
  }

  function resetApp(){
    localStorage.clear()
    window.location.reload()
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">⚙️ Postavke</h1>

      <div className="mb-6 border dark:border-gray-700 rounded-xl p-4">
        <h2 className="font-semibold mb-2">🧠 Ponovno pokreni onboarding</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Vratite se na uvodni vodič.</p>
        <button onClick={restartOnboarding} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">Pokreni uvod ponovo</button>
      </div>

      <div className="mb-6 border dark:border-gray-700 rounded-xl p-4">
        <h2 className="font-semibold mb-2">💎 Kupljene opcije</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Trenutno dostupne opcije:</p>
        <div className="text-sm">
          {isPro 
            ? <div>✅ Sve značajke su otključane</div>
            : owned.length>0 
              ? <div>{owned.join(', ')}</div>
              : <div>🔒 Nema kupljenih opcija</div>
          }
        </div>
      </div>

      <div className="mb-6 border dark:border-gray-700 rounded-xl p-4">
        <h2 className="font-semibold mb-2">🗑️ Reset aplikacije</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Izbrišite sve lokalne podatke i počnite ispočetka.</p>
        <button onClick={resetApp} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">Resetiraj aplikaciju</button>
      <div className="mb-6 border rounded-xl p-4">
    <h2 className="font-semibold mb-2">🌙 Tema</h2>
    <p className="text-sm text-gray-600 mb-3">Promijenite izgled aplikacije.</p>
    <button onClick={()=>{
      const isDark = document.documentElement.classList.contains('dark')
      if(isDark){
        document.documentElement.classList.remove('dark')
        localStorage.theme = 'light'
      }else{
        document.documentElement.classList.add('dark')
        localStorage.theme = 'dark'
      }
    }} className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded">Prebaci temu</button>
  </div>
</div>
  )
}
