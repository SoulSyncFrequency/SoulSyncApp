import { z } from 'zod'

export const PrimaryMoleculeMetaSchema = z.object({
  value: z.string().min(1),
  provenance: z.enum(['registry','disease','ai']).or(z.string()),
  note: z.string().min(1),
  smiles: z.string().min(1),
  description: z.string().min(1)
})

export type PrimaryMoleculeMeta = z.infer<typeof PrimaryMoleculeMetaSchema>
