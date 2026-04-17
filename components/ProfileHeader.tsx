'use client';

import Image from 'next/image';
import { EntityProfile } from '@/lib/types';

const TYPE_BADGE: Record<EntityProfile['type'], { label: string; color: string }> = {
  person: { label: 'Person', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' },
  organization: { label: 'Organization', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  place: { label: 'Place', color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  media: { label: 'Media', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  event: { label: 'Event', color: 'text-rose-400 bg-rose-400/10 border-rose-400/30' },
  other: { label: 'Entity', color: 'text-gray-400 bg-gray-400/10 border-gray-400/30' },
};

interface Props {
  entity: EntityProfile;
}

export default function ProfileHeader({ entity }: Props) {
  const badge = TYPE_BADGE[entity.type];

  return (
    <div className="flex items-start gap-5 mb-6">
      {/* Avatar */}
      <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-surface border border-border flex items-center justify-center">
        {entity.thumbnail ? (
          <Image
            src={entity.thumbnail}
            alt={entity.title}
            width={96}
            height={96}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <span className="text-3xl font-bold text-primary/50">{entity.title.charAt(0)}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">{entity.title}</h1>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badge.color}`}>
            {badge.label}
          </span>
        </div>
        {entity.description && (
          <p className="text-muted text-sm mb-3 line-clamp-2">{entity.description}</p>
        )}
        <div className="flex gap-2 flex-wrap">
          <a
            href={entity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-surface border border-border rounded-lg text-muted hover:text-primary hover:border-primary/40 transition-all"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Wikipedia
          </a>
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(entity.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-surface border border-border rounded-lg text-muted hover:text-primary hover:border-primary/40 transition-all"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            Google
          </a>
          <a
            href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(entity.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-surface border border-border rounded-lg text-muted hover:text-primary hover:border-primary/40 transition-all"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Images
          </a>
          <a
            href={`https://news.google.com/search?q=${encodeURIComponent(entity.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-surface border border-border rounded-lg text-muted hover:text-primary hover:border-primary/40 transition-all"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            </svg>
            News
          </a>
        </div>
      </div>
    </div>
  );
}
