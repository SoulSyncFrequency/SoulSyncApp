import React, { createContext, useContext, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

type Toast = { id:number; text:string; url?:string }
type Ctx = { show: (text:string, url?:string)=>void }

const ToastCtx = createContext<Ctx>({ show: ()=>{} })
export const useToast = ()=> useContext(ToastCtx)

export default function ToastProvider({ children }:{children:any}){
  const [toasts,setToasts] = useState<Toast[]>([])
  const nav = useNavigate()
  const show = useCallback((text:string, url?:string)=>{
    const id = Date.now()+Math.random()
    setToasts(t=>[...t, { id, text, url }])
    setTimeout(()=> setToasts(t=> t.filter(x=>x.id!==id)), 7000)
  },[])
  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(t=> (
          <div key={t.id}
               onClick={()=> t.url && nav(t.url)}
               className="max-w-sm cursor-pointer rounded-2xl shadow-lg border bg-white/90 p-3">
            <div className="text-sm">{t.text}</div>
            {t.url && <div className="text-xs underline text-blue-700">Open</div>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}