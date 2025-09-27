// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // apply caching to statically generated report pages
        source: '/reports/:id',
        headers: [
          {
            key: 'Cache-Control',
            // cache at CDN/edge for 60 seconds (stale-while-revalidate helps)
            value:
              'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
