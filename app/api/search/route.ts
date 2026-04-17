import { NextRequest, NextResponse } from 'next/server';
import { searchWikipedia } from '@/lib/wikipedia';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json({ results: [] });

  try {
    const [wikiResults, ddgData] = await Promise.allSettled([
      searchWikipedia(q),
      fetchDDG(q),
    ]);

    const wiki = wikiResults.status === 'fulfilled' ? wikiResults.value : [];
    const ddg = ddgData.status === 'fulfilled' ? ddgData.value : [];

    // Merge: DDG result first if it's a direct match, then Wikipedia results
    const seen = new Set<string>();
    const merged = [...ddg, ...wiki].filter((r) => {
      if (seen.has(r.wikiTitle)) return false;
      seen.add(r.wikiTitle);
      return true;
    });

    return NextResponse.json({ results: merged });
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}

async function fetchDDG(query: string) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&no_redirect=1&skip_disambig=0`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const data = await res.json();

  const results = [];

  if (data.Heading && data.AbstractText) {
    results.push({
      title: data.Heading,
      description: data.AbstractSource ? `${data.AbstractSource}: ${data.AbstractText.slice(0, 120)}...` : data.AbstractText.slice(0, 120),
      url: data.AbstractURL || '',
      thumbnail: data.Image ? (data.Image.startsWith('http') ? data.Image : `https://duckduckgo.com${data.Image}`) : undefined,
      wikiTitle: data.Heading,
    });
  }

  if (data.RelatedTopics) {
    for (const topic of data.RelatedTopics.slice(0, 5)) {
      if (topic.Text && topic.FirstURL) {
        const titleMatch = topic.FirstURL.match(/\/([^/]+)$/);
        const title = titleMatch ? decodeURIComponent(titleMatch[1].replace(/_/g, ' ')) : topic.Text.split(' - ')[0];
        results.push({
          title,
          description: topic.Text.slice(0, 120),
          url: topic.FirstURL,
          thumbnail: topic.Icon?.URL ? (topic.Icon.URL.startsWith('http') ? topic.Icon.URL : `https://duckduckgo.com${topic.Icon.URL}`) : undefined,
          wikiTitle: title,
        });
      }
    }
  }

  return results;
}
