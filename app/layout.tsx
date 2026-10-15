import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { SiteShell } from '@/components/layout/SiteShell'
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Real Estate Web',
  description: 'Find your dream property',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics 4 - Replace GA_MEASUREMENT_ID with your actual GA4 ID */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script>
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <AnalyticsProvider>
            <SiteShell>{children}</SiteShell>
          </AnalyticsProvider>
        </Providers>
      </body>
    </html>
  )
}
