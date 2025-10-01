import React, { useState } from 'react'
type Props = { tip: string; children: React.ReactNode }
export default function Tooltip({ tip, children }: Props){
  const [open,setOpen] = useState(false)
  return (
    <span className="relative inline-block" onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)}>
      {children}
      {open && (
        <span className="absolute z-50 -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded">
          {tip}
        </span>
      )}
    </span>
  )
}
