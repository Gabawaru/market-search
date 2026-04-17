'use client';

import { useState } from 'react';
import { EntityProfile, TrailItem } from '@/lib/types';
import DorkPanel from './DorkPanel';
import SocialLinks from './SocialLinks';
import RelatedEntities from './RelatedEntities';

interface Props {
  entity: EntityProfile;
  trail: TrailItem[];
}

const TABS = ['Overview', 'Social', 'Dorks', 'Rabbit Hole'] as const;
type Tab = (typeof TABS)[number];

export default function EntityTabs({ entity, trail }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-border mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? 'text-primary border-primary'
                : 'text-muted border-transparent hover:text-white hover:border-border'
            }`}
          >
            {tab === 'Rabbit Hole' && (
              <span className="mr-1.5 text-xs">🕳️</span>
            )}
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTab === 'Overview' && (
          <div className="space-y-4">
            {entity.extract && (
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-muted mb-2">Summary</h3>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                  {entity.extract.slice(0, 1200)}
                  {entity.extract.length > 1200 && (
                    <a
                      href={entity.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary ml-1 hover:underline"
                    >
                      …read more on Wikipedia
                    </a>
                  )}
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <QuickStat label="Entity Type" value={entity.type.charAt(0).toUpperCase() + entity.type.slice(1)} />
              <QuickStat label="Source" value="Wikipedia" />
            </div>
          </div>
        )}

        {activeTab === 'Social' && <SocialLinks name={entity.title} />}

        {activeTab === 'Dorks' && <DorkPanel name={entity.title} />}

        {activeTab === 'Rabbit Hole' && (
          <RelatedEntities wikiTitle={entity.wikiTitle} trail={trail} currentTitle={entity.title} />
        )}
      </div>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-surface border border-border rounded-lg">
      <p className="text-xs text-muted uppercase tracking-wider font-mono mb-1">{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}
