'use client';

import { useEffect, useState } from 'react';
import { Eye, MousePointerClick, MessageSquare, Calendar, Building2, Search, TrendingUp } from 'lucide-react';
import { adminApi } from '../../services/api';

interface AnalyticsData {
  summary: {
    totalPageViews: number;
    totalPropertyViews: number;
    totalClicks: number;
    totalInquiries: number;
    totalViewings: number;
    totalListings: number;
    totalContacts: number;
    totalSearches: number;
  };
  comparison?: {
    pageViewsChange: number;
    propertyViewsChange: number;
    clicksChange: number;
    inquiriesChange: number;
    viewingsChange: number;
  };
  clickBreakdown?: {
    CTA: number;
    PHONE: number;
    EMAIL: number;
    WHATSAPP: number;
    LINK: number;
    BUTTON: number;
  };
}

const AnalyticsStatCard = ({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof Eye;
  tone: string;
}) => (
  <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-slate-500 sm:text-sm">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{value.toLocaleString()}</p>
        <p className="mt-1 truncate text-xs text-slate-500">{detail}</p>
      </div>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-11 sm:w-11 ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    </div>
  </article>
);

export function AnalyticsSummaryCards({ period = '30days', onPeriodChange }: { period?: string; onPeriodChange?: (period: string) => void }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getAnalyticsSummary(period) as { success: boolean; data: AnalyticsData };
        if (response?.success && response?.data) {
          setAnalytics(response.data);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    void loadAnalytics();
  }, [period]);

  if (loading) {
    return (
      <section aria-label="Analytics loading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Analytics Overview</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </section>
    );
  }

  if (error || !analytics) {
    return (
      <section aria-label="Analytics error" className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <p className="text-sm text-rose-700">{error || 'Analytics data unavailable'}</p>
      </section>
    );
  }

  const cards = [
    {
      label: 'Page Views',
      value: analytics?.summary?.totalPageViews || 0,
      detail: 'Total website visits',
      icon: Eye,
      tone: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Property Views',
      value: analytics?.summary?.totalPropertyViews || 0,
      detail: 'Property detail views',
      icon: Building2,
      tone: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Click Events',
      value: analytics?.summary?.totalClicks || 0,
      detail: 'CTA, phone, email clicks',
      icon: MousePointerClick,
      tone: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Inquiries',
      value: analytics?.summary?.totalInquiries || 0,
      detail: 'Property inquiries',
      icon: MessageSquare,
      tone: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Viewing Requests',
      value: analytics?.summary?.totalViewings || 0,
      detail: 'Scheduled viewings',
      icon: Calendar,
      tone: 'bg-rose-50 text-rose-600',
    },
    {
      label: 'Property Searches',
      value: analytics?.summary?.totalSearches || 0,
      detail: 'Search queries',
      icon: Search,
      tone: 'bg-teal-50 text-teal-600',
    },
  ];

  return (
    <section aria-label="Analytics overview" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Analytics Overview</h2>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => {
              if (onPeriodChange) {
                onPeriodChange(e.target.value);
              }
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">
        {cards.map((card) => (
          <AnalyticsStatCard key={card.label} {...card} />
        ))}
      </div>
    </section>
  );
}
