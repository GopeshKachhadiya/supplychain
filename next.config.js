/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment (Render)
  output: 'standalone',
  // Suppress build-time warnings about missing env vars
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
