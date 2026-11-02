import { getApiBaseUrl, sanitizeUrl, isApiConfigValid } from '../config/api';

const API_BASE_URL = getApiBaseUrl();

// Validate API configuration on module load
if (typeof window !== 'undefined') {
	isApiConfigValid();
}

type QueryValue = string | number | boolean | undefined;

const buildQuery = (query: Record<string, QueryValue> = {}) => {
	const params = new URLSearchParams();
	Object.entries(query).forEach(([key, value]) => {
		if (value !== undefined) params.set(key, String(value));
	});
	const search = params.toString();
	return search ? `?${search}` : '';
};

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_token');
  }
  return null;
};

const getRefreshToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refresh_token');
  }
  return null;
};

const getUserRole = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user_role');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

const setUserRole = (role: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_role', JSON.stringify(role));
  }
};

const clearAuthData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('inactivity_logout');
  }
};

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const url = sanitizeUrl(API_BASE_URL, '/auth/refresh');
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.data?.token) {
          return null;
        }
        const newAccessToken = data.data.token as string;
        const newRefreshToken = data.data.refreshToken as string | undefined;
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_token', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }
        }
        return newAccessToken;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
};

/**
 * Determines the correct login page for a session-expiry redirect.
 *
 * Resolution order:
 *  1. Verified role stored in localStorage after a successful login
 *     (admin → /admin; portal roles → /portal/login)
 *  2. Current URL path context as a fallback
 *     (/admin/* → /admin; everything else → /portal/login)
 *
 * Exported so it can be unit-tested without DOM side-effects.
 * Never trusts unverified client-side role data for authorization —
 * the backend continues to enforce permissions.
 */
export const getLoginRedirectForRole = (storedRole: string | null, currentPathname: string): string => {
  if (typeof storedRole === 'string') {
    const role = storedRole.toLowerCase();
    if (role === 'admin') return '/admin';
    if (role === 'agent' || role === 'property_manager' || role === 'content_editor') {
      return '/portal/login';
    }
  }
  // Fallback: infer from the current route context
  if (currentPathname.startsWith('/admin') || currentPathname.startsWith('/login')) {
    return '/admin';
  }
  // Default to portal login for all other authenticated routes
  return '/portal/login';
};

const getLoginRedirect = (currentPathname: string): string =>
  getLoginRedirectForRole(getUserRole(), currentPathname);

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
	const headers = new Headers(options.headers);
	if (typeof options.body === 'string' && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}
	const url = sanitizeUrl(API_BASE_URL, path);
	const response = await fetch(url, { ...options, headers });
	const body = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(body.message || `API request failed (${response.status})`);
	return body;
};

// Authenticated request — injects Bearer token from localStorage
const authRequest = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
	const token = getToken();
	const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '';

	const headers = new Headers(options.headers);
	if (typeof options.body === 'string' && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}
	if (token) {
		headers.set('Authorization', `Bearer ${token}`);
	}

	const url = sanitizeUrl(API_BASE_URL, path);
	const response = await fetch(url, { ...options, headers });
	const body = await response.json().catch(() => ({}));

	// Handle 401 Unauthorized - JWT expired or invalid: attempt token refresh
	if (response.status === 401) {
		const newToken = await refreshAccessToken();
		if (newToken) {
			headers.set('Authorization', `Bearer ${newToken}`);
			const retryResponse = await fetch(url, { ...options, headers });
			if (retryResponse.ok) {
				return await retryResponse.json().catch(() => ({}));
			}
		}

		const loginPage = getLoginRedirect(currentPathname);
		clearAuthData();
		if (typeof window !== 'undefined') {
			window.location.href = `${loginPage}?session=expired`;
		}
		throw new Error('Session expired. Redirecting to login...');
	}

	// Handle 403 Forbidden - permission error (no redirect)
	if (response.status === 403) {
		throw new Error(body.message || 'You do not have permission to perform this action.');
	}

	if (!response.ok) {
		throw new Error(body.message || `API request failed (${response.status})`);
	}

	return body;
};

