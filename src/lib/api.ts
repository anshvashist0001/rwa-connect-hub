import {
  isGoogleConfigured,
  gPaymentsApi, gNoticesApi, gEventsApi, gMembersApi,
  gHousesApi, gGalleryApi, gCommitteeApi, gDocumentsApi,
  gDashboardApi, gReportsApi,
} from './googleApi';

const useGoogle = isGoogleConfigured();

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken(): string | null {
  return localStorage.getItem('rwa_admin_token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

async function upload<T>(path: string, formData: FormData, method = 'POST'): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { ...authHeaders() } as HeadersInit,
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth (always local — Google Sheets doesn't handle auth)
export const authApi = {
  login: (username: string, password: string) =>
    request<{ token: string; admin: Admin }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<Admin>('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// Notices — Google Sheets when configured
export const noticesApi = useGoogle ? {
  getAll: (params?: { type?: string; search?: string }) => gNoticesApi.getAll(params),
  create: (data: FormData) => gNoticesApi.create(data),
  update: (id: number, data: FormData) => gNoticesApi.update(id, data),
  delete: (id: number) => gNoticesApi.delete(id) as Promise<unknown>,
} : {
  getAll: (params?: { type?: string; search?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<Notice[]>(`/notices${q ? '?' + q : ''}`);
  },
  create: (data: FormData) => upload<Notice>('/notices', data),
  update: (id: number, data: FormData) => upload<Notice>(`/notices/${id}`, data, 'PUT'),
  delete: (id: number) => request(`/notices/${id}`, { method: 'DELETE' }),
};

// Events — Google Sheets when configured
export const eventsApi = useGoogle ? {
  getAll: (params?: { upcoming?: string }) => gEventsApi.getAll(params),
  create: (data: FormData) => gEventsApi.create(data),
  update: (id: number, data: FormData) => gEventsApi.update(id, data),
  delete: (id: number) => gEventsApi.delete(id) as Promise<unknown>,
} : {
  getAll: (params?: { upcoming?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<Event[]>(`/events${q ? '?' + q : ''}`);
  },
  create: (data: FormData) => upload<Event>('/events', data),
  update: (id: number, data: FormData) => upload<Event>(`/events/${id}`, data, 'PUT'),
  delete: (id: number) => request(`/events/${id}`, { method: 'DELETE' }),
};

// Payments — Google Sheets when configured
export const paymentsApi = useGoogle ? {
  submit: (data: FormData) => gPaymentsApi.submit(data),
  checkStatus: (phone: string) => gPaymentsApi.checkStatus(phone),
  getAll: (params?: { status?: string; search?: string }) => gPaymentsApi.getAll(params),
  updateStatus: (id: number, status: string, remarks?: string) => gPaymentsApi.updateStatus(id, status, remarks),
  delete: (id: number) => gPaymentsApi.delete(id) as Promise<unknown>,
} : {
  submit: (data: FormData) => upload<{ message: string; payment: Payment }>('/payments', data),
  checkStatus: (phone: string) => request<Payment[]>(`/payments/check?phone=${encodeURIComponent(phone)}`),
  getAll: (params?: { status?: string; search?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<Payment[]>(`/payments${q ? '?' + q : ''}`);
  },
  updateStatus: (id: number, status: string, remarks?: string) =>
    request<Payment>(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, remarks }),
    }),
  delete: (id: number) => request(`/payments/${id}`, { method: 'DELETE' }),
};

// Documents — Google Sheets when configured
export const documentsApi = useGoogle ? {
  getAll: () => gDocumentsApi.getAll(),
  create: (data: FormData) => gDocumentsApi.create(data),
  delete: (id: number) => gDocumentsApi.delete(id) as Promise<unknown>,
} : {
  getAll: () => request<{ documents: Document[]; grouped: Record<string, Document[]> }>('/documents'),
  create: (data: FormData) => upload<Document>('/documents', data),
  delete: (id: number) => request(`/documents/${id}`, { method: 'DELETE' }),
};

// Members — Google Sheets when configured
export const membersApi = useGoogle ? {
  getAll: (search?: string) => gMembersApi.getAll(search),
  create: (data: FormData) => gMembersApi.create(data),
  update: (id: number, data: FormData) => gMembersApi.update(id, data),
  delete: (id: number) => gMembersApi.delete(id) as Promise<unknown>,
} : {
  getAll: (search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<Member[]>(`/members${q}`);
  },
  create: (data: FormData) => upload<Member>('/members', data),
  update: (id: number, data: FormData) => upload<Member>(`/members/${id}`, data, 'PUT'),
  delete: (id: number) => request(`/members/${id}`, { method: 'DELETE' }),
};

// Houses — Google Sheets when configured
export const housesApi = useGoogle ? {
  getAll: () => gHousesApi.getAll(),
  create: (data: Partial<House>) => gHousesApi.create(data),
  update: (id: number, data: Partial<House>) => gHousesApi.update(id, data),
  delete: (id: number) => gHousesApi.delete(id) as Promise<unknown>,
} : {
  getAll: () => request<House[]>('/houses'),
  create: (data: Partial<House>) => request<House>('/houses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<House>) =>
    request<House>(`/houses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request(`/houses/${id}`, { method: 'DELETE' }),
};

// Dashboard — Google Sheets when configured
export const dashboardApi = useGoogle ? {
  get: () => gDashboardApi.get(),
} : {
  get: () => request<DashboardData>('/dashboard'),
};

// Reports — Google Sheets when configured
export const reportsApi = useGoogle ? {
  payments: (params?: { from?: string; to?: string; status?: string; block?: string; house_no?: string; name?: string }) => gReportsApi.payments(params),
  members: () => gReportsApi.members(),
} : {
  payments: (params?: { from?: string; to?: string; status?: string; block?: string; house_no?: string; name?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ payments: Payment[]; summary: PaymentSummary }>(`/reports/payments${q ? '?' + q : ''}`);
  },
  members: () => request<Member[]>('/reports/members'),
};

// Gallery — Google Sheets when configured
export const galleryApi = useGoogle ? {
  getAll: () => gGalleryApi.getAll(),
  upload: (data: FormData) => gGalleryApi.upload(data),
  delete: (id: number) => gGalleryApi.delete(id) as Promise<unknown>,
} : {
  getAll: () => request<GalleryImage[]>('/gallery'),
  upload: (data: FormData) => upload<GalleryImage>('/gallery', data),
  delete: (id: number) => request(`/gallery/${id}`, { method: 'DELETE' }),
};

// Committee — Google Sheets when configured
export const committeeApi = useGoogle ? {
  getAll: () => gCommitteeApi.getAll(),
  create: (data: FormData) => gCommitteeApi.create(data),
  update: (id: number, data: FormData) => gCommitteeApi.update(id, data),
  delete: (id: number) => gCommitteeApi.delete(id) as Promise<unknown>,
} : {
  getAll: () => request<CommitteeMember[]>('/committee'),
  create: (data: FormData) => upload<CommitteeMember>('/committee', data),
  update: (id: number, data: FormData) => upload<CommitteeMember>(`/committee/${id}`, data, 'PUT'),
  delete: (id: number) => request(`/committee/${id}`, { method: 'DELETE' }),
};

// Logs (always local — no Google Sheets equivalent)
export const logsApi = {
  getAll: (params?: { action?: string; entity_type?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<AdminLog[]>(`/logs${q ? '?' + q : ''}`);
  },
};

// Types
export interface Admin {
  id: number;
  username: string;
  name: string;
  role: string;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  type: 'alert' | 'important' | 'general';
  file_url: string | null;
  file_name: string | null;
  file_size: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  brochure_url: string | null;
  brochure_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Payment {
  id: number;
  name: string;
  phone: string;
  block: string;
  house_no: string;
  amount: string;
  payment_type: string;
  screenshot_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  remarks: string | null;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
}

export interface Document {
  id: number;
  title: string;
  category: string;
  file_url: string;
  file_name: string;
  file_size: string;
  file_type: string;
  created_at: string;
}

export interface Member {
  id: number;
  name: string;
  phone: string;
  block: string;
  house_no: string;
  email: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface House {
  id: number;
  block: string;
  house_no: string;
  floor: number | null;
  type: string | null;
  member_id: number | null;
  member_name: string | null;
  member_phone: string | null;
}

export interface DashboardData {
  stats: {
    members: { total: number; active: number };
    payments: { total: number; pending: number; approved: number; rejected: number; totalCollected: number };
    notices: number;
    upcomingEvents: number;
  };
  recentPayments: Partial<Payment>[];
  recentNotices: Partial<Notice>[];
}

export interface PaymentSummary {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  totalCollected: number;
}

export interface CommitteeMember {
  id: number;
  name: string;
  designation: string;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  bio: string | null;
  display_order: number;
  is_active: boolean;
}

export interface GalleryImage {
  id: number;
  title: string;
  category: string;
  image_url: string;
  created_at: string;
}

export interface AdminLog {
  id: number;
  admin_id: number;
  admin_name: string;
  username: string;
  action: string;
  entity_type: string;
  entity_id: number;
  details: Record<string, unknown> | null;
  created_at: string;
}
