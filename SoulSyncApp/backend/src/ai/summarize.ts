import { requestWithCB } from './lib/httpClient'
import { withBreaker } from '../utils/breaker'
// src/ai/summarize.ts
export const summarizeRows = withBreaker(async function summarizeRows(rows: any[]): Promise<string[]> {
  try{
    if(!process.env.OPENAI_API_KEY) return []
    const text = JSON.stringify(rows.slice(0, 50)) // cap
    const prompt = `Summarize the key insights from the following rows in 3-5 bullets (concise): ${text}`
    const resp = await requestWithCB('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role:'user', content: prompt }],
        temperature: 0.2
      })
    })
    const data = await resp.json()
    const content: string = data?.choices?.[0]?.message?.content || ''
    return content.split('\n').map(s=>s.replace(/^[-*]\s*/,'')).filter(Boolean).slice(0,5)
  }catch{ return [] }
}
) as any
