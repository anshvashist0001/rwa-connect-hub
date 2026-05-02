/**
 * Google Apps Script API wrapper.
 * All data flows through a deployed Google Apps Script web app
 * which uses Google Sheets as DB and Google Drive for file storage.
 */

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';

async function gFetch<T>(action: string, body?: Record<string, unknown>): Promise<T> {
  if (!SCRIPT_URL) throw new Error('Google Script URL not configured');

  const url = `${SCRIPT_URL}?action=${action}`;
  const options: RequestInit = body
    ? { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow' }
    : { method: 'GET', redirect: 'follow' };

  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Google API error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data as T;
}

// Convert a File to base64 string
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:...;base64, prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a file to Google Drive via Apps Script
 */
export async function uploadFileToDrive(
  file: File,
  subfolder: string
): Promise<{ viewUrl: string; thumbnailUrl: string; fileName: string; fileSize: number }> {
  const base64 = await fileToBase64(file);
  return gFetch('uploadFile', {
    base64,
    fileName: file.name,
    mimeType: file.type,
    subfolder,
  });
}

// ─── Type imports ────────────────────────────────────────────────────────────
import type { Payment, Notice, Event, Member, House, GalleryImage, CommitteeMember, Document } from './api';

// ─── Payments ────────────────────────────────────────────────────────────────

export const gPaymentsApi = {
  getAll: (params?: { status?: string; search?: string }): Promise<Payment[]> =>
    gFetch<Payment[]>('getPayments').then(rows => {
      let filtered = rows;
      if (params?.status && params.status !== 'all') {
        filtered = filtered.filter(p => p.status === params.status);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(q) ||
          String(p.phone).includes(q) ||
          p.block.toLowerCase().includes(q) ||
          p.house_no.toLowerCase().includes(q)
        );
      }
      return filtered;
    }),

  submit: async (formData: FormData): Promise<{ message: string; payment: Payment }> => {
    let screenshotUrl: string | null = null;
    const file = formData.get('screenshot') as File | null;
    if (file && file.size > 0) {
      const upload = await uploadFileToDrive(file, 'screenshots');
      screenshotUrl = upload.viewUrl;
    }

    const payment = await gFetch<Payment>('createPayment', {
      name: formData.get('name'),
      phone: formData.get('phone'),
      block: formData.get('block'),
      house_no: formData.get('house_no'),
      amount: formData.get('amount'),
      payment_type: formData.get('payment_type'),
      screenshot_url: screenshotUrl,
      status: 'pending',
    });
    return { message: 'Payment submitted', payment };
  },

  checkStatus: (phone: string): Promise<Payment[]> =>
    gFetch<Payment[]>('getPayments').then(rows => rows.filter(p => String(p.phone) === String(phone))),

  updateStatus: (id: number, status: string, remarks?: string): Promise<Payment> =>
    gFetch<Payment>('updatePayment', {
      id,
      status,
      remarks: remarks || null,
      verified_at: status !== 'pending' ? new Date().toISOString() : null,
    }),

  delete: (id: number): Promise<void> => gFetch('deletePayment', { id }),
};

// ─── Notices ─────────────────────────────────────────────────────────────────

export const gNoticesApi = {
  getAll: (params?: { type?: string; search?: string }): Promise<Notice[]> =>
    gFetch<Notice[]>('getNotices').then(rows => {
      let filtered = rows;
      if (params?.type) filtered = filtered.filter(n => n.type === params.type);
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(n => n.title.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q));
      }
      return filtered;
    }),

  create: async (formData: FormData): Promise<Notice> => {
    let fileUrl: string | null = null;
    let fileName: string | null = null;
    let fileSize: string | null = null;
    const file = formData.get('file') as File | null;
    if (file && file.size > 0) {
      const upload = await uploadFileToDrive(file, 'notices');
      fileUrl = upload.viewUrl;
      fileName = upload.fileName;
      fileSize = `${Math.round(upload.fileSize / 1024)} KB`;
    }
    return gFetch<Notice>('createNotice', {
      title: formData.get('title'),
      content: formData.get('content'),
      type: formData.get('type') || 'general',
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
      is_active: true,
    });
  },

  update: async (id: number, formData: FormData): Promise<Notice> => {
    const data: Record<string, unknown> = {
      id,
      title: formData.get('title'),
      content: formData.get('content'),
      type: formData.get('type') || 'general',
    };
    const file = formData.get('file') as File | null;
    if (file && file.size > 0) {
      const upload = await uploadFileToDrive(file, 'notices');
      data.file_url = upload.viewUrl;
      data.file_name = upload.fileName;
      data.file_size = `${Math.round(upload.fileSize / 1024)} KB`;
    }
    return gFetch<Notice>('updateNotice', data);
  },

  delete: (id: number): Promise<void> => gFetch('deleteNotice', { id }),
};

// ─── Events ──────────────────────────────────────────────────────────────────

