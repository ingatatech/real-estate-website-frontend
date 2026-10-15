'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Eye, MousePointerClick, MessageSquare, Calendar, Search, Building2, TrendingUp, Download, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';
import { adminApi } from '../../../services/api';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface AnalyticsData {
  period: string;
  dateRange: { start: Date; end: Date };
  previousDateRange: { start: Date; end: Date };
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
  comparison: {
    pageViewsChange: number;
    propertyViewsChange: number;
    clicksChange: number;
    inquiriesChange: number;
    viewingsChange: number;
  };
  clickBreakdown: {
    CTA: number;
    PHONE: number;
    EMAIL: number;
    WHATSAPP: number;
    LINK: number;
    BUTTON: number;
  };
  pageViewTrend: Array<{ date: string; count: number }>;
  popularProperties: Array<{ propertyId: string; title: string; viewCount: number }>;
}

interface FunnelData {
  period: string;
  dateRange: { start: Date; end: Date };
  funnel: Array<{
    stage: string;
    count: number;
    rate: number;
  }>;
}

interface DeviceData {
  period: string;
  dateRange: { start: Date; end: Date };
  breakdown: Record<string, number>;
}

interface TrafficData {
  period: string;
  dateRange: { start: Date; end: Date };
  sources: Array<{ source: string; count: number }>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export default function Analytics() {
  const [period, setPeriod] = useState('30days');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [summaryResponse, deviceResponse, trafficResponse, funnelResponse] = await Promise.all([
        adminApi.getAnalyticsSummary(period),
        adminApi.getDeviceBreakdown(period),
        adminApi.getTrafficSources(period),
        adminApi.getConversionFunnel(period),
      ]);

      const summary = summaryResponse as ApiResponse<AnalyticsData>;
      const devices = deviceResponse as ApiResponse<DeviceData>;
      const traffic = trafficResponse as ApiResponse<TrafficData>;
      const funnel = funnelResponse as ApiResponse<FunnelData>;
      if (!summary?.success || !summary.data || !devices?.success || !devices.data || !traffic?.success || !traffic.data || !funnel?.success || !funnel.data) {
        throw new Error('The analytics service returned an incomplete response.');
      }
      setAnalytics({ ...summary.data, pageViewTrend: summary.data.pageViewTrend || [], popularProperties: summary.data.popularProperties || [] });
      setDeviceData({ ...devices.data, breakdown: devices.data.breakdown || {} });
      setTrafficData({ ...traffic.data, sources: traffic.data.sources || [] });
      setFunnelData({ ...funnel.data, funnel: funnel.data.funnel || [] });
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const response = await adminApi.exportAnalyticsCsv(period);
      const blob = new Blob([response as unknown as string], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${period}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      setError('Failed to export analytics data');
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, [period]);

  const pageViewTrendOptions = {
    chart: {
      type: 'line' as const,
      height: 350,
      toolbar: { show: false },
    },
    series: [
      {
        name: 'Page Views',
        data: (analytics?.pageViewTrend || []).map((item) => item.count),
      },
    ],
    xaxis: {
      categories: (analytics?.pageViewTrend || []).map((item) => new Date(item.date).toLocaleDateString()),
      labels: { rotate: -45 },
    },
    yaxis: {
      title: { text: 'Views' },
    },
    colors: ['#10B981'],
    stroke: { curve: 'smooth' as const, width: 2 },
    fill: {
      type: 'gradient' as const,
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
  };

  const deviceBreakdownOptions = {
    chart: {
      type: 'donut' as const,
      height: 350,
    },
    series: Object.values(deviceData?.breakdown || {}),
    labels: Object.keys(deviceData?.breakdown || {}),
    colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
    legend: {
      position: 'bottom' as const,
    },
  };

  const trafficSourcesOptions = {
    chart: {
      type: 'bar' as const,
      height: 350,
      toolbar: { show: false },
    },
    series: [
      {
        name: 'Visits',
        data: (trafficData?.sources || []).map((item) => item.count),
      },
    ],
    xaxis: {
      categories: (trafficData?.sources || []).map((item) => item.source),
      labels: { rotate: -45 },
    },
    yaxis: {
      title: { text: 'Visits' },
    },
    colors: ['#10B981'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%',
      },
    },
  };

  const clickBreakdownOptions = {
    chart: {
      type: 'bar' as const,
      height: 350,
      toolbar: { show: false },
    },
    series: [
      {
        name: 'Clicks',
        data: analytics?.clickBreakdown ? Object.values(analytics.clickBreakdown) : [],
      },
    ],
    xaxis: {
      categories: analytics?.clickBreakdown ? Object.keys(analytics.clickBreakdown) : [],
    },
    yaxis: {
      title: { text: 'Clicks' },
    },
    colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%',
      },
    },
  };

  const funnelOptions = {
    chart: {
      type: 'bar' as const,
      height: 350,
      toolbar: { show: false },
    },
    series: [
      {
        name: 'Count',
        data: (funnelData?.funnel || []).map((item) => item.count),
      },
    ],
    xaxis: {
      categories: (funnelData?.funnel || []).map((item) => item.stage),
    },
    yaxis: {
      title: { text: 'Count' },
    },
    colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '50%',
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number, opts: any) => {
        const item = (funnelData?.funnel || [])[opts.dataPointIndex];
        return item ? `${item.rate.toFixed(1)}%` : '0%';
      },
    },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 text-rose-600" />
          <div>
            <h2 className="font-semibold text-rose-900">Failed to load analytics</h2>
            <p className="mt-1 text-sm text-rose-700">{error}</p>
            <button
              onClick={() => void loadAnalytics()}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-rose-700 shadow-sm ring-1 ring-rose-200 hover:bg-rose-100"
            >
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      label: 'Page Views',
      value: analytics?.summary?.totalPageViews || 0,
      change: analytics?.comparison?.pageViewsChange || 0,
      icon: Eye,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Property Views',
      value: analytics?.summary?.totalPropertyViews || 0,
      change: analytics?.comparison?.propertyViewsChange || 0,
      icon: Building2,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Click Events',
      value: analytics?.summary?.totalClicks || 0,
      change: analytics?.comparison?.clicksChange || 0,
      icon: MousePointerClick,
      color: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Inquiries',
      value: analytics?.summary?.totalInquiries || 0,
      change: analytics?.comparison?.inquiriesChange || 0,
      icon: MessageSquare,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Viewing Requests',
      value: analytics?.summary?.totalViewings || 0,
      change: analytics?.comparison?.viewingsChange || 0,
      icon: Calendar,
      color: 'bg-rose-50 text-rose-600',
    },
    {
      label: 'Property Searches',
      value: analytics?.summary?.totalSearches || 0,
      change: 0,
      icon: Search,
      color: 'bg-teal-50 text-teal-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Track website performance and user engagement</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
          </select>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={() => void loadAnalytics()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">
        {summaryCards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-500">{card.label}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{card.value.toLocaleString()}</p>
                <div className="mt-1 flex items-center gap-1 text-xs">
                  {card.change !== 0 && (
                    <>
                      {card.change > 0 ? (
                        <span className="flex items-center gap-0.5 text-emerald-600">
                          <ArrowUp className="h-3 w-3" />
                          {card.change.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-rose-600">
                          <ArrowDown className="h-3 w-3" />
                          {Math.abs(card.change).toFixed(1)}%
                        </span>
                      )}
                      <span className="text-slate-400">vs prev. period</span>
                    </>
                  )}
                </div>
              </div>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </span>
            </div>
          </article>
        ))}
      </section>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Page View Trend */}
        <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Page View Trend</h2>
            <p className="text-sm text-slate-500">Daily page views over selected period</p>
          </div>
          {analytics && <Chart options={pageViewTrendOptions} type="line" height={350} />}
        </article>

        {/* Device Breakdown */}
        <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Device Breakdown</h2>
            <p className="text-sm text-slate-500">Traffic by device type</p>
          </div>
          {deviceData && <Chart options={deviceBreakdownOptions} type="donut" height={350} />}
        </article>

        {/* Traffic Sources */}
        <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Traffic Sources</h2>
            <p className="text-sm text-slate-500">Visitors by source</p>
          </div>
          {trafficData && <Chart options={trafficSourcesOptions} type="bar" height={350} />}
        </article>

        {/* Click Events Breakdown */}
        <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Click Events</h2>
            <p className="text-sm text-slate-500">Button and link clicks by type</p>
          </div>
          {analytics && <Chart options={clickBreakdownOptions} type="bar" height={350} />}
        </article>

        {/* Conversion Funnel */}
        <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Conversion Funnel</h2>
            <p className="text-sm text-slate-500">User journey from page views to inquiries</p>
          </div>
          {funnelData && <Chart options={funnelOptions} type="bar" height={350} />}
        </article>
      </div>

      {/* Popular Properties */}
      <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Popular Properties</h2>
          <p className="text-sm text-slate-500">Most viewed properties in this period</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Property</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Views</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {analytics?.popularProperties && analytics.popularProperties.length > 0 ? (
                analytics.popularProperties.map((property) => {
                  const totalViews = analytics.popularProperties!.reduce((sum, p) => sum + p.viewCount, 0);
                  const share = totalViews > 0 ? ((property.viewCount / totalViews) * 100).toFixed(1) : '0';
                  return (
                    <tr key={property.propertyId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{property.title}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">{property.viewCount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">{share}%</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">No property views recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
