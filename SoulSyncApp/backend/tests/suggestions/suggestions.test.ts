import { describe, it, expect } from 'vitest'
import { applySuggestions } from '../../src/services/suggestions'

describe('suggestions.apply', ()=>{
  it('applies set/unset and resolves conflicts by score when autoTune=true', ()=>{
    const doc:any = { a: { b: { c: 1 } }, list: [ { x:1 }, { x:2 } ] }
    const suggestions = [
      { path:'a.b.c', value: 2, score: 0.7 },
      { path:'a.b.c', value: 3, score: 0.9 },
      { path:'list[1].x', op: 'unset', score: 0.5 }
    ] as any
    const { result, conflicts } = applySuggestions(doc, suggestions, { autoTune: true })
    expect(result.a.b.c).toBe(3)
    expect(result.list.length).toBe(1)
    expect(conflicts.find(c=>c.path==='a.b.c')?.kept).toBe('suggestion')
  })
})
