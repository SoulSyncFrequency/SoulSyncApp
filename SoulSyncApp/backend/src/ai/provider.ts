export type AIProviderName = 'mock' | 'openai' | 'anthropic' | 'local'
export type SummarizeOpts = { maxTokens?: number }
export type ClassifyOpts = { labels?: string[] }
export type EmbedOpts = { model?: string }

export interface AIProvider {
  summarize(text: string, opts?: SummarizeOpts): Promise<string>
  classify(text: string, opts?: ClassifyOpts): Promise<{ label: string, scores?: Record<string, number> }>
  embed(texts: string[], opts?: EmbedOpts): Promise<number[][]>
  moderate?(text: string): Promise<{ allowed: boolean, categories?: Record<string, boolean> }>
}

function env(k: string){ return process.env[k] || '' }

class MockProvider implements AIProvider {
  async summarize(text: string){ return text.length > 160 ? text.slice(0,157)+'...' : text }
  async classify(_text: string, opts?: ClassifyOpts){ const label = (opts?.labels||['neutral'])[0]; return { label, scores: { [label]: 1 } } }
  async embed(texts: string[]){ return texts.map((_t,i)=>[i*0.001, i*0.002]) }
  async moderate(text: string){ return { allowed: true } }
}

export function getAI(): AIProvider {
  const name = (env('AI_PROVIDER') || 'mock') as AIProviderName
  switch(name){
    case 'mock': return new MockProvider()
    // Placeholders for real providers
    case 'openai': throw new Error('OpenAI provider not configured. Set OPENAI_API_KEY and implement client.')
    case 'anthropic': throw new Error('Anthropic provider not configured. Set ANTHROPIC_API_KEY and implement client.')
    case 'local': throw new Error('Local provider not configured.')
    default: return new MockProvider()
  }
}
