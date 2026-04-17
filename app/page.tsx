import SearchBar from '@/components/SearchBar';

const EXAMPLES = [
  'Elon Musk', 'Jeff Bezos', 'Mark Zuckerberg',
  'Keanu Reeves', 'Taylor Swift', 'Barack Obama',
  'SpaceX', 'OpenAI', 'CIA',
];

const FEATURES = [
  {
    icon: '🔍',
    title: 'Smart Search',
    desc: 'Search any person, organization, or entity. Disambiguate between multiple matches to find exactly who you\'re looking for.',
  },
  {
    icon: '🕳️',
    title: 'Rabbit Hole',
    desc: 'Navigate through related entities with a breadcrumb trail. Every click reveals more connections.',
  },
  {
    icon: '📡',
    title: 'Social Footprint',
    desc: 'Instantly check 12+ social media platforms — LinkedIn, Twitter, Instagram, Reddit, GitHub, TikTok and more.',
  },
  {
    icon: '⚙️',
    title: 'Google Dorks',
    desc: '50+ pre-built search dorks across 7 categories: social, documents, legal, news, contact, professional, and deep search.',
  },
  {
    icon: '📄',
    title: 'Document Hunt',
    desc: 'Find PDFs, resumes, CVs, court records, patents, and published papers automatically.',
  },
  {
    icon: '📱',
    title: 'iOS & Web',
    desc: 'Install as a PWA on your iPhone or use in any browser. Works offline for cached data.',
  },
];

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary font-mono mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Open Source Intelligence Tool
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          Find anyone on the{' '}
          <span className="text-primary glow">internet</span>
        </h1>
        <p className="text-lg text-muted max-w-xl mx-auto mb-10">
          Search for any person, company, or entity. Dive into the rabbit hole of public information — profiles, documents, connections, and more.
        </p>
        <SearchBar autoFocus />
      </div>

      {/* Example searches */}
      <div className="text-center mb-16">
        <p className="text-xs text-muted uppercase tracking-widest font-mono mb-3">Try searching</p>
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((ex) => (
            <a
              key={ex}
              href={`/search?q=${encodeURIComponent(ex)}`}
              className="px-3 py-1.5 bg-surface border border-border rounded-full text-sm text-muted hover:text-white hover:border-primary/40 transition-all"
            >
              {ex}
            </a>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
        {FEATURES.map((f) => (
          <div key={f.title} className="p-5 bg-card border border-border rounded-xl hover:border-primary/30 transition-all">
            <div className="text-2xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-white mb-1.5">{f.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* iOS Install CTA */}
      <div className="text-center p-6 bg-surface border border-border rounded-xl">
        <p className="text-sm text-muted mb-2">
          <span className="text-white font-medium">Install on iOS:</span> Tap the Share button in Safari → &ldquo;Add to Home Screen&rdquo;
        </p>
        <p className="text-xs text-muted/60">Works as a full-screen PWA with offline support</p>
      </div>
    </div>
  );
}
