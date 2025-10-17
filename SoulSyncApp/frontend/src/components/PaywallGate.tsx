import React from 'react'
import { useAtom } from 'jotai'
import { ownedProductsAtom, isProAtom } from '../state/billingState'
import { useNavigate } from 'react-router-dom'

export default function PaywallGate({feature, children}:{feature:string,children:any}){
  const [owned] = useAtom(ownedProductsAtom)
  const [isPro] = useAtom(isProAtom)
  const nav = useNavigate()

  if(isPro || owned.includes(feature)){
    return children
  }

  return (
    <div className="p-6 border rounded-xl text-center bg-gray-50">
      <div className="text-lg font-semibold mb-2">🔒 Premium sadržaj</div>
      <p className="mb-4">Za pristup ovoj značajci potrebno je otključati premium verziju.</p>
      <button onClick={()=>nav('/paywall')} className="px-4 py-2 bg-blue-600 text-white rounded">Otključaj</button>
    </div>
  )
}
