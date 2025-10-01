import React
import useTrackUsage from '../hooks/useTrackUsage', { useState } from 'react'

export default function UserVerifier(){
  useTrackUsage("verifier"){
  const [input,setInput] = useState('')
  const [result,setResult] = useState<any>(null)
  const [loading,setLoading] = useState(false)

  async function analyze(){
  useTrackUsage("verifier"){
    setLoading(true)
    try {
      const res = await fetch('/api/verifier/analyze',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ text: input })
      })
      const data = await res.json()
      setResult(data)
    } catch(e){
      console.error(e)
      alert('Greška pri analizi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🧪 Verifier 💎</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Unesite naziv proizvoda, sastojke, materijal itd. i dobit ćete F₀ ocjenu i alternativne prijedloge.</p>

      <textarea value={input} onChange={e=>setInput(e.target.value)} className="w-full border dark:border-gray-700 rounded p-2 h-32 mb-4" placeholder="Upiši ovdje..." />
      <button disabled={loading} onClick={analyze} className="px-4 py-2 bg-blue-600 text-white rounded">
        {loading? 'Analiziram...' : 'Analiziraj'}
      </button>

      {result && (
        <div className="mt-6 p-4 border dark:border-gray-700 rounded bg-gray-50">
          <h2 className="font-semibold mb-2">Rezultat</h2>
          <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(result,null,2)}</pre>
        </div>
      )}
    </div>
  )
}
