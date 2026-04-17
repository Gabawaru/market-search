import { EntityProfile, RelatedEntity, SearchResult } from './types';

const WIKI_REST = 'https://en.wikipedia.org/api/rest_v1';
const WIKI_API = 'https://en.wikipedia.org/w/api.php';

export async function searchWikipedia(query: string): Promise<SearchResult[]> {
  const url = `${WIKI_API}?action=opensearch&search=${encodeURIComponent(query)}&limit=12&namespace=0&format=json&origin=*`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const [, titles, descriptions, urls] = await res.json() as [string, string[], string[], string[]];

  return titles.map((title, i) => ({
    title,
    description: descriptions[i] || '',
    url: urls[i] || '',
    wikiTitle: title,
  }));
}

export async function getEntitySummary(wikiTitle: string): Promise<EntityProfile | null> {
  const encoded = encodeURIComponent(wikiTitle.replace(/ /g, '_'));
  const url = `${WIKI_REST}/page/summary/${encoded}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();

    const type = detectEntityType(data.description || '', data.categories || []);

    return {
      title: data.title,
      description: data.description || '',
      extract: data.extract || '',
      thumbnail: data.thumbnail?.source,
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encoded}`,
      wikiTitle: data.title,
      type,
      categories: [],
    };
  } catch {
    return null;
  }
}

export async function getRelatedEntities(wikiTitle: string): Promise<RelatedEntity[]> {
  const encoded = encodeURIComponent(wikiTitle.replace(/ /g, '_'));

  // Use generator to get linked pages with their summaries in one request
  const url = `${WIKI_API}?action=query&generator=links&titles=${encoded}&prop=pageimages|description&piprop=thumbnail&pithumbsize=100&gplnamespace=0&gpllimit=30&format=json&origin=*`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return [];

    return Object.values(pages)
      .map((p: unknown) => {
        const page = p as { title: string; description?: string; thumbnail?: { source: string } };
        return {
          title: page.title,
          wikiTitle: page.title,
          description: page.description,
          thumbnail: page.thumbnail?.source,
        };
      })
      .filter((r) => !r.title.includes('(disambiguation)'))
      .slice(0, 20);
  } catch {
    return [];
  }
}

function detectEntityType(description: string, _categories: string[]): EntityProfile['type'] {
  const desc = description.toLowerCase();
  if (
    desc.includes('actor') || desc.includes('actress') || desc.includes('politician') ||
    desc.includes('musician') || desc.includes('athlete') || desc.includes('author') ||
    desc.includes('director') || desc.includes('singer') || desc.includes('player') ||
    desc.includes('born') || desc.includes('american ') || desc.includes('british ') ||
    desc.includes('canadian ') || desc.includes('executive') || desc.includes('ceo') ||
    desc.includes('founder') || desc.includes('journalist') || desc.includes('scientist')
  ) return 'person';
  if (
    desc.includes('company') || desc.includes('corporation') || desc.includes('organization') ||
    desc.includes('foundation') || desc.includes('institute') || desc.includes('university') ||
    desc.includes('agency') || desc.includes('group')
  ) return 'organization';
  if (
    desc.includes('film') || desc.includes('movie') || desc.includes('television') ||
    desc.includes('album') || desc.includes('song') || desc.includes('book') ||
    desc.includes('series') || desc.includes('novel') || desc.includes('video game')
  ) return 'media';
  if (
    desc.includes('city') || desc.includes('town') || desc.includes('country') ||
    desc.includes('state') || desc.includes('district') || desc.includes('region') ||
    desc.includes('municipality') || desc.includes('village')
  ) return 'place';
  if (
    desc.includes('event') || desc.includes('election') || desc.includes('war') ||
    desc.includes('battle') || desc.includes('tournament') || desc.includes('championship')
  ) return 'event';
  return 'other';
}