export const gEventsApi = {
  getAll: (params?: { upcoming?: string }): Promise<Event[]> =>
    gFetch<Event[]>('getEvents').then(rows => {
      if (params?.upcoming === 'true') {
        const now = new Date();
        return rows.filter(e => new Date(e.event_date) >= now);
      }
      return rows;
    }),

  create: async (formData: FormData): Promise<Event> => {
    let brochureUrl: string | null = null;
    let brochureName: string | null = null;
    const file = formData.get('brochure') as File | null;
    if (file && file.size > 0) {
      const upload = await uploadFileToDrive(file, 'events');
      brochureUrl = upload.viewUrl;
      brochureName = upload.fileName;
    }
    return gFetch<Event>('createEvent', {
      title: formData.get('title'),
      description: formData.get('description'),
      event_date: formData.get('event_date'),
      start_time: formData.get('start_time'),
      end_time: formData.get('end_time'),
      location: formData.get('location'),
      brochure_url: brochureUrl,
      brochure_name: brochureName,
      is_active: true,
    });
  },

  update: async (id: number, formData: FormData): Promise<Event> => {
    const data: Record<string, unknown> = {
      id,
      title: formData.get('title'),
      description: formData.get('description'),
      event_date: formData.get('event_date'),
      start_time: formData.get('start_time'),
      end_time: formData.get('end_time'),
      location: formData.get('location'),
    };
    const file = formData.get('brochure') as File | null;
    if (file && file.size > 0) {
      const upload = await uploadFileToDrive(file, 'events');
      data.brochure_url = upload.viewUrl;
      data.brochure_name = upload.fileName;
    }
    return gFetch<Event>('updateEvent', data);
  },

  delete: (id: number): Promise<void> => gFetch('deleteEvent', { id }),
};

// ─── Members ─────────────────────────────────────────────────────────────────

export const gMembersApi = {
  getAll: (search?: string): Promise<Member[]> =>
    gFetch<Member[]>('getMembers').then(rows => {
      if (!search) return rows;
      const q = search.toLowerCase();
      return rows.filter(m => m.name.toLowerCase().includes(q) || String(m.phone).includes(q));
    }),

  create: async (formData: FormData): Promise<Member> => {
    let photoUrl: string | null = null;
    const file = formData.get('photo') as File | null;
    if (file && file.size > 0) {
      const upload = await uploadFileToDrive(file, 'members');
      photoUrl = upload.thumbnailUrl;
    }
    return gFetch<Member>('createMember', {
      name: formData.get('name'),
      phone: formData.get('phone'),
      block: formData.get('block'),
      house_no: formData.get('house_no'),
      email: formData.get('email') || null,
      photo_url: photoUrl,
      is_active: true,
    });
  },

  update: async (id: number, formData: FormData): Promise<Member> => {
    const data: Record<string, unknown> = {
      id,
      name: formData.get('name'),
      phone: formData.get('phone'),
      block: formData.get('block'),
      house_no: formData.get('house_no'),
      email: formData.get('email') || null,
    };
    const file = formData.get('photo') as File | null;
    if (file && file.size > 0) {
      const upload = await uploadFileToDrive(file, 'members');
      data.photo_url = upload.thumbnailUrl;
    }
    return gFetch<Member>('updateMember', data);
  },

  delete: (id: number): Promise<void> => gFetch('deleteMember', { id }),
};

// ─── Houses ──────────────────────────────────────────────────────────────────

export const gHousesApi = {
  getAll: (): Promise<House[]> => gFetch<House[]>('getHouses'),

  create: (data: Partial<House>): Promise<House> => gFetch<House>('createHouse', data as Record<string, unknown>),

  update: (id: number, data: Partial<House>): Promise<House> =>
    gFetch<House>('updateHouse', { id, ...data } as Record<string, unknown>),

  delete: (id: number): Promise<void> => gFetch('deleteHouse', { id }),
};

// ─── Gallery ─────────────────────────────────────────────────────────────────

export const gGalleryApi = {
  getAll: (): Promise<GalleryImage[]> => gFetch<GalleryImage[]>('getGallery'),

  upload: async (formData: FormData): Promise<GalleryImage> => {
    const file = formData.get('image') as File;
    const upload = await uploadFileToDrive(file, 'gallery');
    return gFetch<GalleryImage>('createGallery', {
      title: formData.get('title'),
      category: formData.get('category') || 'General',
      image_url: upload.thumbnailUrl,
    });
  },

  delete: (id: number): Promise<void> => gFetch('deleteGallery', { id }),
};

// ─── Committee ───────────────────────────────────────────────────────────────

