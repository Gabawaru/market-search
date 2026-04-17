import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OSINT Navigator — Investigate Anyone',
  description: 'Open-source intelligence tool to research people, organizations, and entities. Find public information, generate search dorks, and navigate the rabbit hole.',
  keywords: 'OSINT, open source intelligence, person search, research, dorks, investigation',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'OSINT Nav',
  },
  icons: {
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#07090f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }`,
          }}
        />
      </head>
      <body className="scanlines">
        <header className="sticky top-0 z-50 border-b border-border/50 bg-bg/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <svg width="14" height="14" fill="none" stroke="#00c8ff" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                  <path d="M11 8v6M8 11h6" />
                </svg>
              </div>
              <span className="font-bold text-white text-sm tracking-tight">
                OSINT<span className="text-primary">Navigator</span>
              </span>
            </a>
            <nav className="flex items-center gap-3 text-xs">
              <a href="/" className="text-muted hover:text-white transition-colors px-2 py-1">Search</a>
              <a href="/tools" className="text-muted hover:text-white transition-colors px-2 py-1">Tools</a>
              <a
                href="https://github.com/gabawaru/market-search"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-white transition-colors px-2 py-1"
              >
                GitHub
              </a>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" title="Online" />
            </nav>
          </div>
        </header>
        <main className="min-h-[calc(100dvh-56px)]">
          {children}
        </main>
        <footer className="border-t border-border/30 mt-16 py-6 text-center text-xs text-muted safe-bottom">
          <p>OSINT Navigator — for educational and research purposes only. Use responsibly.</p>
          <p className="mt-1 text-muted/50">Data sourced from Wikipedia and public search engines.</p>
        </footer>
      </body>
    </html>
  );
}
