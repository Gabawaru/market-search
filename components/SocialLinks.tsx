'use client';

import { getSocialSearchLinks } from '@/lib/dorks';

interface Props {
  name: string;
}

export default function SocialLinks({ name }: Props) {
  const links = getSocialSearchLinks(name);

  return (
    <div>
      <h3 className="text-xs font-mono uppercase tracking-widest text-muted mb-3">Search Presence</h3>
      <div className="grid grid-cols-2 gap-2">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 bg-surface border border-border rounded-lg hover:border-primary/40 hover:bg-card transition-all text-sm text-white hover:text-primary group"
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0 transition-transform group-hover:scale-125" style={{ backgroundColor: link.color }} />
            <span className="truncate">{link.label}</span>
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="ml-auto flex-shrink-0 opacity-40 group-hover:opacity-100">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
