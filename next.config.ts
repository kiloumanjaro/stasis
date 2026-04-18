import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ['pdf-parse', '@napi-rs/canvas'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },

  // DEV: guardrails lifted — CORS open to all origins, verbose errors enabled
  // Remove the isDev guard below to restore production-safe defaults.
  ...(isDev && {
    async headers() {
      return [
        {
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Origin', value: '*' },
            {
              key: 'Access-Control-Allow-Methods',
              value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            },
            { key: 'Access-Control-Allow-Headers', value: '*' },
          ],
        },
      ];
    },
  }),
};

export default nextConfig;
