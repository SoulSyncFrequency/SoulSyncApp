import { useEffect, useState } from 'react'

type Therapy = {
  disease: string
  modules: string[]
  supplements: string[]
  smiles: string
  f0_score: number
  plan5day: { day: string, chakra: string, meals: string[] }[]
}

export default function Therapy() {
  const [lang, setLang] = useState('en')
  const [disease, setDisease] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [therapy, setTherapy] = useState<Therapy | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => { const l = localStorage.getItem('lang'); if (l) setLang(l) }, [])

  const submit = async () => {
    setLoading(true)
    setError(null)
    setTherapy(null)
    setPdfUrl(null)
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
      const res = await fetch(`${base}/api/generateTherapy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disease,
          symptoms: symptoms ? symptoms.split(',').map(s => s.trim()).filter(Boolean) : [],
          language: lang
        })
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data?.error || 'Request failed')
      setTherapy(data.therapy)
      setPdfUrl(data.pdfUrl)
    } catch (e: any) {
      setError(e.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">{lang==='en'?'🌀 Therapy Modules':'🌀 Terapijski moduli'}</h1>

      <div className="space-y-3 mb-4">
        <label className="block">
          <span className="block text-sm opacity-80">{lang==='en'?'Disease / Condition':'Bolest / stanje'}</span>
          <input value={disease} onChange={e=>setDisease(e.target.value)} className="w-full border rounded px-3 py-2 bg-transparent" placeholder={lang==='en'?'e.g., Depression':'npr. Depresija'} />
        </label>
        <label className="block">
          <span className="block text-sm opacity-80">{lang==='en'?'Symptoms (comma‑separated)':'Simptomi (odvojeni zarezom)'}</span>
          <input value={symptoms} onChange={e=>setSymptoms(e.target.value)} className="w-full border rounded px-3 py-2 bg-transparent" placeholder={lang==='en'?'fatigue, anxiety, insomnia':'umor, anksioznost, nesanica'} />
        </label>
        <button onClick={submit} disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60">
          {loading ? (lang==='en'?'Generating...':'Generiram...') : (lang==='en'?'Generate Therapy':'Generiraj terapiju')}
        </button>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>

      {therapy && (
        <div className="space-y-3">
          <div>
            <h2 className="font-semibold">{lang==='en'?'Result':'Rezultat'}</h2>
            <div className="text-sm opacity-80">{lang==='en'?'Disease':'Bolest'}: {therapy.disease}</div>
          </div>
          <div>
            <h3 className="font-semibold">{lang==='en'?'Modules':'Moduli'}</h3>
            <ul className="list-disc ml-6">
              {therapy.modules.map((m,i)=>(<li key={i}>{m}</li>))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">{lang==='en'?'Supplements':'Dodaci prehrani'}</h3>
            <ul className="list-disc ml-6">
              {therapy.supplements.map((s,i)=>(<li key={i}>{s}</li>))}
            </ul>
          </div>
          <div className="text-sm"><span className="font-semibold">SMILES:</span> {therapy.smiles}</div>
          <div className="text-sm"><span className="font-semibold">F₀:</span> {therapy.f0_score}</div>

          <div>
            <h3 className="font-semibold">{lang==='en'?'5‑Day Plan':'5‑dnevni plan'}</h3>
            <ol className="list-decimal ml-6">
              {therapy.plan5day.map((d,i)=>(
                <li key={i} className="mb-1">
                  <span className="font-semibold">{d.day}</span> — chakra: {d.chakra}
                  <ul className="list-disc ml-6">
                    {d.meals.map((m,ix)=>(<li key={ix}>{m}</li>))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>

          {pdfUrl && (
            <a className="inline-block mt-2 px-4 py-2 rounded border hover:bg-gray-100 dark:hover:bg-gray-800" href={pdfUrl} target="_blank" rel="noreferrer">
              {lang==='en'?'Download PDF':'Preuzmi PDF'}
            </a>
          )}
        </div>
      )}
    </div>
  )
}
