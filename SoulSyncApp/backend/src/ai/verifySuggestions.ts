import { requestWithCB } from './lib/httpClient'
import { withBreaker } from '../utils/breaker'

export interface Suggestion { path: string; value?: any; op?: 'set'|'unset'; score?: number }
export interface VerificationResult { ok: boolean; flags: string[]; comment?: string }

export const verifySuggestions = withBreaker(async function verifySuggestions(doc: any, suggestions: Suggestion[]): Promise<VerificationResult> {
  if(!process.env.OPENAI_API_KEY || process.env.VERIFY_SUGGESTIONS !== '1'){
    return { ok: true, flags: [] }
  }
  const prompt = [
    'You are a safety checker. Given the ORIGINAL document and a list of SUGGESTIONS (set/unset), flag risky changes.',
    'Return a short bullet list of concerns.',
    'ORIGINAL:', JSON.stringify(doc).slice(0, 8000),
    'SUGGESTIONS:', JSON.stringify(suggestions).slice(0, 8000)
  ].join('\n')

  const resp = await requestWithCB('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    })
  })
  const data = await resp.json() as any
  const text: string = data?.choices?.[0]?.message?.content || ''
  const flags = text.split('\n').map(s=>s.replace(/^[-*]\s*/,'').trim()).filter(Boolean).slice(0,10)
  return { ok: flags.length === 0, flags, comment: text }
}) as any