const uploadMedia = async (file: File, path: string) => {
	const token = getToken();
	const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '';
	const formData = new FormData();
	formData.append('file', file);
	const url = sanitizeUrl(API_BASE_URL, path);
	const headers: Record<string, string> = {};
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}
	const response = await fetch(url, {
		method: 'POST',
		headers,
		body: formData,
	});
	const body = await response.json().catch(() => ({}));

	// Handle 401 Unauthorized - JWT expired or invalid: attempt token refresh
	if (response.status === 401) {
		const newToken = await refreshAccessToken();
		if (newToken) {
			headers['Authorization'] = `Bearer ${newToken}`;
			const retryResponse = await fetch(url, {
				method: 'POST',
				headers,
				body: formData,
			});
			if (retryResponse.ok) {
				const retryBody = await retryResponse.json().catch(() => ({}));
				return retryBody as { data: { url: string; mediaType: 'IMAGE' | 'VIDEO' } };
			}
		}

		const loginPage = getLoginRedirect(currentPathname);
		clearAuthData();
		if (typeof window !== 'undefined') {
			window.location.href = `${loginPage}?session=expired`;
		}
		throw new Error('Session expired. Redirecting to login...');
	}

	// Handle 403 Forbidden - permission error (no redirect)
	if (response.status === 403) {
		throw new Error(body.message || 'You do not have permission to upload media.');
	}

	if (!response.ok) throw new Error(body.message || 'Media upload failed.');
	return body as { data: { url: string; mediaType: 'IMAGE' | 'VIDEO' } };
};

