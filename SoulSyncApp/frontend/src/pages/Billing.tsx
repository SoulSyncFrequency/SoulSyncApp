import React from 'react';
export default function Billing() {
  const checkout = async (priceId: string) => {
    const res = await fetch('/api/billing/checkout', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ priceId }) });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert(data.error || 'Billing is not configured');
  };
  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">SoulSync Pro</h1>
      <p className="mb-6">Unlock advanced therapy features.</p>
      <div className="space-y-3">
        <button onClick={() => checkout(import.meta.env.VITE_PRICE_MONTHLY)} className="px-4 py-2 rounded bg-black text-white">Subscribe Monthly</button>
        <button onClick={() => checkout(import.meta.env.VITE_PRICE_YEARLY)} className="px-4 py-2 rounded bg-black text-white">Subscribe Yearly</button>
      </div>
    </div>
  );
}
