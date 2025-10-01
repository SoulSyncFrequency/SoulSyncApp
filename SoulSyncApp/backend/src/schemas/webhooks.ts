import { z } from 'zod'
export const WebhookTestRequestSchema = z.object({
  payload: z.unknown().optional()
})
