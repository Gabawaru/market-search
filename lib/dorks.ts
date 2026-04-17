import { Dork, DorkCategory } from './types';

function buildUrls(query: string) {
  const encoded = encodeURIComponent(query);
  return {
    googleUrl: `https://www.google.com/search?q=${encoded}`,
    bingUrl: `https://www.bing.com/search?q=${encoded}`,
    ddgUrl: `https://duckduckgo.com/?q=${encoded}`,
  };
}

function dork(label: string, query: string): Dork {
  return { label, query, ...buildUrls(query) };
}

export function generateDorks(name: string): DorkCategory[] {
  const q = `"${name}"`;

  return [
    {
      label: 'Social Media',
      icon: '📡',
      dorks: [
        dork('LinkedIn Profile', `site:linkedin.com/in/ ${q}`),
        dork('Twitter / X', `site:twitter.com ${q}`),
        dork('Facebook', `site:facebook.com ${q}`),
        dork('Instagram', `site:instagram.com ${q}`),
        dork('GitHub', `site:github.com ${q}`),
        dork('Reddit', `site:reddit.com ${q}`),
        dork('TikTok', `site:tiktok.com ${q}`),
        dork('YouTube', `site:youtube.com ${q}`),
      ],
    },
    {
      label: 'Contact & Identity',
      icon: '📋',
      dorks: [
        dork('Email Address', `${q} email OR "@gmail" OR "@yahoo" OR "@outlook"`),
        dork('Phone Number', `${q} "phone" OR "mobile" OR "contact"`),
        dork('Home Address', `${q} address OR "lives in" OR "located in"`),
        dork('Username Lookup', `${q} username OR "user profile" OR "account"`),
        dork('Profile Pages', `inurl:${encodeURIComponent(name.toLowerCase().replace(/\s+/g, ''))} -site:wikipedia.org`),
      ],
    },
    {
      label: 'Documents & Files',
      icon: '📄',
      dorks: [
        dork('PDF Documents', `${q} filetype:pdf`),
        dork('Resume / CV', `${q} resume OR "curriculum vitae" filetype:pdf`),
        dork('Word Documents', `${q} filetype:doc OR filetype:docx`),
        dork('Spreadsheets', `${q} filetype:xls OR filetype:xlsx`),
        dork('Presentations', `${q} filetype:ppt OR filetype:pptx`),
        dork('Published Author', `${q} author OR published OR paper`),
      ],
    },
    {
      label: 'News & Media',
      icon: '📰',
      dorks: [
        dork('News Mentions', `${q} site:news.google.com OR site:reuters.com OR site:apnews.com`),
        dork('Interviews', `${q} interview OR "spoke with" OR "sat down with"`),
        dork('Press Releases', `${q} "press release" OR announcement`),
        dork('Podcast Appearances', `${q} podcast OR episode OR guest`),
        dork('YouTube Interviews', `site:youtube.com ${q} interview`),
      ],
    },
    {
      label: 'Legal & Records',
      icon: '⚖️',
      dorks: [
        dork('Court Records', `${q} court OR lawsuit OR plaintiff OR defendant`),
        dork('Criminal Records', `${q} arrest OR charged OR convicted OR mugshot`),
        dork('Business Filings', `${q} LLC OR "Inc." OR "Corp." OR CEO OR founder`),
        dork('Property Records', `${q} property OR deed OR "real estate"`),
        dork('Marriage / Divorce', `${q} marriage OR wedding OR divorce`),
        dork('Obituary', `${q} obituary OR "passed away" OR funeral`),
      ],
    },
    {
      label: 'Professional',
      icon: '💼',
      dorks: [
        dork('Patents', `${q} site:patents.google.com OR site:patents.justia.com`),
        dork('Academic Papers', `${q} site:scholar.google.com OR site:researchgate.net`),
        dork('Speaking Events', `${q} speaker OR keynote OR conference OR summit`),
        dork('Board Memberships', `${q} board OR director OR trustee OR committee`),
        dork('Investments / Funding', `${q} investment OR investor OR funding OR venture`),
      ],
    },
    {
      label: 'Deep Search',
      icon: '🔍',
      dorks: [
        dork('Exclude Wikipedia', `${q} -site:wikipedia.org -site:wikimedia.org`),
        dork('Name in URL', `inurl:${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}`),
        dork('Name in Title', `intitle:${q}`),
        dork('Cached Pages', `cache:${encodeURIComponent(name)}`),
        dork('Related Pages', `related:${encodeURIComponent(`en.wikipedia.org/wiki/${name.replace(/\s+/g, '_')}`)}`),
        dork('Image Search', `${q} -site:wikipedia.org portrait OR photo OR headshot`),
      ],
    },
  ];
}

export function getSocialSearchLinks(name: string) {
  const encoded = encodeURIComponent(name);
  return [
    { label: 'LinkedIn', url: `https://www.linkedin.com/search/results/people/?keywords=${encoded}`, color: '#0077b5' },
    { label: 'Twitter/X', url: `https://twitter.com/search?q=${encoded}`, color: '#1da1f2' },
    { label: 'Facebook', url: `https://www.facebook.com/search/people/?q=${encoded}`, color: '#1877f2' },
    { label: 'Instagram', url: `https://www.instagram.com/explore/search/keyword/?q=${encoded}`, color: '#e1306c' },
    { label: 'Reddit', url: `https://www.reddit.com/search/?q=${encoded}&type=user`, color: '#ff4500' },
    { label: 'GitHub', url: `https://github.com/search?q=${encoded}&type=users`, color: '#6e40c9' },
    { label: 'TikTok', url: `https://www.tiktok.com/search?q=${encoded}`, color: '#010101' },
    { label: 'YouTube', url: `https://www.youtube.com/results?search_query=${encoded}`, color: '#ff0000' },
    { label: 'Telegram', url: `https://t.me/s/${encoded}`, color: '#2ca5e0' },
    { label: 'Truthfinder', url: `https://www.truthfinder.com/results/?firstName=&lastName=${encoded}`, color: '#2563eb' },
    { label: 'Spokeo', url: `https://www.spokeo.com/${encoded.replace(/%20/g, '-')}`, color: '#6366f1' },
    { label: 'Pipl', url: `https://pipl.com/search/?q=${encoded}`, color: '#10b981' },
  ];
}
