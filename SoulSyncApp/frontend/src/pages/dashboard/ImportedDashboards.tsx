import React from 'react';

// Lazy-load any dashboard pages that were imported
const modules = import.meta.glob('./imported/**/[A-Za-z]*.{tsx,jsx}', { eager: false });

export default function ImportedDashboards() {
  const keys = Object.keys(modules);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Imported Dashboards</h1>
      <p className="mb-4">Ovo je sandbox za dashboard komponente koje su uvezene iz ranijih ZIP-ova.</p>
      <ul className="list-disc ml-6 space-y-2">
        {keys.map((k) => (
          <li key={k}><code>{k}</code></li>
        ))}
      </ul>
      <p className="mt-6 text-sm opacity-70">Dodaj ove module u router po potrebi.</p>
    </div>
  );
}
