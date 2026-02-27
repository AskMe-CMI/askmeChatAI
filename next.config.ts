import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  // Disable standalone for Windows/pnpm compatibility
  // output: 'standalone',
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
      {
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
