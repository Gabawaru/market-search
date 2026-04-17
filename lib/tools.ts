export interface OsintTool {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  tags: string[];
  free: boolean;
  queryParam?: string; // URL param to append a query to
  queryTemplate?: string; // Template with {query} placeholder
}

export interface ToolCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  { id: 'people', label: 'People Search', icon: '👤', description: 'Find and verify identities' },
  { id: 'social', label: 'Social Media', icon: '📡', description: 'Social network investigation' },
  { id: 'username', label: 'Username Search', icon: '🔖', description: 'Find accounts across platforms' },
  { id: 'email', label: 'Email & Phone', icon: '📧', description: 'Verify contact information' },
  { id: 'images', label: 'Image & Face', icon: '🖼️', description: 'Reverse image and face search' },
  { id: 'documents', label: 'Documents & Records', icon: '📄', description: 'Public records and filings' },
  { id: 'domain', label: 'Domain & IP', icon: '🌐', description: 'Web infrastructure lookup' },
  { id: 'darkweb', label: 'Breach & Leaks', icon: '🔓', description: 'Data breach intelligence' },
  { id: 'maps', label: 'Geo & Maps', icon: '🗺️', description: 'Location intelligence' },
  { id: 'news', label: 'News & Archives', icon: '📰', description: 'Historical and current news' },
  { id: 'business', label: 'Business & Legal', icon: '💼', description: 'Corporate and legal records' },
  { id: 'dorking', label: 'Search Engines', icon: '🔍', description: 'Advanced search techniques' },
];

