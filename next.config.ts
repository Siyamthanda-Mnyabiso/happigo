import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // Pin the project root (there is another lockfile in the home directory).
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
  // Photos are shrunk in the browser first; this only has to fit the 4 MB cap plus form fields.
  experimental: { serverActions: { bodySizeLimit: '5mb' } },
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
