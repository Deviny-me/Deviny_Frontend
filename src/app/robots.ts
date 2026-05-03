import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://deviny.me'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/auth', '/auth/login', '/auth/register', '/auth/forgot-password'],
        disallow: [
          '/user',
          '/user/',
          '/trainer',
          '/trainer/',
          '/nutritionist',
          '/nutritionist/',
          '/api/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
