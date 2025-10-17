import { z } from 'zod'

export const DataSheetRequestSchema = z.object({
  rows: z.array(z.record(z.any())).min(1),
  title: z.string().optional(),
  columns: z.array(z.string()).optional()
})
export type DataSheetRequest = z.infer<typeof DataSheetRequestSchema>
