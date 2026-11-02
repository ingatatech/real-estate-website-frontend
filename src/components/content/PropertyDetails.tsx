'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BedDouble, Bath, MapPin, Ruler, ArrowLeft, Maximize2, Share2, Phone, Mail, Calendar, Check, Video, Home, Shield, Wifi, Car, Droplets, Zap, Flame, Heart, Scale } from 'lucide-react';
import api from '@/services/api';
import { ImageViewer } from '@/components/ImageViewer';
import { TestPropertyNotice } from '@/components/property/TestPropertyBadge';
import { usePropertyViewTracking, trackClickEvent } from '@/utils/analytics';
import { PropertyStructuredData } from '@/components/seo/PropertyStructuredData';
import PropertyMap from '@/components/map/PropertyMap';
import { usePropertyComparison } from '@/hooks/usePropertyComparison';
import { useFavorites } from '@/hooks/useFavorites';

type InquiryForm = {
  name: string;
  phone: string;
  email: string;
  preferredContactMethod: string;
  preferredViewingDate: string;
  preferredContactTime: string;
  message: string;
};

type Media = { id: string; imageUrl: string; mediaType?: 'IMAGE' | 'VIDEO'; caption?: string };
type ViewingRequestForm = {
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
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
  const displayHour = hours % 12 || 12;
  const period = hours >= 12 ? 'PM' : 'AM';
  const label = `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;

  return { value, label };
});

const getLocalDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export default function PropertyDetails({ propertyId }: { propertyId: string }) {
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
    message: ''
  });
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [viewingForm, setViewingForm] = useState<ViewingRequestForm>({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
  });
  const [viewingSubmitted, setViewingSubmitted] = useState(false);
  const [viewingSubmitting, setViewingSubmitting] = useState(false);
  const [viewingError, setViewingError] = useState('');
  const { toggleComparison, isComparing } = usePropertyComparison();
  const { toggleFavorite, isFavorited } = useFavorites();

  useEffect(() => {
    if (!propertyId) return;

    setLoading(true);
    setError('');
    setProperty(null);

    api.getProperty(propertyId)
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
  }, [propertyId]);

  // Track property view with session duration
  usePropertyViewTracking(property?.id || '');

  const validateInquiryForm = (): string => {
    if (!inquiryForm.name.trim()) return 'Full Name is required';
    if (!inquiryForm.phone.trim()) return 'Phone Number is required';
    if (!inquiryForm.email.trim()) return 'Email Address is required';
    if (!(property?.referenceNumber || property?.id)) return 'Property Reference is required';
    if (!property?.title) return 'Property of Interest is required';
    if (!inquiryForm.preferredContactMethod) return 'Preferred Contact Method is required';
    if (!inquiryForm.message.trim()) return 'Message is required';
    
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
        message: inquiryForm.message
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

  const media = (property.propertyImages || []).filter((item) => Boolean(item?.imageUrl));
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

  const isCompared = property ? isComparing(property.id) : false;
  const isFav = property ? isFavorited(property.id) : false;

  const handleCompare = () => {
    if (!property) return;
    toggleComparison({
      id: property.id,
      title: property.title,
      price: property.price || 0,
      currency: property.currency || 'RWF',
      location: property.location || '',
      district: property.district || '',
      propertyType: property.propertyType,
      transactionType: property.transactionType,
      bedrooms: property.bedrooms || undefined,
      bathrooms: property.bathrooms || undefined,
      size: property.size || undefined,
      sizeUnit: property.sizeUnit || undefined,
      propertyImages: media.map((m) => ({ imageUrl: m.imageUrl })),
      amenities: property.amenities || property.features || [],
      status: property.status,
      slug: property.slug || '',
    });
  };

  const handleFavorite = () => {
    if (!property) return;
    toggleFavorite(property.id);
  };

  return (
    <>
      <PropertyStructuredData property={property} />
      <main className="bg-slate-50 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <TestPropertyNotice className="mb-6" />
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link href="/properties" className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800">
            <ArrowLeft className="h-4 w-4" />Back to properties
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Compare Button */}
            <button
              onClick={handleCompare}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                isCompared
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title={isCompared ? 'Remove from comparison' : 'Compare property'}
            >
              <Scale className={`h-4 w-4 ${isCompared ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>{isCompared ? 'Comparing' : 'Compare'}</span>
            </button>

            {/* Favorite / Save Button */}
            <button
              onClick={handleFavorite}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                isFav
                  ? 'bg-rose-50 text-rose-600 border-rose-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title={isFav ? 'Saved in favorites' : 'Save to favorites'}
            >
              <Heart className={`h-4 w-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
              <span>{isFav ? 'Saved' : 'Save'}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg transition-all"
            >
              <Share2 className="h-4 w-4 text-slate-500" />
              <span>Share</span>
            </button>
          </div>
        </div>
        
        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div>
            {/* Enhanced Image Gallery */}
            <div className="space-y-3">
              {media.length > 0 ? (
                <>
                  {/* Hero Main Image with Zoom badge */}
                  <div
                    className="relative group cursor-pointer aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-900 shadow-md border border-slate-200"
                    onClick={() => openViewer(0)}
                  >
                    {media[0].mediaType === 'VIDEO' ? (
                      <div className="w-full h-full relative">
                        <video src={media[0].imageUrl} controls className="w-full h-full object-cover">
                          <source src={media[0].imageUrl} />
                        </video>
                        <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 backdrop-blur-sm">
                          <Video className="h-3.5 w-3.5" /> Video
                        </div>
                      </div>
                    ) : (
                      <>
                        <img
                          src={media[0].imageUrl}
                          alt={property.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {media[0].caption && (
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white text-sm p-4">
                            {media[0].caption}
                          </div>
                        )}
                      </>
                    )}

                    {/* Interactive Zoom Overlay Banner */}
                    <div className="absolute bottom-3 right-3 bg-black/70 hover:bg-black/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 backdrop-blur-md transition-all shadow-md group-hover:bg-emerald-600">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Click to Zoom & View Gallery ({media.length})</span>
                    </div>
                  </div>

                  {/* Thumbnail Row */}
                  {media.length > 1 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
                      {media.slice(0, 5).map((item, index) => {
                        const isLastItemWithMore = index === 4 && media.length > 5;
                        return (
                          <div
                            key={item.id || index}
                            onClick={() => openViewer(index)}
                            className="relative aspect-video rounded-xl overflow-hidden cursor-pointer bg-slate-100 group border border-slate-200 shadow-sm"
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.caption || `Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            {isLastItemWithMore && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                                +{media.length - 4} More
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-video rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400">
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
              <div className="space-y-4">
                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium">{location || 'Location not specified'}</p>
                    {mapUrl && (
                      <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-block mt-2 text-emerald-600 text-sm hover:underline">
                        View on Google Maps
                      </a>
                    )}
                  </div>
                </div>
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
                {/* Interactive Map */}
                {property.latitude != null && property.longitude != null && (
                  <div className="mt-4">
                    <PropertyMap
                      latitude={property.latitude}
                      longitude={property.longitude}
                      address={location}
                    />
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
                        <a
                          href={`tel:${property.agent.phone}`}
                          className="flex items-center gap-2 text-sm text-emerald-600 hover:underline"
                          onClick={() => {
                            if (property.agent?.phone) {
                              trackClickEvent('PHONE', property.id, 'agent-phone', property.agent.phone, `tel:${property.agent.phone}`);
                            }
                          }}
                        >
                          <Phone className="h-4 w-4" />
                          {property.agent.phone}
                        </a>
                      )}
                      {property.agent.email && (
                        <a
                          href={`mailto:${property.agent.email}`}
                          className="flex items-center gap-2 text-sm text-emerald-600 hover:underline"
                          onClick={() => {
                            if (property.agent?.email) {
                              trackClickEvent('EMAIL', property.id, 'agent-email', property.agent.email, `mailto:${property.agent.email}`);
                            }
                          }}
                        >
                          <Mail className="h-4 w-4" />
                          {property.agent.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/request-viewing?propertyId=${property.id}`}
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
                        href={`/properties/${related.id}`}
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
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
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
                    className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
                  >
                    Send Inquiry
                  </button>
                </form>
              )}
            </div>
          </aside>
        </div>
      </div>
      </main>
      {viewerOpen && (
        <ImageViewer
          images={media}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
