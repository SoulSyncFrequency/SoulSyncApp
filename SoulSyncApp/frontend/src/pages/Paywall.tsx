import React from 'react'
import { addProduct } from '../state/billingState'
import { useNavigate } from 'react-router-dom'

export default function Paywall(){
  const nav = useNavigate()

  function unlock(p: string[]){
    p.forEach(addProduct)
    alert('Hvala na kupnji! 🎉 Sadržaj je otključan.')
    nav('/')
  }

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Otključaj SoulSync</h1>
<div className="mb-4 p-3 rounded bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">🎁 <b>Early supporter perk:</b> Kupnjom bilo koje opcije privremeno otključavate sve značajke!</div>
      <p className="mb-6 text-sm text-gray-600">Kupnjom barem jedne opcije otključavate sve značajke u ovoj ranoj fazi. Kasnije će se naplaćivati zasebno.</p>

      <div className="grid gap-4">
        <div className="border rounded-xl p-4">
          <h2 className="font-semibold text-lg">Jedna opcija (npr. Upitnik)</h2>
          <p className="mb-2 text-gray-500">5€</p>
          <button onClick={()=>unlock(['questionnaire'])} className="px-4 py-2 bg-blue-600 text-white rounded">Kupi</button>
        </div>

        <div className="border rounded-xl p-4">
          <h2 className="font-semibold text-lg">Dvije opcije</h2>
          <p className="mb-2 text-gray-500">8€</p>
          <button onClick={()=>unlock(['questionnaire','verifier'])} className="px-4 py-2 bg-blue-600 text-white rounded">Kupi</button>
        </div>

        <div className="border rounded-xl p-4">
          <h2 className="font-semibold text-lg">Sve opcije</h2>
          <p className="mb-2 text-gray-500">10€</p>
          <button onClick={()=>unlock(['direct','therapy','verifier'])} className="px-4 py-2 bg-blue-600 text-white rounded">Kupi</button>
        </div>
      </div>
    </div>
  )
}
