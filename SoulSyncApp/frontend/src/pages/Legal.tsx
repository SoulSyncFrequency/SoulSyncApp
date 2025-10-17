import React from 'react'
export default function Legal(){
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-3">Legal & Licensing</h1>
      <p className="text-sm text-gray-700">
        This application may include third-party SDKs and libraries. Licenses and notices are summarized here.
      </p>
      <ul className="list-disc ml-5 mt-3 space-y-1 text-sm">
        <li>Open-source dependencies are governed by their respective licenses (MIT/Apache-2.0/...)</li>
        <li>Proprietary SDKs (if enabled) must be used within their licensing terms.</li>
        <li>No personal data is shared without consent. See Privacy & Terms.</li>
      </ul>
    </div>
  )
}
