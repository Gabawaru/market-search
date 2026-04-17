'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import EntityCard from '@/components/EntityCard';
import { SearchResult } from '@/lib/types';

function SearchResults() {
  const params = useSearchParams();
  const q = params.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    setError(false);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => setResults(data.results || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <SearchBar initialValue={q} />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm text-muted">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              Searching for &ldquo;<span className="text-white">{q}</span>&rdquo;…
            </span>
          ) : error ? (
            <span className="text-rose-400">Search failed. Please try again.</span>
          ) : (
            <>
              Found <span className="text-white font-medium">{results.length}</span> results for &ldquo;
              <span className="text-primary">{q}</span>&rdquo;
            </>
          )}
        </h2>
        {!loading && results.length > 0 && (
          <span className="text-xs text-muted font-mono">Select the right person →</span>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-white font-medium mb-2">No results found</p>
          <p className="text-sm text-muted">Try a different name or search term</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, i) => (
            <EntityCard key={i} result={result} trail={q} />
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="mt-8 p-4 bg-surface border border-border rounded-xl text-sm text-muted text-center">
          Not what you&apos;re looking for?{' '}
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(q)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Search Google
          </a>
          {' · '}
          <a
            href={`https://duckduckgo.com/?q=${encodeURIComponent(q)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            DuckDuckGo
          </a>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="h-14 bg-card border border-border rounded-xl animate-pulse mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
