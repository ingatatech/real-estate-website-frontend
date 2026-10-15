'use client';

import { useEffect, useRef, useState } from 'react';

interface Property {
  id: string;
  title: string;
  slug: string;
  latitude: number;
  longitude: number;
  price?: number | string;
  address?: string;
}

interface PropertySearchMapProps {
  properties: Property[];
  onPropertyClick?: (property: Property) => void;
  selectedPropertyId?: string;
  className?: string;
}

export default function PropertySearchMap({
  properties,
  onPropertyClick,
  selectedPropertyId,
  className = '',
}: PropertySearchMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any | null>(null);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new (window.google as any).maps.Map(mapRef.current, {
        center: { lat: -1.95, lng: 30.05 }, // Default to Kigali center
        zoom: 12,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add markers for each property
    const bounds = new (window.google as any).maps.LatLngBounds();

    properties.forEach((property) => {
      if (property.latitude == null || property.longitude == null) return;

      const marker = new (window.google as any).maps.Marker({
        position: { lat: property.latitude, lng: property.longitude },
        map: mapInstanceRef.current,
        title: property.title,
        animation: property.id === selectedPropertyId ? (window.google as any).maps.Animation.BOUNCE : undefined,
      });

      // Add click handler
      marker.addListener('click', () => {
        if (onPropertyClick) {
          onPropertyClick(property);
        }
      });

      // Add info window
      const infoWindow = new (window.google as any).maps.InfoWindow({
        content: `
          <div class="p-2 min-w-[200px]">
            <h3 class="font-semibold text-sm">${property.title}</h3>
            ${property.price ? `<p class="text-emerald-600 font-medium">${property.price}</p>` : ''}
            ${property.address ? `<p class="text-xs text-slate-600">${property.address}</p>` : ''}
          </div>
        `,
      });

      marker.addListener('mouseover', () => {
        infoWindow.open(mapInstanceRef.current, marker);
      });

      marker.addListener('mouseout', () => {
        infoWindow.close();
      });

      markersRef.current.push(marker);
      bounds.extend({ lat: property.latitude, lng: property.longitude });
    });

    // Fit map to show all markers
    if (properties.length > 0) {
      mapInstanceRef.current.fitBounds(bounds);
    }

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
    };
  }, [properties, selectedPropertyId, onPropertyClick]);

  return (
    <div
      ref={mapRef}
      className={`w-full h-96 rounded-lg bg-slate-200 ${className}`}
      aria-label="Map showing property locations"
    />
  );
}
