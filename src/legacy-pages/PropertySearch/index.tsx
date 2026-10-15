'use client'

import { FormEvent, useState, useEffect } from 'react';
import { Link, useSearchParams } from '@/navigation/legacy-router';
import api from '../../services/api';
import { RWANDA_DISTRICTS, getSectorsByDistrict } from '../../data/rwandaAdministrativeDivisions';
import { TestPropertyBadge, TestPropertyNotice } from '../../components/property/TestPropertyBadge';

type SearchForm = {
  location: string; district: string; sector: string;
  propertyType: string; transactionType: string; minPrice: string; maxPrice: string;
  minBedrooms: string; minBathrooms: string; minSize: string; maxSize: string; sizeUnit: string;
  availability: string; furnishingStatus: string; features: string;
};

const initialForm: SearchForm = {
  location: '', district: '', sector: '',
  propertyType: '', transactionType: '', minPrice: '', maxPrice: '', minBedrooms: '',
  minBathrooms: '', minSize: '', maxSize: '', sizeUnit: 'sqm', availability: '', furnishingStatus: '', features: '',
};

type Property = { id: string; slug: string; title: string; location?: string; district?: string; sector?: string; price?: string | number; bedrooms?: number; bathrooms?: number; size?: string | number; sizeUnit?: string };
type SavedPropertySearch = { filters: SearchForm; savedAt: string };

const SAVED_SEARCHES_KEY = 'ingata_saved_property_searches';
const isSavedPropertySearch = (value: unknown): value is SavedPropertySearch => {
  if (!value || typeof value !== 'object') return false;
  const savedSearch = value as Partial<SavedPropertySearch>;
  if (!savedSearch.filters || typeof savedSearch.filters !== 'object' || typeof savedSearch.savedAt !== 'string') return false;
  return Number.isFinite(Date.parse(savedSearch.savedAt))
    && Object.keys(initialForm).every((key) => typeof savedSearch.filters?.[key as keyof SearchForm] === 'string');
};

const parseSavedSearches = (storedSearches: string | null): SavedPropertySearch[] => {
  if (!storedSearches) return [];
  const parsedSearches: unknown = JSON.parse(storedSearches);
  if (!Array.isArray(parsedSearches) || !parsedSearches.every(isSavedPropertySearch)) {
    throw new Error('Saved searches data is invalid. Clear this browser’s saved searches and try again.');
  }
  return parsedSearches;
};

