'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { EntityProfile, TrailItem } from '@/lib/types';
import ProfileHeader from '@/components/ProfileHeader';
import EntityTabs from '@/components/EntityTabs';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import SearchBar from '@/components/SearchBar';

function EntityContent() {
  const params = useSearchParams();
  const title = params.get('title') || '';
  const trailParam = params.get('trail') || '';

  const trail: TrailItem[] = trailParam
    ? trailParam.split(',').filter(Boolean).map((t) => ({ title: t, wikiTitle: t }))
    : [];

  const [entity, setEntity] = useState<EntityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!title) return;
    setLoading(true);
    setError(false);
    fetch(`/api/entity?title=${encodeURIComponent(title)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.entity) setEntity(data.entity);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [title]);

  if (!title) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-muted">No entity specified.</p>
        <a href="/" className="text-primary hover:underline mt-2 block">← Go home</a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <BreadcrumbNav trail={trail} current={title} />

      {/* Mini search bar */}
      <div className="mb-8">
        <SearchBar />
      </div>

      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="flex gap-5">
            <div className="w-24 h-24 rounded-xl bg-card border border-border flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-card border border-border rounded w-1/3" />
              <div className="h-4 bg-card border border-border rounded w-2/3" />
              <div className="h-4 bg-card border border-border rounded w-1/2" />
            </div>
          </div>
          <div className="h-px bg-border" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-card border border-border rounded" style={{ width: `${80 - i * 8}%` }} />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-white font-medium mb-2">Entity not found</p>
          <p className="text-sm text-muted mb-4">Could not find information about &ldquo;{title}&rdquo;</p>
          <a href={`/search?q=${encodeURIComponent(title)}`} className="text-primary hover:underline text-sm">
            ← Back to search results
          </a>
        </div>
      )}

      {!loading && entity && (
        <div className="animate-fade-in">
          <ProfileHeader entity={entity} />
          <div className="border border-border rounded-xl p-5 bg-card">
            <EntityTabs entity={entity} trail={trail} />
          </div>

          {/* Depth indicator */}
          {trail.length > 0 && (
            <div className="mt-6 p-4 bg-surface border border-border rounded-xl">
              <p className="text-xs text-muted font-mono">
                <span className="text-primary">Depth {trail.length + 1}</span> — You are {trail.length + 1} hop{trail.length > 0 ? 's' : ''} deep in the rabbit hole
              </p>
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: Math.min(trail.length + 1, 10) }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 flex-1 rounded-full"
                    style={{
                      backgroundColor: i <= trail.length ? '#00c8ff' : '#1e2d45',
                      opacity: i <= trail.length ? 1 - i * 0.08 : 0.3,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EntityPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-8 bg-card border border-border rounded w-48" />
        <div className="flex gap-5">
          <div className="w-24 h-24 rounded-xl bg-card border border-border flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-card rounded w-1/3" />
            <div className="h-4 bg-card rounded w-2/3" />
          </div>
        </div>
      </div>
    }>
      <EntityContent />
    </Suspense>
  );
}
