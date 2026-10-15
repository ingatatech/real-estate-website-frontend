'use client'

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Home,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { portalApi } from '@/services/api';
import { RWANDA_DISTRICTS, getSectorsByDistrict } from '@/data/rwandaAdministrativeDivisions';

type Role = 'agent' | 'property_manager' | 'content_editor' | 'admin';
type IconType = typeof Home;
type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'datetime-local' | 'date' | 'time';

interface PortalField {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  initial?: string;
  options?: string[];
  loadOptions?: () => Promise<unknown>;
}

interface PortalItem {
  label: string;
  href: string;
  icon: IconType;
  load: () => Promise<unknown>;
  fields?: PortalField[];
  create?: (data: Record<string, unknown>) => Promise<unknown>;
  upload?: (file: File) => Promise<string>;
  update?: (id: string, data: Record<string, unknown>) => Promise<unknown>;
  remove?: (id: string) => Promise<unknown>;
  statusOptions?: string[];
  removeAction?: 'archive' | 'delete';
  approveStatus?: string;
  approvalFrom?: string[];
}

type PortalRecord = Record<string, unknown>;

const roleNames: Record<Role, string> = {
  agent: 'Agent',
  property_manager: 'Property Manager',
  content_editor: 'Content Editor',
  admin: 'Administrator',
};

