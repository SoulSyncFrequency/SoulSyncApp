import { ai } from '../ai'

export async function generateSummary(userId: string) {
  const notes = `User ${userId} progress log ...`
  const summary = await ai.summarize(notes, { maxTokens: 120 })
  return { summary }
}
