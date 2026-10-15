'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import api from '../../services/api';
import { getSessionId, initSession, parseUtmParams } from '../../lib/analytics';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize session on mount
    initSession();
  }, []);

  useEffect(() => {
    // Track page view on route change
    if (typeof window !== 'undefined' && pathname) {
      const sessionId = getSessionId();
      const utmParams = parseUtmParams();
      
      // Send to our custom backend
      api.trackPageView({
        pagePath: pathname,
        pageTitle: document.title,
        referrer: document.referrer,
        ...utmParams,
      }).catch((error) => {
        console.error('Failed to track page view:', error);
      });

      // Send to Google Analytics 4 (if configured)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'page_view', {
          page_path: pathname,
          page_title: document.title,
        });
      }
    }
  }, [pathname]);

  return <>{children}</>;
}