export const OSINT_TOOLS: OsintTool[] = [
  // People Search
  { id: 'pipl', name: 'Pipl', description: 'Deep web people search engine. Finds profiles, contact info, social networks.', url: 'https://pipl.com', category: 'people', tags: ['name', 'email', 'phone'], free: false, queryTemplate: 'https://pipl.com/search/?q={query}' },
  { id: 'spokeo', name: 'Spokeo', description: 'People search aggregator for names, addresses, phones, and emails.', url: 'https://www.spokeo.com', category: 'people', tags: ['name', 'address'], free: false, queryTemplate: 'https://www.spokeo.com/{query}' },
  { id: 'whitepages', name: 'Whitepages', description: 'Find people and businesses. Phone, address, background checks.', url: 'https://www.whitepages.com', category: 'people', tags: ['name', 'phone', 'address'], free: false, queryTemplate: 'https://www.whitepages.com/name/{query}' },
  { id: 'intelius', name: 'Intelius', description: 'Background reports, people finder, reverse phone lookup.', url: 'https://www.intelius.com', category: 'people', tags: ['name', 'background'], free: false },
  { id: 'peoplefinder', name: 'PeopleFinder', description: 'Free people search with address history and relatives.', url: 'https://www.peoplefinder.com', category: 'people', tags: ['name', 'address'], free: true, queryTemplate: 'https://www.peoplefinder.com/search/?firstName=&lastName={query}' },
  { id: 'truepeoplesearch', name: 'TruePeopleSearch', description: 'Free people search with addresses, phone numbers, relatives.', url: 'https://www.truepeoplesearch.com', category: 'people', tags: ['name', 'address'], free: true, queryTemplate: 'https://www.truepeoplesearch.com/results?name={query}' },
  { id: 'fastpeoplesearch', name: 'FastPeopleSearch', description: 'Free reverse phone lookup and people finder.', url: 'https://www.fastpeoplesearch.com', category: 'people', tags: ['name', 'phone'], free: true },
  { id: 'peekyou', name: 'PeekYou', description: 'People search that connects names to social media profiles.', url: 'https://www.peekyou.com', category: 'people', tags: ['name', 'social'], free: true, queryTemplate: 'https://www.peekyou.com/{query}' },

  // Social Media
  { id: 'social-searcher', name: 'Social Searcher', description: 'Real-time search across all major social networks at once.', url: 'https://www.social-searcher.com', category: 'social', tags: ['keyword', 'realtime'], free: true, queryTemplate: 'https://www.social-searcher.com/?q={query}' },
  { id: 'mentionmapp', name: 'Mentionmapp', description: 'Twitter network visualization — map connections and mentions.', url: 'https://mentionmapp.com', category: 'social', tags: ['twitter', 'network'], free: true },
  { id: 'hashatit', name: 'Hashatit', description: 'Real-time hashtag search across Instagram, Twitter, Facebook.', url: 'https://www.hashatit.com', category: 'social', tags: ['hashtag', 'instagram'], free: true, queryTemplate: 'https://www.hashatit.com/hashtags/{query}' },
  { id: 'twint', name: 'Twint (GitHub)', description: 'Advanced Twitter scraper. No API key required. Archive tweets.', url: 'https://github.com/twintproject/twint', category: 'social', tags: ['twitter', 'archive', 'tool'], free: true },
  { id: 'tweetdeck', name: 'TweetDeck', description: 'Advanced Twitter monitoring with real-time column feeds.', url: 'https://tweetdeck.twitter.com', category: 'social', tags: ['twitter', 'monitoring'], free: true },
  { id: 'instaloader', name: 'Instaloader (GitHub)', description: 'Download Instagram profiles, stories, posts, and metadata.', url: 'https://github.com/instaloader/instaloader', category: 'social', tags: ['instagram', 'archive'], free: true },
  { id: 'facebook-search', name: 'Facebook Search', description: 'Advanced Facebook people, post, and location search.', url: 'https://www.facebook.com/search', category: 'social', tags: ['facebook', 'search'], free: true, queryTemplate: 'https://www.facebook.com/search/people/?q={query}' },
  { id: 'linkedin-search', name: 'LinkedIn People', description: 'Search LinkedIn profiles by name, company, or location.', url: 'https://www.linkedin.com/search/results/people', category: 'social', tags: ['linkedin', 'professional'], free: true, queryTemplate: 'https://www.linkedin.com/search/results/people/?keywords={query}' },

  // Username
  { id: 'sherlock', name: 'Sherlock (GitHub)', description: 'Hunt down social media accounts by username on 300+ sites.', url: 'https://github.com/sherlock-project/sherlock', category: 'username', tags: ['username', 'tool', 'cli'], free: true },
  { id: 'whatsmyname', name: "What's My Name", description: 'Username enumeration tool covering 600+ services.', url: 'https://whatsmyname.app', category: 'username', tags: ['username', 'enumeration'], free: true, queryTemplate: 'https://whatsmyname.app/?q={query}' },
  { id: 'namechk', name: 'Namechk', description: 'Check username availability across social networks and domains.', url: 'https://namechk.com', category: 'username', tags: ['username', 'availability'], free: true, queryTemplate: 'https://namechk.com/{query}' },
  { id: 'knowem', name: 'KnowEm', description: 'Username search across 500+ social networks.', url: 'https://knowem.com', category: 'username', tags: ['username', 'bulk'], free: true, queryTemplate: 'https://knowem.com/checkusernames.php?u={query}' },
  { id: 'usersearch', name: 'UserSearch.org', description: 'Find someone by username across multiple platforms.', url: 'https://usersearch.org', category: 'username', tags: ['username'], free: true, queryTemplate: 'https://usersearch.org/results_all.php?username={query}' },
  { id: 'instantusername', name: 'Instant Username', description: 'Check social media username availability instantly.', url: 'https://instantusername.com', category: 'username', tags: ['username', 'availability'], free: true, queryTemplate: 'https://instantusername.com/#/{query}' },

  // Email & Phone
  { id: 'haveibeenpwned', name: 'Have I Been Pwned', description: 'Check if an email address appears in known data breaches.', url: 'https://haveibeenpwned.com', category: 'email', tags: ['email', 'breach'], free: true, queryTemplate: 'https://haveibeenpwned.com/account/{query}' },
  { id: 'hunter', name: 'Hunter.io', description: 'Find email addresses associated with a domain or person.', url: 'https://hunter.io', category: 'email', tags: ['email', 'domain'], free: true, queryTemplate: 'https://hunter.io/search/{query}' },
  { id: 'emailrep', name: 'EmailRep.io', description: 'Email reputation lookup — fraud risk, breach history.', url: 'https://emailrep.io', category: 'email', tags: ['email', 'reputation'], free: true, queryTemplate: 'https://emailrep.io/{query}' },
  { id: 'phonebook', name: 'Phonebook.cz', description: 'Search for email addresses, phone numbers, and domains.', url: 'https://phonebook.cz', category: 'email', tags: ['email', 'phone', 'domain'], free: true },
  { id: 'truecaller', name: 'Truecaller', description: 'Reverse phone number lookup with caller ID database.', url: 'https://www.truecaller.com', category: 'email', tags: ['phone', 'caller-id'], free: true },
  { id: 'numverify', name: 'Numverify', description: 'Phone number validation and carrier lookup.', url: 'https://numverify.com', category: 'email', tags: ['phone', 'validation'], free: true },
  { id: 'calleridtest', name: 'CallerIDTest', description: 'Lookup phone numbers and find associated names.', url: 'https://www.calleridtest.com', category: 'email', tags: ['phone', 'lookup'], free: true },

  // Images
  { id: 'google-images', name: 'Google Reverse Image', description: 'Upload or paste image URL to find matching images on the web.', url: 'https://images.google.com', category: 'images', tags: ['reverse-image', 'face'], free: true },
  { id: 'tineye', name: 'TinEye', description: 'Reverse image search to find where an image appears online.', url: 'https://tineye.com', category: 'images', tags: ['reverse-image'], free: true },
  { id: 'yandex-images', name: 'Yandex Images', description: 'Russian search engine with powerful face recognition in reverse image search.', url: 'https://yandex.com/images', category: 'images', tags: ['reverse-image', 'face'], free: true },
  { id: 'pimeyes', name: 'PimEyes', description: 'AI-powered face recognition reverse image search.', url: 'https://pimeyes.com', category: 'images', tags: ['face', 'ai'], free: false },
  { id: 'faceagle', name: 'FaceAgle', description: 'Facial recognition OSINT — find faces across social media.', url: 'https://faceagle.com', category: 'images', tags: ['face', 'social'], free: false },
  { id: 'exifdata', name: 'EXIF Data Viewer', description: 'Extract metadata (GPS, camera, date) from photos.', url: 'https://exifdata.com', category: 'images', tags: ['metadata', 'gps'], free: true },
  { id: 'imgops', name: 'ImgOps', description: 'Multi-engine reverse image search hub.', url: 'https://imgops.com', category: 'images', tags: ['reverse-image', 'multi'], free: true },

  // Documents & Records
  { id: 'courtlistener', name: 'CourtListener', description: 'Free federal court records, opinions, and audio.', url: 'https://www.courtlistener.com', category: 'documents', tags: ['court', 'legal'], free: true, queryTemplate: 'https://www.courtlistener.com/?q={query}' },
  { id: 'pacer', name: 'PACER', description: 'Official US federal court electronic records system.', url: 'https://pacer.uscourts.gov', category: 'documents', tags: ['court', 'federal'], free: false },
  { id: 'unicourt', name: 'UniCourt', description: 'Court records search across state and federal courts.', url: 'https://unicourt.com', category: 'documents', tags: ['court', 'state'], free: false, queryTemplate: 'https://unicourt.com/search/all/{query}' },
  { id: 'publicrecords', name: 'PublicRecords.com', description: 'Aggregated public records database — arrests, licenses, etc.', url: 'https://www.publicrecords.com', category: 'documents', tags: ['records', 'aggregator'], free: false },
  { id: 'opencorporates', name: 'OpenCorporates', description: 'World\'s largest open database of companies. 200M+ companies.', url: 'https://opencorporates.com', category: 'documents', tags: ['company', 'business'], free: true, queryTemplate: 'https://opencorporates.com/companies?q={query}' },
  { id: 'sec-edgar', name: 'SEC EDGAR', description: 'US Securities filings — annual reports, insider trades.', url: 'https://www.sec.gov/cgi-bin/browse-edgar', category: 'documents', tags: ['sec', 'financial'], free: true, queryTemplate: 'https://www.sec.gov/cgi-bin/browse-edgar?company={query}&action=getcompany' },
  { id: 'patents', name: 'Google Patents', description: 'Search millions of patents from 100+ countries.', url: 'https://patents.google.com', category: 'documents', tags: ['patents', 'inventions'], free: true, queryTemplate: 'https://patents.google.com/?q={query}' },
  { id: 'scholar', name: 'Google Scholar', description: 'Academic papers, theses, and citations. Find published authors.', url: 'https://scholar.google.com', category: 'documents', tags: ['academic', 'research'], free: true, queryTemplate: 'https://scholar.google.com/scholar?q={query}' },
  { id: 'propertyshark', name: 'PropertyShark', description: 'Property records, ownership history, tax records.', url: 'https://www.propertyshark.com', category: 'documents', tags: ['property', 'real-estate'], free: false },

  // Domain & IP
  { id: 'whois', name: 'WHOIS Lookup', description: 'Domain registration info — owner, registrar, dates.', url: 'https://www.whois.com/whois', category: 'domain', tags: ['domain', 'whois'], free: true, queryTemplate: 'https://www.whois.com/whois/{query}' },
  { id: 'shodan', name: 'Shodan', description: 'Search engine for internet-connected devices. Ports, services, vulnerabilities.', url: 'https://www.shodan.io', category: 'domain', tags: ['ip', 'devices', 'iot'], free: false, queryTemplate: 'https://www.shodan.io/search?query={query}' },
  { id: 'censys', name: 'Censys', description: 'Internet-wide scan data. Find servers and certificates.', url: 'https://search.censys.io', category: 'domain', tags: ['ip', 'certificates'], free: true, queryTemplate: 'https://search.censys.io/search?resource=hosts&q={query}' },
  { id: 'virustotal', name: 'VirusTotal', description: 'Analyze domains, IPs, files for malicious activity.', url: 'https://www.virustotal.com', category: 'domain', tags: ['malware', 'reputation'], free: true, queryTemplate: 'https://www.virustotal.com/gui/domain/{query}' },
  { id: 'ipinfo', name: 'IPinfo', description: 'IP address geolocation, ASN, and carrier details.', url: 'https://ipinfo.io', category: 'domain', tags: ['ip', 'geolocation'], free: true, queryTemplate: 'https://ipinfo.io/{query}' },
  { id: 'viewdns', name: 'ViewDNS.info', description: 'Reverse IP, Whois, DNS records, and more in one place.', url: 'https://viewdns.info', category: 'domain', tags: ['dns', 'reverse-ip'], free: true, queryTemplate: 'https://viewdns.info/reverseip/?host={query}&t=1' },
  { id: 'spyonweb', name: 'SpyOnWeb', description: 'Find websites sharing the same analytics code or IP.', url: 'https://spyonweb.com', category: 'domain', tags: ['analytics', 'related-sites'], free: true, queryTemplate: 'https://spyonweb.com/{query}' },
  { id: 'builtwith', name: 'BuiltWith', description: 'Detect tech stack, CMS, analytics, and libraries on any site.', url: 'https://builtwith.com', category: 'domain', tags: ['tech-stack', 'domain'], free: true, queryTemplate: 'https://builtwith.com/{query}' },
  { id: 'dnslytics', name: 'DNSlytics', description: 'DNS intelligence — reverse WHOIS, related domains.', url: 'https://dnslytics.com', category: 'domain', tags: ['dns', 'whois'], free: true, queryTemplate: 'https://dnslytics.com/domain/{query}' },

  // Breach & Leaks
  { id: 'dehashed', name: 'DeHashed', description: 'Leaked database search — emails, usernames, passwords, IPs.', url: 'https://dehashed.com', category: 'darkweb', tags: ['breach', 'leaked'], free: false, queryTemplate: 'https://dehashed.com/search?query={query}' },
  { id: 'snusbase', name: 'Snusbase', description: 'Search engine for leaked databases. Names, emails, passwords.', url: 'https://snusbase.com', category: 'darkweb', tags: ['breach', 'database'], free: false },
  { id: 'leakcheck', name: 'LeakCheck', description: 'Check if email or username appears in data breaches.', url: 'https://leakcheck.io', category: 'darkweb', tags: ['breach', 'email'], free: false },
  { id: 'intelx', name: 'Intelligence X', description: 'Search Tor, I2P, leaks, WHOIS, and data breaches.', url: 'https://intelx.io', category: 'darkweb', tags: ['darkweb', 'breach', 'leaks'], free: false, queryTemplate: 'https://intelx.io/?s={query}' },
  { id: 'breachdetective', name: 'Breach Detective', description: 'Free email breach checker with detailed source info.', url: 'https://breachdetective.com', category: 'darkweb', tags: ['breach', 'email'], free: true },

  // Geo & Maps
  { id: 'google-maps', name: 'Google Maps', description: 'Street View, satellite imagery, and location intelligence.', url: 'https://maps.google.com', category: 'maps', tags: ['streetview', 'satellite'], free: true, queryTemplate: 'https://maps.google.com/maps?q={query}' },
  { id: 'google-earth', name: 'Google Earth Pro', description: 'Historical satellite imagery — see how a location looked over time.', url: 'https://earth.google.com', category: 'maps', tags: ['satellite', 'historical'], free: true, queryTemplate: 'https://earth.google.com/web/search/{query}' },
  { id: 'geosocialfootprint', name: 'GeoSocial Footprint', description: 'Map geotagged social media posts for a given username.', url: 'http://geosocialfootprint.com', category: 'maps', tags: ['twitter', 'geolocation'], free: true },
  { id: 'creepy', name: 'Creepy (GitHub)', description: 'Geolocation OSINT tool — extract and visualize geotagged data.', url: 'https://www.geocreepy.com', category: 'maps', tags: ['geolocation', 'social', 'tool'], free: true },
  { id: 'openstreetmap', name: 'OpenStreetMap', description: 'Open-source maps with detailed POI data.', url: 'https://www.openstreetmap.org', category: 'maps', tags: ['maps', 'open-source'], free: true, queryTemplate: 'https://www.openstreetmap.org/search?query={query}' },
  { id: 'wikimapia', name: 'Wikimapia', description: 'Collaborative mapping with crowd-sourced location descriptions.', url: 'https://wikimapia.org', category: 'maps', tags: ['maps', 'crowdsourced'], free: true },

  // News & Archives
  { id: 'wayback', name: 'Wayback Machine', description: 'Archive.org web crawler — see any website at any point in time.', url: 'https://web.archive.org', category: 'news', tags: ['archive', 'web', 'history'], free: true, queryTemplate: 'https://web.archive.org/web/*/{query}' },
  { id: 'google-news', name: 'Google News', description: 'Search current and recent news articles worldwide.', url: 'https://news.google.com', category: 'news', tags: ['news', 'current'], free: true, queryTemplate: 'https://news.google.com/search?q={query}' },
  { id: 'gdelt', name: 'GDELT Project', description: 'Real-time global news monitoring with geolocation and sentiment.', url: 'https://www.gdeltproject.org', category: 'news', tags: ['news', 'global', 'analysis'], free: true },
  { id: 'mediacloud', name: 'Media Cloud', description: 'Open-source media analysis platform with billions of news articles.', url: 'https://mediacloud.org', category: 'news', tags: ['news', 'research'], free: true },
  { id: 'newspapers', name: 'Newspapers.com', description: 'Historical newspaper archive — obituaries, announcements.', url: 'https://www.newspapers.com', category: 'news', tags: ['historical', 'print'], free: false, queryTemplate: 'https://www.newspapers.com/search/#query={query}' },
  { id: 'cachedview', name: 'Google Cache', description: 'View Google\'s cached version of any webpage.', url: 'https://webcache.googleusercontent.com', category: 'news', tags: ['cache', 'archive'], free: true, queryTemplate: 'https://webcache.googleusercontent.com/search?q=cache:{query}' },

  // Business & Legal
  { id: 'linkedin-company', name: 'LinkedIn Companies', description: 'Company profiles — employees, jobs, funding rounds.', url: 'https://www.linkedin.com/search/results/companies', category: 'business', tags: ['company', 'employees'], free: true, queryTemplate: 'https://www.linkedin.com/search/results/companies/?keywords={query}' },
  { id: 'crunchbase', name: 'Crunchbase', description: 'Startup funding, investors, acquisitions, and founder profiles.', url: 'https://www.crunchbase.com', category: 'business', tags: ['startup', 'funding', 'investors'], free: true, queryTemplate: 'https://www.crunchbase.com/search/organizations/field/organizations/facet_ids/{query}' },
  { id: 'gleif', name: 'GLEIF LEI Search', description: 'Legal Entity Identifier — verify company identity globally.', url: 'https://www.gleif.org/en/lei-data/global-lei-index/lei-issuer-list', category: 'business', tags: ['company', 'legal', 'global'], free: true },
  { id: 'bbb', name: 'Better Business Bureau', description: 'Business reviews, complaints, and ratings.', url: 'https://www.bbb.org', category: 'business', tags: ['business', 'reviews', 'complaints'], free: true, queryTemplate: 'https://www.bbb.org/search?find_text={query}' },
  { id: 'opensanctions', name: 'OpenSanctions', description: 'Database of sanctioned entities, PEPs, and crime suspects.', url: 'https://www.opensanctions.org', category: 'business', tags: ['sanctions', 'pep', 'crime'], free: true, queryTemplate: 'https://www.opensanctions.org/search/?q={query}' },
  { id: 'ofac', name: 'OFAC Sanctions List', description: 'US Treasury\'s Specially Designated Nationals sanctions list.', url: 'https://sanctionssearch.ofac.treas.gov', category: 'business', tags: ['sanctions', 'us-government'], free: true },

  // Search Engines / Dorking
  { id: 'google-dorks', name: 'Google Advanced Search', description: 'Boolean operators, site:, filetype:, intitle:, inurl: searches.', url: 'https://www.google.com/advanced_search', category: 'dorking', tags: ['google', 'advanced', 'dorks'], free: true },
  { id: 'bing-advanced', name: 'Bing Advanced Search', description: 'Bing search operators: site:, filetype:, ip:, language:.', url: 'https://www.bing.com/search', category: 'dorking', tags: ['bing', 'operators'], free: true, queryTemplate: 'https://www.bing.com/search?q={query}' },
  { id: 'ddg-bangs', name: 'DuckDuckGo Bangs', description: 'DuckDuckGo !bang shortcuts for direct search on any site.', url: 'https://duckduckgo.com/bangs', category: 'dorking', tags: ['ddg', 'shortcuts'], free: true },
  { id: 'grep-app', name: 'grep.app', description: 'Search code in half a million GitHub repositories instantly.', url: 'https://grep.app', category: 'dorking', tags: ['code', 'github'], free: true, queryTemplate: 'https://grep.app/search?q={query}' },
  { id: 'dorksearch', name: 'DorkSearch', description: 'Pre-built Google dork query builder and repository.', url: 'https://dorksearch.com', category: 'dorking', tags: ['dorks', 'builder'], free: true, queryTemplate: 'https://dorksearch.com/?s={query}' },
  { id: 'fullhunt', name: 'Fullhunt', description: 'Attack surface intelligence — find domains and exposed assets.', url: 'https://fullhunt.io', category: 'dorking', tags: ['attack-surface', 'domains'], free: false, queryTemplate: 'https://fullhunt.io/search?q={query}' },
];

export function getToolsByCategory(categoryId: string): OsintTool[] {
  return OSINT_TOOLS.filter((t) => t.category === categoryId);
}

export function searchTools(query: string): OsintTool[] {
  const q = query.toLowerCase();
  return OSINT_TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.includes(q))
  );
}
