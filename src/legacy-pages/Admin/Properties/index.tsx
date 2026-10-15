'use client'

import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/navigation/legacy-router';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Home,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { adminApi } from '../../../services/api';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface Property {
  id: string;
  title: string;
  propertyType: string;
  transactionType: string;
  price: string | null;
  currency: string | null;
  location: string | null;
  status: string;
  publicationStatus: string;
  isFeatured: boolean;
  createdAt: string;
  agent?: { name: string } | null;
  propertyManager?: { name: string } | null;
  category?: { name: string } | null;
  images?: {
    imageUrl: string;
    isPrimary?: boolean;
  }[];
}

interface ApiResponse {
  success?: boolean;
  data?: Property[];
  properties?: Property[];
  total?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

const formatLabel = (value: string) => {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatPrice = (
  price: string | null,
  currency: string | null
): string => {
  if (!price) return '—';

  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return `${currency ?? ''} ${price}`.trim();
  }

  if (numericPrice >= 1000000) {
    return `RWF ${(numericPrice / 1000000).toFixed(0)}M`;
  } else if (numericPrice >= 1000) {
    return `RWF ${(numericPrice / 1000).toFixed(0)}K`;
  }
  return `RWF ${numericPrice.toLocaleString()}`;
};

const formatDate = (date: string) => {
  if (!date) return '—';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return '—';
  }

  return parsedDate.toLocaleDateString();
};

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [transactionFilter, setTransactionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 10;

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await adminApi.getAdminProperties({
        page,
        limit,
        search: searchTerm || undefined,
        transactionType: transactionFilter || undefined,
        status: statusFilter || undefined,
        propertyType: propertyTypeFilter || undefined,
      });

      const result = response as ApiResponse;

      const propertyData =
        result.data ??
        result.properties ??
        [];

      setProperties(propertyData);

      if (result.pagination?.totalPages) {
        setTotalPages(result.pagination.totalPages);
      } else if (result.total !== undefined) {
        setTotalPages(Math.max(1, Math.ceil(result.total / limit)));
      } else {
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to load properties:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load properties.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [page, searchTerm, transactionFilter, statusFilter, propertyTypeFilter]);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesSearch =
        !searchTerm ||
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesTransaction =
        !transactionFilter ||
        property.transactionType === transactionFilter;

      const matchesStatus =
        !statusFilter ||
        property.status === statusFilter;

      const matchesPropertyType =
        !propertyTypeFilter ||
        property.propertyType === propertyTypeFilter;

      return (
        matchesSearch &&
        matchesTransaction &&
        matchesStatus &&
        matchesPropertyType
      );
    });
  }, [
    properties,
    searchTerm,
    transactionFilter,
    statusFilter,
    propertyTypeFilter,
  ]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);

      await adminApi.deleteAdminProperty(deleteId);

      setDeleteId(null);

      await fetchProperties();
    } catch (err) {
      console.error('Failed to delete property:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete property.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTransactionFilter('');
    setStatusFilter('');
    setPropertyTypeFilter('');
    setPage(1);
  };

  const hasFilters =
    searchTerm ||
    transactionFilter ||
    statusFilter ||
    propertyTypeFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">
              Properties
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Manage property listings and their publication status.
          </p>
        </div>

        <Link
          to="/admin/properties/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          <Plus className="h-5 w-5" />
          Add Property
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">
            <p className="font-medium">Unable to load properties</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError('')}
            className="rounded p-1 hover:bg-red-100"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Search properties..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Transaction */}
          <select
            value={transactionFilter}
            onChange={(event) => {
              setTransactionFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">All Transactions</option>
            <option value="SALE">For Sale</option>
            <option value="RENT">For Rent</option>
            <option value="LEASE">For Lease</option>
          </select>

          {/* Property Type */}
          <select
            value={propertyTypeFilter}
            onChange={(event) => {
              setPropertyTypeFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">All Types</option>
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="APARTMENTS">Apartments</option>
            <option value="HOUSES">Houses</option>
            <option value="LAND">Land</option>
            <option value="OFFICES">Offices</option>
            <option value="WAREHOUSES">Warehouses</option>
            <option value="NEW_DEVELOPMENTS">New Developments</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
            <option value="RENTED">Rented</option>
            <option value="LEASED">Leased</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
            Clear filters
          </button>
        )}
      </div>

      {/* Properties table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Image
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Property
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Type
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Transaction
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Price
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Agent
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Property Manager
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Created
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Loading properties...
                  </td>
                </tr>
              ) : filteredProperties.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center"
                  >
                    <Home className="mx-auto h-10 w-10 text-slate-300" />

                    <p className="mt-3 font-medium text-slate-700">
                      No properties found
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Try changing your filters or add a new property.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProperties.map((property) => {
                  const primaryImage =
                    property.images?.find((image) => image.isPrimary)
                      ?.imageUrl ??
                    property.images?.[0]?.imageUrl;

                  return (
                    <tr
                      key={property.id}
                      className="transition hover:bg-slate-50"
                    >
                      {/* Image */}
                      <td className="whitespace-nowrap px-5 py-4">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={property.title}
                            className="h-14 w-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-slate-100">
                            <Home className="h-6 w-6 text-slate-400" />
                          </div>
                        )}
                      </td>

                      {/* Title */}
                      <td className="max-w-xs px-5 py-4">
                        <div className="font-medium text-slate-900">
                          {property.title}
                        </div>

                        {property.isFeatured && (
                          <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Featured
                          </span>
                        )}
                      </td>

                      {/* Type */}
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatLabel(property.propertyType)}
                      </td>

                      {/* Transaction */}
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatLabel(property.transactionType)}
                      </td>

                      {/* Price */}
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-900">
                        {formatPrice(
                          property.price,
                          property.currency
                        )}
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={property.status} />
                          <StatusBadge status={property.publicationStatus} />
                        </div>
                      </td>

                      {/* Agent */}
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {property.agent?.name ?? 'Unassigned'}
                      </td>

                      {/* Property Manager */}
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {property.propertyManager?.name ?? 'Unassigned'}
                      </td>

                      {/* Created */}
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                        {formatDate(property.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/admin/properties/${property.id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                            title="Edit property"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeleteId(property.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-medium text-rose-600 shadow-sm hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                            title="Delete property"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filteredProperties.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage((currentPage) =>
                    Math.max(1, currentPage - 1)
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((currentPage) =>
                    Math.min(totalPages, currentPage + 1)
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Delete property?
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  This action cannot be undone. The property and
                  its related data may be permanently removed.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Property'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}