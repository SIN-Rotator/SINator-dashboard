/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Rotation takes ~200s — increase proxy timeout
  experimental: {
    proxyTimeout: 300_000,
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://localhost:8000/api/:path*" },
      { source: "/health", destination: "http://localhost:8000/health" },
    ]
  },
}

export default nextConfig
