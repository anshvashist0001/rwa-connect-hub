/**
 * Shared localStorage store for demo mode.
 * Admin pages write here → public pages read from here.
 * Works without a database, persists across page refreshes.
 */

import type { Notice, Event, GalleryImage } from "./api";

// ─── Clear old mock data (one-time migration) ───────────────────────────────
const STORE_VERSION_KEY = "demo_store_version";
const CURRENT_VERSION = "2";
if (localStorage.getItem(STORE_VERSION_KEY) !== CURRENT_VERSION) {
  ["demo_notices", "demo_events", "demo_gallery", "demo_committee", "demo_documents", "demo_payments", "demo_members", "demo_houses"].forEach((k) => localStorage.removeItem(k));
  localStorage.setItem(STORE_VERSION_KEY, CURRENT_VERSION);
}

// ─── Default seed data ────────────────────────────────────────────────────────

export const DEFAULT_NOTICES: Notice[] = [];

export const DEFAULT_EVENTS: Event[] = [];

export const DEFAULT_GALLERY: GalleryImage[] = [];

// ─── Generic helpers ──────────────────────────────────────────────────────────

function load<T>(key: string, defaults: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : defaults;
  } catch {
    return defaults;
  }
}

function save<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

function nextId<T extends { id: number }>(items: T[]): number {
  return items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
}

// ─── Notices ──────────────────────────────────────────────────────────────────

const NK = "demo_notices";

