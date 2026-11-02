'use client'

import React from 'react';
import Link from 'next/link';
import { Heart, Scale } from 'lucide-react';
import { Card, CardBody, CardFooter } from './Card';
import { Button } from './Button';
import { TestPropertyBadge } from '../property/TestPropertyBadge';
import { usePropertyComparison } from '@/hooks/usePropertyComparison';
import { useFavorites } from '@/hooks/useFavorites';

export interface PropertyProps {
  id: string;
  slug: string;
  image: string;
  title: string;
  status: 'For Sale' | 'For Rent' | 'Pending' | 'Sold';
  type: string;
  price: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  size: string;
  features: string[];
  hasVideo?: boolean;
  isFeatured?: boolean;
}

export function PropertyCard({ property }: { property: PropertyProps }) {
  const { toggleComparison, isComparing } = usePropertyComparison();
  const { toggleFavorite, isFavorited } = useFavorites();

  const isCompared = isComparing(property.id);
  const isFav = isFavorited(property.id);

  const statusColors = {
    'For Sale': 'bg-emerald-100 text-emerald-800',
    'For Rent': 'bg-blue-100 text-blue-800',
    'Pending': 'bg-amber-100 text-amber-800',
    'Sold': 'bg-gray-100 text-gray-800',
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleComparison({
      id: property.id,
      title: property.title,
      price: property.price,
      currency: 'RWF',
      location: property.location,
      propertyType: property.type,
      transactionType: property.status === 'For Rent' ? 'RENT' : 'SALE',
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      size: property.size,
      propertyImages: [{ imageUrl: property.image }],
      amenities: property.features,
      status: property.status,
      slug: property.slug,
    });
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(property.id);
  };

  return (
    <Card className="flex flex-col h-full group hover:shadow-md transition-shadow">
      <div className="relative h-64 overflow-hidden">
        <img 
          src={property.image} 
          alt={property.location} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <TestPropertyBadge />
          {property.isFeatured && (
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-500 text-white">
              Featured
            </span>
          )}
          <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusColors[property.status]}`}>
            {property.status}
          </span>
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-black/50 text-white backdrop-blur-sm">
            {property.type}
          </span>
          {property.hasVideo && (
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-500/80 text-white backdrop-blur-sm">
              Video
            </span>
          )}
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-2">
          {/* Compare Button */}
          <button
            type="button"
            onClick={handleCompareClick}
            aria-label={isCompared ? 'Remove from comparison' : 'Compare property'}
            title={isCompared ? 'Remove from comparison' : 'Compare property'}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all shadow-sm ${
              isCompared
                ? 'bg-brand-emerald text-white ring-2 ring-emerald-300'
                : 'bg-white/80 hover:bg-white text-brand-charcoal'
            }`}
          >
            <Scale className="w-4 h-4" />
          </button>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-label={isFav ? 'Remove from favorites' : 'Save to favorites'}
            title={isFav ? 'Remove from favorites' : 'Save to favorites'}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all shadow-sm ${
              isFav
                ? 'bg-rose-50 text-rose-600 ring-2 ring-rose-200'
                : 'bg-white/80 hover:bg-white text-brand-charcoal'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>
      </div>
      
      <CardBody className="flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-brand-navy mb-1">{property.title}</h3>
        <p className="text-brand-charcoal text-sm mb-2">{property.type} · {property.location}</p>
        <h4 className="text-2xl font-bold text-brand-emerald mb-4">{property.price}</h4>
        
        <div className="flex items-center gap-4 text-sm text-brand-charcoal mb-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1">
            <span className="font-bold">{property.bedrooms}</span> Beds
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold">{property.bathrooms}</span> Baths
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold">{property.size}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {property.features.slice(0, 3).map((feature, i) => (
            <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
              {feature}
            </span>
          ))}
          {property.features.length > 3 && (
            <span className="text-xs text-slate-400 px-2 py-1">+{property.features.length - 3} more</span>
          )}
        </div>
      </CardBody>
      
      <CardFooter className="bg-white border-t-0 pt-0">
        <Link href={`/properties/${property.id}`} className="block w-full">
          <Button variant="secondary" className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default PropertyCard;