export const portalApi = {
	forgotPassword: (email: string) =>
		request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
	resetPassword: (token: string, password: string) =>
		request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
	getAgentProperties: () => authRequest('/agent-dashboard/my-properties'),
	getAgentInquiries: () => authRequest('/agent-dashboard/my-inquiries'),
	getAgentViewings: () => authRequest('/agent-dashboard/my-viewings'),
	updateAgentProperty: (id: string, data: Record<string, unknown>) =>
		authRequest(`/agent-dashboard/my-properties/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteAgentProperty: (id: string) =>
		authRequest(`/agent-dashboard/my-properties/${encodeURIComponent(id)}`, { method: 'DELETE' }),
	uploadAgentPropertyMedia: (file: File) => uploadMedia(file, '/agent-dashboard/property-media'),
	updateAgentInquiryStatus: (id: string, status: string) =>
		authRequest(`/agent-dashboard/my-inquiries/${encodeURIComponent(id)}/status`, {
			method: 'PATCH',
			body: JSON.stringify({ status }),
		}),
	updateAgentInquiryFollowUp: (id: string, data: { notes?: string; nextFollowUpDate?: string | null }) =>
		authRequest(`/agent-dashboard/my-inquiries/${encodeURIComponent(id)}/follow-up`, {
			method: 'PATCH',
			body: JSON.stringify(data),
		}),
	updateAgentViewingStatus: (id: string, data: Record<string, unknown>) =>
		authRequest(`/agent-dashboard/my-viewings/${encodeURIComponent(id)}`, {
			method: 'PATCH',
			body: JSON.stringify(data),
		}),
	getManagedProperties: (query?: Record<string, QueryValue>) =>
		authRequest(`/property-manager${buildQuery(query)}`),
	getAssignableAgents: () => authRequest('/property-manager/agents'),
	uploadManagedPropertyMedia: (file: File) => uploadMedia(file, '/property-manager/media'),
	createManagedProperty: (data: Record<string, unknown>) =>
		authRequest('/property-manager', { method: 'POST', body: JSON.stringify(data) }),
	updateManagedProperty: (id: string, data: Record<string, unknown>) =>
		authRequest(`/property-manager/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteManagedProperty: (id: string) =>
		authRequest(`/property-manager/${encodeURIComponent(id)}`, { method: 'DELETE' }),
	getManagedInquiries: (query?: Record<string, QueryValue>) =>
		authRequest(`/property-manager/inquiries${buildQuery(query)}`),
	updateManagedInquiry: (id: string, data: Record<string, unknown>) =>
		authRequest(`/property-manager/inquiries/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteManagedInquiry: (id: string) =>
		authRequest(`/property-manager/inquiries/${encodeURIComponent(id)}`, { method: 'DELETE' }),
	getManagedViewings: (query?: Record<string, QueryValue>) =>
		authRequest(`/property-manager/viewings${buildQuery(query)}`),
	createManagedViewing: (data: Record<string, unknown>) =>
		authRequest('/property-manager/viewings', { method: 'POST', body: JSON.stringify(data) }),
	updateManagedViewing: (id: string, data: Record<string, unknown>) =>
		authRequest(`/property-manager/viewings/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteManagedViewing: (id: string) =>
		authRequest(`/property-manager/viewings/${encodeURIComponent(id)}`, { method: 'DELETE' }),
	getManagedPropertyRequests: (query?: Record<string, QueryValue>) =>
		authRequest(`/property-manager/requests${buildQuery(query)}`),
	updateManagedListing: (id: string, data: Record<string, unknown>) =>
		authRequest(`/property-manager/requests/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
	approveManagedListing: (id: string) =>
		authRequest(`/property-manager/requests/${encodeURIComponent(id)}/approve`, { method: 'PATCH' }),
	rejectManagedListing: (id: string) =>
		authRequest(`/property-manager/requests/${encodeURIComponent(id)}/reject`, { method: 'PATCH' }),
	getManagedDevelopments: () => authRequest('/property-manager/developments'),
	getManagedDevelopment: (id: string) => authRequest(`/property-manager/developments/${id}`),
	createManagedDevelopment: (data: Record<string, unknown>) =>
		authRequest('/property-manager/developments', { method: 'POST', body: JSON.stringify(data) }),
	updateManagedDevelopment: (id: string, data: Record<string, unknown>) =>
		authRequest(`/property-manager/developments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteManagedDevelopment: (id: string) =>
		authRequest(`/property-manager/developments/${id}`, { method: 'DELETE' }),
	uploadManagedDevelopmentMedia: (file: File) => uploadMedia(file, '/property-manager/developments/media'),
	getManagedPropertyFeatures: () => authRequest('/property-manager/property-features'),
	getManagedPropertyFeature: (id: string) => authRequest(`/property-manager/property-features/${id}`),
	createManagedPropertyFeature: (data: Record<string, unknown>) =>
		authRequest('/property-manager/property-features', { method: 'POST', body: JSON.stringify(data) }),
	updateManagedPropertyFeature: (id: string, data: Record<string, unknown>) =>
		authRequest(`/property-manager/property-features/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteManagedPropertyFeature: (id: string) =>
		authRequest(`/property-manager/property-features/${id}`, { method: 'DELETE' }),
	updateProfile: (data: { name?: string; phone?: string }) =>
		authRequest('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
	getEditorArticles: () => authRequest('/content-editor/articles'),
	createEditorArticle: (data: Record<string, unknown>) =>
		authRequest('/content-editor/articles', { method: 'POST', body: JSON.stringify(data) }),
	updateEditorArticle: (id: string, data: Record<string, unknown>) =>
		authRequest(`/content-editor/articles/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteEditorArticle: (id: string) =>
		authRequest(`/content-editor/articles/${encodeURIComponent(id)}`, { method: 'DELETE' }),
	getEditorPages: () => authRequest('/content-editor/pages'),
	createEditorPage: (data: Record<string, unknown>) =>
		authRequest('/content-editor/pages', { method: 'POST', body: JSON.stringify(data) }),
	updateEditorPage: (id: string, data: Record<string, unknown>) =>
		authRequest(`/content-editor/pages/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteEditorPage: (id: string) =>
		authRequest(`/content-editor/pages/${encodeURIComponent(id)}`, { method: 'DELETE' }),
	getEditorFaqs: () => authRequest('/content-editor/faqs'),
	createEditorFaq: (data: Record<string, unknown>) =>
		authRequest('/content-editor/faqs', { method: 'POST', body: JSON.stringify(data) }),
	updateEditorFaq: (id: string, data: Record<string, unknown>) =>
		authRequest(`/content-editor/faqs/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteEditorFaq: (id: string) =>
		authRequest(`/content-editor/faqs/${encodeURIComponent(id)}`, { method: 'DELETE' }),
	getEditorTestimonials: () => authRequest('/content-editor/testimonials'),
	createEditorTestimonial: (data: Record<string, unknown>) =>
		authRequest('/content-editor/testimonials', { method: 'POST', body: JSON.stringify(data) }),
	updateEditorTestimonial: (id: string, data: Record<string, unknown>) =>
		authRequest(`/content-editor/testimonials/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteEditorTestimonial: (id: string) =>
		authRequest(`/content-editor/testimonials/${encodeURIComponent(id)}`, { method: 'DELETE' }),
	uploadEditorMedia: async (file: File) => uploadMedia(file, '/content-editor/media'),
	getArticleCategories: (query?: Record<string, QueryValue>) =>
		request(`/article-categories${buildQuery(query)}`),
};

const uploadPropertyMedia = async (file: File) => {
	return uploadMedia(file, '/admin/properties/media');
};

const uploadDevelopmentMedia = async (file: File) => {
	return uploadMedia(file, '/admin/developments/media');
};

// ─── Public API ───────────────────────────────────────────────────────────────
export const api = {
	refreshToken: (refreshToken: string) => request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
	getProperties: (query?: Record<string, QueryValue>) => request(`/properties${buildQuery(query)}`),
	savePropertySearch: (data: Record<string, unknown>) => request('/property-searches', { method: 'POST', body: JSON.stringify(data) }),
	getPropertiesByTransaction: (transactionType: string) => request(`/properties${buildQuery({ transactionType })}`),
	getPropertiesByType: (propertyType: string) => request(`/properties${buildQuery({ propertyType })}`),
	getProperty: (id: string) => request(`/properties/id/${encodeURIComponent(id)}`),
	getFavorites: (userId: string) => request(`/favorites${buildQuery({ userId })}`),
	addFavorite: (userId: string, propertyId: string) => request('/favorites', { method: 'POST', body: JSON.stringify({ userId, propertyId }) }),
	removeFavorite: (id: string) => request(`/favorites/${encodeURIComponent(id)}`, { method: 'DELETE' }),
	getAgents: (query?: Record<string, QueryValue>) => request(`/agents${buildQuery(query)}`),
	getAgent: (slug: string) => request(`/agents/${encodeURIComponent(slug)}`),
	getServices: () => request('/services'),
	getArticles: (category: string) => request(`/articles${buildQuery({ category })}`),
	getArticle: (slug: string) => request(`/articles/${encodeURIComponent(slug)}`),
	getFaqs: () => request('/faqs'),
	getCategories: () => request('/categories'),
	getArticleCategories: (query?: Record<string, QueryValue>) =>
		request(`/article-categories${buildQuery({ isActive: true, limit: 100, ...query })}`),
	getPageBySlug: (slug: string) => request(`/pages/${encodeURIComponent(slug)}`),
	createContact: (data: unknown) => request('/contact', { method: 'POST', body: JSON.stringify(data) }),
	createInquiry: (data: unknown) => request('/inquiries', { method: 'POST', body: JSON.stringify(data) }),
	createListing: (data: FormData) => request('/listings', { method: 'POST', body: data }),
	createViewing: (data: unknown) => request('/viewings', { method: 'POST', body: JSON.stringify(data) }),
	createValuation: (data: unknown) => request('/valuations', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Admin API ─────────────────────────────────────────────────────────────────
export const adminApi = {
	// Auth
	login: (email: string, password: string) =>
		request('/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
	getMe: () => authRequest('/auth/me'),

	// Dashboard
	getDashboard: () => authRequest('/admin/dashboard'),
	uploadPropertyMedia,
	uploadDevelopmentMedia,

	// Properties
	getProperties: (query?: Record<string, QueryValue>) =>
		authRequest(`/admin/properties${buildQuery(query)}`),
	getProperty: (id: string) => authRequest(`/admin/properties/${id}`),
	createProperty: (data: Record<string, unknown>) =>
		authRequest('/admin/properties', { method: 'POST', body: JSON.stringify(data) }),
	updateProperty: (id: string, data: Record<string, unknown>) =>
		authRequest(`/admin/properties/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteProperty: (id: string) =>
		authRequest(`/admin/properties/${id}`, { method: 'DELETE' }),
	getAdminProperties: (query?: Record<string, QueryValue>) =>
		authRequest(`/admin/properties${buildQuery(query)}`),
	createAdminProperty: (data: Record<string, unknown>) =>
		authRequest('/admin/properties', { method: 'POST', body: JSON.stringify(data) }),
	updateAdminProperty: (id: string, data: Record<string, unknown>) =>
		authRequest(`/admin/properties/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteAdminProperty: (id: string) =>
		authRequest(`/admin/properties/${id}`, { method: 'DELETE' }),

	// Categories
	getCategories: () => authRequest('/admin/categories'),
	getArticleCategories: (query?: Record<string, QueryValue>) =>
		authRequest(`/admin/article-categories${buildQuery({ limit: 100, ...query })}`),
	getAdminCategories: (query?: Record<string, QueryValue>) =>
		authRequest(`/admin/categories${buildQuery(query)}`),
	getAdminCategory: (id: string) =>
		authRequest(`/admin/categories/${id}`),
	createCategory: (data: Record<string, unknown>) =>
		authRequest('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
	updateCategory: (id: string, data: Record<string, unknown>) =>
		authRequest(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteCategory: (id: string) =>
		authRequest(`/admin/categories/${id}`, { method: 'DELETE' }),
	deleteAdminCategory: (id: string) =>
		authRequest(`/admin/categories/${id}`, { method: 'DELETE' }),

	// Public agent directory is still used to assign an agent to a property.
	getAgents: () => request('/agents'),
	getAssignablePropertyManagers: () => authRequest('/admin/property-managers'),

	// Inquiries
	getInquiries: (query?: Record<string, QueryValue>) =>
		authRequest(`/admin/inquiries${buildQuery(query)}`),
	getInquiry: (id: string) =>
		authRequest(`/admin/inquiries/${id}`),
	updateInquiry: (id: string, data: Record<string, unknown>) =>
		authRequest(`/admin/inquiries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteAdminInquiry: (id: string) =>
		authRequest(`/admin/inquiries/${id}`, { method: 'DELETE' }),

	// Property listing requests
	getListingRequests: () => authRequest('/admin/listings'),
	approveListingRequest: (id: string) =>
		authRequest(`/admin/listings/${id}/approve`, { method: 'PATCH' }),
	rejectListingRequest: (id: string) =>
		authRequest(`/admin/listings/${id}/reject`, { method: 'PATCH' }),

	// Viewings
	getViewings: (query?: Record<string, QueryValue>) =>
		authRequest(`/admin/viewings${buildQuery(query)}`),
	getViewing: (id: string) =>
		authRequest(`/admin/viewings/${id}`),
	updateViewing: (id: string, data: Record<string, unknown>) =>
		authRequest(`/admin/viewings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteViewing: (id: string) =>
		authRequest(`/admin/viewings/${id}`, { method: 'DELETE' }),

	// Valuations
	getValuations: (query?: Record<string, QueryValue>) =>
		authRequest(`/admin/valuations${buildQuery(query)}`),
	getValuation: (id: string) =>
		authRequest(`/admin/valuations/${id}`),
	updateValuation: (id: string, data: Record<string, unknown>) =>
		authRequest(`/admin/valuations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteValuation: (id: string) =>
		authRequest(`/admin/valuations/${id}`, { method: 'DELETE' }),

	// Services
	getAdminServices: (query?: Record<string, QueryValue>) =>
		authRequest(`/admin/services${buildQuery(query)}`),
	getAdminService: (id: string) =>
		authRequest(`/admin/services/${id}`),
	createService: (data: Record<string, unknown>) =>
		authRequest('/admin/services', { method: 'POST', body: JSON.stringify(data) }),
	updateService: (id: string, data: Record<string, unknown>) =>
		authRequest(`/admin/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteService: (id: string) =>
		authRequest(`/admin/services/${id}`, { method: 'DELETE' }),

	// Articles
	getArticles: () => authRequest('/admin/articles'),
	getAdminArticles: (query?: Record<string, QueryValue>) =>
		authRequest(`/admin/articles${buildQuery(query)}`),
	getAdminArticle: (id: string) =>
		authRequest(`/admin/articles/${id}`),
	createArticle: (data: Record<string, unknown>) =>
		authRequest('/admin/articles', { method: 'POST', body: JSON.stringify(data) }),
	updateArticle: (id: string, data: Record<string, unknown>) =>
		authRequest(`/admin/articles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteArticle: (id: string) =>
		authRequest(`/admin/articles/${id}`, { method: 'DELETE' }),
	deleteAdminArticle: (id: string) =>
		authRequest(`/admin/articles/${id}`, { method: 'DELETE' }),

	// FAQs
	getFaqs: () => authRequest('/admin/faqs'),
	getAdminFaqs: (query?: Record<string, QueryValue>) =>
		authRequest(`/admin/faqs${buildQuery(query)}`),
	getAdminFaq: (id: string) =>
		authRequest(`/admin/faqs/${id}`),
	createFaq: (data: Record<string, unknown>) =>
		authRequest('/admin/faqs', { method: 'POST', body: JSON.stringify(data) }),
	updateFaq: (id: string, data: Record<string, unknown>) =>
		authRequest(`/admin/faqs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteFaq: (id: string) =>
		authRequest(`/admin/faqs/${id}`, { method: 'DELETE' }),
	deleteAdminFaq: (id: string) =>
		authRequest(`/admin/faqs/${id}`, { method: 'DELETE' }),

	// Testimonials
	getTestimonials: (query?: Record<string, QueryValue>) =>
		authRequest(`/admin/testimonials${buildQuery(query)}`),
	getAdminTestimonial: (id: string) =>
		authRequest(`/admin/testimonials/${id}`),
	createTestimonial: (data: Record<string, unknown>) =>
		authRequest('/admin/testimonials', { method: 'POST', body: JSON.stringify(data) }),
	updateTestimonial: (id: string, data: Record<string, unknown>) =>
		authRequest(`/admin/testimonials/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteTestimonial: (id: string) =>
		authRequest(`/admin/testimonials/${id}`, { method: 'DELETE' }),

	// Users
	getUsers: (query?: Record<string, QueryValue>) =>
		authRequest(`/admin/users${buildQuery(query)}`),
	createUser: (data: Record<string, unknown>) =>
		authRequest('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
	updateUser: (id: string, data: Record<string, unknown>) =>
		authRequest(`/admin/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteUser: (id: string) =>
		authRequest(`/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),
	getRoles: () => authRequest('/admin/roles'),
	updateUserMediaPermission: (id: string, canUploadPropertyMedia: boolean) =>
		authRequest(`/admin/users/${id}/media-permission`, {
			method: 'PATCH',
			body: JSON.stringify({ canUploadPropertyMedia }),
		}),
	// Settings
	getSettings: () => authRequest('/admin/settings'),
	updateSettings: (data: Record<string, unknown>) =>
		authRequest('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),

	// Contact Messages
	getContactMessages: (query?: Record<string, QueryValue>) =>
		authRequest(`/admin/contact${buildQuery(query)}`),
	getContactMessage: (id: string) =>
		authRequest(`/admin/contact/${encodeURIComponent(id)}`),
	updateContactMessage: (id: string, data: Record<string, unknown>) =>
		authRequest(`/admin/contact/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
	replyToContactMessage: (id: string, data: { subject: string; message: string }) =>
		authRequest(`/admin/contact/${encodeURIComponent(id)}/reply`, { method: 'POST', body: JSON.stringify(data) }),
	deleteContactMessage: (id: string) =>
		authRequest(`/admin/contact/${encodeURIComponent(id)}`, { method: 'DELETE' }),

	// Analytics Cleanup
	cleanupAnalyticsData: () => authRequest('/admin/analytics/cleanup', { method: 'POST' }),
	getAnalyticsRetentionStatus: () => authRequest('/admin/analytics/retention-status'),

	// Analytics
	getAnalyticsSummary: (period?: string) =>
		authRequest(`/analytics/summary${period ? `?period=${period}` : ''}`),
	getAnalyticsDevices: (period?: string) =>
		authRequest(`/analytics/devices${period ? `?period=${period}` : ''}`),
	getAnalyticsSources: (period?: string) =>
		authRequest(`/analytics/sources${period ? `?period=${period}` : ''}`),
	getAnalyticsFunnel: (period?: string) =>
		authRequest(`/analytics/funnel${period ? `?period=${period}` : ''}`),

	// Property Features
	getPropertyFeatures: () => authRequest('/admin/property-features'),
	getPropertyFeature: (id: string) => authRequest(`/admin/property-features/${id}`),
	createPropertyFeature: (data: Record<string, unknown>) =>
		authRequest('/admin/property-features', { method: 'POST', body: JSON.stringify(data) }),
	updatePropertyFeature: (id: string, data: Record<string, unknown>) =>
		authRequest(`/admin/property-features/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deletePropertyFeature: (id: string) =>
		authRequest(`/admin/property-features/${id}`, { method: 'DELETE' }),

	// Developments
	getDevelopments: () => authRequest('/admin/developments'),
	getDevelopment: (id: string) => authRequest(`/admin/developments/${id}`),
	createDevelopment: (data: Record<string, unknown>) =>
		authRequest('/admin/developments', { method: 'POST', body: JSON.stringify(data) }),
	updateDevelopment: (id: string, data: Record<string, unknown>) =>
		authRequest(`/admin/developments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteDevelopment: (id: string) =>
		authRequest(`/admin/developments/${id}`, { method: 'DELETE' }),

	// Pages
	getAdminPages: (query?: Record<string, QueryValue>) =>
		authRequest(`/admin/pages${buildQuery(query)}`),
	getAdminPage: (id: string) =>
		authRequest(`/admin/pages/${id}`),
	createPage: (data: Record<string, unknown>) =>
		authRequest('/admin/pages', { method: 'POST', body: JSON.stringify(data) }),
	updatePage: (id: string, data: Record<string, unknown>) =>
		authRequest(`/admin/pages/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deletePage: (id: string) =>
		authRequest(`/admin/pages/${id}`, { method: 'DELETE' }),
};

export default api;
