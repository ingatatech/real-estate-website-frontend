'use client'

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ClipboardList, LoaderCircle, Pencil, RefreshCw, Save, Search, X } from 'lucide-react';
import { adminApi } from '../../../services/api';

interface ListingRequest {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  propertyType: string;
  transactionType: string;
  location: string;
  district?: string | null;
  sector?: string | null;
  propertySize?: string | number | null;
  sizeUnit?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  description?: string | null;
  images?: { imageUrl: string; mediaType: string }[] | null;
  price?: string | number | null;
  status: string;
  createdAt: string;
}

interface ListingRequestsResponse {
  success?: boolean;
  data?: ListingRequest[];
}

const formatLabel = (value: string) => value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const formatPrice = (price?: string | number | null) => {
  if (price === undefined || price === null || price === '') return '—';
  const amount = Number(price);
  return Number.isFinite(amount) ? `RWF ${amount.toLocaleString()}` : '—';
};

export default function ListingRequests() {
  const [requests, setRequests] = useState<ListingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [editingRequest, setEditingRequest] = useState<ListingRequest | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.getListingRequests() as ListingRequestsResponse;
      setRequests(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load property listing requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const filteredRequests = useMemo(() => requests.filter((request) => {
    const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter ||
      (statusFilter === 'PENDING' && request.status === 'SUBMITTED');
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [request.name, request.email, request.phone, request.location, request.district, request.sector]
      .some((value) => value?.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  }), [requests, search, statusFilter]);

  const pendingCount = requests.filter((request) => request.status === 'PENDING' || request.status === 'SUBMITTED').length;

  const updateRequest = async (request: ListingRequest, action: 'approve' | 'reject') => {
    const prompt = action === 'approve'
      ? `Approve ${request.name}'s request and publish this property publicly?`
      : `Reject ${request.name}'s property listing request?`;
    if (!window.confirm(prompt)) return;

    setWorkingId(request.id);
    setError('');
    setMessage('');
    try {
      if (action === 'approve') {
        await adminApi.approveListingRequest(request.id);
        setMessage('Request approved and property published.');
      } else {
        await adminApi.rejectListingRequest(request.id);
        setMessage('Request rejected.');
      }
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to ${action} this request.`);
    } finally {
      setWorkingId(null);
    }
  };

  const saveEdits = async (approveAfterSave = false) => {
    if (!editingRequest) return;
    setWorkingId(editingRequest.id);
    setError('');
    setMessage('');
    try {
      await adminApi.updateListingRequest(editingRequest.id, {
        propertyType: editingRequest.propertyType,
        transactionType: editingRequest.transactionType,
        location: editingRequest.location,
        district: editingRequest.district || '',
        sector: editingRequest.sector || '',
        propertySize: editingRequest.propertySize ?? '',
        sizeUnit: editingRequest.sizeUnit || '',
        bedrooms: editingRequest.bedrooms ?? '',
        bathrooms: editingRequest.bathrooms ?? '',
        description: editingRequest.description || '',
        price: editingRequest.price ?? '',
      });
      if (approveAfterSave) {
        await adminApi.approveListingRequest(editingRequest.id);
        setMessage('Changes saved and property published.');
      } else {
        setMessage('Listing request updated. You can approve it when ready.');
      }
      setEditingRequest(null);
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save listing changes.');
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Property Requests</h1>
            {pendingCount > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{pendingCount} pending</span>}
          </div>
          <p className="mt-1 text-sm text-slate-500">Review owner-submitted listings. Approving creates and publishes a public property listing.</p>
        </div>
        <button onClick={() => void loadRequests()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search owner or location" className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
        </div>
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`rounded-lg px-3 py-2 text-sm font-medium ${statusFilter === status ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {formatLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin" />Loading requests...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
          {requests.length === 0 ? 'No property listing requests have been submitted.' : 'No requests match this filter.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const isPending = request.status === 'PENDING' || request.status === 'SUBMITTED';
            const busy = workingId === request.id;
            return (
              <article key={request.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{formatLabel(request.propertyType)} · {request.location}</h2>
                    <p className="mt-1 text-sm text-slate-500">{[request.sector, request.district].filter(Boolean).join(', ') || 'Location details not provided'} · Submitted {new Date(request.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isPending ? 'bg-amber-100 text-amber-800' : request.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{formatLabel(request.status)}</span>
                </div>

                <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Owner</p><p className="mt-1 font-medium text-slate-800">{request.name}</p><a className="text-emerald-700 hover:underline" href={`mailto:${request.email}`}>{request.email}</a>{request.phone && <p className="text-slate-600">{request.phone}</p>}</div>
                  <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Listing</p><p className="mt-1 text-slate-800">{formatLabel(request.transactionType)}</p><p className="text-slate-600">{formatPrice(request.price)}</p></div>
                  <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Size</p><p className="mt-1 text-slate-800">{request.propertySize ? `${request.propertySize} ${request.sizeUnit || 'sqm'}` : '—'}</p></div>
                  <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Rooms</p><p className="mt-1 text-slate-800">{request.bedrooms ?? '—'} bedrooms · {request.bathrooms ?? '—'} bathrooms</p></div>
                </div>

                {request.description && <p className="mt-4 whitespace-pre-wrap border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">{request.description}</p>}
                {!!request.images?.length && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{request.images.map((image) => <a key={image.imageUrl} href={image.imageUrl} target="_blank" rel="noreferrer"><img src={image.imageUrl} alt="Submitted property" className="aspect-square w-full rounded-lg border border-slate-200 object-cover" /></a>)}</div>}

                {isPending && <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                  <button onClick={() => setEditingRequest({ ...request })} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"><Pencil className="h-4 w-4" />Edit before approving</button>
                  <button onClick={() => void updateRequest(request, 'reject')} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"><X className="h-4 w-4" />Reject</button>
                  <button onClick={() => void updateRequest(request, 'approve')} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"><Check className="h-4 w-4" />Approve &amp; publish</button>
                </div>}
              </article>
            );
          })}
        </div>
      )}

      {editingRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4">
          <div className="mx-auto my-6 w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div><h2 className="text-lg font-semibold text-slate-900">Edit listing request</h2><p className="mt-1 text-sm text-slate-500">Review details before creating the public property listing.</p></div>
              <button onClick={() => setEditingRequest(null)} disabled={workingId === editingRequest.id} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-4 py-5 sm:grid-cols-2">
              {([
                ['propertyType', 'Property type'], ['transactionType', 'Transaction type'], ['location', 'Location'], ['district', 'District'], ['sector', 'Sector'], ['propertySize', 'Size'], ['sizeUnit', 'Size unit'], ['bedrooms', 'Bedrooms'], ['bathrooms', 'Bathrooms'], ['price', 'Price (RWF)'],
              ] as const).map(([field, label]) => (
                <label key={field} className="text-sm font-medium text-slate-700">{label}
                  <input value={editingRequest[field] ?? ''} onChange={(event) => setEditingRequest({ ...editingRequest, [field]: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </label>
              ))}
              <label className="sm:col-span-2 text-sm font-medium text-slate-700">Description
                <textarea rows={4} value={editingRequest.description ?? ''} onChange={(event) => setEditingRequest({ ...editingRequest, description: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </label>
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
              <button onClick={() => setEditingRequest(null)} disabled={workingId === editingRequest.id} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={() => void saveEdits(false)} disabled={workingId === editingRequest.id} className="inline-flex items-center gap-2 rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"><Save className="h-4 w-4" />Save changes</button>
              <button onClick={() => void saveEdits(true)} disabled={workingId === editingRequest.id} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"><Check className="h-4 w-4" />Save &amp; approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
