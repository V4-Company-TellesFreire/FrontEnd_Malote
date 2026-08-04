import type { ServiceOrderStatus, UrgencyLevel, MaloteShift, UserRole, MountingOrigin } from './constants';

// ─── User & Auth ────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeId: string | null;   // null for lab/admin
  storeName: string | null;
  isActive: boolean;
  createdAt: string;
  avatar?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

// ─── Service Order ──────────────────────────────────────────────────────────

export interface PrescriptionEye {
  esf: string;
  cil: string;
  eixo: string;
  add: string;
  dnp: string;
  alt: string;
}

export interface Prescription {
  od: PrescriptionEye;
  oe: PrescriptionEye;
  dp: string;
  dpOd: string;
  dpOe: string;
  prisOd: string;
  prisOe: string;
}

export interface ReceptionData {
  ok?: boolean;
  ts: string;
  observation?: string;
  photoUrl: string | null;
  confirmedBy?: string;
  receivedBy?: string;
  withinDeadline?: boolean | null;
  deadlineDate?: string | null;
  recipientName?: string;
}

export interface ClientPickupData {
  pickedUpBy: string;       // Client name or person picking up
  deliveredBy?: string;      // Employee who handed over
  ts: string;
  observation?: string;
  relationship?: string;
}

export interface RectificationData {
  id?: string;
  parentOsId?: string;
  childOsId?: string;
  reason: string;
  action: string;
  createdAt?: string;
  createdBy?: string;
}

export interface ServiceOrder {
  id: string;
  osNumber: string;           // Auto-generated unique OS number
  osStore: string;            // Store's own OS number
  sequence: string;
  clientName: string;
  clientPhone: string;
  storeName: string;
  storeId: string;
  malote: MaloteShift;
  status: ServiceOrderStatus;
  sellerName: string;
  entryDate: string;
  recipeType: string;
  prescription: Prescription | null;
  frameOrigin: string;
  frameMaterial: string;
  frameReference: string;
  frameColor: string;
  frameBrand: string;
  lensType: string;
  lensMaterial: string;
  treatments: string;
  externalLab: boolean;
  labName: string;
  serviceType: string;
  deadline: string;
  technician: string;
  observations: string;
  urgency: UrgencyLevel;
  urgencyReason: string;
  urgencyObservation: string;
  urgencyExtreme: string;
  receiptImageUrl: string | null;
  origin: 'loja' | 'lab';
  mountingOrigin: MountingOrigin | null;
  createdAt: string;
  statusChangedAt: string;
  reception: ReceptionData | null;
  clientPickup: ClientPickupData | null;
  rectification: RectificationData | null;
  parentOsId: string | null;  // If this is a rectification child
  isStopped: boolean;         // Critical hold
  stoppedReason: string | null;
  createdBy?: string;         // ID of the user who created this OS
  createdByRole?: string;     // Role of the user who created this OS
  pouchCode?: string | null;  // Physical pouch code
  auditLog: AuditLogEntry[];
}

// ─── Audit Log ──────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  fromStatus: ServiceOrderStatus | null;
  toStatus: ServiceOrderStatus | null;
  details: string;
}

// ─── Notifications ──────────────────────────────────────────────────────────

export interface WhatsAppNotification {
  id: string;
  type: 'receipt_ok' | 'receipt_problem' | 'ready_pickup' | 'manual';
  osNumber: string;
  clientName: string;
  storeName: string;
  malote: MaloteShift;
  timestamp: string;
  observation: string;
  photoUrl: string | null;
  receivedBy: string;
  withinDeadline: boolean | null;
  sentVia: 'auto' | 'manual';
  messagePreview: string;
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  totalOrders: number;
  ordersByStatus: Record<ServiceOrderStatus, number>;
  urgentCount: number;
  externalLabCount: number;
  mountingsKatz: number;
  mountingsExternal: number;
  deliveredToday: number;
  averageTimeByStatus: Record<ServiceOrderStatus, number>; // minutes
}

// ─── Filters ────────────────────────────────────────────────────────────────

export interface OSFilters {
  search: string;
  storeId: string;
  status: ServiceOrderStatus | '';
  malote: MaloteShift | '';
  urgency: UrgencyLevel | -1;
  dateFrom: string;
  dateTo: string;
  sellerId: string;
}

// ─── API ────────────────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export interface Store {
  id: string;
  name: string;
  malote: MaloteShift;
  activeOrderCount: number;
}

// ─── Create OS Payload ──────────────────────────────────────────────────────

export interface CreateOSPayload {
  osStore: string;
  clientName: string;
  clientPhone: string;
  storeName: string;
  sellerName: string;
  entryDate: string;
  recipeType: string;
  prescription: Prescription | null;
  frameOrigin: string;
  frameMaterial: string;
  frameReference: string;
  frameColor: string;
  frameBrand: string;
  lensType: string;
  lensMaterial: string;
  treatments: string;
  externalLab: boolean;
  labName: string;
  serviceType: string;
  deadline: string;
  technician: string;
  observations: string;
  urgency: UrgencyLevel;
  urgencyReason: string;
  urgencyObservation: string;
  urgencyExtreme: string;
  receiptImage: File | null;
}

export interface TransitionPayload {
  to: ServiceOrderStatus;
  reason?: string;
  photoUrl?: string;
  urgency?: UrgencyLevel;
  mountingOrigin?: MountingOrigin;
  receivedBy?: string;
  pouchCode?: string;
}
