'use client';

import { TrailItem } from '@/lib/types';

interface Props {
  trail: TrailItem[];
  current: string;
}

export default function BreadcrumbNav({ trail, current }: Props) {
  if (trail.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 flex-wrap text-sm mb-6 p-3 bg-surface/50 border border-border/50 rounded-lg">
      <span className="text-muted text-xs uppercase tracking-widest mr-1 font-mono">Trail:</span>
      <a href="/" className="text-muted hover:text-primary transition-colors">Home</a>
      {trail.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-border">
            <path d="m9 18 6-6-6-6" />
          </svg>
          <a
            href={`/entity?title=${encodeURIComponent(item.wikiTitle)}&trail=${encodeURIComponent(trail.slice(0, i).map((t) => t.wikiTitle).join(','))}`}
            className="text-muted hover:text-primary transition-colors max-w-[120px] truncate"
            title={item.title}
          >
            {item.title}
          </a>
        </span>
      ))}
      <span className="flex items-center gap-1">
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-border">
          <path d="m9 18 6-6-6-6" />
        </svg>
        <span className="text-primary font-medium max-w-[150px] truncate" title={current}>{current}</span>
      </span>
    </nav>
  );
}
