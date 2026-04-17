'use client';

import Image from 'next/image';
import { SearchResult } from '@/lib/types';

interface Props {
  result: SearchResult;
  trail?: string;
  onSelect?: (result: SearchResult) => void;
}

export default function EntityCard({ result, trail, onSelect }: Props) {
  const href = `/entity?title=${encodeURIComponent(result.wikiTitle)}${trail ? `&trail=${encodeURIComponent(trail)}` : ''}`;

  function handleClick() {
    if (onSelect) onSelect(result);
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-card/80 transition-all group animate-fade-in cursor-pointer"
    >
      <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-surface border border-border flex items-center justify-center">
        {result.thumbnail ? (
          <Image
            src={result.thumbnail}
            alt={result.title}
            width={56}
            height={56}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <span className="text-xl font-bold text-primary/60">
            {result.title.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white group-hover:text-primary transition-colors truncate">
          {result.title}
        </h3>
        <p className="text-sm text-muted mt-1 line-clamp-2">{result.description}</p>
      </div>
      <div className="flex-shrink-0 self-center text-muted group-hover:text-primary transition-colors">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </a>
  );
}
