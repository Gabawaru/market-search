'use client';

import { useState } from 'react';
import { TOOL_CATEGORIES, OSINT_TOOLS, OsintTool } from '@/lib/tools';

export default function ToolsPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const filtered = OSINT_TOOLS.filter((t) => {
    const matchesCat = activeCategory === 'all' || t.category === activeCategory;
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary font-mono mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {OSINT_TOOLS.length} Tools Available
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">OSINT Toolkit</h1>
        <p className="text-muted max-w-2xl">
          Curated collection of {OSINT_TOOLS.length} open-source intelligence tools across {TOOL_CATEGORIES.length} categories.
          Search, click, and investigate.
        </p>
      </div>

      {/* Target + Tool search bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <div className="relative">
          <label className="block text-xs text-muted font-mono uppercase tracking-widest mb-1.5">Target (name/domain/email)</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. John Doe, example.com, user@email.com"
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-white placeholder-muted text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>
        <div className="relative">
          <label className="block text-xs text-muted font-mono uppercase tracking-widest mb-1.5">Filter Tools</label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools…"
              className="w-full pl-9 pr-4 py-3 bg-surface border border-border rounded-xl text-white placeholder-muted text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            activeCategory === 'all'
              ? 'bg-primary text-bg border-primary'
              : 'bg-surface border-border text-muted hover:text-white hover:border-primary/40'
          }`}
        >
          All ({OSINT_TOOLS.length})
        </button>
        {TOOL_CATEGORIES.map((cat) => {
          const count = OSINT_TOOLS.filter((t) => t.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? 'bg-primary text-bg border-primary'
                  : 'bg-surface border-border text-muted hover:text-white hover:border-primary/40'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted font-mono mb-4">
        Showing {filtered.length} tools{search ? ` matching "${search}"` : ''}
        {activeCategory !== 'all' ? ` in ${TOOL_CATEGORIES.find((c) => c.id === activeCategory)?.label}` : ''}
      </p>

      {/* Tools grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tool) => (
          <ToolCard key={tool.id} tool={tool} queryValue={query} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-white font-medium mb-2">No tools found</p>
          <p className="text-sm text-muted">Try a different search term</p>
        </div>
      )}
    </div>
  );
}

function ToolCard({ tool, queryValue }: { tool: OsintTool; queryValue: string }) {
  const cat = TOOL_CATEGORIES.find((c) => c.id === tool.category);

  function buildUrl(): string {
    if (queryValue && tool.queryTemplate) {
      return tool.queryTemplate.replace('{query}', encodeURIComponent(queryValue));
    }
    return tool.url;
  }

  return (
    <div className="p-4 bg-card border border-border rounded-xl hover:border-primary/40 transition-all group flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{cat?.icon}</span>
          <h3 className="font-semibold text-white text-sm">{tool.name}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {tool.free ? (
            <span className="text-xs px-1.5 py-0.5 rounded bg-green-400/10 border border-green-400/20 text-green-400">Free</span>
          ) : (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400">Paid</span>
          )}
        </div>
      </div>

      <p className="text-xs text-muted leading-relaxed mb-3 flex-1">{tool.description}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {tool.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-surface border border-border text-muted">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <a
          href={buildUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 text-center text-xs py-2 rounded-lg border transition-all font-medium ${
            queryValue && tool.queryTemplate
              ? 'bg-primary text-bg border-primary hover:bg-cyan-300'
              : 'bg-surface border-border text-muted hover:text-white hover:border-primary/40'
          }`}
        >
          {queryValue && tool.queryTemplate ? `🔍 Search "${queryValue.slice(0, 15)}${queryValue.length > 15 ? '…' : ''}"` : 'Open Tool →'}
        </a>
        {queryValue && tool.queryTemplate && (
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-2 rounded-lg border border-border text-muted hover:text-white hover:border-primary/40 transition-all"
          >
            Home
          </a>
        )}
      </div>
    </div>
  );
}
