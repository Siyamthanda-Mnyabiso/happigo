import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // Pin the project root (there is another lockfile in the home directory).
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
