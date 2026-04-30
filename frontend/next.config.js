/** @type {import('next').NextConfig} */
const defaultBackendUrl = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5000'
  : 'https://api.deviny.me'
const backendUrl = process.env.NEXT_PUBLIC_API_URL || defaultBackendUrl
const parsedBackendUrl = new URL(backendUrl)

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: parsedBackendUrl.protocol.replace(':', ''),
        hostname: parsedBackendUrl.hostname,
        port: parsedBackendUrl.port || undefined,
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ]
  },
}

module.exports = nextConfig