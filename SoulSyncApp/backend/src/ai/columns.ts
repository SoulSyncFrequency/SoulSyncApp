import { requestWithCB } from './lib/httpClient'
import { withBreaker } from '../utils/breaker'

export const suggestColumns = withBreaker(async (rows: any[]): Promise<string[]> => {
  try{
    if(!process.env.OPENAI_API_KEY) return []
    const sample = JSON.stringify(rows.slice(0, 50))
    const prompt = `From the following rows (array of objects), propose a compact column order (3-10 keys). Output keys only, comma-separated. Rows: ${sample}`
    const resp = await requestWithCB('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages: [{ role:'user', content: prompt }], temperature: 0.1 })
    })
    const data = await resp.json()
    const text: string = data?.choices?.[0]?.message?.content || ''
    const cols = text.split(',').map(s=>s.trim()).filter(Boolean).slice(0, 10)
    return cols
  }catch{ return [] }
}) as any
