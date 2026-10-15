const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

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

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
	const headers = new Headers(options.headers);
	if (typeof options.body === 'string' && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}
	const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
	const body = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(body.message || `API request failed (${response.status})`);
	return body;
};

// Authenticated request — injects Bearer token from localStorage
const authRequest = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
	const token = getToken();
	return request<T>(path, {
		...options,
		headers: {
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...(options.headers || {}),
		},
	});
};

const uploadMedia = async (file: File, path: string) => {
	const token = getToken();
	const formData = new FormData();
	formData.append('file', file);
	const response = await fetch(`${API_BASE_URL}${path}`, {
		method: 'POST',
		headers: token ? { Authorization: `Bearer ${token}` } : {},
		body: formData,
	});
	const body = await response.json().catch(() => ({}));
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
};

const uploadPropertyMedia = async (file: File) => {
	return uploadMedia(file, '/admin/properties/media');
};

// ─── Public API ───────────────────────────────────────────────────────────────
export const api = {
	getProperties: (query?: Record<string, QueryValue>) => request(`/properties${buildQuery(query)}`),
	savePropertySearch: (data: Record<string, unknown>) => request('/property-searches', { method: 'POST', body: JSON.stringify(data) }),
	getPropertiesByTransaction: (transactionType: string) => request(`/properties${buildQuery({ transactionType })}`),
	getPropertiesByType: (propertyType: string) => request(`/properties${buildQuery({ propertyType })}`),
	getProperty: (slug: string) => request(`/properties/${encodeURIComponent(slug)}`),
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
	createContact: (data: unknown) => request('/contact', { method: 'POST', body: JSON.stringify(data) }),
	createInquiry: (data: unknown) => request('/inquiries', { method: 'POST', body: JSON.stringify(data) }),
	createListing: (data: FormData) => request('/listings', { method: 'POST', body: data }),
	createViewing: (data: unknown) => request('/viewings', { method: 'POST', body: JSON.stringify(data) }),
	createValuation: (data: unknown) => request('/valuations', { method: 'POST', body: JSON.stringify(data) }),

	// Analytics (public endpoints, no auth required)
	trackPageView: (data: { pagePath: string; pageTitle?: string; referrer?: string }) =>
		request('/analytics/page-view', { method: 'POST', body: JSON.stringify(data) }),
	trackPropertyView: (data: { propertyId: string; sessionDurationSeconds?: number; referrer?: string }) =>
		request('/analytics/property-view', { method: 'POST', body: JSON.stringify(data) }),
	trackClickEvent: (data: {
		eventType: 'CTA' | 'PHONE' | 'EMAIL' | 'WHATSAPP' | 'LINK' | 'BUTTON';
		propertyId?: string;
		elementId?: string;
		elementText?: string;
		pagePath: string;
		destinationUrl?: string;
	}) => request('/analytics/click-event', { method: 'POST', body: JSON.stringify(data) }),
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

	// Categories (Property Categories & Unified)
	getCategories: () => authRequest('/admin/categories'),
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

	// Article Categories
	getArticleCategories: (query?: Record<string, QueryValue>) =>
		authRequest(`/admin/article-categories${buildQuery(query)}`),
	getArticleCategory: (id: string) =>
		authRequest(`/admin/article-categories/${id}`),
	createArticleCategory: (data: Record<string, unknown>) =>
		authRequest('/admin/article-categories', { method: 'POST', body: JSON.stringify(data) }),
	updateArticleCategory: (id: string, data: Record<string, unknown>) =>
		authRequest(`/admin/article-categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	deleteArticleCategory: (id: string) =>
		authRequest(`/admin/article-categories/${id}`, { method: 'DELETE' }),

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

	// Contact Messages
	getContactMessages: (query?: Record<string, QueryValue>) =>
		authRequest(`/admin/contact${buildQuery(query)}`),
	getContactMessage: (id: string) =>
		authRequest(`/admin/contact/${id}`),
	updateContactMessage: (id: string, data: Record<string, unknown>) =>
		authRequest(`/admin/contact/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
	 replyToContactMessage: (id: string, data: { subject: string; message: string }) =>
		authRequest(`/admin/contact/${id}/reply`, { method: 'POST', body: JSON.stringify(data) }),
	deleteContactMessage: (id: string) =>
		authRequest(`/admin/contact/${id}`, { method: 'DELETE' }),

	// Property listing requests
	getListingRequests: () => authRequest('/admin/listings'),
	updateListingRequest: (id: string, data: Record<string, unknown>) =>
		authRequest(`/admin/listings/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
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

	// Analytics
	getAnalyticsSummary: (period?: string) =>
		authRequest(`/analytics/summary${buildQuery({ period })}`),
	getDeviceBreakdown: (period?: string) =>
		authRequest(`/analytics/devices${buildQuery({ period })}`),
	getTrafficSources: (period?: string) =>
		authRequest(`/analytics/sources${buildQuery({ period })}`),
	exportAnalyticsCsv: (period?: string) =>
		authRequest(`/analytics/export/csv${buildQuery({ period })}`),
	getPropertyAnalytics: (propertyId: string, period?: string) =>
		authRequest(`/analytics/property/${propertyId}${buildQuery({ period })}`),
	getConversionFunnel: (period?: string) =>
		authRequest(`/analytics/funnel${buildQuery({ period })}`),
};

export default api;
