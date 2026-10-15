// Session management for analytics
let sessionId: string | null = null;

const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

export const getSessionId = (): string => {
  if (!sessionId) {
    sessionId = generateSessionId();
    // Store in sessionStorage for persistence across page reloads
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
  }
  return sessionId;
};

export const initSession = (): void => {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('analytics_session_id');
    if (stored) {
      sessionId = stored;
    } else {
      sessionId = generateSessionId();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
  }
};

// UTM parameter parsing
export const parseUtmParams = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  const utmParams: Record<string, string> = {};
  
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
    const value = params.get(param);
    if (value) utmParams[param] = value;
  });
  
  return utmParams;
};

// Get device info
export const getDeviceInfo = () => {
  if (typeof window === 'undefined') return { deviceType: 'unknown' };
  
  const userAgent = navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
  
  return {
    deviceType: isMobile ? 'mobile' : 'desktop',
    userAgent,
  };
};
