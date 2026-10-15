import { useEffect, useState } from 'react';

declare global {
  interface Window {
    google?: any;
    initGoogleMaps?: () => void;
  }
}

export function useGoogleMaps(apiKey?: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    if (window.initGoogleMaps) {
      return;
    }

    // Use the API key from environment or a placeholder
    const googleMapsApiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!googleMapsApiKey) {
      setError('Google Maps API key not configured');
      return;
    }

    // Create script loader
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    window.initGoogleMaps = () => {
      setIsLoaded(true);
      delete window.initGoogleMaps;
    };

    script.onerror = () => {
      setError('Failed to load Google Maps');
      delete window.initGoogleMaps;
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (window.initGoogleMaps) {
        delete window.initGoogleMaps;
      }
    };
  }, [apiKey]);

  return { isLoaded, error };
}
