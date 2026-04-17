/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: '**.wikipedia.org' },
      { protocol: 'https', hostname: 'duckduckgo.com' },
      { protocol: 'https', hostname: '**.ddgcdn.com' },
    ],
  },
};

module.exports = nextConfig;
