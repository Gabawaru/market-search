'use client';

import { useState, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  initialValue?: string;
  autoFocus?: boolean;
  placeholder?: string;
}

export default function SearchBar({ initialValue = '', autoFocus = false, placeholder }: Props) {
  const [query, setQuery] = useState(initialValue);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-primary pointer-events-none">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder ?? 'Search any person, company, or entity…'}
          autoFocus={autoFocus}
          className="w-full pl-12 pr-32 py-4 bg-surface border border-border rounded-xl text-white placeholder-muted text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
        <button
          type="submit"
          className="absolute right-2 px-5 py-2.5 bg-primary text-bg font-semibold rounded-lg text-sm hover:bg-cyan-300 transition-colors active:scale-95"
        >
          Investigate
        </button>
      </div>
    </form>
  );
}
