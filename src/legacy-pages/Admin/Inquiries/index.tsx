'use client'

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Trash2,
  Inbox,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  Save,
} from 'lucide-react';
import { adminApi } from '../../../services/api';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  inquiry: string;
  status?: string;
  property?: { title: string } | null;
  agent?: { id: string; name: string; email?: string | null } | null;
  privateNotes?: string;
  nextFollowUpDate?: string | null;
  createdAt: string;
}

interface Agent {
  id: string;
  name: string;
  email?: string | null;
}

interface ApiResponse {
  success?: boolean;
  data?: Inquiry[];
  inquiries?: Inquiry[];
  total?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

const formatDate = (date: string) => {
  if (!date) return '—';
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return '—';
  return parsedDate.toLocaleDateString();
};

export default function Inquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [workflowSaving, setWorkflowSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 10;

  const fetchInquiries = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await adminApi.getInquiries({
        page,
        limit,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      });

      const result = response as ApiResponse;
      const inquiryData = result.data ?? result.inquiries ?? [];

      setInquiries(inquiryData);

      if (result.pagination?.totalPages) {
        setTotalPages(result.pagination.totalPages);
      } else if (result.total !== undefined) {
        setTotalPages(Math.max(1, Math.ceil(result.total / limit)));
      } else {
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to load inquiries:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inquiries.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [page, searchTerm, statusFilter]);

  useEffect(() => {
    adminApi.getAgents()
      .then((response: unknown) => {
        const result = response as { data?: Agent[]; agents?: Agent[] };
        setAgents(result.data ?? result.agents ?? []);
      })
      .catch(() => setAgents([]));
  }, []);

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inquiry.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [inquiries, searchTerm, statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      await adminApi.deleteAdminInquiry(deleteId);
      setDeleteId(null);
      if (selectedInquiry?.id === deleteId) {
        setSelectedInquiry(null);
      }
      await fetchInquiries();
    } catch (err) {
      console.error('Failed to delete inquiry:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete inquiry.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await adminApi.updateInquiry(id, { status: newStatus });
      await fetchInquiries();
    } catch (err) {
      console.error('Failed to update inquiry status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update inquiry status.');
    }
  };

  const saveWorkflow = async () => {
    if (!selectedInquiry) return;
    try {
      setWorkflowSaving(true);
      setError('');
      const response = await adminApi.updateInquiry(selectedInquiry.id, {
        agentId: selectedInquiry.agent?.id || null,
        privateNotes: selectedInquiry.privateNotes || '',
        nextFollowUpDate: selectedInquiry.nextFollowUpDate || null,
      }) as { data?: Inquiry };
      if (response.data) setSelectedInquiry(response.data);
      await fetchInquiries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save the inquiry workflow.');
    } finally {
      setWorkflowSaving(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPage(1);
  };

  const hasFilters = searchTerm || statusFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Inbox className="h-6 w-6 text-emerald-600" />
          <h1 className="text-2xl font-bold text-slate-900">Inquiries</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Review leads, client messages, and property tour requests.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Unable to load inquiries</p>
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Search by client name, email, or inquiry..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="READ">Read</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
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

      {/* Inquiries Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Client
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Property / Message Preview
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Received
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                    Loading inquiries...
                  </td>
                </tr>
              ) : filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Inbox className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-3 font-medium text-slate-700">No inquiries found</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try changing your search or filter settings.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      {item.property && (
                        <div className="mb-1 text-xs font-semibold text-emerald-600">
                          Property: {item.property.title}
                        </div>
                      )}
                      <p className="line-clamp-1 text-sm text-slate-600">{item.inquiry}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <select
                        value={item.status || 'PENDING'}
                        onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="READ">Read</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedInquiry(item)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(item.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-600 shadow-sm hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filteredInquiries.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Inquiry Details</h2>
                <p className="text-xs text-slate-500">Received on {formatDate(selectedInquiry.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 py-4">
              <div>
                <span className="text-xs font-medium uppercase text-slate-400">Client Name</span>
                <p className="font-semibold text-slate-900">{selectedInquiry.name}</p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <span className="text-xs font-medium uppercase text-slate-400">Email</span>
                  <p className="flex items-center gap-1.5 text-sm text-slate-700">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <a href={`mailto:${selectedInquiry.email}`} className="text-emerald-600 hover:underline">
                      {selectedInquiry.email}
                    </a>
                  </p>
                </div>
                {selectedInquiry.phone && (
                  <div>
                    <span className="text-xs font-medium uppercase text-slate-400">Phone</span>
                    <p className="flex items-center gap-1.5 text-sm text-slate-700">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <a href={`tel:${selectedInquiry.phone}`} className="text-emerald-600 hover:underline">
                        {selectedInquiry.phone}
                      </a>
                    </p>
                  </div>
                )}
              </div>

              {selectedInquiry.property && (
                <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
                  <span className="font-semibold">Associated Property:</span> {selectedInquiry.property.title}
                </div>
              )}

              <div>
                <span className="text-xs font-medium uppercase text-slate-400">Inquiry</span>
                <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">
                  {selectedInquiry.inquiry}
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div>
                  <label htmlFor="assigned-agent" className="text-xs font-medium uppercase text-slate-400">Assigned agent</label>
                  <select
                    id="assigned-agent"
                    value={selectedInquiry.agent?.id || ''}
                    onChange={(event) => setSelectedInquiry((current) => current ? {
                      ...current,
                      agent: agents.find((agent) => agent.id === event.target.value) || null,
                    } : current)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">Unassigned</option>
                    {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}{agent.email ? ` — ${agent.email}` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="follow-up-date" className="text-xs font-medium uppercase text-slate-400">Follow-up date</label>
                  <input
                    id="follow-up-date"
                    type="date"
                    value={selectedInquiry.nextFollowUpDate ? selectedInquiry.nextFollowUpDate.slice(0, 10) : ''}
                    disabled={!selectedInquiry.agent}
                    onChange={(event) => setSelectedInquiry((current) => current ? { ...current, nextFollowUpDate: event.target.value || null } : current)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label htmlFor="internal-notes" className="text-xs font-medium uppercase text-slate-400">Internal notes</label>
                  <textarea
                    id="internal-notes"
                    rows={4}
                    maxLength={5000}
                    disabled={!selectedInquiry.agent}
                    value={selectedInquiry.privateNotes || ''}
                    onChange={(event) => setSelectedInquiry((current) => current ? { ...current, privateNotes: event.target.value } : current)}
                    placeholder={selectedInquiry.agent ? 'Notes visible to the assigned agent and administrators.' : 'Assign an agent to add notes.'}
                    className="mt-1 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => void saveWorkflow()}
                disabled={workflowSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> {workflowSaving ? 'Saving...' : 'Save workflow'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Delete inquiry?</h2>
                <p className="mt-1 text-sm text-slate-500">
                  This action cannot be undone. The client inquiry will be permanently deleted.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Inquiry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
