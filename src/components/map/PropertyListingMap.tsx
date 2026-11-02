'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { BedDouble, Bath, Ruler } from 'lucide-react'

interface Property {
  id: string
  slug: string
  title: string
  price?: string | number
  currency?: string
  bedrooms?: number
  bathrooms?: number
  size?: string | number
  sizeUnit?: string
  propertyImages?: { imageUrl: string; isPrimary?: boolean }[]
  latitude?: number | null
  longitude?: number | null
  location?: string
}

interface PropertyListingMapProps {
  properties: Property[]
  className?: string
}

// Fix for default marker icons in Leaflet with Next.js
const createCustomIcon = () => {
  return L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })
}

// Create popup content for a property
const createPopupContent = (property: Property): string => {
  const primaryImage = property.propertyImages?.find(img => img.isPrimary) || property.propertyImages?.[0]
  const price = property.price ? (() => {
    const priceNum = Number(property.price)
    if (priceNum >= 1000000) {
      return `RWF ${(priceNum / 1000000).toFixed(0)}M`
    } else if (priceNum >= 1000) {
      return `RWF ${(priceNum / 1000).toFixed(0)}K`
    }
    return `RWF ${priceNum.toLocaleString()}`
  })() : 'Price on request'

  const size = property.size ? (() => {
    const unit = property.sizeUnit || 'sqm'
    const unitDisplay = unit === 'sqm' ? 'm²' : unit === 'sqft' ? 'ft²' : unit === 'acres' ? 'acres' : unit === 'hectares' ? 'hectares' : unit
    return `${property.size} ${unitDisplay}`
  })() : '—'

  return `
    <div style="min-width: 200px; max-width: 300px;">
      ${primaryImage ? `
        <img 
          src="${primaryImage.imageUrl}" 
          alt="${property.title}" 
          style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;"
        />
      ` : ''}
      <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0; color: #1e293b;">${property.title}</h3>
      <p style="font-weight: 700; font-size: 16px; margin: 0 0 8px 0; color: #059669;">${price}</p>
      <div style="display: flex; gap: 12px; font-size: 12px; color: #64748b; margin-bottom: 8px;">
        <span>🛏️ ${property.bedrooms ?? '—'} beds</span>
        <span>🚿 ${property.bathrooms ?? '—'} baths</span>
        <span>📐 ${size}</span>
      </div>
      <a 
        href="/properties/${property.id}"
        style="display: inline-block; background: #10b981; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 500;"
      >
        View Details
      </a>
    </div>
  `
}

export default function PropertyListingMap({ properties, className = '' }: PropertyListingMapProps) {
  const [isMounted, setIsMounted] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !mapRef.current) return
    if (!mapRef.current) return

    // Initialize map only once
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [-1.9441, 30.0619], // Kigali, Rwanda
        zoom: 12,
        scrollWheelZoom: false,
      })

      // Add OpenStreetMap tiles (free, no API key required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current)
    }

    // Clear existing markers
    markersRef.current.forEach(marker => mapInstanceRef.current?.removeLayer(marker))
    markersRef.current = []

    // Filter properties with valid coordinates
    const propertiesWithCoords = properties.filter(
      property => property.latitude != null && property.longitude != null
    )

    // Add markers for each property
    const customIcon = createCustomIcon()
    propertiesWithCoords.forEach(property => {
      if (property.latitude && property.longitude) {
        const marker = L.marker([property.latitude, property.longitude], { icon: customIcon })
          .addTo(mapInstanceRef.current!)
          .bindPopup(createPopupContent(property), {
            maxWidth: 320,
            className: 'property-popup'
          })
        markersRef.current.push(marker)
      }
    })

    // Fit bounds to show all markers if there are any
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current)
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
    }

    // Cleanup on unmount
    return () => {
      markersRef.current.forEach(marker => mapInstanceRef.current?.removeLayer(marker))
      markersRef.current = []
    }
  }, [properties])

  if (!isMounted) {
    return (
      <div
        className={`w-full rounded-lg shadow-md ${className}`}
        style={{ minHeight: '500px', height: '100%' }}
      >
        <div className="flex items-center justify-center h-full text-slate-500">
          Loading map...
        </div>
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      className={`w-full rounded-lg shadow-md ${className}`}
      style={{ minHeight: '500px', height: '100%' }}
    />
  )
}