const roleMenus: Record<Exclude<Role, 'admin'>, PortalItem[]> = {
  agent: [
    {
      label: 'My Properties', href: '/portal/agent/properties', icon: Home, load: portalApi.getAgentProperties,
      fields: [
        { key: 'title', label: 'Title', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'propertyType', label: 'Property type' }, { key: 'transactionType', label: 'Transaction type' },
        { key: 'categoryId', label: 'Category ID' }, { key: 'price', label: 'Price', type: 'number' },
        { key: 'currency', label: 'Currency' }, { key: 'location', label: 'Location' },
        { key: 'district', label: 'District' }, { key: 'sector', label: 'Sector' }, { key: 'address', label: 'Address' },
        { key: 'bedrooms', label: 'Bedrooms', type: 'number' }, { key: 'bathrooms', label: 'Bathrooms', type: 'number' },
        { key: 'size', label: 'Size', type: 'number' }, { key: 'sizeUnit', label: 'Size unit' },
        { key: 'furnishingStatus', label: 'Furnishing status' }, { key: 'parking', label: 'Parking spaces', type: 'number' },
        { key: 'amenities', label: 'Amenities (comma separated)' },
        { key: 'latitude', label: 'Latitude', type: 'number' }, { key: 'longitude', label: 'Longitude', type: 'number' },
        { key: 'area', label: 'Area' }, { key: 'locationDescription', label: 'Location description' },
        { key: 'nearbyLandmarks', label: 'Nearby landmarks' }, { key: 'neighborhood', label: 'Neighborhood' },
        { key: 'images', label: 'Property image/video URLs (one per line)', type: 'textarea' },
        { key: 'status', label: 'Availability', type: 'select', options: ['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'LEASED', 'ARCHIVED'] },
        { key: 'publicationStatus', label: 'Publication', type: 'select', options: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
        { key: 'isFeatured', label: 'Featured', type: 'checkbox' },
        { key: 'isNewDevelopment', label: 'New development', type: 'checkbox' },
      ],
      upload: async (file) => (await portalApi.uploadAgentPropertyMedia(file)).data.url,
      update: (id, data) => portalApi.updateAgentProperty(id, data),
      remove: portalApi.deleteAgentProperty,
      removeAction: 'archive',
      statusOptions: ['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'LEASED', 'ARCHIVED'],
    },
    {
      label: 'My Inquiries', href: '/portal/agent/inquiries', icon: MessageSquare, load: portalApi.getAgentInquiries,
      fields: [
        { key: 'status', label: 'Inquiry status', type: 'select', options: ['NEW', 'PENDING', 'READ', 'CONTACTED', 'INTERESTED', 'APPROVED', 'RESOLVED', 'CLOSED'] },
        { key: 'privateNotes', label: 'Private notes', type: 'textarea' },
        { key: 'nextFollowUpDate', label: 'Next follow-up', type: 'date' },
      ],
      update: async (id, data) => {
        const updates: Promise<unknown>[] = [];
        if (typeof data.status === 'string') updates.push(portalApi.updateAgentInquiryStatus(id, data.status));
        if (typeof data.privateNotes === 'string' || typeof data.nextFollowUpDate === 'string') {
          updates.push(portalApi.updateAgentInquiryFollowUp(id, {
            ...(typeof data.privateNotes === 'string' ? { notes: data.privateNotes } : {}),
            ...(typeof data.nextFollowUpDate === 'string' ? { nextFollowUpDate: data.nextFollowUpDate || null } : {}),
          }));
        }
        return Promise.all(updates);
      },
      approveStatus: 'APPROVED',
      approvalFrom: ['NEW', 'PENDING', 'READ', 'CONTACTED'],
    },
    {
      label: 'My Viewings', href: '/portal/agent/viewings', icon: CalendarDays, load: portalApi.getAgentViewings,
      fields: [
        { key: 'status', label: 'Viewing status', type: 'select', options: ['PENDING', 'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] },
        { key: 'preferredDate', label: 'Viewing date', type: 'date' },
        { key: 'preferredTime', label: 'Viewing time', type: 'time' },
      ],
      update: (id, data) => portalApi.updateAgentViewingStatus(id, data),
      approveStatus: 'CONFIRMED',
      approvalFrom: ['PENDING', 'SCHEDULED'],
    },
  ],
  property_manager: [
    {
      label: 'Properties', href: '/portal/property-manager/properties', icon: Home, load: portalApi.getManagedProperties,
      fields: [
        { key: 'title', label: 'Title', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'propertyType', label: 'Property type', type: 'select', options: ['RESIDENTIAL', 'COMMERCIAL', 'APARTMENTS', 'HOUSES', 'VILLA', 'LAND', 'OFFICES', 'WAREHOUSES', 'NEW_DEVELOPMENTS'], initial: 'RESIDENTIAL' },
        { key: 'transactionType', label: 'Transaction type', type: 'select', options: ['SALE', 'RENT', 'LEASE'], initial: 'SALE' },
        { key: 'agentId', label: 'Assign to agent', type: 'select', options: [''], loadOptions: portalApi.getAssignableAgents },
        { key: 'price', label: 'Price', type: 'number' },
        { key: 'currency', label: 'Currency', initial: 'RWF' },
        { key: 'location', label: 'Location' },
        { key: 'district', label: 'District' },
        { key: 'sector', label: 'Sector' },
        { key: 'address', label: 'Street address' },
        { key: 'neighborhood', label: 'Neighborhood' },
        { key: 'area', label: 'Area' },
        { key: 'latitude', label: 'Latitude', type: 'number' },
        { key: 'longitude', label: 'Longitude', type: 'number' },
        { key: 'bedrooms', label: 'Bedrooms', type: 'number' },
        { key: 'bathrooms', label: 'Bathrooms', type: 'number' },
        { key: 'parking', label: 'Parking spaces', type: 'number' },
        { key: 'size', label: 'Property size', type: 'number' },
        { key: 'sizeUnit', label: 'Size unit', type: 'select', options: ['sqm', 'acres', 'hectares'], initial: 'sqm' },
        { key: 'furnishingStatus', label: 'Furnishing', type: 'select', options: ['', 'FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED'], initial: '' },
        { key: 'locationDescription', label: 'Location description', type: 'textarea' },
        { key: 'nearbyLandmarks', label: 'Nearby landmarks' },
        { key: 'amenities', label: 'Amenities (comma separated)' },
        { key: 'images', label: 'Property image URLs (one per line)', type: 'textarea' },
        { key: 'status', label: 'Availability', type: 'select', options: ['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'LEASED', 'ARCHIVED'], initial: 'AVAILABLE' },
        { key: 'publicationStatus', label: 'Publication', type: 'select', options: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], initial: 'DRAFT' },
        { key: 'isFeatured', label: 'Featured property', type: 'checkbox' },
        { key: 'isNewDevelopment', label: 'New development', type: 'checkbox' },
      ],
      create: portalApi.createManagedProperty,
      upload: async (file) => (await portalApi.uploadManagedPropertyMedia(file)).data.url,
      update: (id, data) => portalApi.updateManagedProperty(id, data),
      remove: portalApi.deleteManagedProperty,
      removeAction: 'archive',
      statusOptions: ['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'LEASED', 'ARCHIVED'],
    },
    {
      label: 'Property Requests', href: '/portal/property-manager/requests', icon: FileText, load: portalApi.getManagedPropertyRequests,
      fields: [
        { key: 'status', label: 'Request status', type: 'select', options: ['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED'] },
      ],
      update: (id, data) => {
        if (data.status === 'APPROVED') return portalApi.approveManagedListing(id);
        if (data.status === 'REJECTED') return portalApi.rejectManagedListing(id);
        return portalApi.updateManagedListing(id, data);
      },
      approveStatus: 'APPROVED',
      approvalFrom: ['PENDING', 'SUBMITTED'],
      statusOptions: ['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED'],
    },
    {
      label: 'Inquiries', href: '/portal/property-manager/inquiries', icon: MessageSquare, load: portalApi.getManagedInquiries,
      fields: [
        { key: 'name', label: 'Client name', required: true }, { key: 'email', label: 'Email', required: true },
        { key: 'phone', label: 'Phone' }, { key: 'message', label: 'Message', type: 'textarea', required: true },
        { key: 'status', label: 'Inquiry status', type: 'select', options: ['NEW', 'PENDING', 'READ', 'CONTACTED', 'INTERESTED', 'APPROVED', 'RESOLVED', 'CLOSED'] },
      ],
      update: (id, data) => portalApi.updateManagedInquiry(id, data),
      remove: portalApi.deleteManagedInquiry,
      statusOptions: ['NEW', 'PENDING', 'READ', 'CONTACTED', 'INTERESTED', 'APPROVED', 'RESOLVED', 'CLOSED'],
    },
    {
      label: 'Viewings', href: '/portal/property-manager/viewings', icon: CalendarDays, load: portalApi.getManagedViewings,
      fields: [
        { key: 'propertyId', label: 'Property', type: 'select', required: true, loadOptions: portalApi.getManagedProperties },
        { key: 'name', label: 'Client name', required: true }, { key: 'email', label: 'Email', required: true },
        { key: 'phone', label: 'Phone' }, { key: 'preferredDate', label: 'Preferred date/time', type: 'datetime-local' },
        { key: 'preferredTime', label: 'Preferred time' }, { key: 'message', label: 'Message', type: 'textarea' },
        { key: 'status', label: 'Viewing status', type: 'select', options: ['PENDING', 'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] },
      ],
      create: portalApi.createManagedViewing,
      update: (id, data) => portalApi.updateManagedViewing(id, data),
      remove: portalApi.deleteManagedViewing,
      statusOptions: ['PENDING', 'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
    },
  ],
  content_editor: [
    {
      label: 'Articles', href: '/portal/content-editor/articles', icon: FileText, load: portalApi.getEditorArticles,
      fields: [
        { key: 'title', label: 'Title', required: true }, { key: 'slug', label: 'Slug', required: true },
        { key: 'excerpt', label: 'Excerpt', type: 'textarea' }, { key: 'content', label: 'Content', type: 'textarea', required: true },
        { key: 'publicationStatus', label: 'Publication', type: 'select', options: ['DRAFT', 'PUBLISHED'], initial: 'DRAFT' },
      ],
      create: portalApi.createEditorArticle,
      update: (id, data) => portalApi.updateEditorArticle(id, data),
      remove: portalApi.deleteEditorArticle,
      statusOptions: ['DRAFT', 'PUBLISHED'],
    },
    {
      label: 'Pages', href: '/portal/content-editor/pages', icon: FileText, load: portalApi.getEditorPages,
      fields: [
        { key: 'title', label: 'Title', required: true }, { key: 'slug', label: 'Slug', required: true },
        { key: 'content', label: 'Content', type: 'textarea' }, { key: 'metaTitle', label: 'SEO title' },
        { key: 'metaDescription', label: 'SEO description', type: 'textarea' },
        { key: 'isPublished', label: 'Published', type: 'checkbox', initial: 'true' },
      ],
      create: portalApi.createEditorPage,
      update: (id, data) => portalApi.updateEditorPage(id, data),
      remove: portalApi.deleteEditorPage,
    },
    {
      label: 'FAQs', href: '/portal/content-editor/faqs', icon: MessageSquare, load: portalApi.getEditorFaqs,
      fields: [
        { key: 'question', label: 'Question', required: true }, { key: 'answer', label: 'Answer', type: 'textarea', required: true },
        { key: 'category', label: 'Category' }, { key: 'displayOrder', label: 'Display order', type: 'number', initial: '0' },
        { key: 'isActive', label: 'Active', type: 'checkbox', initial: 'true' },
      ],
      create: portalApi.createEditorFaq,
      update: (id, data) => portalApi.updateEditorFaq(id, data),
      remove: portalApi.deleteEditorFaq,
    },
  ],
};

const recordList = (response: unknown): PortalRecord[] => {
  if (!response || typeof response !== 'object') return [];
  const data = (response as { data?: unknown }).data;
  return Array.isArray(data) ? data as PortalRecord[] : [];
};

const recordCount = (response: unknown) => {
  if (!response || typeof response !== 'object') return recordList(response).length;
  const pagination = (response as { pagination?: { total?: unknown } }).pagination;
  return typeof pagination?.total === 'number' ? pagination.total : recordList(response).length;
};

const responseStats = (response: unknown): Record<string, unknown> => {
  if (!response || typeof response !== 'object') return {};
  const stats = (response as { stats?: unknown }).stats;
  return stats && typeof stats === 'object' ? stats as Record<string, unknown> : {};
};

const numericStat = (stats: Record<string, unknown>, name: string) =>
  typeof stats[name] === 'number' && Number.isFinite(stats[name]) ? stats[name] as number : null;

const recordDate = (value: unknown) => {
  if (typeof value !== 'string' && !(value instanceof Date)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatPortalDate = (value: unknown, includeTime = false) => {
  const date = recordDate(value);
  return date
    ? date.toLocaleString(undefined, includeTime
      ? { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }
      : { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Date not set';
};

const formatMoney = (price: unknown, currency: unknown) => {
  if (price === null || price === undefined || price === '') return 'Price on request';
  const amount = Number(price);
  if (!Number.isFinite(amount)) return 'Price on request';
  return `${typeof currency === 'string' && currency ? currency : 'RWF'} ${amount.toLocaleString()}`;
};

const statusClasses: Record<string, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  SOLD: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  RENTED: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  LEASED: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  SUBMITTED: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  NEW: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  READ: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  CONTACTED: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15',
  INTERESTED: 'bg-teal-50 text-teal-700 ring-teal-600/15',
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  RESOLVED: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  CLOSED: 'bg-slate-100 text-slate-500 ring-slate-500/10',
  DRAFT: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  ARCHIVED: 'bg-slate-100 text-slate-500 ring-slate-500/10',
  CONFIRMED: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  COMPLETED: 'bg-teal-50 text-teal-700 ring-teal-600/15',
  CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  SCHEDULED: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15',
};

const formatLabel = (value?: string | null) => {
  if (!value) return '—';
  return value.replace(/[_-]/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`inline-flex whitespace-nowrap items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusClasses[status.toUpperCase()] || 'bg-slate-100 text-slate-600 ring-slate-500/10'}`}>
    {formatLabel(status)}
  </span>
);

const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return '—';
  return String(value);
};

const recordTitle = (record: PortalRecord) =>
  displayValue(record.title || record.name || record.question || record.email || record.id);

const relatedValue = (record: PortalRecord, relation: string, key: string) => {
  const value = record[relation];
  return value && typeof value === 'object' && key in value
    ? displayValue((value as PortalRecord)[key])
    : '—';
};

function PortalSidebar({ role, onClose }: { role: Exclude<Role, 'admin'>; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const items = roleMenus[role];

  const signOut = () => {
    logout();
    router.replace('/portal/login');
  };

  return (
    <aside className="flex h-full w-72 flex-col bg-slate-900 text-white lg:w-60">
      <div className="flex h-16 items-center justify-between border-b border-slate-700 px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="font-bold">Ingata</span>
        </div>
        {onClose && <button onClick={onClose} aria-label="Close menu" className="lg:hidden"><X className="h-5 w-5" /></button>}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Workspace</p>
        <Link
          href="/portal/dashboard"
          onClick={onClose}
          className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
            pathname.endsWith('/dashboard') ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Home className="h-4 w-4" /> Dashboard
        </Link>
        {items.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
              pathname === href ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-700 p-3">
        <div className="mb-1 truncate rounded-lg bg-slate-800/70 px-3 py-2.5">
          <p className="truncate text-sm font-medium">{user?.name || user?.email}</p>
          <p className="text-xs text-slate-400">{roleNames[role]}</p>
        </div>
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-red-500/10 hover:text-red-300">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}

function WorkspaceFrame({ role, children }: { role: Exclude<Role, 'admin'>; children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <div className="hidden lg:block"><PortalSidebar role={role} /></div>
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="relative"><PortalSidebar role={role} onClose={() => setMenuOpen(false)} /></div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-slate-800">{roleNames[role]} workspace</span>
          <span className="ml-auto hidden text-sm text-slate-500 sm:block">Ingata Real Estate</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

function PortalPage({ role, item }: { role: Exclude<Role, 'admin'>; item: PortalItem | null }) {
  const { user, updateProfile } = useAuth();
  const [records, setRecords] = useState<PortalRecord[]>([]);
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [dashboardRecords, setDashboardRecords] = useState<Record<string, PortalRecord[]>>({});
  const [dashboardStats, setDashboardStats] = useState<Record<string, Record<string, unknown>>>({});
  const [dashboardErrors, setDashboardErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<PortalRecord | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const items = roleMenus[role];

  const refreshItem = async () => {
    if (!item) return;
    const response = await item.load();
    setRecords(recordList(response));
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const load = item
      ? item.load().then((response) => ({ rows: recordList(response), counts: {}, dashboardRecords: {}, dashboardStats: {}, dashboardErrors: {}, error: '' }))
      : Promise.allSettled(items.map((entry) => entry.load()))
        .then((results) => {
          const loadedCounts: Record<string, number | null> = {};
          const loadedRecords: Record<string, PortalRecord[]> = {};
          const loadedStats: Record<string, Record<string, unknown>> = {};
          const loadedErrors: Record<string, string> = {};
          results.forEach((result, index) => {
            const entry = items[index];
            if (result.status === 'fulfilled') {
              const rows = recordList(result.value);
              loadedCounts[entry.href] = recordCount(result.value);
              loadedRecords[entry.href] = rows;
              loadedStats[entry.href] = responseStats(result.value);
            } else {
              loadedCounts[entry.href] = null;
              loadedErrors[entry.href] = result.reason instanceof Error ? result.reason.message : `Could not load ${entry.label.toLowerCase()}.`;
            }
          });
          return {
            rows: [],
            counts: loadedCounts,
            dashboardRecords: loadedRecords,
            dashboardStats: loadedStats,
            dashboardErrors: loadedErrors,
            error: '',
          };
        });

    load.then(({ rows, counts: loadedCounts, dashboardRecords: loadedDashboardRecords, dashboardStats: loadedDashboardStats, dashboardErrors: loadedDashboardErrors, error: loadError }) => {
        if (active) {
          setRecords(rows);
          setCounts(loadedCounts);
          setDashboardRecords(loadedDashboardRecords);
          setDashboardStats(loadedDashboardStats);
          setDashboardErrors(loadedDashboardErrors);
          setError(loadError);
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load workspace data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [item, role]);

  const retryDashboardSection = async (entry: PortalItem) => {
    setDashboardErrors((current) => ({ ...current, [entry.href]: '' }));
    try {
      const response = await entry.load();
      setDashboardRecords((current) => ({ ...current, [entry.href]: recordList(response) }));
      setCounts((current) => ({ ...current, [entry.href]: recordCount(response) }));
      setDashboardStats((current) => ({ ...current, [entry.href]: responseStats(response) }));
      setDashboardErrors((current) => ({ ...current, [entry.href]: '' }));
    } catch (reason) {
      setDashboardErrors((current) => ({
        ...current,
        [entry.href]: reason instanceof Error ? reason.message : `Could not load ${entry.label.toLowerCase()}.`,
      }));
    }
  };

  const retryCurrentItem = async () => {
    if (!item) return;
    setLoading(true);
    setError('');
    try {
      const response = await item.load();
      setRecords(recordList(response));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : `Could not load ${item.label.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  };

  const submitRecord = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!item?.fields) return;
    setError('');
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const data: Record<string, unknown> = {};
    for (const field of item.fields) {
      const value = form.get(field.key);
      if (field.type === 'checkbox') {
        data[field.key] = value === 'on';
      } else if (field.type === 'number' && value !== null && String(value).trim()) {
        data[field.key] = Number(value);
      } else if (field.key === 'images' && value !== null) {
        data[field.key] = String(value).split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
      } else if (field.key === 'amenities' && value !== null) {
        data[field.key] = String(value).split(',').map((entry) => entry.trim()).filter(Boolean);
      } else if (value !== null) {
        data[field.key] = String(value);
      }
    }
    // Clear sector if district changes and sector doesn't belong to new district
    if (data.district && data.sector && typeof data.district === 'string' && typeof data.sector === 'string') {
      const sectors = getSectorsByDistrict(data.district);
      if (!sectors.includes(data.sector)) {
        data.sector = '';
      }
    }
    try {
      if (editing) {
        const id = displayValue(editing.id);
        if (id === '—' || !item.update) throw new Error('This record cannot be edited.');
        await item.update(id, data);
      } else {
        if (!item.create) throw new Error('Creating records is not available here.');
        await item.create(data);
      }
      await refreshItem();
      setEditing(null);
      setShowNew(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save this record.');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (record: PortalRecord, status: string) => {
    if (!item?.update) return;
    const id = displayValue(record.id);
    if (id === '—') return;
    const key = record.publicationStatus !== undefined ? 'publicationStatus' : 'status';
    setError('');
    try {
      await item.update(id, { [key]: status });
      setRecords((current) => current.map((entry) => entry.id === record.id ? { ...entry, [key]: status } : entry));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update the status.');
    }
  };

  const approveRecord = async (record: PortalRecord) => {
    if (!item?.update || !item.approveStatus) return;
    const id = displayValue(record.id);
    if (id === '—') return;
    setError('');
    try {
      await item.update(id, { status: item.approveStatus });
      setRecords((current) => current.map((entry) => entry.id === record.id ? { ...entry, status: item.approveStatus } : entry));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not approve this request.');
    }
  };

  const deleteRecord = async (record: PortalRecord) => {
    if (!item?.remove) return;
    const id = displayValue(record.id);
    const action = item.removeAction === 'archive' ? 'Archive' : 'Delete';
    const consequence = item.removeAction === 'archive' ? 'It will no longer be published.' : 'This cannot be undone.';
    if (id === '—' || !window.confirm(`${action} "${recordTitle(record)}"? ${consequence}`)) return;
    setError('');
    try {
      await item.remove(id);
      setRecords((current) => current.filter((entry) => entry.id !== record.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not delete this record.');
    }
  };

  const heading = item?.label || 'Dashboard';
  const dashboardCounts = useMemo(() => items.map((entry) => ({ ...entry, count: counts[entry.href] })), [items, counts]);
  const agentPropertiesHref = '/portal/agent/properties';
  const agentInquiriesHref = '/portal/agent/inquiries';
  const agentViewingsHref = '/portal/agent/viewings';
  const agentProperties = dashboardRecords[agentPropertiesHref] || [];
  const agentInquiries = dashboardRecords[agentInquiriesHref] || [];
  const agentViewings = dashboardRecords[agentViewingsHref] || [];
  const agentSectionItems = items.filter((entry) =>
    [agentPropertiesHref, agentInquiriesHref, agentViewingsHref].includes(entry.href),
  );
  const followUpCount = agentInquiries.filter((inquiry) => {
    if (typeof inquiry.nextFollowUpDate !== 'string' || !inquiry.nextFollowUpDate) return false;
    return new Date(inquiry.nextFollowUpDate).getTime() >= new Date().setHours(0, 0, 0, 0);
  }).length;
  const soldOrRentedCount = agentProperties.filter((property) => ['SOLD', 'RENTED'].includes(String(property.status))).length;
  const newInquiryCount = agentInquiries.filter((inquiry) => ['NEW', 'PENDING'].includes(String(inquiry.status))).length;
  const scheduledViewingCount = agentViewings.filter((viewing) => ['PENDING', 'SCHEDULED', 'CONFIRMED'].includes(String(viewing.status))).length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayViewings = agentViewings.filter((viewing) => {
    if (typeof viewing.preferredDate !== 'string' || !viewing.preferredDate || !['PENDING', 'SCHEDULED', 'CONFIRMED'].includes(String(viewing.status))) return false;
    const date = new Date(viewing.preferredDate);
    return date.getTime() >= today.getTime() && date.getTime() < tomorrow.getTime();
  });

  const upcomingViewings = agentViewings.filter((viewing) => {
    if (typeof viewing.preferredDate !== 'string' || !viewing.preferredDate || !['PENDING', 'SCHEDULED', 'CONFIRMED'].includes(String(viewing.status))) return false;
    const date = new Date(viewing.preferredDate);
    return date.getTime() >= tomorrow.getTime();
  }).sort((left, right) => {
    const leftDate = new Date(left.preferredDate as string).getTime();
    const rightDate = new Date(right.preferredDate as string).getTime();
    return leftDate - rightDate;
  }).slice(0, 5);

  const overdueFollowUps = agentInquiries.filter((inquiry) => {
    if (typeof inquiry.nextFollowUpDate !== 'string' || !inquiry.nextFollowUpDate) return false;
    const date = new Date(inquiry.nextFollowUpDate);
    return date.getTime() < today.getTime();
  });

  const todayFollowUps = agentInquiries.filter((inquiry) => {
    if (typeof inquiry.nextFollowUpDate !== 'string' || !inquiry.nextFollowUpDate) return false;
    const date = new Date(inquiry.nextFollowUpDate);
    return date.getTime() >= today.getTime() && date.getTime() < tomorrow.getTime();
  });

  const agentAgenda = [
    ...todayViewings.map((viewing) => ({
      id: `viewing-${String(viewing.id)}`,
      date: new Date(viewing.preferredDate as string),
      label: `Viewing: ${String(viewing.name || 'Client')} · ${String(viewing.property && typeof viewing.property === 'object' && 'title' in viewing.property ? viewing.property.title : 'Property')}`,
      detail: String(viewing.preferredTime || viewing.status),
      type: 'viewing' as const,
    })),
    ...todayFollowUps.map((inquiry) => ({
      id: `followup-${String(inquiry.id)}`,
      date: new Date(inquiry.nextFollowUpDate as string),
      label: `Follow up: ${String(inquiry.name || 'Inquiry')}`,
      detail: String(inquiry.email || ''),
      type: 'followup' as const,
    })),
  ].sort((left, right) => left.date.getTime() - right.date.getTime()).slice(0, 8);
  const agentNotifications = [
    ...agentInquiries.map((inquiry) => ({
      id: `inquiry-${String(inquiry.id)}`,
      at: String(inquiry.createdAt || ''),
      label: `Inquiry from ${String(inquiry.name || 'a client')}`,
      detail: String(inquiry.inquiry || ''),
      status: String(inquiry.status || 'NEW'),
      type: 'inquiry' as const,
      href: '/portal/agent/inquiries',
    })),
    ...agentViewings.map((viewing) => ({
      id: `viewing-${String(viewing.id)}`,
      at: String(viewing.createdAt || ''),
      label: `Viewing request from ${String(viewing.name || 'a client')}`,
      detail: String(viewing.status || ''),
      status: String(viewing.status || 'PENDING'),
      type: 'viewing' as const,
      href: '/portal/agent/viewings',
    })),
    ...agentProperties.map((property) => ({
      id: `property-${String(property.id)}`,
      at: String(property.createdAt || ''),
      label: `Property assigned: ${String(property.title || 'Property')}`,
      detail: String(property.status || ''),
      status: String(property.status || 'AVAILABLE'),
      type: 'property' as const,
      href: '/portal/agent/properties',
    })),
  ].filter((entry) => !Number.isNaN(Date.parse(entry.at)))
    .sort((left, right) => Date.parse(right.at) - Date.parse(left.at))
    .slice(0, 6);

  const recentAssignedProperties = [...agentProperties]
    .sort((left, right) => {
      const leftDate = recordDate(left.updatedAt || left.createdAt)?.getTime() || 0;
      const rightDate = recordDate(right.updatedAt || right.createdAt)?.getTime() || 0;
      return rightDate - leftDate;
    })
    .slice(0, 5);
  const managerPropertiesHref = '/portal/property-manager/properties';
  const managerInquiriesHref = '/portal/property-manager/inquiries';
  const managerViewingsHref = '/portal/property-manager/viewings';
  const managerRequestsHref = '/portal/property-manager/requests';
  const managerProperties = dashboardRecords[managerPropertiesHref] || [];
  const managerInquiries = dashboardRecords[managerInquiriesHref] || [];
  const managerViewings = dashboardRecords[managerViewingsHref] || [];
  const managerRequests = dashboardRecords[managerRequestsHref] || [];
  const managerPropertyStats = dashboardStats[managerPropertiesHref] || {};
  const managerInquiryStats = dashboardStats[managerInquiriesHref] || {};
  const managerViewingStats = dashboardStats[managerViewingsHref] || {};
  const managerRequestStats = dashboardStats[managerRequestsHref] || {};
  const propertyStatusCounts = (managerPropertyStats.statusCounts || {}) as Record<string, number>;
  const publicationStatusCounts = (managerPropertyStats.publicationStatusCounts || {}) as Record<string, number>;
  const inquiryStatusCounts = (managerInquiryStats.statusCounts || {}) as Record<string, number>;
  const managerAvailableCount = numericStat(managerPropertyStats, 'availableProperties') ??
    managerProperties.filter((property) => property.status === 'AVAILABLE').length;
  const managerNewInquiryCount = numericStat(managerInquiryStats, 'newInquiries') ??
    managerInquiries.filter((inquiry) => ['NEW', 'PENDING'].includes(String(inquiry.status).toUpperCase())).length;
  const managerUpcomingViewingCount = numericStat(managerViewingStats, 'upcomingViewings') ??
    managerViewings.filter((viewing) => {
      const date = recordDate(viewing.preferredDate);
      return !!date && date >= new Date() && ['PENDING', 'SCHEDULED', 'CONFIRMED'].includes(String(viewing.status).toUpperCase());
    }).length;
  const managerPendingRequestsCount = numericStat(managerRequestStats, 'pendingRequests') ??
    managerRequests.filter((request) => ['PENDING', 'SUBMITTED'].includes(String(request.status).toUpperCase())).length;
  const managerUnpublishedCount = (publicationStatusCounts.DRAFT || 0) + (publicationStatusCounts.UNDER_REVIEW || 0);
  const managerNotificationUnavailable = loading ||
    [managerPropertiesHref, managerInquiriesHref, managerViewingsHref, managerRequestsHref].some((href) => Boolean(dashboardErrors[href]));
  const managerNotificationCount = managerNotificationUnavailable
    ? null
    : managerNewInquiryCount + managerUpcomingViewingCount + managerPendingRequestsCount + managerUnpublishedCount;
  const managerRecentProperties = [...managerProperties].sort((left, right) =>
    (recordDate(right.updatedAt)?.getTime() || recordDate(right.createdAt)?.getTime() || 0) -
    (recordDate(left.updatedAt)?.getTime() || recordDate(left.createdAt)?.getTime() || 0),
  ).slice(0, 5);
  const managerRecentInquiries = [...managerInquiries].sort((left, right) =>
    (recordDate(right.createdAt)?.getTime() || 0) - (recordDate(left.createdAt)?.getTime() || 0),
  ).slice(0, 5);
  const managerUpcomingViewings = managerViewings
    .filter((viewing) => {
      const date = recordDate(viewing.preferredDate);
      return !!date && date >= new Date() && ['PENDING', 'SCHEDULED', 'CONFIRMED'].includes(String(viewing.status).toUpperCase());
    })
    .sort((left, right) => (recordDate(left.preferredDate)?.getTime() || 0) - (recordDate(right.preferredDate)?.getTime() || 0))
    .slice(0, 5);
  const managerChartRows = [
    ...Object.entries(propertyStatusCounts).map(([status, count]) => ({ label: `Properties · ${status}`, count, tone: 'bg-emerald-500' })),
    ...Object.entries(inquiryStatusCounts).map(([status, count]) => ({ label: `Inquiries · ${status}`, count, tone: 'bg-blue-500' })),
  ].filter((row) => row.count > 0).sort((left, right) => right.count - left.count).slice(0, 6);
  const managerSectionItems = items.filter((entry) =>
    [managerPropertiesHref, managerInquiriesHref, managerViewingsHref, managerRequestsHref].includes(entry.href),
  );

  const saveManagerProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setProfileSaving(true);
    setProfileError('');
    setProfileSaved(false);
    try {
      await updateProfile(String(form.get('name') || '').trim(), String(form.get('phone') || '').trim());
      setProfileSaved(true);
      setProfileOpen(false);
    } catch (reason) {
      setProfileError(reason instanceof Error ? reason.message : 'Unable to update your profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {!item && role === 'property_manager' ? (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-5 py-6 text-white shadow-lg sm:px-8 sm:py-7">
          <div className="pointer-events-none absolute -right-12 -top-28 h-72 w-72 rounded-full border-[42px] border-white/5" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-200">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
              </h1>
              <p className="mt-2 text-sm text-slate-300">Your assigned portfolio, clients and upcoming schedule at a glance.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/portal/property-manager/inquiries" aria-label={managerNotificationCount === null ? 'Workspace notifications' : `${managerNotificationCount} items need attention`} className="relative grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-white/10 transition hover:bg-white/20">
                <Bell className="h-5 w-5" />
                {managerNotificationCount !== null && managerNotificationCount > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold">{managerNotificationCount > 99 ? '99+' : managerNotificationCount}</span>}
              </Link>
              <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-300 font-bold text-emerald-950">{(user?.name || user?.email || 'M').slice(0, 1).toUpperCase()}</span>
                <div className="max-w-40">
                  <p className="truncate text-sm font-semibold">{user?.name || 'Property Manager'}</p>
                  <p className="truncate text-xs text-slate-300">{user?.email}</p>
                </div>
              </div>
              <button type="button" onClick={() => { setProfileOpen((open) => !open); setProfileError(''); setProfileSaved(false); }} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 px-3 text-sm font-semibold text-white transition hover:bg-white/50">
                <Pencil className="h-4 w-4" /> Edit profile
              </button>
              <Link href="/portal/property-manager/properties" className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-400">
                <Plus className="h-4 w-4" /> Add Property
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <h1 className="text-2xl font-bold text-slate-900">{heading}</h1>
      )}
      {(!item && role !== 'property_manager') && (
        <p className="mt-1 text-sm text-slate-500">Welcome to your {roleNames[role].toLowerCase()} workspace.</p>
      )}
      {item && <p className="mt-1 text-sm text-slate-500">View and work with your {item.label.toLowerCase()}.</p>}

      {profileSaved && !item && role === 'property_manager' && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Profile updated successfully.</p>
      )}
      {profileOpen && !item && role === 'property_manager' && (
        <form onSubmit={saveManagerProfile} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="font-bold text-slate-900">Basic profile details</h2><p className="mt-1 text-sm text-slate-500">Update the name and phone number on your account.</p></div>
            <button type="button" aria-label="Close profile form" onClick={() => setProfileOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Name<input name="name" required defaultValue={user?.name || ''} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500" /></label>
            <label className="text-sm font-medium text-slate-700">Phone<input name="phone" defaultValue={user?.phone || ''} type="tel" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500" /></label>
          </div>
          {profileError && <p role="alert" className="mt-3 text-sm text-rose-700">{profileError}</p>}
          <div className="mt-4 flex justify-end"><button type="submit" disabled={profileSaving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"><Save className="h-4 w-4" />{profileSaving ? 'Saving…' : 'Save profile'}</button></div>
        </form>
      )}
      {!item && role === 'property_manager' && !loading && !dashboardErrors[managerPropertiesHref] && counts[managerPropertiesHref] === 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <p>No properties are assigned to this workspace yet. Existing properties remain unassigned until an administrator assigns them; creating a property will assign it to you.</p>
          <Link href={managerPropertiesHref} className="shrink-0 font-semibold text-emerald-800 hover:underline">Open Properties <ChevronRight className="inline h-4 w-4" /></Link>
        </div>
      )}

      {!item && role === 'agent' && (
        <>
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-5 py-6 text-white shadow-lg sm:px-8 sm:py-7">
            <div className="pointer-events-none absolute -right-12 -top-28 h-72 w-72 rounded-full border-[42px] border-white/5" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-200">
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
                </h1>
                <p className="mt-2 text-sm text-slate-300">Your assigned properties, client inquiries, and upcoming schedule at a glance.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/portal/agent/inquiries" aria-label={`${newInquiryCount + scheduledViewingCount} items need attention`} className="relative grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-white/10 transition hover:bg-white/20">
                  <Bell className="h-5 w-5" />
                  {newInquiryCount + scheduledViewingCount > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold">{newInquiryCount + scheduledViewingCount > 99 ? '99+' : newInquiryCount + scheduledViewingCount}</span>}
                </Link>
                <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-300 font-bold text-emerald-950">{(user?.name || user?.email || 'A').slice(0, 1).toUpperCase()}</span>
                  <div className="max-w-40">
                    <p className="truncate text-sm font-semibold">{user?.name || 'Agent'}</p>
                    <p className="truncate text-xs text-slate-300">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section aria-label="Key performance indicators" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
            {[
              { label: 'My Properties', count: counts[agentPropertiesHref], detail: 'Assigned to you', href: agentPropertiesHref, icon: Home, tone: 'bg-blue-50 text-blue-600' },
              { label: 'New Inquiries', count: newInquiryCount, detail: 'Awaiting response', href: agentInquiriesHref, icon: MessageSquare, tone: 'bg-amber-50 text-amber-600' },
              { label: 'Scheduled Viewings', count: scheduledViewingCount, detail: 'Upcoming appointments', href: agentViewingsHref, icon: CalendarDays, tone: 'bg-violet-50 text-violet-600' },
              { label: 'Sold / Rented', count: soldOrRentedCount, detail: 'Completed deals', href: agentPropertiesHref, icon: Building2, tone: 'bg-emerald-50 text-emerald-600' },
              { label: 'Pending Follow-ups', count: followUpCount, detail: 'Client callbacks due', href: agentInquiriesHref, icon: Clock, tone: 'bg-rose-50 text-rose-600' },
            ].map((card) => {
              const failedItem = agentSectionItems.find((entry) => entry.href === card.href);
              const sectionError = dashboardErrors[card.href];
              return (
                <Link key={card.label} href={card.href} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-500 sm:text-sm">{card.label}</p>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{loading ? '…' : sectionError ? '—' : card.count ?? '—'}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{sectionError ? 'Statistics unavailable' : card.detail}</p>
                    </div>
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-11 sm:w-11 ${card.tone}`}>
                      <card.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  {sectionError && failedItem ? (
                    <button type="button" onClick={() => void retryDashboardSection(failedItem)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:underline"><RefreshCw className="h-3 w-3" /> Retry {failedItem.label.toLowerCase()}</button>
                  ) : null}
                </Link>
              );
            })}
          </section>

          {counts['/portal/agent/properties'] === 0 && !loading && (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
              <p>No properties are assigned to your agent profile yet. Ask a property manager or administrator to assign listings to you.</p>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Your schedule</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">Today's Schedule</h2>
                  <p className="mt-1 text-sm text-slate-500">Viewings and follow-ups scheduled for today</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CalendarDays className="h-5 w-5" /></span>
              </div>
              {dashboardErrors[agentViewingsHref] || dashboardErrors[agentInquiriesHref] ? (
                <div className="mt-5 space-y-3">
                  {[agentViewingsHref, agentInquiriesHref].filter((href) => dashboardErrors[href]).map((href) => {
                    const entry = agentSectionItems.find((section) => section.href === href);
                    return <div key={href} className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800"><p>{entry?.label}: {dashboardErrors[href]}</p>{entry && <button type="button" onClick={() => void retryDashboardSection(entry)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"><RefreshCw className="h-3 w-3" /> Retry</button>}</div>;
                  })}
                </div>
              ) : loading ? (
                <div className="mt-5 space-y-3">
                  {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
                </div>
              ) : agentAgenda.length ? (
                <ul className="mt-5 divide-y divide-slate-100">
                  {agentAgenda.map((entry) => (
                    <li key={`${entry.id}-${entry.label}`} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {entry.type === 'viewing' && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Viewing</span>}
                          {entry.type === 'followup' && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Follow-up</span>}
                          <p className="truncate text-sm font-medium text-slate-800">{entry.label}</p>
                        </div>
                        <p className="truncate text-xs text-slate-500">{entry.detail}</p>
                      </div>
                      <time className="shrink-0 text-xs font-medium text-slate-600">{entry.date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</time>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5 rounded-xl bg-slate-50 px-4 py-8 text-center">
                  <CalendarDays className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-600">No schedule today</p>
                  <p className="mt-1 text-xs text-slate-400">You have no viewings or follow-ups scheduled for today.</p>
                </div>
              )}
            </section>
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Priority tasks</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">My Priority Tasks</h2>
                  <p className="mt-1 text-sm text-slate-500">Overdue follow-ups and urgent items</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-700"><AlertCircle className="h-5 w-5" /></span>
              </div>
              {dashboardErrors[agentInquiriesHref] ? (
                <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800">
                  <p>{dashboardErrors[agentInquiriesHref]}</p>
                  {agentSectionItems.find((section) => section.href === agentInquiriesHref) && (
                    <button type="button" onClick={() => { const entry = agentSectionItems.find((section) => section.href === agentInquiriesHref); if (entry) void retryDashboardSection(entry); }} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"><RefreshCw className="h-3 w-3" /> Retry inquiries</button>
                  )}
                </div>
              ) : loading ? (
                <div className="mt-5 space-y-3">
                  {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
                </div>
              ) : overdueFollowUps.length > 0 ? (
                <ul className="mt-5 divide-y divide-slate-100">
                  {overdueFollowUps.slice(0, 5).map((inquiry) => (
                    <li key={String(inquiry.id)} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{String(inquiry.name || 'Client')}</p>
                        <p className="truncate text-xs text-slate-500">{String(inquiry.email || '')}</p>
                        <p className="mt-1 text-xs text-rose-600">Follow-up was due {formatPortalDate(inquiry.nextFollowUpDate)}</p>
                      </div>
                      <Link href="/portal/agent/inquiries" className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">Update</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5 rounded-xl bg-slate-50 px-4 py-8 text-center">
                  <CheckCircle className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-600">All caught up</p>
                  <p className="mt-1 text-xs text-slate-400">You have no overdue follow-ups or urgent tasks.</p>
                </div>
              )}
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Activity feed</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">Recent Activity</h2>
                  <p className="mt-1 text-sm text-slate-500">Recent inquiries, viewing requests, and assigned properties</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Activity className="h-5 w-5" /></span>
              </div>
              {dashboardErrors[agentPropertiesHref] || dashboardErrors[agentInquiriesHref] || dashboardErrors[agentViewingsHref] ? (
                <div className="mt-5 space-y-3">
                  {[agentPropertiesHref, agentInquiriesHref, agentViewingsHref].filter((href) => dashboardErrors[href]).map((href) => {
                    const entry = agentSectionItems.find((section) => section.href === href);
                    return <div key={href} className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800"><p>{entry?.label}: {dashboardErrors[href]}</p>{entry && <button type="button" onClick={() => void retryDashboardSection(entry)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"><RefreshCw className="h-3 w-3" /> Retry</button>}</div>;
                  })}
                </div>
              ) : loading ? (
                <div className="mt-5 space-y-3">
                  {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
                </div>
              ) : agentNotifications.length ? (
                <ul className="mt-5 divide-y divide-slate-100">
                  {agentNotifications.map((entry) => (
                    <li key={entry.id} className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {entry.type === 'inquiry' && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Inquiry</span>}
                            {entry.type === 'viewing' && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Viewing</span>}
                            {entry.type === 'property' && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Property</span>}
                            <p className="truncate text-sm font-medium text-slate-800">{entry.label}</p>
                          </div>
                          <p className="truncate text-xs text-slate-500">{entry.detail}</p>
                        </div>
                        <StatusBadge status={entry.status} />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <time className="text-xs text-slate-400">{formatPortalDate(entry.at, true)}</time>
                        <Link href={entry.href} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">View details</Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5 rounded-xl bg-slate-50 px-4 py-8 text-center">
                  <Activity className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-600">No recent activity</p>
                  <p className="mt-1 text-xs text-slate-400">Your recent work will appear here.</p>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Your portfolio</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">Recently Assigned Properties</h2>
                  <p className="mt-1 text-sm text-slate-500">Your latest property assignments</p>
                </div>
                <Link href="/portal/agent/properties" className="text-sm font-semibold text-emerald-700 hover:underline">View all</Link>
              </div>
              {dashboardErrors[agentPropertiesHref] ? (
                <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800">
                  <p>{dashboardErrors[agentPropertiesHref]}</p>
                  {agentSectionItems.find((section) => section.href === agentPropertiesHref) && (
                    <button type="button" onClick={() => { const entry = agentSectionItems.find((section) => section.href === agentPropertiesHref); if (entry) void retryDashboardSection(entry); }} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"><RefreshCw className="h-3 w-3" /> Retry properties</button>
                  )}
                </div>
              ) : loading ? (
                <div className="mt-5 space-y-3">
                  {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
                </div>
              ) : recentAssignedProperties.length ? (
                <ul className="mt-5 divide-y divide-slate-100">
                  {recentAssignedProperties.map((property) => {
                    const primaryImage = Array.isArray(property.propertyImages)
                      ? property.propertyImages.sort((a: unknown, b: unknown) => {
                          const aIsPrimary = typeof a === 'object' && a !== null && 'isPrimary' in a ? Boolean(a.isPrimary) : false;
                          const bIsPrimary = typeof b === 'object' && b !== null && 'isPrimary' in b ? Boolean(b.isPrimary) : false;
                          return Number(bIsPrimary) - Number(aIsPrimary);
                        })[0]
                      : null;
                    const imageUrl = primaryImage && typeof primaryImage === 'object' && 'imageUrl' in primaryImage ? String(primaryImage.imageUrl) : null;
                    return (
                      <li key={String(property.id)} className="flex items-center gap-3 py-3">
                        {imageUrl ? (
                          <img src={imageUrl} alt="" className="h-12 w-14 shrink-0 rounded-lg bg-slate-100 object-cover" />
                        ) : (
                          <span className="grid h-12 w-14 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400"><Home className="h-5 w-5" /></span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">{String(property.title || 'Untitled property')}</p>
                          <p className="flex items-center gap-1 truncate text-xs text-slate-500"><MapPin className="h-3 w-3 shrink-0" />{String(property.location || property.district || 'Location not specified')}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <p className="truncate text-xs text-slate-500">{formatMoney(property.price, property.currency)}</p>
                            <StatusBadge status={String(property.status || 'AVAILABLE')} />
                          </div>
                        </div>
                        <Link href="/portal/agent/properties" className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">Manage</Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="mt-5 rounded-xl bg-slate-50 px-4 py-8 text-center">
                  <Home className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-600">No properties assigned</p>
                  <p className="mt-1 text-xs text-slate-400">Properties assigned to you will appear here.</p>
                </div>
              )}
            </section>
          </div>
        </>
      )}
      {!item && role === 'property_manager' && (
        <>
          <section aria-label="Property manager statistics" className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[
              { title: 'Total Properties', href: managerPropertiesHref, count: counts[managerPropertiesHref], detail: `${managerAvailableCount} available`, icon: Home, tone: 'bg-blue-50 text-blue-700' },
              { title: 'Available Properties', href: managerPropertiesHref, count: managerAvailableCount, detail: 'Ready for clients', icon: Building2, tone: 'bg-emerald-50 text-emerald-700' },
              { title: 'Pending Inquiries', href: managerInquiriesHref, count: managerNewInquiryCount, detail: `${counts[managerInquiriesHref] ?? managerInquiries.length} total inquiries`, icon: MessageSquare, tone: 'bg-amber-50 text-amber-700' },
              { title: 'Upcoming Viewings', href: managerViewingsHref, count: managerUpcomingViewingCount, detail: `${numericStat(managerViewingStats, 'pendingViewings') ?? managerViewings.filter((viewing) => String(viewing.status).toUpperCase() === 'PENDING').length} pending confirmation`, icon: CalendarDays, tone: 'bg-violet-50 text-violet-700' },
            ].map((card) => {
              const failedItem = managerSectionItems.find((entry) => entry.href === card.href);
              const sectionError = dashboardErrors[card.href];
              return (
                <article key={card.title} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-500 sm:text-sm">{card.title}</p>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{loading ? '…' : sectionError ? '—' : card.count ?? '—'}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{sectionError ? 'Statistics unavailable' : card.detail}</p>
                    </div>
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${card.tone}`}><card.icon className="h-5 w-5" /></span>
                  </div>
                  {sectionError && failedItem ? (
                    <button type="button" onClick={() => void retryDashboardSection(failedItem)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:underline"><RefreshCw className="h-3 w-3" /> Retry {failedItem.label.toLowerCase()}</button>
                  ) : (
                    <Link href={card.href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 focus:outline-none focus:underline">Open section <ChevronRight className="h-4 w-4" /></Link>
                  )}
                </article>
              );
            })}
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Needs attention</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Action Required</h2>
              </div>
              <p className="text-sm text-slate-500">              {managerNotificationCount === null ? 'Some action counts are unavailable' : `${managerNotificationCount} items across your assigned workspace`}</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { title: 'New / unread inquiries', count: managerNewInquiryCount, href: managerInquiriesHref, label: 'View Inquiry', icon: MessageSquare },
                { title: 'Upcoming viewings', count: managerUpcomingViewingCount, href: managerViewingsHref, label: 'View Schedule', icon: CalendarDays },
                { title: 'Pending property requests', count: managerPendingRequestsCount, href: managerRequestsHref, label: 'Review Requests', icon: FileText },
                { title: 'Properties to publish', count: managerUnpublishedCount, href: managerPropertiesHref, label: 'Manage Property', icon: Building2 },
              ].map((task) => {
                const entry = managerSectionItems.find((section) => section.href === task.href);
                const sectionError = dashboardErrors[task.href];
                return (
                  <article key={task.title} className="rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/30">
                    <div className="flex items-center justify-between gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><task.icon className="h-5 w-5" /></span>
                      <span className="text-xl font-bold text-slate-900">{loading ? '…' : sectionError ? '—' : task.count}</span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-slate-800">{task.title}</h3>
                    {sectionError && entry ? (
                      <div className="mt-2">
                        <p className="line-clamp-2 text-xs text-rose-700">{sectionError}</p>
                        <button type="button" onClick={() => void retryDashboardSection(entry)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:underline"><RefreshCw className="h-3 w-3" /> Retry</button>
                      </div>
                    ) : (
                      <Link href={task.href} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 focus:outline-none focus:underline">{task.label}<ChevronRight className="h-4 w-4" /></Link>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Workspace activity</p><h2 className="mt-1 text-lg font-bold text-slate-900">Portfolio & inquiry status</h2><p className="mt-1 text-sm text-slate-500">Counts from properties and inquiries assigned to you.</p></div>
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
              {dashboardErrors[managerPropertiesHref] || dashboardErrors[managerInquiriesHref] ? (
                <div className="mt-4 space-y-3">
                  {[managerPropertiesHref, managerInquiriesHref].filter((href) => dashboardErrors[href]).map((href) => {
                    const entry = managerSectionItems.find((section) => section.href === href);
                    return <div key={href} className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800"><p>{entry?.label}: {dashboardErrors[href]}</p>{entry && <button type="button" onClick={() => void retryDashboardSection(entry)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"><RefreshCw className="h-3 w-3" /> Retry</button>}</div>;
                  })}
                </div>
              ) : managerChartRows.length ? (
                <div className="mt-5 space-y-4">
                  {managerChartRows.map((row) => {
                    const maxCount = Math.max(...managerChartRows.map((entry) => entry.count), 1);
                    return <div key={row.label}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="truncate font-medium text-slate-700">{row.label.replace(/_/g, ' ').toLowerCase()}</span><span className="font-semibold text-slate-900">{row.count}</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${row.tone}`} style={{ width: `${Math.max(4, (row.count / maxCount) * 100)}%` }} /></div>
                    </div>;
                  })}
                </div>
              ) : <p className="mt-5 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{loading ? 'Loading workspace activity…' : 'No status activity yet. New assigned listings and inquiries will appear here.'}</p>}
            </article>

            <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Your schedule</p><h2 className="mt-1 text-lg font-bold text-slate-900">Upcoming Viewings</h2><p className="mt-1 text-sm text-slate-500">Next client appointments for your properties.</p></div>
                <Link href={managerViewingsHref} className="text-sm font-semibold text-emerald-700 hover:underline">View Schedule</Link>
              </div>
              {dashboardErrors[managerViewingsHref] ? (
                <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800"><p>{dashboardErrors[managerViewingsHref]}</p><button type="button" onClick={() => { const entry = managerSectionItems.find((section) => section.href === managerViewingsHref); if (entry) void retryDashboardSection(entry); }} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"><RefreshCw className="h-3 w-3" /> Retry viewings</button></div>
              ) : managerUpcomingViewings.length ? (
                <ul className="mt-4 divide-y divide-slate-100">
                  {managerUpcomingViewings.map((viewing, index) => {
                    const property = viewing.property && typeof viewing.property === 'object' ? viewing.property as PortalRecord : {};
                    return <li key={String(viewing.id || index)} className="flex items-start gap-3 py-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700"><CalendarDays className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{String(viewing.name || 'Client viewing')}</p>
                        <p className="truncate text-xs text-slate-500">{String(property.title || 'Assigned property')} · {String(viewing.preferredTime || 'Time not set')}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3 w-3" />{formatPortalDate(viewing.preferredDate)}</p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">{String(viewing.status || 'PENDING').replace(/_/g, ' ')}</span>
                    </li>;
                  })}
                </ul>
              ) : <p className="mt-4 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{loading ? 'Loading upcoming viewings…' : 'No upcoming viewings are scheduled.'}</p>}
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div><h2 className="font-bold text-slate-900">Recent Inquiries</h2><p className="mt-1 text-xs text-slate-500">Customers interested in your assigned properties</p></div>
                <Link href={managerInquiriesHref} className="text-sm font-semibold text-emerald-700 hover:underline">View all</Link>
              </div>
              {dashboardErrors[managerInquiriesHref] ? (
                <div className="p-5 text-sm text-rose-700"><p>{dashboardErrors[managerInquiriesHref]}</p><button type="button" onClick={() => { const entry = managerSectionItems.find((section) => section.href === managerInquiriesHref); if (entry) void retryDashboardSection(entry); }} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"><RefreshCw className="h-3 w-3" /> Retry inquiries</button></div>
              ) : managerRecentInquiries.length ? (
                <ul className="divide-y divide-slate-100">
                  {managerRecentInquiries.map((inquiry, index) => {
                    const property = inquiry.property && typeof inquiry.property === 'object' ? inquiry.property as PortalRecord : {};
                    return <li key={String(inquiry.id || index)} className="flex items-start gap-3 px-5 py-4 sm:px-6">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-700"><MessageSquare className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{String(inquiry.name || 'Customer')}</p>
                        <p className="truncate text-xs text-slate-500">{String(property.title || 'Assigned property')} · {String(inquiry.email || '')}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{String(inquiry.inquiry || '')}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatPortalDate(inquiry.createdAt)}</p>
                      </div>
                      <Link href={managerInquiriesHref} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">View Inquiry</Link>
                    </li>;
                  })}
                </ul>
              ) : <div className="p-8 text-center text-sm text-slate-500">{loading ? 'Loading inquiries…' : 'No assigned-property inquiries yet.'}</div>}
            </article>

            <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div><h2 className="font-bold text-slate-900">Recently Updated Properties</h2><p className="mt-1 text-xs text-slate-500">Your latest property changes</p></div>
                <Link href={managerPropertiesHref} className="text-sm font-semibold text-emerald-700 hover:underline">Manage Property</Link>
              </div>
              {dashboardErrors[managerPropertiesHref] ? (
                <div className="p-5 text-sm text-rose-700"><p>{dashboardErrors[managerPropertiesHref]}</p><button type="button" onClick={() => { const entry = managerSectionItems.find((section) => section.href === managerPropertiesHref); if (entry) void retryDashboardSection(entry); }} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"><RefreshCw className="h-3 w-3" /> Retry properties</button></div>
              ) : managerRecentProperties.length ? (
                <ul className="divide-y divide-slate-100">
                  {managerRecentProperties.map((property, index) => {
                    const primaryImage = Array.isArray(property.propertyImages)
                      ? property.propertyImages.sort((a: unknown, b: unknown) => {
                          const aIsPrimary = typeof a === 'object' && a !== null && 'isPrimary' in a ? Boolean(a.isPrimary) : false;
                          const bIsPrimary = typeof b === 'object' && b !== null && 'isPrimary' in b ? Boolean(b.isPrimary) : false;
                          return Number(bIsPrimary) - Number(aIsPrimary);
                        })[0]
                      : null;
                    const imageUrl = primaryImage && typeof primaryImage === 'object' && 'imageUrl' in primaryImage ? String(primaryImage.imageUrl) : null;
                    return (
                      <li key={String(property.id || index)} className="flex items-center gap-3 px-5 py-4 sm:px-6">
                        {imageUrl ? (
                          <img src={imageUrl} alt="" className="h-11 w-14 shrink-0 rounded-lg bg-slate-100 object-cover" />
                        ) : (
                          <span className="grid h-11 w-14 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400"><Home className="h-5 w-5" /></span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">{String(property.title || 'Untitled property')}</p>
                          <p className="flex items-center gap-1 truncate text-xs text-slate-500"><MapPin className="h-3 w-3 shrink-0" />{String(property.location || property.district || 'Location not specified')}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">{formatMoney(property.price, property.currency)} · Updated {formatPortalDate(property.updatedAt || property.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={String(property.status || property.publicationStatus || 'AVAILABLE')} />
                          <p className="mt-2"><Link href={managerPropertiesHref} className="text-xs font-semibold text-emerald-700 hover:underline">Manage</Link></p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : <div className="p-8 text-center text-sm text-slate-500">{loading ? 'Loading properties…' : 'No properties are assigned to this workspace yet.'}</div>}
            </article>
          </section>
        </>
      )}

      {!item && role === 'content_editor' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {dashboardCounts.map(({ label, href, icon: Icon, count }) => (
            <Link key={href} href={href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '…' : count ?? '—'}</p>
                </div>
                <span className="rounded-xl bg-emerald-50 p-3 text-emerald-600"><Icon className="h-5 w-5" /></span>
              </div>
              <p className="mt-4 flex items-center gap-1 text-sm font-medium text-emerald-700">Open {label.toLowerCase()} <ChevronRight className="h-4 w-4" /></p>
            </Link>
          ))}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          {item && <button type="button" onClick={() => void retryCurrentItem()} className="mt-2 inline-flex items-center gap-1 font-semibold hover:underline"><RefreshCw className="h-4 w-4" /> Retry {item.label.toLowerCase()}</button>}
        </div>
      )}

      {item && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {(item.create || showNew || editing) && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
              <p className="text-sm text-slate-500">{records.length} record{records.length === 1 ? '' : 's'}</p>
              {item.create && !showNew && !editing && (
                <button type="button" onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                  <Plus className="h-4 w-4" /> Add {item.label.replace(/s$/, '')}
                </button>
              )}
            </div>
          )}
          {(showNew || editing) && item.fields && (
            <RecordForm
              key={editing ? displayValue(editing.id) : 'new'}
              fields={item.fields}
              record={editing}
              upload={item.upload}
              saving={saving}
              onCancel={() => { setEditing(null); setShowNew(false); }}
              onSubmit={submitRecord}
            />
          )}
          {loading ? (
            <p className="p-8 text-center text-sm text-slate-500">Loading {item.label.toLowerCase()}…</p>
          ) : error ? (
            <p className="p-8 text-center text-sm text-slate-500">Data could not be loaded.</p>
          ) : records.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              {role === 'agent' && item.href === '/portal/agent/properties'
                ? 'No properties are assigned to your agent profile yet. Ask a property manager or administrator to assign a property to you.'
                : `No ${item.label.toLowerCase()} found.`}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Name</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Date</th>
                    {(item.fields || item.remove || item.approveStatus) && <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record, index) => (
                    <tr key={displayValue(record.id) === '—' ? index : displayValue(record.id)} className="hover:bg-slate-50">
                              <td className="px-5 py-4 text-sm text-slate-800">
                                <p className="font-medium">{recordTitle(record)}</p>
                                {role === 'agent' && item.href === '/portal/agent/inquiries' && (
                                  <div className="mt-1 space-y-1 text-xs font-normal text-slate-500">
                                    {typeof record.email === 'string' && <a className="mr-3 text-emerald-700 hover:underline" href={`mailto:${record.email}`}>{record.email}</a>}
                                    {typeof record.phone === 'string' && <a className="text-emerald-700 hover:underline" href={`tel:${record.phone}`}>{record.phone}</a>}
                                    {typeof record.message === 'string' && <p className="max-w-xl truncate">{record.message}</p>}
                                    {typeof record.nextFollowUpDate === 'string' && <p>Follow-up: {record.nextFollowUpDate.slice(0, 10)}</p>}
                                  </div>
                                )}
                                {role === 'agent' && item.href === '/portal/agent/viewings' && (
                                  <p className="mt-1 text-xs font-normal text-slate-500">
                                    {typeof record.preferredTime === 'string' ? record.preferredTime : ''}
                                    {record.property && typeof record.property === 'object' && 'title' in record.property
                                      ? ` · ${String(record.property.title)}`
                                      : ''}
                                  </p>
                                )}
                                {role === 'property_manager' && [managerInquiriesHref, managerViewingsHref, managerRequestsHref].includes(item.href) && (
                                  <div className="mt-1 space-y-1 text-xs font-normal text-slate-500">
                                    <p>Property: {relatedValue(record, 'property', 'title')}</p>
                                    {typeof record.email === 'string' && <a className="mr-3 text-emerald-700 hover:underline" href={`mailto:${record.email}`}>{record.email}</a>}
                                    {typeof record.phone === 'string' && <a className="text-emerald-700 hover:underline" href={`tel:${record.phone}`}>{record.phone}</a>}
                                    {typeof record.message === 'string' && <p className="max-w-xl truncate">{record.message}</p>}
                                    {item.href === managerViewingsHref && <p>Viewing: {formatPortalDate(record.preferredDate, true)}{record.preferredTime ? ` · ${String(record.preferredTime)}` : ''}</p>}
                                    {item.href === managerRequestsHref && <p>Submitted by {displayValue(record.name)} · {displayValue(record.location)}</p>}
                                  </div>
                                )}
                              </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {item.statusOptions && item.update ? (
                          <select
                            value={displayValue(record.publicationStatus ?? record.status)}
                            onChange={(event) => changeStatus(record, event.target.value)}
                            aria-label={`Change status for ${recordTitle(record)}`}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                          >
                            {item.statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                        ) : displayValue(record.status ?? record.publicationStatus ?? record.isPublished ?? record.isActive)}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {role === 'property_manager' && item.href === managerViewingsHref
                          ? formatPortalDate(record.preferredDate, true)
                          : displayValue(record.createdAt || record.preferredDate || record.publishedAt)}
                      </td>
                      {(item.fields || item.remove || item.approveStatus) && (
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {item.approveStatus && item.approvalFrom?.includes(displayValue(record.status)) && (
                              <button
                                type="button"
                                onClick={() => void approveRecord(record)}
                                aria-label={`Approve ${recordTitle(record)}`}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                              >
                                <Check className="h-3.5 w-3.5" /> Approve
                              </button>
                            )}
                            {item.fields && item.update && (
                              <button type="button" onClick={() => { setShowNew(false); setEditing(record); }} aria-label={`Edit ${recordTitle(record)}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </button>
                            )}
                            {item.remove && (
                              <button type="button" onClick={() => void deleteRecord(record)} aria-label={`${item.removeAction === 'archive' ? 'Archive' : 'Delete'} ${recordTitle(record)}`} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-medium text-rose-600 shadow-sm hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2">
                                {item.removeAction === 'archive' ? <X className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function RecordForm({
  fields,
  record,
  upload,
  saving,
  onCancel,
  onSubmit,
}: {
  fields: PortalField[];
  record: PortalRecord | null;
  upload?: (file: File) => Promise<string>;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const imagesRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [optionLists, setOptionLists] = useState<Record<string, Array<{ value: string; label: string }>>>({});
  const [optionError, setOptionError] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [availableSectors, setAvailableSectors] = useState<string[]>([]);

  useEffect(() => {
    if (record?.district && typeof record.district === 'string') {
      setSelectedDistrict(record.district);
      setAvailableSectors(getSectorsByDistrict(record.district));
    }
  }, [record?.district]);

  useEffect(() => {
    if (!record) {
      setSelectedDistrict('');
      setAvailableSectors([]);
    }
  }, [record]);

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistrict = e.target.value;
    setSelectedDistrict(newDistrict);
    setAvailableSectors(getSectorsByDistrict(newDistrict));
    // Clear sector input when district changes
    const sectorInput = document.querySelector('select[name="sector"]') as HTMLSelectElement;
    if (sectorInput) {
      sectorInput.value = '';
    }
  };

  useEffect(() => {
    let active = true;
    const optionFields = fields.filter((field) => field.loadOptions);
    Promise.all(optionFields.map(async (field) => {
      const response = await field.loadOptions!();
      const data = response && typeof response === 'object' && 'data' in response
        ? (response as { data?: unknown }).data
        : undefined;
      const options = Array.isArray(data)
        ? data.flatMap((option) => {
          if (!option || typeof option !== 'object' || !('id' in option)) return [];
          const item = option as { id: unknown; name?: unknown; title?: unknown };
          const label = typeof item.name === 'string' ? item.name : item.title;
          return typeof label === 'string' ? [{ value: String(item.id), label }] : [];
        })
        : [];
      return [field.key, options] as const;
    })).then((entries) => {
      if (active) setOptionLists(Object.fromEntries(entries));
    }).catch((reason: unknown) => {
      if (active) setOptionError(reason instanceof Error ? reason.message : 'Could not load property assignment options.');
    });
    return () => { active = false; };
  }, [fields]);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file || !upload || !imagesRef.current) return;
    setUploading(true);
    setUploadError('');
    try {
      const url = await upload(file);
      const currentUrls = imagesRef.current.value.trim();
      imagesRef.current.value = currentUrls ? `${currentUrls}\n${url}` : url;
    } catch (reason) {
      setUploadError(reason instanceof Error ? reason.message : 'Media upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="border-b border-slate-100 bg-slate-50/70 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const recordValue = field.key === 'images' && Array.isArray(record?.propertyImages)
            ? record.propertyImages.map((image) => typeof image === 'object' && image !== null && 'imageUrl' in image ? String(image.imageUrl) : '').filter(Boolean).join('\n')
            : field.key === 'amenities' && Array.isArray(record?.amenities)
              ? record.amenities.join(', ')
            : record?.[field.key];
          const value = displayValue(recordValue);
          const initial = value === '—'
            ? field.initial || ''
            : field.type === 'datetime-local'
              ? new Date(String(recordValue)).toISOString().slice(0, 16)
              : field.type === 'date'
                ? String(recordValue).slice(0, 10)
                : value;
          if (field.type === 'checkbox') {
            return (
              <label key={field.key} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" name={field.key} defaultChecked={initial === 'true'} className="h-4 w-4 accent-emerald-600" />
                {field.label}
              </label>
            );
          }
          if (field.type === 'textarea') {
            return (
              <div key={field.key} className="text-sm font-medium text-slate-700 sm:col-span-2">
                <label>{field.label}
                  <textarea ref={field.key === 'images' ? imagesRef : undefined} name={field.key} required={field.required} defaultValue={initial} rows={4} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                </label>
                {field.key === 'images' && upload && (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleFile} />
                    <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">
                      <Upload className="h-4 w-4" /> {uploading ? 'Uploading…' : 'Upload image or video'}
                    </button>
                    <span className="text-xs text-slate-500">Uploaded files are added to this property when you save.</span>
                    {uploadError && <p role="alert" className="w-full text-xs text-red-600">{uploadError}</p>}
                  </div>
                )}
              </div>
            );
          }
          if (field.type === 'select') {
            const options = field.loadOptions
              ? [{ value: '', label: field.required ? 'Select a property' : 'Unassigned' }, ...(optionLists[field.key] || [])]
              : field.key === 'district'
                ? [{ value: '', label: 'Select district' }, ...RWANDA_DISTRICTS.map(d => ({ value: d, label: d }))]
                : field.key === 'sector'
                  ? [{ value: '', label: selectedDistrict ? 'Select sector' : 'Select district first' }, ...availableSectors.map(s => ({ value: s, label: s }))]
                  : (field.options || []).map((option) => ({ value: option, label: option ? option.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : 'Not specified' }));
            return (
              <label key={field.key} className="text-sm font-medium text-slate-700">
                {field.label}
                <select 
                  name={field.key} 
                  required={field.required} 
                  defaultValue={initial || field.options?.[0]} 
                  disabled={field.key === 'sector' && !selectedDistrict}
                  onChange={field.key === 'district' ? handleDistrictChange : undefined}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            );
          }
          return (
            <label key={field.key} className="text-sm font-medium text-slate-700">
              {field.label}
              <input name={field.key} type={field.type || 'text'} required={field.required} defaultValue={initial} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            </label>
          );
        })}
      </div>
      {optionError && <p role="alert" className="mt-3 text-sm text-red-600">{optionError}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">Cancel</button>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
          <Save className="h-4 w-4" /> {saving ? 'Saving…' : record ? 'Save changes' : 'Create'}
        </button>
      </div>
    </form>
  );
}

export default function PortalWorkspace() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const userRole = user?.role.toLowerCase();
  const role: Exclude<Role, 'admin'> | null =
    userRole === 'agent' || userRole === 'property_manager' || userRole === 'content_editor'
      ? userRole
      : null;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace('/portal/login');
      return;
    }
    if (userRole === 'admin') {
      router.replace('/admin/dashboard');
      return;
    }
    if (!role) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, role, router, user, userRole]);

  const roleSlug = role === 'property_manager' ? 'property-manager' : role;
  const item = useMemo(() => {
    if (!role) return null;
    return roleMenus[role].find((entry) => pathname === entry.href) || null;
  }, [pathname, role]);

  if (isLoading || !role) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading workspace…</div>;
  }

  if (pathname !== '/portal' && pathname !== '/portal/dashboard' && !pathname.startsWith(`/portal/${roleSlug}/`)) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">This page is not available for your role.</div>;
  }

  return <WorkspaceFrame role={role}><PortalPage key={item?.href || 'dashboard'} role={role} item={item} /></WorkspaceFrame>;
}
