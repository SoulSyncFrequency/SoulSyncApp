import { useEffect, useState } from 'react'

interface Device {
  token: string
  platform: string
  user_id?: string
  segment?: string
}

export default function AdminDevices(){
  const [devices,setDevices] = useState<Device[]>([])
  const [secret,setSecret] = useState(localStorage.adminToken||'')
  const [loading,setLoading] = useState(false)

  async function load(){
    setLoading(true)
    const res = await await DefaultService.getApiAdminDevices()
    const j = await res.json()
    if(j.ok) setDevices(j.devices)
    else alert(j.error||'Greška')
    setLoading(false)
  }

  async function save(dev:Device){
    const res = await fetch('/api/admin/devices/'+dev.token, {
      method:'PATCH',
      headers:{
        'Content-Type':'application/json',
        Authorization:'Bearer '+secret
      },
      body: JSON.stringify({ userId:dev.user_id, segment:dev.segment })
    })
    const j = await res.json()
    if(!j.ok) alert(j.error||'Greška')
    else alert('Spremljeno!')
  }

  useEffect(()=>{
    if(secret) localStorage.adminToken=secret
  },[secret])

  return <div className="p-4">
    <h1 className="text-xl font-semibold mb-4">🛠️ Admin: Uređaji</h1>
    {!secret && <div className="mb-4">
      <input className="border p-2 rounded w-64" placeholder="Admin token" value={secret} onChange={e=>setSecret(e.target.value)}/>
      <button onClick={load} className="ml-2 px-4 py-2 bg-blue-600 text-white rounded">Prijava</button>
    </div>}
    {secret && <button onClick={load} className="mb-4 px-4 py-2 bg-green-600 text-white rounded">{loading?'Učitavam...':'🔄 Učitaj'}</button>}
    <div className="space-y-2">
      {devices.map(d=><div key={d.token} className="border rounded-xl p-3 flex flex-col gap-2">
        <div className="text-xs text-gray-500 break-all">{d.token}</div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="text-sm">{d.platform}</div>
          <input className="border p-1 rounded" placeholder="userId" value={d.user_id||''} onChange={e=>setDevices(x=>x.map(xx=>xx.token===d.token?{...xx,user_id:e.target.value}:xx))}/>
          <select className="border p-1 rounded" value={d.segment||'free'} onChange={e=>setDevices(x=>x.map(xx=>xx.token===d.token?{...xx,segment:e.target.value}:xx))}>
            <option value="free">free</option>
            <option value="premium">premium</option>
            <option value="verifier">verifier</option>
            <option value="admin">admin</option>
          </select>
          <button onClick={()=>save(d)} className="px-3 py-1 bg-blue-500 text-white rounded">💾 Spremi</button>
        </div>
      </div>)}
    </div>
  </div>
}
