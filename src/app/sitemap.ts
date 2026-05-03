import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://deviny.me'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Only public, indexable pages are listed.
  // Authenticated dashboards (/user, /trainer, /nutritionist) are intentionally excluded
  // as they require login and contain private data.
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: {
          en: `${SITE_URL}/`,
          ru: `${SITE_URL}/`,
          az: `${SITE_URL}/`,
        },
      },
    },
    {
      url: `${SITE_URL}/auth`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/auth/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/auth/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/auth/forgot-password`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  return routes
}