export const gCommitteeApi = {
  getAll: (): Promise<CommitteeMember[]> => gFetch<CommitteeMember[]>('getCommittee'),

  create: async (formData: FormData): Promise<CommitteeMember> => {
    let photoUrl: string | null = null;
    const file = formData.get('photo') as File | null;
    if (file && file.size > 0) {
      const upload = await uploadFileToDrive(file, 'committee');
      photoUrl = upload.thumbnailUrl;
    }
    return gFetch<CommitteeMember>('createCommittee', {
      name: formData.get('name'),
      designation: formData.get('designation'),
      phone: formData.get('phone') || null,
      email: formData.get('email') || null,
      bio: formData.get('bio') || null,
      photo_url: photoUrl,
      display_order: parseInt(formData.get('display_order') as string) || 99,
      is_active: true,
    });
  },

  update: async (id: number, formData: FormData): Promise<CommitteeMember> => {
    const data: Record<string, unknown> = {
      id,
      name: formData.get('name'),
      designation: formData.get('designation'),
      phone: formData.get('phone') || null,
      email: formData.get('email') || null,
      bio: formData.get('bio') || null,
      display_order: parseInt(formData.get('display_order') as string) || 99,
    };
    const file = formData.get('photo') as File | null;
    if (file && file.size > 0) {
      const upload = await uploadFileToDrive(file, 'committee');
      data.photo_url = upload.thumbnailUrl;
    }
    return gFetch<CommitteeMember>('updateCommittee', data);
  },

  delete: (id: number): Promise<void> => gFetch('deleteCommittee', { id }),
};

// ─── Documents ───────────────────────────────────────────────────────────────

export const gDocumentsApi = {
  getAll: (): Promise<{ documents: Document[]; grouped: Record<string, Document[]> }> =>
    gFetch<Document[]>('getDocuments').then(docs => {
      const grouped: Record<string, Document[]> = {};
      docs.forEach(d => {
        if (!grouped[d.category]) grouped[d.category] = [];
        grouped[d.category].push(d);
      });
      return { documents: docs, grouped };
    }),

  create: async (formData: FormData): Promise<Document> => {
    const file = formData.get('file') as File;
    const upload = await uploadFileToDrive(file, 'documents');
    return gFetch<Document>('createDocument', {
      title: formData.get('title'),
      category: formData.get('category'),
      file_url: upload.viewUrl,
      file_name: upload.fileName,
      file_size: `${Math.round(upload.fileSize / 1024)} KB`,
      file_type: file.type.includes('pdf') ? 'PDF' : file.type.split('/')[1]?.toUpperCase() || 'FILE',
    });
  },

  delete: (id: number): Promise<void> => gFetch('deleteDocument', { id }),
};

// ─── Dashboard (computed from sheets data) ───────────────────────────────────
import type { DashboardData } from './api';

export const gDashboardApi = {
  get: async (): Promise<DashboardData> => {
    const [payments, members, notices, events] = await Promise.all([
      gFetch<Payment[]>('getPayments'),
      gFetch<Member[]>('getMembers'),
      gFetch<Notice[]>('getNotices'),
      gFetch<Event[]>('getEvents'),
    ]);

    const now = new Date();
    return {
      stats: {
        members: {
          total: members.length,
          active: members.filter(m => m.is_active).length,
        },
        payments: {
          total: payments.length,
          pending: payments.filter(p => p.status === 'pending').length,
          approved: payments.filter(p => p.status === 'approved').length,
          rejected: payments.filter(p => p.status === 'rejected').length,
          totalCollected: payments.filter(p => p.status === 'approved').reduce((s, p) => s + parseFloat(p.amount), 0),
        },
        notices: notices.length,
        upcomingEvents: events.filter(e => new Date(e.event_date) >= now).length,
      },
      recentPayments: payments.slice(0, 3),
      recentNotices: notices.slice(0, 3),
    };
  },
};

// ─── Reports ─────────────────────────────────────────────────────────────────
import type { PaymentSummary } from './api';

export const gReportsApi = {
  payments: async (params?: { from?: string; to?: string; status?: string; block?: string; house_no?: string; name?: string }): Promise<{ payments: Payment[]; summary: PaymentSummary }> => {
    let payments = await gFetch<Payment[]>('getPayments');
    if (params?.from) payments = payments.filter(p => p.created_at >= params.from!);
    if (params?.to) payments = payments.filter(p => p.created_at <= params.to! + 'T23:59:59Z');
    if (params?.status) payments = payments.filter(p => p.status === params.status);
    if (params?.block) payments = payments.filter(p => p.block.toLowerCase() === params.block!.toLowerCase());
    if (params?.house_no) payments = payments.filter(p => p.house_no === params.house_no);
    if (params?.name) payments = payments.filter(p => p.name.toLowerCase().includes(params.name!.toLowerCase()));

    return {
      payments,
      summary: {
        total: payments.length,
        approved: payments.filter(p => p.status === 'approved').length,
        pending: payments.filter(p => p.status === 'pending').length,
        rejected: payments.filter(p => p.status === 'rejected').length,
        totalCollected: payments.filter(p => p.status === 'approved').reduce((s, p) => s + parseFloat(p.amount), 0),
      },
    };
  },
  members: (): Promise<Member[]> => gFetch<Member[]>('getMembers'),
};

// ─── Check if Google API is configured ───────────────────────────────────────

export function isGoogleConfigured(): boolean {
  return !!SCRIPT_URL;
}
