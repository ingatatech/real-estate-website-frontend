'use client'

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from '@/navigation/legacy-router';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bell,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Home,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { adminApi } from '../../../services/api';
import { AnalyticsSummaryCards } from '../../../components/admin/AnalyticsSummaryCards';

interface DashboardStats {
  totalProperties: number;
  publishedProperties: number;
  totalAgents: number;
  totalUsers: number;
  pendingInquiries: number;
  totalInquiries: number;
  pendingViewings: number;
  totalViewings: number;
  pendingValuations: number;
}

interface RecentProperty {
  id: string;
  title: string;
  propertyType: string;
  transactionType: string;
  price: string | null;
  currency: string | null;
  status: string;
  publicationStatus: string;
  createdAt: string;
  location?: string | null;
  agent: { name: string } | null;
  propertyImages?: { imageUrl?: string; image_url?: string; isPrimary?: boolean; displayOrder?: number }[] | null;
}

interface RecentInquiry {
  id: string;
  name: string;
  email: string;
  inquiry: string;
  status: string;
  createdAt: string;
  property: { title: string; slug: string } | null;
}

interface DashboardData {
  stats: DashboardStats;
  recentProperties: RecentProperty[];
  recentInquiries: RecentInquiry[];
}

interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

interface PropertiesResponse {
  data?: RecentProperty[];
}

interface ListingRequest {
  status?: string;
}

interface ListingRequestsResponse {
  data?: ListingRequest[];
}

