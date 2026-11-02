'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../services/api';
import { TestPropertyBadge, TestPropertyNotice } from './TestPropertyBadge';

type Property = {
  id: string;
  slug: string;
  title: string;
  location?: string;
  transactionType?: string;
  propertyType?: string;
  price?: string | number;
  bedrooms?: number;
  bathrooms?: number;
  size?: string | number;
  sizeUnit?: string;
  propertyImages?: { imageUrl: string; isPrimary?: boolean; mediaType?: 'IMAGE' | 'VIDEO' }[];
};

type CategoryListingProps = { title: string; query: Record<string, string> };

const fallbackImage = '/images/images.jpeg';

function ListingImage({ property }: { property: Property }) {
  const image = property.propertyImages?.find((item) => item.isPrimary && item.mediaType !== 'VIDEO')
    || property.propertyImages?.find((item) => item.mediaType !== 'VIDEO');
  const [imageSrc, setImageSrc] = useState(image?.imageUrl || fallbackImage);

  useEffect(() => {
    setImageSrc(image?.imageUrl || fallbackImage);
  }, [image?.imageUrl]);

  return (
    <img
      src={imageSrc}
      alt={property.title}
      loading="lazy"
      onError={() => {
        if (imageSrc !== fallbackImage) setImageSrc(fallbackImage);
      }}
      className="aspect-[16/10] w-full bg-slate-100 object-cover transition-transform duration-300 group-hover:scale-105"
    />
  );
}

export function CategoryListing({ title, query }: CategoryListingProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const queryKey = JSON.stringify(query);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.getProperties(JSON.parse(queryKey) as Record<string, string>)
      .then((response) => setProperties((response as { data: Property[] }).data || []))
      .catch(() => setError('Unable to load properties. Please try again later.'))
      .finally(() => setLoading(false));
  }, [queryKey]);

  return (
    <main className="bg-brand-background min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-emerald">Property Listings</p>
        <h1 className="text-4xl font-bold text-brand-navy mt-2 mb-8">{title}</h1>
        <TestPropertyNotice className="mb-6" />
        {error && <p className="text-red-600">{error}</p>}
        {loading && <p className="text-brand-charcoal">Loading published properties…</p>}
        {!loading && !error && properties.length === 0 && <p className="text-brand-charcoal">No published properties are currently listed in this category.</p>}
        {!loading && !error && properties.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/properties/${encodeURIComponent(property.id)}`}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative overflow-hidden">
                <ListingImage property={property} />
                {property.transactionType && (
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm">
                    {property.transactionType === 'SALE' ? 'For Sale' : property.transactionType === 'RENT' ? 'For Rent' : property.transactionType === 'LEASE' ? 'For Lease' : property.transactionType}
                  </span>
                )}
                <TestPropertyBadge className="absolute right-3 top-3" />
              </div>
              <div className="p-5">
                <p className="text-sm text-brand-charcoal">{property.location || 'Location unavailable'}</p>
                <h2 className="mt-1 line-clamp-1 text-xl font-bold text-brand-navy">{property.title}</h2>
                <p className="mt-3 text-lg font-semibold text-brand-emerald">{property.price ? (() => {
                  const price = Number(property.price);
                  if (price >= 1000000) {
                    return `RWF ${(price / 1000000).toFixed(0)}M`;
                  } else if (price >= 1000) {
                    return `RWF ${(price / 1000).toFixed(0)}K`;
                  }
                  return `RWF ${price.toLocaleString()}`;
                })() : 'Price on request'}</p>
                <p className="mt-2 text-sm text-slate-600">{property.bedrooms ?? 0} beds · {property.bathrooms ?? 0} baths · {property.size ? (() => {
                  const unit = property.sizeUnit || 'sqm';
                  const unitDisplay = unit === 'sqm' ? 'm²' : unit === 'sqft' ? 'ft²' : unit === 'acres' ? 'acres' : unit === 'hectares' ? 'hectares' : unit;
                  return `${property.size} ${unitDisplay}`;
                })() : 'Size unavailable'}</p>
                <span className="mt-4 inline-block border-t border-slate-100 pt-4 text-sm font-semibold text-brand-emerald">View property →</span>
              </div>
            </Link>
          ))}
        </div>}
      </div>
    </main>
  );
}