'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Scale, X, ArrowLeft, Trash2, Plus, BedDouble, Bath, Ruler, Check, ExternalLink } from 'lucide-react'
import api from '@/services/api'
import { usePropertyComparison, Property } from '@/hooks/usePropertyComparison'

const formatPrice = (price: string | number | undefined, currency: string = 'RWF'): string => {
  if (!price) return 'Price on request'
  const num = Number(price)
  if (isNaN(num)) return String(price)
  if (num >= 1000000) {
    return `${currency} ${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${currency} ${(num / 1000).toFixed(0)}K`
  }
  return `${currency} ${num.toLocaleString()}`
}

const formatSize = (size: string | number | undefined, sizeUnit?: string): string => {
  if (!size) return '—'
  const unit = sizeUnit || 'sqm'
  const unitDisplay = unit === 'sqm' ? 'm²' : unit === 'sqft' ? 'ft²' : unit === 'acres' ? 'acres' : unit === 'hectares' ? 'hectares' : unit
  return `${size} ${unitDisplay}`
}

export default function ComparePropertiesContent() {
  const { comparingProperties, removeFromComparison, clearComparison, addToComparison } = usePropertyComparison()
  const [slugInput, setSlugInput] = useState('')
  const [addError, setAddError] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddBySlug = async (e: React.FormEvent) => {
    e.preventDefault()
    const propertyId = slugInput.trim().replace(/^.*\/properties\//, '').replace(/\/$/, '')
    if (!propertyId) return

    setAddError('')
    setIsAdding(true)

    try {
      const res = (await api.getProperty(propertyId)) as { data: any }
      if (!res?.data) {
        setAddError('Property not found. Please enter a valid property ID.')
        return
      }

      const p = res.data
      const result = addToComparison({
        id: p.id,
        title: p.title,
        price: p.price,
        currency: p.currency || 'RWF',
        location: p.location,
        district: p.district,
        propertyType: p.propertyType,
        transactionType: p.transactionType,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        size: p.size,
        sizeUnit: p.sizeUnit,
        propertyImages: p.propertyImages || (p.image ? [{ imageUrl: p.image }] : []),
        amenities: p.amenities || [],
        furnishingStatus: p.furnishingStatus,
        status: p.status,
        slug: p.slug || p.id,
      })

      if (!result.success) {
        setAddError(result.message)
      } else {
        setSlugInput('')
      }
    } catch {
      setAddError('Failed to fetch property details. Please verify the slug.')
    } finally {
      setIsAdding(false)
    }
  }

  const renderRow = (label: string, getValue: (p: Property) => React.ReactNode) => (
    <tr className="border-b border-slate-200">
      <td className="py-4 px-4 font-semibold text-slate-700 bg-slate-50 sticky left-0 z-10 w-44">
        {label}
      </td>
      {comparingProperties.map((property) => (
        <td key={property.id} className="py-4 px-4 text-center min-w-[240px]">
          {getValue(property)}
        </td>
      ))}
    </tr>
  )

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Breadcrumbs & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to all properties
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy">Compare Properties</h1>
                <p className="text-sm text-slate-600">
                  {comparingProperties.length === 0
                    ? 'No properties selected for comparison yet.'
                    : `Comparing ${comparingProperties.length} ${comparingProperties.length === 1 ? 'property' : 'properties'} side by side.`}
                </p>
              </div>
            </div>
          </div>

          {comparingProperties.length > 0 && (
            <button
              onClick={clearComparison}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          )}
        </div>

        {/* Add property by ID search bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-8">
          <form onSubmit={handleAddBySlug} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              placeholder="Add another property by ID (or /properties/ID URL)"
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              disabled={comparingProperties.length >= 5 || isAdding}
            />
            <button
              type="submit"
              disabled={!slugInput.trim() || comparingProperties.length >= 5 || isAdding}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-brand-emerald text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              {isAdding ? 'Adding...' : 'Add to Compare'}
            </button>
          </form>
          {addError && <p className="text-xs sm:text-sm text-red-600 mt-2 font-medium">{addError}</p>}
          {comparingProperties.length >= 5 && (
            <p className="text-xs text-amber-600 mt-2">Maximum limit of 5 properties reached.</p>
          )}
        </div>

        {/* Empty State */}
        {comparingProperties.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-2xl mx-auto my-12">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scale className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-brand-navy mb-2">No Properties Selected</h2>
            <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
              Browse our properties and click the compare icon on any listing card or details page to compare features, prices, and locations.
            </p>
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-emerald text-white font-semibold rounded-xl hover:bg-emerald-700 transition shadow-md text-sm"
            >
              Browse Properties
            </Link>
          </div>
        ) : (
          /* Comparison Table */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="py-4 px-4 font-bold text-slate-800 sticky left-0 bg-slate-100 z-10 w-44">
                      Property
                    </th>
                    {comparingProperties.map((p) => {
                      const primaryImg = p.propertyImages?.[0]?.imageUrl
                      return (
                        <th key={p.id} className="py-4 px-4 text-center min-w-[260px] align-top">
                          <div className="relative group bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => removeFromComparison(p.id)}
                              aria-label={`Remove ${p.title}`}
                              className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors z-20"
                              title="Remove from comparison"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-200 mb-3">
                              {primaryImg ? (
                                <img src={primaryImg} alt={p.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                                  No Image
                                </div>
                              )}
                            </div>

                            <h3 className="font-bold text-brand-navy text-sm sm:text-base line-clamp-2 mb-1">
                              {p.title}
                            </h3>
                            <p className="text-brand-emerald font-extrabold text-lg mb-3">
                              {formatPrice(p.price, p.currency || 'RWF')}
                            </p>

                            <Link
                              href={`/properties/${encodeURIComponent(p.id)}`}
                              className="inline-flex items-center justify-center gap-1 w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                              <span>View Listing</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {renderRow('Price', (p) => (
                    <span className="font-bold text-brand-emerald text-base">
                      {formatPrice(p.price, p.currency || 'RWF')}
                    </span>
                  ))}
                  {renderRow('Location', (p) => (
                    <div>
                      <div className="font-medium text-slate-800">{p.location || '—'}</div>
                      {p.district && <div className="text-xs text-slate-500">{p.district}</div>}
                    </div>
                  ))}
                  {renderRow('Property Type', (p) => (
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {p.propertyType || 'Residential'}
                    </span>
                  ))}
                  {renderRow('Transaction', (p) => (
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                      {p.transactionType || 'Sale'}
                    </span>
                  ))}
                  {renderRow('Bedrooms', (p) => (
                    <div className="inline-flex items-center gap-1.5 text-slate-700">
                      <BedDouble className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold">{p.bedrooms ?? '—'}</span>
                    </div>
                  ))}
                  {renderRow('Bathrooms', (p) => (
                    <div className="inline-flex items-center gap-1.5 text-slate-700">
                      <Bath className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold">{p.bathrooms ?? '—'}</span>
                    </div>
                  ))}
                  {renderRow('Size', (p) => (
                    <div className="inline-flex items-center gap-1.5 text-slate-700">
                      <Ruler className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold">{formatSize(p.size, p.sizeUnit)}</span>
                    </div>
                  ))}
                  {renderRow('Furnishing', (p) => (
                    <span className="text-slate-700 font-medium">
                      {p.furnishingStatus || 'Unspecified'}
                    </span>
                  ))}
                  {renderRow('Status', (p) => (
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'SOLD'
                          ? 'bg-red-100 text-red-800'
                          : p.status === 'RENTED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {p.status || 'AVAILABLE'}
                    </span>
                  ))}
                  {renderRow('Amenities', (p) => (
                    <div className="flex flex-wrap gap-1 justify-center max-w-xs mx-auto">
                      {p.amenities && p.amenities.length > 0 ? (
                        p.amenities.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">None listed</span>
                      )}
                    </div>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