const formatLabel = (value?: string | null) => {
  if (!value) return '—';
  return value.replace(/[_-]/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatPrice = (price: string | number | null, currency: string | null) => {
  if (price === null || price === undefined || price === '') return 'Price on request';
  const amount = Number(price);
  if (!Number.isFinite(amount)) return 'Price on request';
  const code = currency || 'RWF';
  return `${code} ${amount.toLocaleString()}`;
};

const formatDate = (date: string) => {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const statusClasses: Record<string, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  SOLD: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  RENTED: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  LEASED: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  SUBMITTED: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  DRAFT: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  ARCHIVED: 'bg-slate-100 text-slate-500 ring-slate-500/10',
  CONFIRMED: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  COMPLETED: 'bg-teal-50 text-teal-700 ring-teal-600/15',
  CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-600/15',
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`inline-flex whitespace-nowrap items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusClasses[status.toUpperCase()] || 'bg-slate-100 text-slate-600 ring-slate-500/10'}`}>
    {formatLabel(status)}
  </span>
);

const StatCard = ({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof Home;
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [propertyDetails, setPropertyDetails] = useState<RecentProperty[]>([]);
  const [pendingListingRequests, setPendingListingRequests] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [supportError, setSupportError] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30days');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    setSupportError(false);
    setPendingListingRequests(null);
    setSupportLoading(true);
    try {
      const response = await adminApi.getDashboard() as DashboardResponse;
      if (!response?.data?.stats) throw new Error('The dashboard response was incomplete.');
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the admin dashboard.');
      setLoading(false);
      setSupportLoading(false);
      return;
    }
    setLoading(false);

    const [propertiesResult, requestsResult] = await Promise.allSettled([
      adminApi.getProperties({ page: 1, limit: 5 }) as Promise<PropertiesResponse>,
      adminApi.getListingRequests() as Promise<ListingRequestsResponse>,
    ]);
    if (propertiesResult.status === 'fulfilled') {
      setPropertyDetails(propertiesResult.value.data || []);
    } else {
      setSupportError(true);
    }
    if (requestsResult.status === 'fulfilled') {
      setPendingListingRequests(
        (requestsResult.value.data || []).filter((request) =>
          ['PENDING', 'SUBMITTED'].includes((request.status || '').toUpperCase()),
        ).length,
      );
    } else {
      setSupportError(true);
    }
    setSupportLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const recentProperties = useMemo(() => {
    if (!data) return [];
    const propertyDetailsById = new Map(propertyDetails.map((property) => [property.id, property]));
    return data.recentProperties.map((property) => ({
      ...property,
      ...(propertyDetailsById.get(property.id) || {}),
    }));
  }, [data, propertyDetails]);

  const typeMix = useMemo(() => {
    const counts = new Map<string, number>();
    recentProperties.forEach((property) => {
      const type = formatLabel(property.propertyType);
      counts.set(type, (counts.get(type) || 0) + 1);
    });
    return [...counts.entries()].sort((left, right) => right[1] - left[1]).slice(0, 4);
  }, [recentProperties]);

  if (loading) {
    return (
      <div className="space-y-6" aria-label="Loading admin dashboard">
        <div className="h-28 animate-pulse rounded-3xl bg-slate-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:p-6" role="alert">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div className="flex-1">
            <h2 className="font-semibold text-rose-900">Dashboard couldn’t load</h2>
            <p className="mt-1 text-sm text-rose-700">{error || 'Please try again in a moment.'}</p>
            <button onClick={() => void loadDashboard()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-rose-700 shadow-sm ring-1 ring-rose-200 hover:bg-rose-100">
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = data.stats;
  const notificationCount = stats.pendingInquiries + stats.pendingViewings + stats.pendingValuations + (pendingListingRequests || 0);
  const inventoryMaximum = Math.max(stats.totalProperties, 1);
  const publishedWidth = Math.min((stats.publishedProperties / inventoryMaximum) * 100, 100);
  const unpublishedCount = Math.max(stats.totalProperties - stats.publishedProperties, 0);

  const statCards = [
    { label: 'Total Properties', value: stats.totalProperties, detail: `${stats.publishedProperties} published`, icon: Home, tone: 'bg-blue-50 text-blue-600' },
    { label: 'Active Agents', value: stats.totalAgents, detail: 'On the Ingata team', icon: Users, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Pending Inquiries', value: stats.pendingInquiries, detail: `${stats.totalInquiries} inquiries received`, icon: MessageSquare, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Pending Viewings', value: stats.pendingViewings, detail: `${stats.totalViewings} viewing requests`, icon: Calendar, tone: 'bg-violet-50 text-violet-600' },
    { label: 'Pending Valuations', value: stats.pendingValuations, detail: 'Awaiting review', icon: TrendingUp, tone: 'bg-rose-50 text-rose-600' },
    { label: 'Total Users', value: stats.totalUsers, detail: 'Registered accounts', icon: CheckCircle, tone: 'bg-teal-50 text-teal-600' },
  ];

  const actionItems = [
    { label: 'Property requests', count: pendingListingRequests, hint: 'Review submitted listings', to: '/admin/listings', icon: Building2, tone: 'bg-blue-50 text-blue-700' },
    { label: 'Inquiries', count: stats.pendingInquiries, hint: 'Respond to new leads', to: '/admin/inquiries', icon: MessageSquare, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Viewings', count: stats.pendingViewings, hint: 'Review viewing requests', to: '/admin/viewings', icon: Calendar, tone: 'bg-violet-50 text-violet-700' },
    { label: 'Valuations', count: stats.pendingValuations, hint: 'Review valuation requests', to: '/admin/valuations', icon: TrendingUp, tone: 'bg-rose-50 text-rose-700' },
  ];

  return (
    <main className="space-y-6 pb-8 sm:space-y-7">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-5 py-6 text-white shadow-lg sm:px-8 sm:py-7">
        <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full border-[36px] border-white/5" />
        <div className="pointer-events-none absolute -bottom-28 right-32 h-52 w-52 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-200">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">Here’s the latest overview of your Ingata Real Estate activity.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/admin/inquiries" aria-label={`${notificationCount} items require attention`} className="relative grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold">{notificationCount > 99 ? '99+' : notificationCount}</span>}
            </Link>
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-300 font-bold text-emerald-950">
                {(user?.name || user?.email || 'A').slice(0, 1).toUpperCase()}
              </span>
              <div className="max-w-40">
                <p className="truncate text-sm font-semibold">{user?.name || 'Administrator'}</p>
                <p className="truncate text-xs capitalize text-slate-300">{formatLabel(user?.role)}</p>
              </div>
            </div>
            <Link to="/admin/properties/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-bold text-emerald-950 shadow-sm transition hover:bg-emerald-300">
              <Plus className="h-4 w-4" /> Add Property
            </Link>
          </div>
        </div>
      </header>

      {supportError && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Some supplementary dashboard details could not be loaded. Core statistics are up to date.
        </div>
      )}

      <section aria-label="Key performance indicators" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 2xl:grid-cols-6">
        {statCards.map((card) => <StatCard key={card.label} {...card} />)}
      </section>

      <AnalyticsSummaryCards period={analyticsPeriod} onPeriodChange={setAnalyticsPeriod} />

      <section className="grid gap-6 xl:grid-cols-5">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 xl:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Portfolio health</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">Property performance</h2>
              <p className="mt-1 text-sm text-slate-500">Publication status across your current inventory.</p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Activity className="h-5 w-5" /></span>
          </div>
          <div className="mt-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-bold tracking-tight text-slate-900">{stats.totalProperties.toLocaleString()}</p>
                <p className="mt-1 text-sm text-slate-500">properties in portfolio</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-700">{stats.totalProperties ? Math.round((stats.publishedProperties / stats.totalProperties) * 100) : 0}%</p>
                <p className="text-xs text-slate-500">published</p>
              </div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${stats.publishedProperties} of ${stats.totalProperties} properties published`}>
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${publishedWidth}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50/80 p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-500" />Published</div>
                <p className="mt-1 text-xl font-bold text-slate-900">{stats.publishedProperties.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600"><span className="h-2 w-2 rounded-full bg-slate-400" />Other statuses</div>
                <p className="mt-1 text-xl font-bold text-slate-900">{unpublishedCount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">At a glance</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">Recent listing mix</h2>
              <p className="mt-1 text-sm text-slate-500">Property types in the latest listings.</p>
            </div>
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          {typeMix.length ? (
            <div className="mt-5 space-y-4">
              {typeMix.map(([type, count], index) => {
                const maxTypeCount = Math.max(...typeMix.map(([, total]) => total));
                const width = (count / maxTypeCount) * 100;
                return (
                  <div key={type}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-slate-700">{type}</span>
                      <span className="shrink-0 font-semibold text-slate-900">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500'][index]}`} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
              <p className="border-t border-slate-100 pt-3 text-xs text-slate-400">Based on up to five most recent properties.</p>
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-slate-50 px-4 py-8 text-center">
              <Building2 className="mx-auto h-7 w-7 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-600">No property data yet</p>
              <p className="mt-1 text-xs text-slate-400">Listing types will appear here as properties are added.</p>
            </div>
          )}
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Stay on top of it</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Action required</h2>
          </div>
          <Link to="/admin/listings" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800">Review requests <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actionItems.map((item) => (
            <Link key={item.label} to={item.to} className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 transition hover:border-emerald-300 hover:bg-emerald-50/40">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.tone}`}><item.icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-800">{item.label}</span>
                <span className="block truncate text-xs text-slate-500">{item.hint}</span>
              </span>
              <span className="text-lg font-bold text-slate-900">{item.count === null && supportLoading ? '…' : (item.count ?? '—')}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-5">
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm xl:col-span-3">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-bold text-slate-900">Recent Properties</h2>
              <p className="mt-0.5 text-xs text-slate-500">Latest additions to your portfolio</p>
            </div>
            <Link to="/admin/properties" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800">View all <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {recentProperties.length ? (
            <div className="divide-y divide-slate-100">
              {recentProperties.map((property) => {
                const primaryImage = [...(property.propertyImages || [])].sort((a, b) =>
                  Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)) || (a.displayOrder || 0) - (b.displayOrder || 0),
                )[0];
                const imageUrl = primaryImage?.imageUrl || primaryImage?.image_url;
                return (
                  <article key={property.id} className="flex min-w-0 items-center gap-3 px-4 py-4 transition hover:bg-slate-50/80 sm:gap-4 sm:px-6">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="h-14 w-16 shrink-0 rounded-xl bg-slate-100 object-cover sm:h-16 sm:w-20" />
                    ) : (
                      <span className="grid h-14 w-16 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-400 sm:h-16 sm:w-20"><Home className="h-6 w-6" /></span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{property.title}</p>
                      <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-xs text-slate-500">
                        <MapPin className="h-3 w-3 shrink-0" />{property.location || 'Location not specified'}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">{formatLabel(property.propertyType)} · {formatLabel(property.transactionType)} · {property.agent?.name || 'Unassigned'}</p>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-sm font-bold text-slate-800">{formatPrice(property.price, property.currency)}</p>
                      <div className="mt-1"><StatusBadge status={property.publicationStatus || property.status} /></div>
                    </div>
                    <div className="shrink-0 sm:hidden"><StatusBadge status={property.publicationStatus || property.status} /></div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Home className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-700">No properties to show</p>
              <p className="mt-1 text-xs text-slate-500">Create your first listing to start building your portfolio.</p>
              <Link to="/admin/properties/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Property</Link>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-bold text-slate-900">Recent Inquiries</h2>
              <p className="mt-0.5 text-xs text-slate-500">Latest customer conversations</p>
            </div>
            <Link to="/admin/inquiries" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800">View all <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {data.recentInquiries.length ? (
            <div className="divide-y divide-slate-100">
              {data.recentInquiries.map((inquiry) => (
                <article key={inquiry.id} className="flex items-start gap-3 px-5 py-4 transition hover:bg-slate-50/80 sm:px-6">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-700"><MessageSquare className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{inquiry.name || 'Customer'}</p>
                      <StatusBadge status={inquiry.status} />
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-600">{inquiry.property?.title || 'General inquiry'}</p>
                    {inquiry.inquiry && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{inquiry.inquiry}</p>}
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-400"><Clock className="h-3 w-3" />{formatDate(inquiry.createdAt)}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <MessageSquare className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-700">No inquiries yet</p>
              <p className="mt-1 text-xs text-slate-500">New customer inquiries will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
