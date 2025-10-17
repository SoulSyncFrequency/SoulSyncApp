import React from 'react'
export default function SDK(){
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-3">SoulSync SDK</h1>
      <p className="text-sm text-gray-700">
        Lightweight SDK helpers for integrating with SoulSync services (examples only).
      </p>
      <pre className="bg-gray-100 p-3 rounded mt-3 text-xs overflow-auto">
{`import { SoulSyncClient } from '@soulsync/sdk'
const client = new SoulSyncClient({ baseUrl: '/api' })
const res = await client.ping()`}
      </pre>
    </div>
  )
}