export const demoNotices = {
  getAll: (): Notice[] => load<Notice>(NK, DEFAULT_NOTICES),

  create: (data: Omit<Notice, "id" | "created_at" | "updated_at">): Notice => {
    const all = load<Notice>(NK, DEFAULT_NOTICES);
    const item: Notice = {
      ...data,
      id: nextId(all),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    save(NK, [item, ...all]);
    return item;
  },

  update: (id: number, data: Partial<Notice>): Notice => {
    const all = load<Notice>(NK, DEFAULT_NOTICES);
    const updated = all.map((n) =>
      n.id === id ? { ...n, ...data, updated_at: new Date().toISOString() } : n
    );
    save(NK, updated);
    return updated.find((n) => n.id === id)!;
  },

  delete: (id: number): void => {
    const all = load<Notice>(NK, DEFAULT_NOTICES);
    save(NK, all.filter((n) => n.id !== id));
  },
};

// ─── Events ───────────────────────────────────────────────────────────────────

const EK = "demo_events";

export const demoEvents = {
  getAll: (): Event[] => load<Event>(EK, DEFAULT_EVENTS),

  create: (data: Omit<Event, "id" | "created_at">): Event => {
    const all = load<Event>(EK, DEFAULT_EVENTS);
    const item: Event = {
      ...data,
      id: nextId(all),
      created_at: new Date().toISOString(),
    };
    save(EK, [item, ...all]);
    return item;
  },

  update: (id: number, data: Partial<Event>): Event => {
    const all = load<Event>(EK, DEFAULT_EVENTS);
    const updated = all.map((e) => (e.id === id ? { ...e, ...data } : e));
    save(EK, updated);
    return updated.find((e) => e.id === id)!;
  },

  delete: (id: number): void => {
    const all = load<Event>(EK, DEFAULT_EVENTS);
    save(EK, all.filter((e) => e.id !== id));
  },
};

// ─── Gallery ──────────────────────────────────────────────────────────────────

const GK = "demo_gallery";

export const demoGallery = {
  getAll: (): GalleryImage[] => load<GalleryImage>(GK, DEFAULT_GALLERY),

  create: (data: Omit<GalleryImage, "id" | "created_at">): GalleryImage => {
    const all = load<GalleryImage>(GK, DEFAULT_GALLERY);
    const item: GalleryImage = {
      ...data,
      id: nextId(all),
      created_at: new Date().toISOString(),
    };
    save(GK, [item, ...all]);
    return item;
  },

  delete: (id: number): void => {
    const all = load<GalleryImage>(GK, DEFAULT_GALLERY);
    save(GK, all.filter((g) => g.id !== id));
  },
};

// ─── Committee ────────────────────────────────────────────────────────────────

import type { CommitteeMember } from "./api";

const DEFAULT_COMMITTEE: CommitteeMember[] = [];

const CK = "demo_committee";

export const demoCommittee = {
  getAll: (): CommitteeMember[] => load<CommitteeMember>(CK, DEFAULT_COMMITTEE),

  create: (data: Omit<CommitteeMember, "id" | "created_at" | "updated_at">): CommitteeMember => {
    const all = load<CommitteeMember>(CK, DEFAULT_COMMITTEE);
    const item: CommitteeMember = {
      ...data,
      id: nextId(all),
    };
    save(CK, [item, ...all]);
    return item;
  },

  update: (id: number, data: Partial<CommitteeMember>): CommitteeMember => {
    const all = load<CommitteeMember>(CK, DEFAULT_COMMITTEE);
    const updated = all.map((c) => (c.id === id ? { ...c, ...data } : c));
    save(CK, updated);
    return updated.find((c) => c.id === id)!;
  },

  delete: (id: number): void => {
    const all = load<CommitteeMember>(CK, DEFAULT_COMMITTEE);
    save(CK, all.filter((c) => c.id !== id));
  },
};

// ─── Documents ────────────────────────────────────────────────────────────────

import type { Document } from "./api";

const DEFAULT_DOCUMENTS: Document[] = [];

const DK = "demo_documents";

export const demoDocuments = {
  getAll: (): Document[] => load<Document>(DK, DEFAULT_DOCUMENTS),

  create: (data: Omit<Document, "id" | "created_at">): Document => {
    const all = load<Document>(DK, DEFAULT_DOCUMENTS);
    const item: Document = {
      ...data,
      id: nextId(all),
      created_at: new Date().toISOString(),
    };
    save(DK, [item, ...all]);
    return item;
  },

  delete: (id: number): void => {
    const all = load<Document>(DK, DEFAULT_DOCUMENTS);
    save(DK, all.filter((d) => d.id !== id));
  },
};

// ─── Payments ─────────────────────────────────────────────────────────────────

import type { Payment } from "./api";

const DEFAULT_PAYMENTS: Payment[] = [];

const PK = "demo_payments";

export const demoPayments = {
  getAll: (): Payment[] => load<Payment>(PK, DEFAULT_PAYMENTS),

  create: (data: Omit<Payment, "id" | "created_at" | "updated_at" | "verified_at">): Payment => {
    const all = load<Payment>(PK, DEFAULT_PAYMENTS);
    const item: Payment = {
      ...data,
      id: nextId(all),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      verified_at: null,
    };
    save(PK, [item, ...all]);
    return item;
  },

  updateStatus: (id: number, status: Payment["status"], remarks?: string): Payment => {
    const all = load<Payment>(PK, DEFAULT_PAYMENTS);
    const updated = all.map((p) =>
      p.id === id ? { ...p, status, remarks: remarks || p.remarks, updated_at: new Date().toISOString(), verified_at: status !== "pending" ? new Date().toISOString() : p.verified_at } : p
    );
    save(PK, updated);
    return updated.find((p) => p.id === id)!;
  },
};

// ─── Members ──────────────────────────────────────────────────────────────────

import type { Member } from "./api";

const DEFAULT_MEMBERS: Member[] = [];

const MK = "demo_members";

export const demoMembers = {
  getAll: (): Member[] => load<Member>(MK, DEFAULT_MEMBERS),

  create: (data: Omit<Member, "id" | "created_at">): Member => {
    const all = load<Member>(MK, DEFAULT_MEMBERS);
    const item: Member = {
      ...data,
      id: nextId(all),
      created_at: new Date().toISOString(),
    };
    save(MK, [item, ...all]);
    return item;
  },

  update: (id: number, data: Partial<Member>): Member => {
    const all = load<Member>(MK, DEFAULT_MEMBERS);
    const updated = all.map((m) => (m.id === id ? { ...m, ...data } : m));
    save(MK, updated);
    return updated.find((m) => m.id === id)!;
  },

  delete: (id: number): void => {
    const all = load<Member>(MK, DEFAULT_MEMBERS);
    save(MK, all.filter((m) => m.id !== id));
  },
};

// ─── Houses ───────────────────────────────────────────────────────────────────

import type { House } from "./api";

const DEFAULT_HOUSES: House[] = [];

const HK = "demo_houses";

export const demoHouses = {
  getAll: (): House[] => load<House>(HK, DEFAULT_HOUSES),

  create: (data: Partial<House>): House => {
    const all = load<House>(HK, DEFAULT_HOUSES);
    const item: House = {
      ...data,
      id: nextId(all),
    } as House;
    save(HK, [item, ...all]);
    return item;
  },

  update: (id: number, data: Partial<House>): House => {
    const all = load<House>(HK, DEFAULT_HOUSES);
    const updated = all.map((h) => (h.id === id ? { ...h, ...data } : h));
    save(HK, updated);
    return updated.find((h) => h.id === id)!;
  },

  delete: (id: number): void => {
    const all = load<House>(HK, DEFAULT_HOUSES);
    save(HK, all.filter((h) => h.id !== id));
  },
};
