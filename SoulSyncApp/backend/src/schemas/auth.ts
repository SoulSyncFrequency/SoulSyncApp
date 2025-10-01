import { z } from 'zod'

export const LoginResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email()
  })
})

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})
