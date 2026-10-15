import React from 'react';

const statusClasses: Record<string, string> = {
  // Property status
  AVAILABLE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  SOLD: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  RENTED: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  LEASED: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  RESERVED: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  ARCHIVED: 'bg-slate-100 text-slate-500 ring-slate-500/10',
  DRAFT: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  UNDER_REVIEW: 'bg-orange-50 text-orange-700 ring-orange-600/15',
  
  // Inquiry status
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  SUBMITTED: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  NEW: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  READ: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  CONTACTED: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15',
  INTERESTED: 'bg-teal-50 text-teal-700 ring-teal-600/15',
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  RESOLVED: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  CLOSED: 'bg-slate-100 text-slate-500 ring-slate-500/10',
  
  // Viewing status
  CONFIRMED: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  COMPLETED: 'bg-teal-50 text-teal-700 ring-teal-600/15',
  CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  SCHEDULED: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15',
  
  // Valuation status
  PENDING_VALUATION: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  COMPLETED_VALUATION: 'bg-teal-50 text-teal-700 ring-teal-600/15',
};

const formatLabel = (value?: string | null) => {
  if (!value) return '—';
  return value.replace(/[_-]/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex whitespace-nowrap items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusClasses[status.toUpperCase()] || 'bg-slate-100 text-slate-600 ring-slate-500/10'} ${className}`}>
      {formatLabel(status)}
    </span>
  );
}
