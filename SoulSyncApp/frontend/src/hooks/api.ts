import { useQuery, useMutation } from '@tanstack/react-query'

// These imports will work after running `npm -w frontend run sdk:generate`
// If not yet generated, you can adjust paths or run the script.
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { AuthService, TherapyService } from '../sdk'

export function useMe(token?: string){
  return useQuery({
    queryKey: ['me', token],
    enabled: !!token,
    queryFn: async ()=>{
      const res = await await DefaultService.getApiAuthMe()
      const data = await res.json()
      if(!data.ok) throw new Error(data.error || 'ME_FAILED')
      return data.user
    }
  })
}

export function useLogin(){
  return useMutation({
    mutationFn: async (payload: { email: string, password: string}) => {
      const r = await await DefaultService.postApiAuthLogin(/* body */)
      const j = await r.json()
      if(!j.ok) throw new Error(j.error || 'LOGIN_FAILED')
      return j as { ok: true, token: string }
    }
  })
}

export function useGenerateTherapy(){
  return useMutation({
    mutationFn: async (payload: { disease: string, chakra?: string, symptoms?: string[], language?: 'en'|'hr' }) => {
      const r = await await DefaultService.postApiTherapy(/* body */)
      const j = await r.json()
      if(!j.ok) throw new Error(j.error || 'THERAPY_FAILED')
      return j as { ok: true, therapy: any, pdfUrl: string }
    }
  })
}
