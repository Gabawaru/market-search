'use client';

import { useState } from 'react';
import { generateDorks } from '@/lib/dorks';
import { Dork } from '@/lib/types';

interface Props {
  name: string;
}

export default function DorkPanel({ name }: Props) {
  const categories = generateDorks(name);
  const [activeCategory, setActiveCategory] = useState(0);
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  async function copyQuery(query: string) {
    await navigator.clipboard.writeText(query);
    setCopiedQuery(query);
    setTimeout(() => setCopiedQuery(null), 1500);
  }

  return (
    <div>
      <h3 className="text-xs font-mono uppercase tracking-widest text-muted mb-3">Search Dorks</h3>

      {/* Category tabs */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {categories.map((cat, i) => (
          <button
            key={i}
            onClick={() => setActiveCategory(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCategory === i
                ? 'bg-primary text-bg'
                : 'bg-surface border border-border text-muted hover:text-white hover:border-primary/40'
            }`}
          >
            <span className="mr-1">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Dork list */}
      <div className="space-y-2">
        {categories[activeCategory].dorks.map((dork: Dork, i: number) => (
          <div
            key={i}
            className="p-3 bg-surface border border-border rounded-lg hover:border-primary/30 transition-all group"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-sm font-medium text-white">{dork.label}</span>
              <button
                onClick={() => copyQuery(dork.query)}
                className="flex-shrink-0 text-xs text-muted hover:text-primary transition-colors px-2 py-0.5 rounded border border-border hover:border-primary/40"
              >
                {copiedQuery === dork.query ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <code className="block text-xs text-muted font-mono bg-bg px-2 py-1.5 rounded mb-2 break-all leading-relaxed">
              {dork.query}
            </code>
            <div className="flex gap-2">
              <a
                href={dork.googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-xs py-1.5 bg-card border border-border rounded hover:border-primary/40 hover:text-primary text-muted transition-all"
              >
                Google
              </a>
              <a
                href={dork.bingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-xs py-1.5 bg-card border border-border rounded hover:border-primary/40 hover:text-primary text-muted transition-all"
              >
                Bing
              </a>
              <a
                href={dork.ddgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-xs py-1.5 bg-card border border-border rounded hover:border-primary/40 hover:text-primary text-muted transition-all"
              >
                DDG
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
