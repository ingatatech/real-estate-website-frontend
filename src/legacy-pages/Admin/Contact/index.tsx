'use client'

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Trash2,
  Mail,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  CheckCircle2,
  Clock,
  Send,
  Archive,
  RefreshCw,
} from 'lucide-react';
import { adminApi } from '../../../services/api';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface ApiResponse {
  success?: boolean;
  data?: ContactMessage[];
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
  return parsedDate.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [replySubject, setReplySubject] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyError, setReplyError] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const limit = 15;

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await adminApi.getContactMessages({
        page,
        limit,
      });

      const result = response as ApiResponse;
      const messageList = result.data ?? [];

      setMessages(messageList);

      if (result.pagination?.totalPages) {
        setTotalPages(result.pagination.totalPages);
        setTotalCount(result.pagination.total);
      } else {
        setTotalPages(1);
        setTotalCount(messageList.length);
      }
    } catch (err) {
      console.error('Failed to load contact messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contact messages.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [page]);

  const filteredMessages = useMemo(() => {
    return messages.filter((item) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        (item.subject && item.subject.toLowerCase().includes(query)) ||
        item.message.toLowerCase().includes(query) ||
        (item.phone && item.phone.toLowerCase().includes(query));

      const matchesStatus = !statusFilter || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [messages, searchTerm, statusFilter]);

  const unreadCount = useMemo(() => {
    return messages.filter((m) => m.status === 'NEW' || m.status === 'UNREAD').length;
  }, [messages]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      await adminApi.deleteContactMessage(deleteId);
      setDeleteId(null);
      if (selectedMessage?.id === deleteId) {
        setSelectedMessage(null);
      }
      await fetchMessages();
    } catch (err) {
      console.error('Failed to delete contact message:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete contact message.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await adminApi.updateContactMessage(id, { status: newStatus });
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );
      if (selectedMessage?.id === id) {
        setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error('Failed to update message status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update message status.');
    }
  };

  const handleOpenMessage = async (msg: ContactMessage) => {
    setSelectedMessage(msg);
    if (msg.status === 'NEW' || msg.status === 'UNREAD') {
      try {
        await adminApi.updateContactMessage(msg.id, { status: 'READ' });
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status: 'READ' } : m))
        );
        setSelectedMessage((prev) => (prev ? { ...prev, status: 'READ' } : null));
      } catch {
        // Silently continue reading
      }
    }
  };

  const openReplyComposer = () => {
    if (!selectedMessage) return;
    setReplySubject(selectedMessage.subject ? `Re: ${selectedMessage.subject}` : 'Response to your inquiry at Ingata Real Estate');
    setReplyMessage('');
    setReplyError('');
    setIsReplying(true);
  };

  const handleSendReply = async () => {
    if (!selectedMessage) return;
    try {
      setIsSendingReply(true);
      setReplyError('');
      const response = await adminApi.replyToContactMessage(selectedMessage.id, {
        subject: replySubject,
        message: replyMessage,
      }) as { data?: ContactMessage };
      const updatedMessage = response.data ?? { ...selectedMessage, status: 'RESPONDED' };
      setMessages((prev) => prev.map((item) => (item.id === updatedMessage.id ? updatedMessage : item)));
      setSelectedMessage(updatedMessage);
      setIsReplying(false);
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Could not send the reply.');
    } finally {
      setIsSendingReply(false);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <Mail className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Contact Messages</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Messages and general inquiries submitted through the website Contact Us page.
          </p>
        </div>

        <button
          onClick={fetchMessages}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Error</p>
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
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, subject, or message content..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="READ">Read</option>
            <option value="RESPONDED">Responded</option>
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

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Sender
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Subject & Preview
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
                    Loading messages...
                  </td>
                </tr>
              ) : filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Mail className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-3 font-medium text-slate-700">No contact messages found</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Messages sent via the website Contact page will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMessages.map((item) => {
                  const isUnread = item.status === 'NEW' || item.status === 'UNREAD';
                  return (
                    <tr
                      key={item.id}
                      className={`transition hover:bg-slate-50/80 ${
                        isUnread ? 'bg-emerald-50/30 font-medium' : ''
                      }`}
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-2">
                          {isUnread && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                          )}
                          <div>
                            <div className="font-semibold text-slate-900">{item.name}</div>
                            <div className="text-xs text-slate-500">{item.email}</div>
                            {item.phone && (
                              <div className="text-xs text-slate-400">{item.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-md">
                        {item.subject && (
                          <div className="text-xs font-semibold text-slate-800 line-clamp-1 mb-0.5">
                            {item.subject}
                          </div>
                        )}
                        <p className="line-clamp-2 text-sm text-slate-600 font-normal">
                          {item.message}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <select
                          value={item.status || 'NEW'}
                          onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                          <option value="NEW">New</option>
                          <option value="READ">Read</option>
                          <option value="RESPONDED">Responded</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenMessage(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-600 shadow-sm hover:bg-rose-50"
                            title="Delete message"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
        {!isLoading && filteredMessages.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages} ({totalCount} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedMessage.subject || 'Website Contact Message'}
                  </h2>
                  <StatusBadge status={selectedMessage.status} />
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  Received {formatDate(selectedMessage.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">Sender Name</span>
                  <p className="font-semibold text-slate-900">{selectedMessage.name}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">Email Address</span>
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="text-emerald-600 hover:underline font-medium"
                    >
                      {selectedMessage.email}
                    </a>
                  </p>
                </div>
                {selectedMessage.phone && (
                  <div>
                    <span className="text-xs font-semibold uppercase text-slate-400">Phone Number</span>
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <a
                        href={`tel:${selectedMessage.phone}`}
                        className="text-slate-700 hover:underline"
                      >
                        {selectedMessage.phone}
                      </a>
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">Status</span>
                  <div className="mt-0.5">
                    <select
                      value={selectedMessage.status}
                      onChange={(e) =>
                        handleStatusUpdate(selectedMessage.id, e.target.value)
                      }
                      className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700"
                    >
                      <option value="NEW">New</option>
                      <option value="READ">Read</option>
                      <option value="RESPONDED">Responded</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase text-slate-400">Message Content</span>
                <div className="mt-1.5 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedMessage.message}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusUpdate(selectedMessage.id, 'RESPONDED')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Mark as Responded
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusUpdate(selectedMessage.id, 'ARCHIVED')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Archive className="h-3.5 w-3.5 text-slate-500" /> Archive
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={openReplyComposer}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  <Send className="h-3.5 w-3.5" /> Reply via Email
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Composer Modal */}
      {selectedMessage && isReplying && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Reply via Email</h2>
                <p className="mt-1 text-sm text-slate-500">To: {selectedMessage.email}</p>
              </div>
              <button type="button" onClick={() => setIsReplying(false)} disabled={isSendingReply} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 py-5">
              {replyError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{replyError}</p>}
              <label className="block text-sm font-medium text-slate-700">Subject
                <input value={replySubject} onChange={(event) => setReplySubject(event.target.value)} maxLength={255} disabled={isSendingReply} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Message
                <textarea value={replyMessage} onChange={(event) => setReplyMessage(event.target.value)} maxLength={10000} rows={8} disabled={isSendingReply} className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50" placeholder="Write your response…" />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setIsReplying(false)} disabled={isSendingReply} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={handleSendReply} disabled={isSendingReply || !replySubject.trim() || !replyMessage.trim()} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                <Send className="h-4 w-4" /> {isSendingReply ? 'Sending…' : 'Send reply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Delete contact message?</h2>
                <p className="mt-1 text-sm text-slate-500">
                  This action cannot be undone. The message will be permanently removed from the system.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
