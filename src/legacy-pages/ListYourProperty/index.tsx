'use client'

import { useEffect, useState } from 'react';
import { Link } from '@/navigation/legacy-router';
import { ArrowLeft } from 'lucide-react';
import { RWANDA_DISTRICTS, getSectorsByDistrict } from '../../data/rwandaAdministrativeDivisions';
import { api } from '../../services/api';

export default function ListYourProperty() {
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [propertyImages, setPropertyImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    ownerName: '',
    phone: '',
    email: '',
    propertyType: '',
    district: '',
    sector: '',
    propertyLocation: '',
    transactionType: '',
    expectedPrice: '',
    propertySize: '',
    sizeUnit: 'sqm',
    bedrooms: '',
    bathrooms: '',
    propertyDescription: ''
  });

  useEffect(() => {
    const previews = propertyImages.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [propertyImages]);

  const formatPrice = (price: string): string => {
    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (isNaN(numericPrice)) return price;
    
    if (numericPrice >= 1000000) {
      return `RWF ${(numericPrice / 1000000).toFixed(0)}M`;
    } else if (numericPrice >= 1000) {
      return `RWF ${(numericPrice / 1000).toFixed(0)}K`;
    }
    return `RWF ${numericPrice.toLocaleString()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmissionError('');
    const propertyTypeMap: Record<string, string> = {
      apartment: 'APARTMENTS',
      house: 'HOUSES',
      office: 'OFFICES',
      retail: 'COMMERCIAL',
      warehouse: 'WAREHOUSES',
      land: 'LAND',
      other: 'RESIDENTIAL',
    };

    try {
      const listing = new FormData();
      listing.append('ownerName', formData.ownerName);
      listing.append('phone', formData.phone);
      listing.append('email', formData.email);
      listing.append('propertyType', propertyTypeMap[formData.propertyType] || 'RESIDENTIAL');
      listing.append('district', formData.district);
      listing.append('sector', formData.sector);
      listing.append('location', formData.propertyLocation || [formData.sector, formData.district].filter(Boolean).join(', '));
      listing.append('transactionType', formData.transactionType.toUpperCase());
      listing.append('expectedPrice', String(Number(formData.expectedPrice)));
      listing.append('propertySize', String(Number(formData.propertySize)));
      listing.append('sizeUnit', formData.sizeUnit);
      if (formData.bedrooms) listing.append('bedrooms', String(Number(formData.bedrooms)));
      if (formData.bathrooms) listing.append('bathrooms', String(Number(formData.bathrooms)));
      listing.append('propertyDescription', formData.propertyDescription);
      propertyImages.forEach((image) => listing.append('images', image));
      await api.createListing(listing);
      setSubmitted(true);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Unable to submit the property listing.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImageError('');
    if (files.length > 8) {
      setImageError('Choose up to 8 images.');
      event.target.value = '';
      return;
    }
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    if (files.some((file) => !allowedTypes.has(file.type) || file.size > 10 * 1024 * 1024)) {
      setImageError('Use JPG, PNG, WebP, or GIF images up to 10 MB each.');
      event.target.value = '';
      return;
    }
    setPropertyImages(files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <main className="bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/services" className="text-emerald-600 hover:underline text-sm font-medium">
            <><ArrowLeft className="mr-1 inline h-4 w-4" aria-hidden="true" />Back to Services</>
          </Link>
        </div>
        
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">List Your Property</h1>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> Submitted information shall be reviewed by authorized staff before publication.
              </p>
            </div>

            {submitted && <p role="status" className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Your listing request was received and is pending review.</p>}
            {submissionError && <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{submissionError}</p>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="ownerName" className="block text-sm font-medium text-slate-700 mb-2">
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    id="ownerName"
                    name="ownerName"
                    required
                    value={formData.ownerName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="propertyType" className="block text-sm font-medium text-slate-700 mb-2">
                    Property Type *
                  </label>
                  <select
                    id="propertyType"
                    name="propertyType"
                    required
                    value={formData.propertyType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select property type</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="office">Office</option>
                    <option value="retail">Retail Space</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="land">Land</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="transactionType" className="block text-sm font-medium text-slate-700 mb-2">
                    Transaction Type *
                  </label>
                  <select
                    id="transactionType"
                    name="transactionType"
                    required
                    value={formData.transactionType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select transaction type</option>
                    <option value="sale">Sale</option>
                    <option value="rent">Rent</option>
                    <option value="lease">Lease</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-slate-700 mb-2">
                    District *
                  </label>
                  <select
                    id="district"
                    name="district"
                    required
                    value={formData.district || ''}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        district: e.target.value,
                        sector: '',
                        propertyLocation: e.target.value ? e.target.value : ''
                      });
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select district</option>
                    {RWANDA_DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="sector" className="block text-sm font-medium text-slate-700 mb-2">
                    Sector
                  </label>
                  <select
                    id="sector"
                    name="sector"
                    value={formData.sector || ''}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        sector: e.target.value,
                        propertyLocation: e.target.value ? `${e.target.value}, ${formData.district}` : formData.district || ''
                      });
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    disabled={!formData.district}
                  >
                    <option value="">Select sector</option>
                    {formData.district && getSectorsByDistrict(formData.district).map((s: string) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="propertyLocation" className="block text-sm font-medium text-slate-700 mb-2">
                  Detailed Address
                </label>
                <input
                  type="text"
                  id="propertyLocation"
                  name="propertyLocation"
                  placeholder="e.g., KN 5 Rd, Near Airport"
                  value={formData.propertyLocation}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="expectedPrice" className="block text-sm font-medium text-slate-700 mb-2">
                    Expected Price (RWF) *
                  </label>
                  <input
                    type="number"
                    id="expectedPrice"
                    name="expectedPrice"
                    required
                    placeholder="e.g., 250000000"
                    value={formData.expectedPrice}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {formData.expectedPrice && (
                    <p className="text-emerald-600 text-sm mt-1 font-medium">
                      {formatPrice(formData.expectedPrice)}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="propertySize" className="block text-sm font-medium text-slate-700 mb-2">
                    Property Size *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      id="propertySize"
                      name="propertySize"
                      required
                      placeholder="e.g., 1500"
                      value={formData.propertySize}
                      onChange={handleChange}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <select
                      id="sizeUnit"
                      name="sizeUnit"
                      value={formData.sizeUnit}
                      onChange={handleChange}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="sqm">m²</option>
                      <option value="sqft">ft²</option>
                      <option value="acres">acres</option>
                      <option value="hectares">hectares</option>
                    </select>
                  </div>
                  {formData.propertySize && (
                    <p className="text-emerald-600 text-sm mt-1 font-medium">
                      {formData.propertySize} {formData.sizeUnit === 'sqm' ? 'm²' : formData.sizeUnit === 'sqft' ? 'ft²' : formData.sizeUnit === 'acres' ? 'acres' : 'hectares'}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="bedrooms" className="block text-sm font-medium text-slate-700 mb-2">
                    Number of Bedrooms
                  </label>
                  <input
                    type="number"
                    id="bedrooms"
                    name="bedrooms"
                    min="0"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="bathrooms" className="block text-sm font-medium text-slate-700 mb-2">
                    Number of Bathrooms
                  </label>
                  <input
                    type="number"
                    id="bathrooms"
                    name="bathrooms"
                    min="0"
                    step="1"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="propertyDescription" className="block text-sm font-medium text-slate-700 mb-2">
                  Property Description *
                </label>
                <textarea
                  id="propertyDescription"
                  name="propertyDescription"
                  rows={4}
                  required
                  value={formData.propertyDescription}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Describe your property features, amenities, condition, etc..."
                />
              </div>

              <div>
                <label htmlFor="images" className="block text-sm font-medium text-slate-700 mb-2">
                  Property Images
                </label>
                <input
                  type="file"
                  id="images"
                  name="images"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImagesChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-slate-500 text-sm mt-1">Upload up to 8 JPG, PNG, WebP, or GIF images, 10 MB each. Images are published if your request is approved.</p>
                {imageError && <p role="alert" className="mt-2 text-sm text-red-700">{imageError}</p>}
                {imagePreviews.length > 0 && <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{imagePreviews.map((preview, index) => <img key={preview} src={preview} alt={`Selected property image ${index + 1}`} className="aspect-square w-full rounded-lg border border-slate-200 object-cover" />)}</div>}
              </div>

              <button
                type="submit"
                disabled={submitting || submitted}
                className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : submitted ? 'Request Submitted' : 'Submit Property Listing'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
