/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracing: true,
  experimental: {
    outputFileTracingRoot: __dirname,
  },
}

module.exports = nextConfig
