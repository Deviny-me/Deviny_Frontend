import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://deviny.me'
const SITE_NAME = 'Deviny'
const DEFAULT_TITLE = 'Deviny — Social Network for Fitness & Healthy Lifestyle'
const DEFAULT_DESCRIPTION =
  'Deviny is a social fitness platform that connects you with certified trainers and nutritionists. Discover personalized training and meal programs, track your progress, join challenges, earn achievements, and stay motivated with a like-minded community.'
const KEYWORDS = [
  'Deviny',
  'fitness social network',
  'fitness app',
  'online personal trainer',
  'nutritionist online',
  'workout programs',
  'meal plans',
  'training programs',
  'nutrition programs',
  'fitness community',
  'fitness challenges',
  'fitness achievements',
  'progress tracking',
  'healthy lifestyle',
  'gym app',
  'fitness goals',
  'fitness coaching',
  'фитнес социальная сеть',
  'персональный тренер онлайн',
  'нутрициолог онлайн',
  'программы тренировок',
  'планы питания',
  'fitness sosial şəbəkə',
  'şəxsi məşqçi',
  'qidalanma mütəxəssisi',
]

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  colorScheme: 'dark light',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: '%s | Deviny',
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: 'Next.js',
  keywords: KEYWORDS,
  authors: [{ name: 'Deviny', url: SITE_URL }],
  creator: 'Deviny',
  publisher: 'Deviny',
  category: 'Health & Fitness',
  classification: 'Health, Fitness, Social Network',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
      'ru-RU': '/',
      'az-AZ': '/',
      'x-default': '/',
    },
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    locale: 'en_US',
    alternateLocale: ['ru_RU', 'az_AZ'],
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Deviny — Social Network for Fitness & Healthy Lifestyle',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ['/logo.png'],
    creator: '@deviny',
    site: '@deviny',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  manifest: '/manifest.webmanifest',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
        width: 512,
        height: 512,
      },
      sameAs: [] as string[],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: ['en', 'ru', 'az'],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#app`,
      name: SITE_NAME,
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      description: DEFAULT_DESCRIPTION,
      url: SITE_URL,
      image: `${SITE_URL}/logo.png`,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      author: { '@id': `${SITE_URL}/#organization` },
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
try{
  var langKey='deviny.language';
  var themeKey='theme';
  var lang=localStorage.getItem(langKey);
  var isSupported=lang==='ru'||lang==='en'||lang==='az';
  if(isSupported){
    document.documentElement.lang=lang;
    var metaByLang={
      ru:{title:'Deviny - Социальная сеть для фитнеса',description:'Социальная сеть для фитнеса и здорового образа жизни'},
      en:{title:'Deviny - Social Network for Fitness',description:'Social network for fitness and healthy lifestyle'},
      az:{title:'Deviny - Fitness Sosial Şəbəkəsi',description:'Fitness və sağlam həyat tərzi üçün sosial şəbəkə'}
    };
    var meta=metaByLang[lang];
    if(meta){
      document.title=meta.title;
      var d=document.querySelector('meta[name="description"]');
      if(!d){d=document.createElement('meta');d.setAttribute('name','description');document.head.appendChild(d);}
      d.setAttribute('content',meta.description);
    }
  }

  var t=localStorage.getItem(themeKey);
  if(t!=='light'){document.documentElement.classList.add('dark');}
}catch(e){}
})()`
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className}`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
