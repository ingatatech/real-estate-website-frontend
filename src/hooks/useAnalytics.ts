import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import api from '../services/api';
import { getSessionId, initSession, parseUtmParams } from '../lib/analytics';

export const useAnalytics = () => {
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

  const trackPropertyView = (propertyId: string) => {
    const sessionId = getSessionId();
    
    api.trackPropertyView({
      propertyId,
      referrer: document.referrer,
    }).catch((error) => {
      console.error('Failed to track property view:', error);
    });

    // GA4 event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'view_item', {
        item_id: propertyId,
      });
    }
  };

  const trackClick = (
    eventType: 'CTA' | 'PHONE' | 'EMAIL' | 'WHATSAPP' | 'LINK' | 'BUTTON',
    elementId?: string,
    elementText?: string,
    propertyId?: string,
    destinationUrl?: string
  ) => {
    const sessionId = getSessionId();
    const pagePath = typeof window !== 'undefined' ? window.location.pathname : '';

    api.trackClickEvent({
      eventType,
      propertyId,
      elementId,
      elementText,
      pagePath,
      destinationUrl,
    }).catch((error) => {
      console.error('Failed to track click event:', error);
    });

    // GA4 event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventType.toLowerCase(), {
        event_category: 'engagement',
        element_id: elementId,
        element_text: elementText,
        item_id: propertyId,
        destination_url: destinationUrl,
      });
    }
  };

  return {
    trackPropertyView,
    trackClick,
  };
};
