import { useEffect } from 'react'

export default function useTrackUsage(feature: string){
  useEffect(()=>{
    const raw = localStorage.getItem('usage') || '{}'
    const data = JSON.parse(raw)
    data[feature] = (data[feature]||0)+1
    localStorage.setItem('usage', JSON.stringify(data))
  },[])
}
