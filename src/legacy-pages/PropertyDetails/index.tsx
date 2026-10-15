'use client'

import { useEffect, useState } from 'react';
import { Link } from '@/navigation/legacy-router';
import { useSearchParams } from 'next/navigation';
import { BedDouble, Bath, MapPin, Ruler, ArrowLeft, Maximize2, Share2, Phone, Mail, Calendar, Check, Video, Home, Shield, Wifi, Car, Droplets, Zap, Flame } from 'lucide-react';
import api from '../../services/api';
import { ImageViewer } from '../../components/ImageViewer';
import { TestPropertyNotice } from '../../components/property/TestPropertyBadge';
import PropertyMap from '../../components/shared/PropertyMap';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';

type InquiryForm = {
  name: string;
  phone: string;
  email: string;
  preferredContactMethod: string;
  preferredViewingDate: string;
  preferredContactTime: string;
  inquiry: string;
};

type Media = { id: string; imageUrl: string; mediaType?: 'IMAGE' | 'VIDEO'; caption?: string };
type ViewingRequestForm = {
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  numberOfVisitors: string;
  message: string;
};
type Property = { 
  id: string;
  slug?: string;
  referenceNumber?: string;
  title: string; 
  status?: string;
  description?: string | null; 
  price?: string | number | null; 
  currency?: string | null; 
  location?: string | null; 
  district?: string | null; 
  sector?: string | null; 
  neighborhood?: string | null;
  area?: string | null;
  address?: string | null; 
  nearbyLandmarks?: string | null;
  locationDescription?: string | null;
  latitude?: number | null; 
  longitude?: number | null; 
  bedrooms?: number | null; 
  bathrooms?: number | null; 
  parking?: number | null;
  size?: string | number | null; 
  sizeUnit?: string | null; 
  propertyType: string; 
  transactionType: string; 
  propertyImages?: Media[]; 
  features?: string[];
  amenities?: string[];
  furnished?: boolean;
  agent?: { 
    id?: string;
    name?: string | null; 
    phone?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  virtualTourUrl?: string;
  videoUrl?: string;
  listedDate?: string;
};

const viewingTimeOptions = Array.from({ length: 17 }, (_, index) => {
  const minutes = 9 * 60 + index * 30;
  const hours = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const value = `${String(hours).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const label = new Date(2000, 0, 1, hours, minute).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return { value, label };
});

const getLocalDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export default function PropertyDetails({ propertySlug: propSlug }: { propertySlug?: string }) {
  const searchParams = useSearchParams();
  const propertySlug = propSlug || searchParams.get('slug') || '';
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [relatedProperties, setRelatedProperties] = useState<Property[]>([]);
  const [inquiryForm, setInquiryForm] = useState<InquiryForm>({
    name: '',
    phone: '',
    email: '',
    preferredContactMethod: 'email',
    preferredViewingDate: '',
    preferredContactTime: '',
    inquiry: ''
  });
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const { isLoaded: mapsLoaded } = useGoogleMaps();
  const [viewingForm, setViewingForm] = useState<ViewingRequestForm>({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
    numberOfVisitors: '',
    message: '',
  });
  const [viewingSubmitted, setViewingSubmitted] = useState(false);
  const [viewingSubmitting, setViewingSubmitting] = useState(false);
  const [viewingError, setViewingError] = useState('');

  useEffect(() => {
    if (propertySlug) {
      api.getProperty(propertySlug)
        .then((r) => {
          const prop = (r as { data: Property }).data;
          setProperty(prop);
          
          // Fetch related properties
          if (prop) {
            api.getProperties({
              propertyType: prop.propertyType,
              transactionType: prop.transactionType
            }).then((res) => {
              const related = (res as { data: Property[] }).data || [];
              setRelatedProperties(related.filter((p: Property) => p.id !== prop.id).slice(0, 3));
            }).catch(() => {});
          }
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Unable to load this property.'))
        .finally(() => setLoading(false));
    }
  }, [propertySlug]);

  const validateInquiryForm = (): string => {
    if (!inquiryForm.name.trim()) return 'Full Name is required';
    if (!inquiryForm.phone.trim()) return 'Phone Number is required';
    if (!inquiryForm.email.trim()) return 'Email Address is required';
    if (!(property?.referenceNumber || property?.id)) return 'Property Reference is required';
    if (!property?.title) return 'Property of Interest is required';
    if (!inquiryForm.preferredContactMethod) return 'Preferred Contact Method is required';
    if (!inquiryForm.inquiry.trim()) return 'Inquiry is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inquiryForm.email)) return 'Please enter a valid email address';
    
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(inquiryForm.phone)) return 'Please enter a valid phone number';
    
    return '';
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryError('');
    
    const validationError = validateInquiryForm();
    if (validationError) {
      setInquiryError(validationError);
      return;
    }

    try {
      await api.createInquiry({
        name: inquiryForm.name,
        email: inquiryForm.email,
        phone: inquiryForm.phone,
        propertyId: property?.id,
        inquiry: inquiryForm.inquiry
      });
      setInquirySubmitted(true);
    } catch (err) {
      setInquiryError('Unable to send your inquiry. Please try again later.');
    }
  };

  const handleViewingSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setViewingError('');
    setViewingSubmitting(true);

    try {
      await api.createViewing({
        ...viewingForm,
        propertyId: property?.id,
      });
      setViewingSubmitted(true);
    } catch (err) {
      setViewingError(err instanceof Error ? err.message : 'Unable to request a viewing. Please try again.');
    } finally {
      setViewingSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && property) {
      try {
        await navigator.share({
          title: property.title,
          text: `Check out this property: ${property.title}`,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } else {
      // Fallback for desktop
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) return <main className="mx-auto max-w-7xl px-4 py-16 text-slate-500">Loading property…</main>;
  if (error || !property) return <main className="mx-auto max-w-7xl px-4 py-16 text-red-600">{error || 'Property not found.'}</main>;

  const media = property.propertyImages || [];
  const location = [property.address, property.neighborhood, property.sector, property.district, property.location].filter(Boolean).join(', ');
  const mapUrl = property.latitude != null && property.longitude != null 
    ? `https://www.google.com/maps?q=${property.latitude},${property.longitude}` 
    : null;

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const amenityIcons: Record<string, any> = {
    'wifi': Wifi,
    'parking': Car,
    'water': Droplets,
    'electricity': Zap,
    'security': Shield,
    'furnished': Home,
  };

  return (
    <main className="bg-slate-50 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <TestPropertyNotice className="mb-6" />
        <div className="flex items-center justify-between mb-6">
          <Link to="/properties" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
            <ArrowLeft className="h-4 w-4" />Back to properties
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700"
          >
            <Share2 className="h-4 w-4" />Share
          </button>
        </div>
        
        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div>
            {/* Image Gallery */}
            <div className="grid gap-4 sm:grid-cols-2 relative">
              {media.length ? media.map((item, index) => (
                <div key={item.id} className="relative group cursor-pointer" onClick={() => openViewer(index)}>
                  {item.mediaType === 'VIDEO' ? (
                    <div className="aspect-video w-full rounded-xl bg-slate-900 object-cover relative">
                      <video src={item.imageUrl} controls className="w-full h-full rounded-xl object-cover">
                        <source src={item.imageUrl} />
                      </video>
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Video className="h-3 w-3" />Video
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <img src={item.imageUrl} alt={property.title} className="aspect-video w-full rounded-xl object-cover" />
                      {item.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 rounded-b-xl">
                          {item.caption}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-xl">
                    <Maximize2 className="w-8 h-8 text-white" />
                  </div>
                </div>
              )) : (
                <div className="aspect-video rounded-xl bg-slate-200 flex items-center justify-center text-slate-400">
                  No images available
                </div>
              )}
            </div>

            {/* Virtual Tour */}
            {property.virtualTourUrl && (
              <div className="mt-4 rounded-xl bg-white p-4 shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 text-emerald-700 font-medium mb-2">
                  <Video className="h-5 w-5" />
                  Virtual Tour Available
                </div>
                <a
                  href={property.virtualTourUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
                >
                  View Virtual Tour
                </a>
              </div>
            )}

            {/* Property Header */}
            <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                      {property.transactionType}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-sm text-slate-600">{property.propertyType}</span>
                    {property.status && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="text-sm text-slate-600">{property.status}</span>
                      </>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900">{property.title}</h1>
                  {property.referenceNumber && (
                    <p className="text-sm text-slate-500 mt-1">Ref: {property.referenceNumber}</p>
                  )}
                </div>
                <p className="text-2xl font-bold text-emerald-700">
                  {property.price == null ? 'Price on request' : (() => {
                    const price = Number(property.price);
                    if (price >= 1000000) {
                      return `RWF ${(price / 1000000).toFixed(0)}M`;
                    } else if (price >= 1000) {
                      return `RWF ${(price / 1000).toFixed(0)}K`;
                    }
                    return `RWF ${price.toLocaleString()}`;
                  })()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-y border-slate-200 py-5 sm:grid-cols-4">
                <div className="flex items-center gap-2 text-slate-700">
                  <BedDouble className="h-5 w-5 text-emerald-600" />
                  <span>{property.bedrooms ?? '—'} beds</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Bath className="h-5 w-5 text-emerald-600" />
                  <span>{property.bathrooms ?? '—'} baths</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Car className="h-5 w-5 text-emerald-600" />
                  <span>{property.parking ?? '—'} parking</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Ruler className="h-5 w-5 text-emerald-600" />
                  <span>{property.size ? (() => {
                    const unit = property.sizeUnit || 'sqm';
                    const unitDisplay = unit === 'sqm' ? 'm²' : unit === 'sqft' ? 'ft²' : unit === 'acres' ? 'acres' : unit === 'hectares' ? 'hectares' : unit;
                    return `${property.size} ${unitDisplay}`;
                  })() : '—'}</span>
                </div>
              </div>

              <h2 className="mt-6 text-lg font-semibold text-slate-900">Description</h2>
              <p className="mt-2 whitespace-pre-line leading-7 text-slate-600">
                {property.description || 'No description available.'}
              </p>
            </section>

            {/* Features */}
            {property.features && property.features.length > 0 && (
              <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Features</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {property.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-slate-700">
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {property.amenities.map((amenity, index) => {
                    const Icon = amenityIcons[amenity.toLowerCase()] || Check;
                    return (
                      <div key={index} className="flex items-center gap-2 text-slate-700">
                        <Icon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Location */}
            <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Location</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium">{location || 'Location not specified'}</p>
                  </div>
                </div>
                {property.latitude != null && property.longitude != null && mapsLoaded && (
                  <div className="mt-4">
                    <PropertyMap
                      latitude={property.latitude}
                      longitude={property.longitude}
                      title={property.title}
                    />
                    {mapUrl && (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-3 text-emerald-600 text-sm hover:underline"
                      >
                        View on Google Maps
                      </a>
                    )}
                  </div>
                )}
                {property.area && (
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Area:</span> {property.area}
                  </div>
                )}
                {property.nearbyLandmarks && (
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Nearby Landmarks:</span> {property.nearbyLandmarks}
                  </div>
                )}
                {property.locationDescription && (
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">About the Location:</span> {property.locationDescription}
                  </div>
                )}
              </div>
            </section>

            {/* Agent Information */}
            {property.agent && (
              <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Agent</h2>
                <div className="flex items-start gap-4 mb-4">
                  {property.agent.image && (
                    <img src={property.agent.image} alt={property.agent.name || 'Agent'} className="w-16 h-16 rounded-full object-cover" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{property.agent.name || 'Agent'}</p>
                    <div className="mt-2 space-y-1">
                      {property.agent.phone && (
                        <a href={`tel:${property.agent.phone}`} className="flex items-center gap-2 text-sm text-emerald-600 hover:underline">
                          <Phone className="h-4 w-4" />
                          {property.agent.phone}
                        </a>
                      )}
                      {property.agent.email && (
                        <a href={`mailto:${property.agent.email}`} className="flex items-center gap-2 text-sm text-emerald-600 hover:underline">
                          <Mail className="h-4 w-4" />
                          {property.agent.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link
                    to={`/request-viewing?propertyId=${property.id}`}
                    className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Request a Viewing
                  </Link>
                  <button
                    onClick={() => document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition flex items-center justify-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Enquire Now
                  </button>
                </div>
              </section>
            )}

            {/* Related Properties */}
            {relatedProperties.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Similar Properties</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedProperties.map((related) => {
                    const primaryImage = related.propertyImages?.[0];
                    return (
                      <Link
                        key={related.id}
                        to={`/properties/${related.slug}`}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        {primaryImage ? (
                          <img src={primaryImage.imageUrl} alt={related.title} className="aspect-video w-full object-cover" />
                        ) : (
                          <div className="aspect-video bg-slate-200" />
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold text-slate-900 line-clamp-1">{related.title}</h3>
                          <p className="text-sm text-emerald-700 font-medium mt-1">
                            {related.price ? (() => {
                              const price = Number(related.price);
                              if (price >= 1000000) {
                                return `RWF ${(price / 1000000).toFixed(0)}M`;
                              } else if (price >= 1000) {
                                return `RWF ${(price / 1000).toFixed(0)}K`;
                              }
                              return `RWF ${price.toLocaleString()}`;
                            })() : 'Price on request'}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Property Details */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Property Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Property Type</span>
                  <span className="font-medium text-slate-900">{property.propertyType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Transaction</span>
                  <span className="font-medium text-slate-900">{property.transactionType}</span>
                </div>
                {property.status && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Status</span>
                    <span className="font-medium text-slate-900">{property.status}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">Size</span>
                  <span className="font-medium text-slate-900">{property.size ? (() => {
                    const unit = property.sizeUnit || 'sqm';
                    const unitDisplay = unit === 'sqm' ? 'm²' : unit === 'sqft' ? 'ft²' : unit === 'acres' ? 'acres' : unit === 'hectares' ? 'hectares' : unit;
                    return `${property.size} ${unitDisplay}`;
                  })() : 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Bedrooms</span>
                  <span className="font-medium text-slate-900">{property.bedrooms ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Bathrooms</span>
                  <span className="font-medium text-slate-900">{property.bathrooms ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Parking</span>
                  <span className="font-medium text-slate-900">{property.parking ?? '—'}</span>
                </div>
                {property.furnished !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Furnished</span>
                    <span className="font-medium text-slate-900">{property.furnished ? 'Yes' : 'No'}</span>
                  </div>
                )}
                {property.listedDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Listed</span>
                    <span className="font-medium text-slate-900">{new Date(property.listedDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Request Viewing */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Request Viewing</h2>
              {viewingSubmitted ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">
                  Viewing request sent. Our team will contact you to confirm the appointment.
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleViewingSubmit}>
                  <input
                    type="text"
                    placeholder="Your name"
                    aria-label="Your name"
                    autoComplete="name"
                    required
                    value={viewingForm.name}
                    onChange={(event) => setViewingForm({ ...viewingForm, name: event.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="email"
                    placeholder="Your email"
                    aria-label="Your email"
                    autoComplete="email"
                    required
                    value={viewingForm.email}
                    onChange={(event) => setViewingForm({ ...viewingForm, email: event.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="tel"
                    placeholder="Your phone"
                    aria-label="Your phone"
                    autoComplete="tel"
                    required
                    value={viewingForm.phone}
                    onChange={(event) => setViewingForm({ ...viewingForm, phone: event.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="viewing-date" className="mb-1 block text-xs font-medium text-slate-600">Choose a date</label>
                      <input
                        id="viewing-date"
                        type="date"
                        min={getLocalDateString()}
                        required
                        value={viewingForm.preferredDate}
                        onChange={(event) => setViewingForm({ ...viewingForm, preferredDate: event.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="viewing-time" className="mb-1 block text-xs font-medium text-slate-600">Choose a time</label>
                      <select
                        id="viewing-time"
                        required
                        value={viewingForm.preferredTime}
                        onChange={(event) => setViewingForm({ ...viewingForm, preferredTime: event.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">Select a time</option>
                        {viewingTimeOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="viewing-visitors" className="mb-1 block text-xs font-medium text-slate-600">Number of Visitors</label>
                    <input
                      id="viewing-visitors"
                      type="number"
                      min="1"
                      required
                      value={viewingForm.numberOfVisitors}
                      onChange={(event) => setViewingForm({ ...viewingForm, numberOfVisitors: event.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="e.g., 2"
                    />
                  </div>
                  <div>
                    <label htmlFor="viewing-message" className="mb-1 block text-xs font-medium text-slate-600">Additional Message</label>
                    <textarea
                      id="viewing-message"
                      rows={3}
                      value={viewingForm.message}
                      onChange={(event) => setViewingForm({ ...viewingForm, message: event.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="Any additional information or requests..."
                    />
                  </div>
                  {viewingError && (
                    <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                      {viewingError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={viewingSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Calendar className="h-4 w-4" />
                    {viewingSubmitting ? 'Sending request…' : 'Request Viewing'}
                  </button>
                </form>
              )}
            </div>

            {/* Contact Agent */}
            <div id="inquiry-form" className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Send Inquiry</h2>
              
              {inquirySubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Thank You</h3>
                  <p className="text-slate-600 mb-4">Your inquiry has been received successfully. A member of our team will review your request and contact you using the information you provided.</p>
                  <button
                    onClick={() => setInquirySubmitted(false)}
                    className="text-emerald-600 hover:underline text-sm font-medium"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleInquirySubmit}>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={inquiryForm.phone}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                        placeholder="+250 7XX XXX XXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={inquiryForm.email}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Property Reference *</label>
                    <input
                      type="text"
                      value={property.referenceNumber || property.id || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Property of Interest *</label>
                    <input
                      type="text"
                      value={property.title || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Contact Method *</label>
                    <select
                      value={inquiryForm.preferredContactMethod}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, preferredContactMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Viewing Date (Optional)</label>
                      <div className="relative">
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={inquiryForm.preferredViewingDate}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, preferredViewingDate: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                        />
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Contact Time (Optional)</label>
                      <select
                        value={inquiryForm.preferredContactTime}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, preferredContactTime: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">Select a time</option>
                        {viewingTimeOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Message *</label>
                    <textarea
                      value={inquiryForm.inquiry}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, inquiry: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="I'm interested in this property and would like to..."
                    />
                  </div>

                  {inquiryError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm">{inquiryError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition flex items-center justify-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Send Inquiry
                  </button>
                </form>
              )}
            </div>
          </aside>
        </div>
      </div>
      {viewerOpen && <ImageViewer images={media} initialIndex={viewerIndex} onClose={() => setViewerOpen(false)} />}
    </main>
  );
}