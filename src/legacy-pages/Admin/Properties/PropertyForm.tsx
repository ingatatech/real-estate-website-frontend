'use client'

import { FormEvent, useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from '@/navigation/legacy-router';
import { AlertCircle, ArrowLeft, Save, X, Star, Plus, Check } from 'lucide-react';
import { adminApi } from '../../../services/api';
import { RWANDA_DISTRICTS, getSectorsByDistrict } from '../../../data/rwandaAdministrativeDivisions';

type PropertyRecord = Record<string, any>;
type MediaItem = { url: string; mediaType: 'IMAGE' | 'VIDEO'; isPrimary?: boolean };

const COMMON_AMENITIES = [
  'Swimming Pool',
  'WiFi / Internet',
  '24/7 Security',
  'Backup Generator',
  'Air Conditioning',
  'Water Tank / Reservoir',
  'Balcony / Terrace',
  'Private Garden',
  'Parking Spaces',
  'Gym / Fitness',
  'Furnished',
  'CCTV Surveillance',
  'Staff Quarters',
  'Modern Kitchen',
];

const initialForm: PropertyRecord = {
  title: '',
  description: '',
  categoryId: '',
  agentId: '',
  propertyManagerId: '',
  propertyType: 'RESIDENTIAL',
  transactionType: 'SALE',
  price: '',
  currency: 'RWF',
  location: '',
  district: '',
  sector: '',
  address: '',
  area: '',
  neighborhood: '',
  latitude: '',
  longitude: '',
  bedrooms: '',
  bathrooms: '',
  parking: '',
  size: '',
  sizeUnit: 'sqm',
  furnishingStatus: '',
  status: 'AVAILABLE',
  publicationStatus: 'DRAFT',
  isFeatured: false,
  isNewDevelopment: false,
  amenities: [],
  images: [],
};

export default function PropertyForm({ propertyId }: { propertyId?: string }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<PropertyRecord>(initialForm);
  const [categories, setCategories] = useState<PropertyRecord[]>([]);
  const [agents, setAgents] = useState<PropertyRecord[]>([]);
  const [propertyManagers, setPropertyManagers] = useState<PropertyRecord[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(!!propertyId);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [availableSectors, setAvailableSectors] = useState<string[]>([]);
  const [customAmenityInput, setCustomAmenityInput] = useState('');
  const editing = Boolean(propertyId);

  useEffect(() => {
    Promise.all([
      adminApi.getCategories(),
      adminApi.getAgents(),
      adminApi.getAssignablePropertyManagers(),
      propertyId ? adminApi.getProperty(propertyId) : Promise.resolve(null),
    ])
      .then(([categoryRes, agentRes, propertyManagersRes, propertyRes]: any[]) => {
        setCategories(categoryRes.data || []);
        setAgents(agentRes.data || []);
        setPropertyManagers(propertyManagersRes.data || []);

        if (propertyRes?.data) {
          const p = propertyRes.data;
          setForm({
            ...initialForm,
            ...p,
            description: p.description ?? '',
            categoryId: p.categoryId || '',
            agentId: p.agentId || '',
            propertyManagerId: p.propertyManagerId || '',
            price: p.price?.toString() || '',
            size: p.size?.toString() || '',
            parking: p.parking !== undefined && p.parking !== null ? p.parking.toString() : '',
            area: p.area || '',
            neighborhood: p.neighborhood || '',
            amenities: Array.isArray(p.amenities) ? p.amenities : [],
          });

          const loadedMedia: MediaItem[] = (p.propertyImages || []).map(
            (image: PropertyRecord, idx: number) => ({
              url: image.imageUrl,
              mediaType: image.mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
              isPrimary: image.isPrimary !== undefined ? Boolean(image.isPrimary) : idx === 0,
            })
          );

          if (loadedMedia.length > 0 && !loadedMedia.some((m) => m.isPrimary)) {
            loadedMedia[0].isPrimary = true;
          }

          setMedia(loadedMedia);

          if (p.district) {
            setAvailableSectors(getSectorsByDistrict(p.district));
          }
        }
      })
      .catch((err) => setError(err.message || 'Unable to load property form.'))
      .finally(() => setLoading(false));
  }, [propertyId]);

  const update = (name: string, value: unknown) => {
    setForm((current: PropertyRecord) => ({ ...current, [name]: value }));
    if (name === 'district') {
      setAvailableSectors(getSectorsByDistrict(value as string));
      setForm((current) => ({ ...current, sector: '' }));
    }
  };

  const toggleAmenity = (amenity: string) => {
    const currentList: string[] = Array.isArray(form.amenities) ? form.amenities : [];
    const exists = currentList.includes(amenity);
    const updated = exists
      ? currentList.filter((item) => item !== amenity)
      : [...currentList, amenity];
    update('amenities', updated);
  };

  const addCustomAmenity = () => {
    const trimmed = customAmenityInput.trim();
    if (!trimmed) return;
    const currentList: string[] = Array.isArray(form.amenities) ? form.amenities : [];
    if (!currentList.includes(trimmed)) {
      update('amenities', [...currentList, trimmed]);
    }
    setCustomAmenityInput('');
  };

  const setPrimaryImage = (index: number) => {
    setMedia((items) =>
      items.map((item, i) => ({
        ...item,
        isPrimary: i === index,
      }))
    );
  };

  const removeMedia = (index: number) => {
    setMedia((items) => {
      const updated = items.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((m) => m.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const preparedMedia = media.map((item, index) => ({
        url: item.url,
        mediaType: item.mediaType,
        isPrimary: item.isPrimary ?? index === 0,
      }));

      // Sort media so the primary image is at index 0 for complete backend consistency
      const sortedMedia = [...preparedMedia].sort(
        (a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)
      );

      const data = {
        ...form,
        parking: form.parking !== '' && form.parking !== null ? Number(form.parking) : undefined,
        images: sortedMedia,
      };

      if (editing) await adminApi.updateAdminProperty(propertyId!, data);
      else await adminApi.createAdminProperty(data);
      navigate('/admin/properties');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save property.');
    } finally {
      setSaving(false);
    }
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const selected = Array.from(files);
    if (
      selected.some(
        (file) =>
          !/^image\/(jpeg|png|webp|gif)$|^video\/(mp4|webm|quicktime)$/.test(file.type) ||
          file.size > 100 * 1024 * 1024
      )
    ) {
      return setError('Use JPG, PNG, WebP, GIF, MP4, WebM, or MOV files up to 100 MB.');
    }

    try {
      setUploading(true);
      setError('');
      const results = await Promise.all(selected.map((file) => adminApi.uploadPropertyMedia(file)));
      const newItems: MediaItem[] = results.map((result) => ({
        url: result.data.url,
        mediaType: result.data.mediaType,
        isPrimary: false,
      }));

      setMedia((items) => {
        const combined = [...items, ...newItems];
        if (combined.length > 0 && !combined.some((m) => m.isPrimary)) {
          combined[0].isPrimary = true;
        }
        return combined;
      });
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Unable to upload media.');
    } finally {
      setUploading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const [isDragging, setIsDragging] = useState(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) uploadFiles(files);
  };

  if (loading) return <div className="py-16 text-center text-slate-500">Loading property...</div>;

  const input =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
  const field = (label: string, name: string, type = 'text', required = false) => (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        className={input}
        type={type}
        required={required}
        value={form[name] ?? ''}
        onChange={(e) => update(name, e.target.value)}
      />
    </label>
  );
  const select = (label: string, name: string, options: [string, string][]) => (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select
        className={input}
        value={form[name] ?? ''}
        onChange={(e) => update(name, e.target.value)}
      >
        {options.map(([val, text]) => (
          <option key={val} value={val}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );

  const districtOptions = RWANDA_DISTRICTS.map((district) => [district, district] as [string, string]);
  const currentAmenities: string[] = Array.isArray(form.amenities) ? form.amenities : [];

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/admin/properties"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to properties
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {editing ? 'Edit Property' : 'Add Property'}
          </h1>
        </div>
        <button
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Property'}
        </button>
      </div>

      {error && (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Listing details */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Listing details</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {field('Title', 'title', 'text', true)}
          {select('Property type', 'propertyType', [
            ['RESIDENTIAL', 'Residential'],
            ['COMMERCIAL', 'Commercial'],
            ['APARTMENTS', 'Apartments'],
            ['HOUSES', 'Houses'],
            ['VILLA', 'Villa'],
            ['LAND', 'Land & plots'],
            ['OFFICES', 'Offices'],
            ['WAREHOUSES', 'Warehouses'],
            ['NEW_DEVELOPMENTS', 'New Developments'],
          ])}
          {select('Transaction type', 'transactionType', [
            ['SALE', 'For sale'],
            ['RENT', 'For rent'],
            ['LEASE', 'For lease'],
          ])}
          <label className="block text-sm font-medium text-slate-700">
            Category
            <span className="text-xs text-slate-500 ml-1">(Optional - e.g., Luxury, Budget)</span>
            <select
              className={input}
              value={form.categoryId}
              onChange={(e) => update('categoryId', e.target.value)}
            >
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Description
            <textarea
              className={input}
              rows={5}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </label>
        </div>
      </section>

      {/* Price and location */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Price and location</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {field('Price', 'price', 'number')}
          {select('Currency', 'currency', [['RWF', 'Rwandan franc (RWF)']])}
          {field('General Location', 'location')}
          {select('District', 'district', districtOptions)}
          {select(
            'Sector',
            'sector',
            availableSectors.length > 0
              ? availableSectors.map((s) => [s, s] as [string, string])
              : [['', 'Select district first']]
          )}
          {field('Street Address', 'address')}
          {field('Area / Suburb', 'area')}
          {field('Neighborhood', 'neighborhood')}
          {field('Nearby Landmarks', 'nearbyLandmarks')}
          {field('Latitude', 'latitude', 'number')}
          {field('Longitude', 'longitude', 'number')}
        </div>
      </section>

      {/* Property details */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Property details</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {field('Bedrooms', 'bedrooms', 'number')}
          {field('Bathrooms', 'bathrooms', 'number')}
          {field('Parking Spaces', 'parking', 'number')}
          {field('Size', 'size', 'number')}
          {select('Size unit', 'sizeUnit', [
            ['sqm', 'Square metres (sqm)'],
            ['acres', 'Acres'],
            ['hectares', 'Hectares'],
          ])}
          {select('Furnishing', 'furnishingStatus', [
            ['', 'Not specified'],
            ['FURNISHED', 'Furnished'],
            ['SEMI_FURNISHED', 'Semi-furnished'],
            ['UNFURNISHED', 'Unfurnished'],
          ])}
          <label className="block text-sm font-medium text-slate-700">
            Assigned agent
            <select
              className={input}
              value={form.agentId}
              onChange={(e) => update('agentId', e.target.value)}
            >
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Property manager
            <select
              className={input}
              value={form.propertyManagerId}
              onChange={(e) => update('propertyManagerId', e.target.value)}
            >
              <option value="">Unassigned</option>
              {propertyManagers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name || manager.email}{' '}
                  {manager.role?.name ? `(${manager.role.name})` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Amenities & Features */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Amenities & Features</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Select available amenities or add custom features.
            </p>
          </div>
          {currentAmenities.length > 0 && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              {currentAmenities.length} selected
            </span>
          )}
        </div>

        {/* Common amenities tags */}
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
            Quick Select
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_AMENITIES.map((amenity) => {
              const active = currentAmenities.includes(amenity);
              return (
                <button
                  type="button"
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                  {amenity}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom amenity input */}
        <div className="mt-5 flex gap-2">
          <input
            type="text"
            value={customAmenityInput}
            onChange={(e) => setCustomAmenityInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomAmenity();
              }
            }}
            placeholder="Add custom amenity (e.g., Solar Water Heater, Wine Cellar)..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="button"
            onClick={addCustomAmenity}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        {/* Selected amenities list */}
        {currentAmenities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">Selected Amenities:</p>
            <div className="flex flex-wrap gap-2">
              {currentAmenities.map((amenity) => (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className="hover:text-red-600 ml-1 rounded-full p-0.5"
                    title="Remove amenity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Publishing */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Publishing</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {select('Availability', 'status', [
            ['AVAILABLE', 'Available'],
            ['RESERVED', 'Reserved'],
            ['SOLD', 'Sold'],
            ['RENTED', 'Rented'],
            ['LEASED', 'Leased'],
            ['ARCHIVED', 'Archived'],
          ])}
          {select('Publication status', 'publicationStatus', [
            ['DRAFT', 'Draft'],
            ['PUBLISHED', 'Published'],
            ['ARCHIVED', 'Archived'],
          ])}
          <div className="flex flex-wrap items-end gap-5 pb-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => update('isFeatured', e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isNewDevelopment}
                onChange={(e) => update('isNewDevelopment', e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              New development
            </label>
          </div>
        </div>
      </section>

      {/* Property Media & Primary Image Selection */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Property Media</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Upload photos and videos. Click &ldquo;Set as Primary&rdquo; to choose the main listing thumbnail.
            </p>
          </div>
          {media.length > 0 && (
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {media.length} {media.length === 1 ? 'file' : 'files'}
            </span>
          )}
        </div>

        <div className="mt-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-300 hover:border-emerald-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <svg
                className="w-12 h-12 text-slate-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
              <p className="text-sm font-medium text-slate-700 mb-2">Drag and drop files here</p>
              <p className="text-xs text-slate-500 mb-4">or click to browse</p>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => uploadFiles(e.target.files)}
                className="hidden"
                disabled={uploading}
                ref={fileInputRef}
              />
              <button
                type="button"
                onClick={handleFileButtonClick}
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select Files
              </button>
              <p className="text-xs text-slate-400 mt-3">
                JPG, PNG, WebP, GIF, MP4, WebM, MOV up to 100MB
              </p>
            </div>
          </div>

          {uploading && (
            <div className="mt-3 text-sm text-slate-500 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              Uploading media...
            </div>
          )}

          {media.length > 0 && (
            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              {media.map((item, index) => {
                const isPrimary = Boolean(item.isPrimary);
                return (
                  <div
                    key={index}
                    className={`relative group rounded-xl overflow-hidden border-2 transition ${
                      isPrimary
                        ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="aspect-square bg-slate-100 overflow-hidden">
                      {item.mediaType === 'VIDEO' ? (
                        <video src={item.url} className="w-full h-full object-cover" controls />
                      ) : (
                        <img
                          src={item.url}
                          alt={`Property media ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Media Type Badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[11px] font-medium rounded-md backdrop-blur-xs">
                      {item.mediaType === 'VIDEO' ? 'Video' : 'Image'}
                    </div>

                    {/* Primary Badge or Set Primary Button */}
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center gap-1">
                      {isPrimary ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-sm">
                          <Star className="h-3 w-3 fill-current" /> Primary Image
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(index)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white/90 text-slate-800 hover:bg-white text-xs font-medium rounded-lg shadow-sm transition opacity-90 group-hover:opacity-100"
                        >
                          <Star className="h-3 w-3 text-slate-400 group-hover:text-amber-500" />
                          Set Primary
                        </button>
                      )}
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      aria-label="Remove media"
                      className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs shadow hover:bg-red-700"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Link
          to="/admin/properties"
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          Cancel
        </Link>
        <button
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 transition shadow-sm"
        >
          {saving ? 'Saving...' : editing ? 'Update Property' : 'Create Property'}
        </button>
      </div>
    </form>
  );
}