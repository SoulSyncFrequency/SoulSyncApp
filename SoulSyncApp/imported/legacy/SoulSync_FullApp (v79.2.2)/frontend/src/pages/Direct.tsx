import React
import useTrackUsage from '../hooks/useTrackUsage', { useState } from 'react'

export default function Direct(){
  useTrackUsage("direct"){
  const [input,setInput] = useState('')
  const [result,setResult] = useState<any>(null)

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">📝 Direct input 🟢</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Brzi unos ključnih riječi i trenutna analiza.</p>
      <textarea value={input} onChange={e=>setInput(e.target.value)} className="w-full border dark:border-gray-700 rounded p-2 h-32 mb-4" placeholder="Upiši ovdje..." />
      <button onClick={()=>setResult('Analiza još nije implementirana')} className="px-4 py-2 bg-blue-600 text-white rounded">Analiziraj</button>
      {result && <div className="mt-4 text-sm">{result}</div>}
    </div>
  )
}
