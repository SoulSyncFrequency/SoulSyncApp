import React from 'react'
export default function Paywall() {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string>('')
  async function startCheckout() {
    setLoading(true); setError('')
    try {
      const userId = localStorage.getItem('userId') || 'demo-user'
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setError(data.error || 'unknown_error')
    } catch (e:any) {
      setError(e.message || 'network_error')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Unlock full access</h1>
      <p className="mb-6">You get <strong>1 free therapy</strong>. After that, purchase to unlock unlimited therapies and premium modules.</p>
      <button onClick={startCheckout} disabled={loading} className="px-4 py-2 rounded-2xl shadow">
        {loading ? 'Redirecting...' : 'Go to Checkout'}
      </button>
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  )
}
