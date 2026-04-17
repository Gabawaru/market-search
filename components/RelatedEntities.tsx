'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { RelatedEntity, TrailItem } from '@/lib/types';

interface Props {
  wikiTitle: string;
  trail: TrailItem[];
  currentTitle: string;
}

export default function RelatedEntities({ wikiTitle, trail, currentTitle }: Props) {
  const [related, setRelated] = useState<RelatedEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/related?title=${encodeURIComponent(wikiTitle)}`)
      .then((r) => r.json())
      .then((data) => setRelated(data.related || []))
      .catch(() => setRelated([]))
      .finally(() => setLoading(false));
  }, [wikiTitle]);

  const newTrail = [...trail.map((t) => t.wikiTitle), currentTitle].join(',');

  if (loading) {
    return (
      <div>
        <h3 className="text-xs font-mono uppercase tracking-widest text-muted mb-3">Related Entities</h3>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-surface border border-border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (related.length === 0) {
    return (
      <div>
        <h3 className="text-xs font-mono uppercase tracking-widest text-muted mb-3">Related Entities</h3>
        <p className="text-sm text-muted">No related entities found.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs font-mono uppercase tracking-widest text-muted mb-3">
        Rabbit Hole — Related Entities
        <span className="ml-2 text-primary/60">({related.length})</span>
      </h3>
      <div className="space-y-2">
        {related.map((entity) => (
          <a
            key={entity.wikiTitle}
            href={`/entity?title=${encodeURIComponent(entity.wikiTitle)}&trail=${encodeURIComponent(newTrail)}`}
            className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg hover:border-primary/50 hover:bg-card transition-all group"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-lg overflow-hidden bg-card border border-border flex items-center justify-center">
              {entity.thumbnail ? (
                <Image
                  src={entity.thumbnail}
                  alt={entity.title}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-sm font-bold text-primary/50">
                  {entity.title.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white group-hover:text-primary transition-colors truncate">
                {entity.title}
              </p>
              {entity.description && (
                <p className="text-xs text-muted truncate">{entity.description}</p>
              )}
            </div>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0 text-muted group-hover:text-primary transition-colors">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