export default function PropertySearch() {
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState<SearchForm>(() => {
    const initial = { ...initialForm };
    if (searchParams.has('location')) initial.location = searchParams.get('location') || '';
    if (searchParams.has('propertyType')) initial.propertyType = searchParams.get('propertyType') || '';
    
    const urlTransaction = searchParams.get('transactionType');
    if (urlTransaction) {
      if (urlTransaction.toLowerCase() === 'buy') initial.transactionType = 'SALE';
      else if (urlTransaction.toLowerCase() === 'rent') initial.transactionType = 'RENT';
      else initial.transactionType = urlTransaction;
    }
    
    const priceRange = searchParams.get('priceRange');
    if (priceRange) {
      const parts = priceRange.split('-');
      if (parts.length === 2) {
        initial.minPrice = parts[0];
        initial.maxPrice = parts[1];
      } else if (priceRange.endsWith('+')) {
        initial.minPrice = priceRange.replace('+', '');
      }
    }
    
    if (searchParams.has('bedrooms')) {
      initial.minBedrooms = searchParams.get('bedrooms') || '';
    }
    
    return initial;
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [availableSectors, setAvailableSectors] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedPropertySearch[]>([]);

  const update = (name: keyof SearchForm, value: string) => {
    setSaveMessage('');
    setForm((current) => {
      const updated = { ...current, [name]: value };
      if (name === 'district') {
        updated.sector = '';
        setAvailableSectors(getSectorsByDistrict(value));
      }
      return updated;
    });
  };

  useEffect(() => {
    try {
      const storedSearches = localStorage.getItem(SAVED_SEARCHES_KEY);
      setSavedSearches(parseSavedSearches(storedSearches));
    } catch (loadError) {
      setSaveMessage(loadError instanceof Error ? loadError.message : 'Unable to load saved searches from this browser.');
    }

    const fetchProperties = async () => {
      setLoading(true); setError('');
      const query = Object.fromEntries(Object.entries(form).filter(([, value]) => value.trim() !== ''));
      try {
        const response = await api.getProperties(query) as { data: Property[] };
        setProperties(response.data || []);
        if (searchParams.toString()) setHasSearched(true);
      }
      catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to search properties'); }
      finally { setLoading(false); }
    };
    fetchProperties();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError(''); setHasSearched(true);
    const query = Object.fromEntries(Object.entries(form).filter(([, value]) => value.trim() !== ''));
    try { const response = await api.getProperties(query) as { data: Property[] }; setProperties(response.data || []); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to search properties'); }
    finally { setLoading(false); }
  };

  const saveSearch = () => {
    setSaveMessage('');
    try {
      const savedSearches = parseSavedSearches(localStorage.getItem(SAVED_SEARCHES_KEY));

      const isAlreadySaved = savedSearches.some((search) => JSON.stringify(search.filters) === JSON.stringify(form));
      if (isAlreadySaved) {
        setSaveMessage('This search is already saved on this device.');
        return;
      }

      const updatedSearches = [
        ...savedSearches,
        { filters: form, savedAt: new Date().toISOString() },
      ];
      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updatedSearches));
      setSavedSearches(updatedSearches);
      setSaveMessage('Search saved on this device.');
    } catch (saveError) {
      setSaveMessage(saveError instanceof Error ? saveError.message : 'Unable to save this search in your browser.');
    }
  };

  const applySavedSearch = async (savedSearch: SavedPropertySearch) => {
    setForm(savedSearch.filters);
    setAvailableSectors(getSectorsByDistrict(savedSearch.filters.district));
    setSaveMessage('');
    setError('');
    setLoading(true);
    setHasSearched(true);
    const query = Object.fromEntries(
      Object.entries(savedSearch.filters).filter(([, value]) => value.trim() !== ''),
    );
    try {
      const response = await api.getProperties(query) as { data: Property[] };
      setProperties(response.data || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to search properties');
    } finally {
      setLoading(false);
    }
  };

  const removeSavedSearch = (indexToRemove: number) => {
    try {
      const updatedSearches = savedSearches.filter((_, index) => index !== indexToRemove);
      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updatedSearches));
      setSavedSearches(updatedSearches);
      setSaveMessage('Saved search removed from this device.');
    } catch (removeError) {
      setSaveMessage(removeError instanceof Error ? removeError.message : 'Unable to remove this saved search.');
    }
  };

  const describeSavedSearch = (filters: SearchForm) => [
    filters.location && `Location: ${filters.location}`,
    filters.district && `District: ${filters.district}`,
    filters.sector && `Sector: ${filters.sector}`,
    filters.propertyType && `Type: ${filters.propertyType.replaceAll('_', ' ')}`,
    filters.transactionType && `Purpose: ${filters.transactionType}`,
  ].filter(Boolean).join(' · ') || 'All properties';

  const sizeUnitLabel = form.sizeUnit === 'sqm' ? 'm²' : form.sizeUnit === 'sqft' ? 'ft²' : form.sizeUnit === 'acres' ? 'acres' : 'ha';

  return (
    <main className="bg-brand-background min-h-screen py-12"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-emerald">Property Search</p><h1 className="text-4xl font-bold text-brand-navy mt-2 mb-8">Find a property that fits</h1>
      <form onSubmit={handleSubmit} className="bg-brand-white rounded-xl shadow-sm border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Location text */}
        <label className="lg:col-span-2 block text-sm font-medium text-slate-700">Location / Address
          <input value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="Neighbourhood or street" className="search-input mt-1" />
        </label>
        {/* District */}
        <label className="block text-sm font-medium text-slate-700">District
          <select value={form.district} onChange={(event) => update('district', event.target.value)} className="search-input mt-1">
            <option value="">Any district</option>
            {RWANDA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        {/* Sector — only enabled once district selected */}
        <label className="block text-sm font-medium text-slate-700">Sector
          <select value={form.sector} onChange={(event) => update('sector', event.target.value)} className="search-input mt-1" disabled={!form.district}>
            <option value="">{form.district ? 'Any sector' : 'Select district first'}</option>
            {availableSectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        {/* Property type */}
        <label className="block text-sm font-medium text-slate-700">Property type
          <select value={form.propertyType} onChange={(event) => update('propertyType', event.target.value)} className="search-input mt-1"><option value="">Any type</option><option value="RESIDENTIAL">Residential</option><option value="COMMERCIAL">Commercial</option><option value="APARTMENTS">Apartments</option><option value="HOUSES">Houses</option><option value="LAND">Land</option><option value="OFFICES">Offices</option><option value="WAREHOUSES">Warehouses</option><option value="NEW_DEVELOPMENTS">New Developments</option></select>
        </label>
        {/* Purpose */}
        <label className="block text-sm font-medium text-slate-700">Purpose
          <select value={form.transactionType} onChange={(event) => update('transactionType', event.target.value)} className="search-input mt-1"><option value="">Any purpose</option><option value="SALE">Buy</option><option value="RENT">Rent</option><option value="LEASE">Lease</option></select>
        </label>
        {/* Min price with RWF prefix */}
        <label className="block text-sm font-medium text-slate-700">Min price (RWF)
          <input type="number" min="0" placeholder="e.g. 5000000" value={form.minPrice} onChange={(event) => update('minPrice', event.target.value)} className="search-input mt-1" />
        </label>
        {/* Max price with RWF prefix */}
        <label className="block text-sm font-medium text-slate-700">Max price (RWF)
          <input type="number" min="0" placeholder="e.g. 100000000" value={form.maxPrice} onChange={(event) => update('maxPrice', event.target.value)} className="search-input mt-1" />
        </label>
        {/* Bedrooms / Bathrooms */}
        <label className="block text-sm font-medium text-slate-700">Min bedrooms
          <input type="number" min="0" value={form.minBedrooms} onChange={(event) => update('minBedrooms', event.target.value)} className="search-input mt-1" />
        </label>
        <label className="block text-sm font-medium text-slate-700">Min bathrooms
          <input type="number" min="0" value={form.minBathrooms} onChange={(event) => update('minBathrooms', event.target.value)} className="search-input mt-1" />
        </label>
        {/* Size unit selector */}
        <label className="block text-sm font-medium text-slate-700">Size unit
          <select value={form.sizeUnit} onChange={(event) => update('sizeUnit', event.target.value)} className="search-input mt-1">
            <option value="sqm">m² (sqm)</option>
            <option value="sqft">ft² (sqft)</option>
            <option value="acres">Acres</option>
            <option value="hectares">Hectares</option>
          </select>
        </label>
        {/* Min / Max size using chosen unit */}
        <label className="block text-sm font-medium text-slate-700">Min size ({sizeUnitLabel})
          <input type="number" min="0" value={form.minSize} onChange={(event) => update('minSize', event.target.value)} className="search-input mt-1" />
        </label>
        <label className="block text-sm font-medium text-slate-700">Max size ({sizeUnitLabel})
          <input type="number" min="0" value={form.maxSize} onChange={(event) => update('maxSize', event.target.value)} className="search-input mt-1" />
        </label>
        {/* Availability / Furnishing */}
        <label className="block text-sm font-medium text-slate-700">Availability
          <select value={form.availability} onChange={(event) => update('availability', event.target.value)} className="search-input mt-1"><option value="">Any availability</option><option value="AVAILABLE">Available</option><option value="SOLD">Sold</option><option value="RENTED">Rented</option></select>
        </label>
        <label className="block text-sm font-medium text-slate-700">Furnishing
          <select value={form.furnishingStatus} onChange={(event) => update('furnishingStatus', event.target.value)} className="search-input mt-1"><option value="">Any furnishing</option><option value="FURNISHED">Furnished</option><option value="SEMI_FURNISHED">Semi-furnished</option><option value="UNFURNISHED">Unfurnished</option></select>
        </label>
        <label className="lg:col-span-2 block text-sm font-medium text-slate-700">Features <span className="font-normal text-slate-500">(comma-separated)</span>
          <input value={form.features} onChange={(event) => update('features', event.target.value)} placeholder="parking, pool, balcony" className="search-input mt-1" />
        </label>
        <div className="lg:col-span-4 flex flex-wrap gap-3 pt-2"><button type="submit" className="bg-brand-emerald hover:bg-brand-emerald-hover text-brand-white font-semibold rounded-lg px-6 py-3">{loading ? 'Searching...' : 'Search properties'}</button><button type="button" onClick={saveSearch} className="border border-brand-slate text-brand-navy rounded-lg px-6 py-3">Save this search</button></div>
        {saveMessage && (
          <p className={`lg:col-span-4 text-sm ${saveMessage.startsWith('Unable') || saveMessage.startsWith('Saved searches data') ? 'text-red-600' : 'text-brand-emerald'}`} role="status">
            {saveMessage}
          </p>
        )}
      </form>
      {error && <p className="mt-5 text-red-600">{error}</p>}
      {savedSearches.length > 0 && (
        <section className="mt-8 rounded-xl border border-slate-200 bg-brand-white p-6" aria-labelledby="saved-searches-heading">
          <h2 id="saved-searches-heading" className="text-xl font-semibold text-brand-navy">Saved searches on this device</h2>
          <ul className="mt-4 divide-y divide-slate-200">
            {savedSearches.map((savedSearch, index) => (
              <li key={`${savedSearch.savedAt}-${index}`} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium text-brand-charcoal">{describeSavedSearch(savedSearch.filters)}</p>
                  <p className="mt-1 text-sm text-slate-500">Saved {new Date(savedSearch.savedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => applySavedSearch(savedSearch)} disabled={loading} className="rounded-lg bg-brand-emerald px-4 py-2 text-sm font-medium text-brand-white disabled:opacity-60">
                    Apply
                  </button>
                  <button type="button" onClick={() => removeSavedSearch(index)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-brand-charcoal">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {hasSearched && !loading && !error && properties.length === 0 && (
        <p className="mt-10 rounded-xl border border-slate-200 bg-brand-white p-6 text-center text-lg font-medium text-brand-charcoal" role="status">
          Property not found
        </p>
      )}
      <TestPropertyNotice className="mt-8" />
      <section className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <article key={property.id} className="rounded-xl border border-slate-200 bg-brand-white p-5">
            <div className="mb-3"><TestPropertyBadge /></div>
            <h2 className="text-xl font-bold text-brand-navy">{property.title}</h2>
            <p className="mt-2 text-brand-charcoal">{property.location || 'Location unavailable'}</p>
            <p className="mt-4 font-semibold text-brand-emerald">{property.price ? `RWF ${Number(property.price).toLocaleString()}` : 'Price on request'}</p>
            <p className="mt-2 text-sm text-slate-600">
              {property.bedrooms ?? 0} beds · {property.bathrooms ?? 0} baths · {property.size ? `${property.size} ${property.sizeUnit === 'sqm' ? 'm²' : property.sizeUnit === 'sqft' ? 'ft²' : property.sizeUnit === 'acres' ? 'acres' : property.sizeUnit === 'hectares' ? 'hectares' : property.sizeUnit || 'sqm'}` : 'Size unavailable'}
            </p>
            <Link to={`/properties/${property.slug}`} className="mt-4 inline-block font-semibold text-brand-emerald">View property</Link>
          </article>
        ))}
      </section>
    </div></main>
  );
}
