import React from 'react';
import { getApiBaseUrl } from '../config/api';
import { hasAnalyticsConsent } from './consent';

const API_BASE_URL = getApiBaseUrl();

// Generate or retrieve session ID
const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Get user ID from localStorage if logged in
const getUserId = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const token = localStorage.getItem('admin_token');
  return token ? 'user' : undefined; // Simplified - in production, decode JWT to get user ID
};

// Track page view
export const trackPageView = async (pagePath: string, pageTitle?: string) => {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) return;

  try {
    await fetch(`${API_BASE_URL}/analytics/page-view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': getSessionId(),
      },
      body: JSON.stringify({
        pagePath,
        pageTitle,
        referrer: document.referrer || undefined,
        utmSource: new URLSearchParams(window.location.search).get('utm_source') || undefined,
        utmMedium: new URLSearchParams(window.location.search).get('utm_medium') || undefined,
        utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign') || undefined,
      }),
      // Use keepalive to ensure tracking doesn't block navigation
      keepalive: true,
    });
  } catch (error) {
    // Silent fail - don't break user experience if tracking fails
    console.debug('Page view tracking failed:', error);
  }
};

// Track property view
export const trackPropertyView = async (propertyId: string, sessionDurationSeconds?: number) => {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) return;

  try {
    await fetch(`${API_BASE_URL}/analytics/property-view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': getSessionId(),
      },
      body: JSON.stringify({
        propertyId,
        sessionDurationSeconds,
        referrer: document.referrer || undefined,
      }),
      keepalive: true,
    });
  } catch (error) {
    console.debug('Property view tracking failed:', error);
  }
};

// Track click event
export const trackClickEvent = async (
  eventType: 'CTA' | 'PHONE' | 'EMAIL' | 'WHATSAPP' | 'LINK' | 'BUTTON' | 'SEARCH' | 'FILTER',
  propertyId?: string,
  elementId?: string,
  elementText?: string,
  destinationUrl?: string
) => {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) return;

  try {
    await fetch(`${API_BASE_URL}/analytics/click-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': getSessionId(),
      },
      body: JSON.stringify({
        eventType,
        propertyId,
        elementId,
        elementText,
        pagePath: window.location.pathname,
        destinationUrl,
      }),
      keepalive: true,
    });
  } catch (error) {
    console.debug('Click event tracking failed:', error);
  }
};

// React hook for tracking page views on route changes
export const usePageViewTracking = (pageTitle?: string) => {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const pagePath = window.location.pathname;
    trackPageView(pagePath, pageTitle);
  }, [pageTitle]);
};

// React hook for tracking property views
export const usePropertyViewTracking = (propertyId: string) => {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    // One property-view event represents one detail-page visit. Recording again on
    // unmount inflated view totals because the API treats it as a separate visit.
    if (propertyId) trackPropertyView(propertyId);
  }, [propertyId]);
};

// Helper to wrap click handlers with tracking
export const withClickTracking = (
  handler: () => void,
  eventType: 'CTA' | 'PHONE' | 'EMAIL' | 'WHATSAPP' | 'LINK' | 'BUTTON' | 'SEARCH' | 'FILTER',
  propertyId?: string,
  elementId?: string,
  elementText?: string,
  destinationUrl?: string
) => {
  return () => {
    trackClickEvent(eventType, propertyId, elementId, elementText, destinationUrl);
    handler();
  };
};

