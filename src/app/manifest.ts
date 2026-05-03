import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Deviny — Social Network for Fitness & Healthy Lifestyle',
    short_name: 'Deviny',
    description:
      'Social fitness platform connecting you with certified trainers and nutritionists. Personalized programs, challenges, achievements, and community support.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    orientation: 'portrait',
    categories: ['health', 'fitness', 'lifestyle', 'social'],
    lang: 'en',
    icons: [
      {
        src: '/favicon.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
