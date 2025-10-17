import React, { useMemo, useState } from 'react';

// Import all markdown/txt from legal/imported as raw strings
const mdFiles = import.meta.glob('/legal/imported/**/*.{md,txt}', { as: 'raw', eager: true }) as Record<string, string>;

function slugify(path: string) {
  return path.toLowerCase()
    .replace(/^\/legal\/imported\//, '')
    .replace(/\.(md|txt)$/,'')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const docs = Object.entries(mdFiles).map(([path, content]) => ({
  path,
  slug: slugify(path),
  title: path.split('/').slice(-1)[0].replace(/\.(md|txt)$/,'')
}));

export default function LegalRenderer() {
  const [active, setActive] = useState<string>(docs[0]?.slug || '');
  const current = useMemo(() => docs.find(d => d.slug === active) || docs[0], [active]);

  return (
    <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-4 gap-6">
      <aside className="md:col-span-1 border rounded p-3 h-max sticky top-4">
        <h2 className="font-bold mb-2">Legal</h2>
        <ul className="space-y-2">
          {docs.map(d => (
            <li key={d.slug}>
              <button className={"underline " + (d.slug===active?'font-bold':'')} onClick={() => setActive(d.slug)}>{d.title}</button>
            </li>
          ))}
        </ul>
      </aside>
      <main className="md:col-span-3 prose max-w-none">
        {current ? (
          <article>
            <h1 className="text-2xl font-bold mb-4">{current.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: current ? current.content?.replace(/\n/g,'<br/>') : '' }} />
          </article>
        ) : <p>No legal docs found under <code>legal/imported/</code>.</p>}
      </main>
    </div>
  );
}
