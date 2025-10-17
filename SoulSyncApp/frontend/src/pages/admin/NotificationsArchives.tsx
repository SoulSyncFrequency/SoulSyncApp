import React, { useEffect, useState } from 'react'

type FileRow = { filename:string; size:number; createdAt:string }

export default function NotificationsArchives(){
  const [files,setFiles]=useState<FileRow[]>([])
  const [loading,setLoading]=useState(false)

  async function load(){
    setLoading(true)
    try{
      const r = await fetch('/api/notifications/archives')
      const j = await r.json()
      setFiles((j.files||[]).map((f:any)=>({...f, createdAt: new Date(f.createdAt).toISOString()})))
    } finally{
      setLoading(false)
    }
  }
  useEffect(()=>{ load() },[])

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-3">Notification Archives</h1>
      {loading ? <p>Loading...</p> : (
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-2 border">File</th>
              <th className="text-left p-2 border">Created</th>
              <th className="text-left p-2 border">Size (bytes)</th>
              <th className="text-left p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {files.map(f=>(
              <tr key={f.filename}>
                <td className="p-2 border">{f.filename}</td>
                <td className="p-2 border">{new Date(f.createdAt).toLocaleString()}</td>
                <td className="p-2 border">{f.size}</td>
                <td className="p-2 border">
                  <a className="underline text-blue-600" href={`/api/notifications/archives/${encodeURIComponent(f.filename)}`}>Download</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}