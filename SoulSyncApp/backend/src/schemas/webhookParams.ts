import { z } from 'zod'
export const WebhookIdParamsSchema = z.object({
  id: z.string().uuid()
})
