import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { SiteShell } from '@/components/layout/SiteShell'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ingata-real-estate.com'

export const metadata: Metadata = {
  title: {
    default: 'Ingata Real Estate - Find Your Dream Property in Rwanda',
    template: '%s | Ingata Real Estate',
  },
  description: 'Discover residential, commercial, and investment properties across Rwanda. Expert real estate services including property sales, rentals, management, and valuation.',
  keywords: ['real estate Rwanda', 'properties for sale Rwanda', 'houses for sale Kigali', 'apartments for rent Rwanda', 'commercial property Rwanda', 'land for sale Rwanda', 'property management Rwanda', 'real estate agents Rwanda'],
  authors: [{ name: 'Ingata Real Estate' }],
  creator: 'Ingata Real Estate',
  publisher: 'Ingata Real Estate',
  metadataBase: new URL(baseUrl),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Ingata Real Estate',
    title: 'Ingata Real Estate - Find Your Dream Property in Rwanda',
    description: 'Discover residential, commercial, and investment properties across Rwanda. Expert real estate services including property sales, rentals, management, and valuation.',
    images: [
      {
        url: '/images/wp4110652.jpg',
        width: 1200,
        height: 630,
        alt: 'Ingata Real Estate',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ingata Real Estate - Find Your Dream Property in Rwanda',
    description: 'Discover residential, commercial, and investment properties across Rwanda.',
    images: ['/images/wp4110652.jpg'],
    creator: '@ingatatech',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  )
}
