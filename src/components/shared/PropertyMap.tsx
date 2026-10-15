'use client';

import { useEffect, useRef } from 'react';

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  className?: string;
}

export default function PropertyMap({ latitude, longitude, title, className = '' }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    // Initialize map if not already initialized
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new (window.google as any).maps.Map(mapRef.current, {
        center: { lat: latitude, lng: longitude },
        zoom: 15,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });
    } else {
      // Update center if map already exists
      mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude });
    }

    // Add or update marker
    if (markerRef.current) {
      markerRef.current.setPosition({ lat: latitude, lng: longitude });
    } else {
      markerRef.current = new (window.google as any).maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: mapInstanceRef.current,
        title: title || 'Property Location',
      });
    }
  }, [latitude, longitude, title]);

  return (
    <div
      ref={mapRef}
      className={`w-full h-64 sm:h-80 rounded-lg bg-slate-200 ${className}`}
      aria-label={`Map showing property location at ${title || 'property'}`}
    />
  );
}
