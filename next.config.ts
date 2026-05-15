import { dirname } from 'path';
import { fileURLToPath } from 'url';
import type { NextConfig } from 'next';

const rootDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: rootDir,
  },
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
};

export default nextConfig;
