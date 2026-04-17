export interface SearchResult {
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  wikiTitle: string;
}

export interface EntityProfile {
  title: string;
  description: string;
  extract: string;
  thumbnail?: string;
  url: string;
  wikiTitle: string;
  type: 'person' | 'organization' | 'place' | 'media' | 'event' | 'other';
  categories: string[];
  // Structured fields extracted from description/categories
  born?: string;
  nationality?: string;
  occupation?: string;
  knownFor?: string;
}

export interface RelatedEntity {
  title: string;
  wikiTitle: string;
  description?: string;
  thumbnail?: string;
}

export interface DorkCategory {
  label: string;
  icon: string;
  dorks: Dork[];
}

export interface Dork {
  label: string;
  query: string;
  googleUrl: string;
  bingUrl: string;
  ddgUrl: string;
}

export interface TrailItem {
  title: string;
  wikiTitle: string;
}
