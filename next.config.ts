import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ✅ Ensure Vercel can trace middleware/server files
  outputFileTracing: true,
  experimental: {
    outputFileTracingRoot: __dirname,
  },
}

export default nextConfig