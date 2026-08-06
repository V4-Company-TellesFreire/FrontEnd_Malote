// ─── Store Configuration ────────────────────────────────────────────────────

export type MaloteShift = 'Manhã' | 'Tarde' | 'Noite';

export interface StoreConfig {
  readonly id: string;
  readonly name: string;
  readonly malote: MaloteShift;
}

export const MALOTE_SHIFTS: readonly MaloteShift[] = ['Manhã', 'Tarde', 'Noite'] as const;

export const MALOTE_SHIFT_META: Record<MaloteShift, { label: string; color: string; bg: string; border: string }> = {
  'Manhã': { label: 'Malote Manhã', color: 'text-malote-manha', bg: 'bg-malote-manha-light', border: 'border-malote-manha' },
  'Tarde': { label: 'Malote Tarde', color: 'text-malote-tarde', bg: 'bg-malote-tarde-light', border: 'border-malote-tarde' },
  'Noite': { label: 'Malote Noite', color: 'text-malote-noite', bg: 'bg-malote-noite-light', border: 'border-malote-noite' },
};

export const STORES_BY_SHIFT: Record<MaloteShift, readonly string[]> = {
  'Manhã': ['Norte 1', 'Norte 2', 'Freguesia 1', 'Freguesia 2', 'Freguesia 3', 'Plaza'],
  'Tarde': ['Centro 1', 'Centro 2', 'Centro 3', 'Tijuca 1', 'Tijuca 2', 'Tijuca 3'],
  'Noite': ['Gávea', 'Ipanema', 'Copa 1', 'Copa 2', 'Copa 3', 'JB 1', 'JB 2'],
} as const;

export const ALL_STORES: StoreConfig[] = (Object.entries(STORES_BY_SHIFT) as [MaloteShift, readonly string[]][])
  .flatMap(([malote, stores]) =>
    stores.map((name) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      malote,
    }))
  );

export function getStoreByName(name: string): StoreConfig | undefined {
  return ALL_STORES.find((s) => s.name === name);
}

export function getMaloteForStore(storeName: string): MaloteShift | null {
  for (const [shift, stores] of Object.entries(STORES_BY_SHIFT) as [MaloteShift, readonly string[]][]) {
    if (stores.includes(storeName)) return shift;
  }
  return null;
}

// ─── Pipeline Status (State Machine) ────────────────────────────────────────

export const SERVICE_ORDER_STATUSES = [
  'Chegada de Malote',
  'Envio Laboratório',
  'Montagem',
  'Controle de Qualidade',
  'Separando',
  'Pronto para Expedição',
  'Em Rota',
  'Entregue na Loja',
  'Entregue c/ Ressalva',
  'Entregue ao Cliente',
] as const;

export type ServiceOrderStatus = (typeof SERVICE_ORDER_STATUSES)[number];

export interface StatusMeta {
  readonly key: ServiceOrderStatus;
  readonly index: number;
  readonly color: string;
  readonly bgColor: string;
  readonly textColor: string;
  readonly isFinal: boolean;
  readonly isDelivery: boolean;
  readonly requiresReason: boolean;
}

export const STATUS_META: Record<ServiceOrderStatus, StatusMeta> = {
  'Chegada de Malote':      { key: 'Chegada de Malote',      index: 0, color: '#FFC20E', bgColor: '#FFFAEC', textColor: '#785D0D', isFinal: false, isDelivery: false, requiresReason: false },
  'Envio Laboratório':      { key: 'Envio Laboratório',      index: 1, color: '#4338CA', bgColor: '#E0E7FF', textColor: '#4338CA', isFinal: false, isDelivery: false, requiresReason: false },
  'Montagem':               { key: 'Montagem',               index: 2, color: '#DC8C0A', bgColor: '#FEF7E0', textColor: '#92400E', isFinal: false, isDelivery: false, requiresReason: false },
  'Controle de Qualidade':  { key: 'Controle de Qualidade',  index: 3, color: '#64748B', bgColor: '#F1F5F9', textColor: '#475569', isFinal: false, isDelivery: false, requiresReason: false },
  'Separando':              { key: 'Separando',              index: 4, color: '#0891B2', bgColor: '#CFFAFE', textColor: '#0C4A6E', isFinal: false, isDelivery: false, requiresReason: false },
  'Pronto para Expedição':  { key: 'Pronto para Expedição',  index: 5, color: '#7C3AED', bgColor: '#F3E8FF', textColor: '#7C3AED', isFinal: false, isDelivery: false, requiresReason: false },
  'Em Rota':                { key: 'Em Rota',                index: 6, color: '#0369A1', bgColor: '#BAE6FD', textColor: '#0369A1', isFinal: false, isDelivery: false, requiresReason: false },
  'Entregue na Loja':       { key: 'Entregue na Loja',       index: 7, color: '#0D9F6F', bgColor: '#D1FAE5', textColor: '#065F46', isFinal: false, isDelivery: true,  requiresReason: false },
  'Entregue c/ Ressalva':   { key: 'Entregue c/ Ressalva',   index: 8, color: '#D92B4B', bgColor: '#FFE4E6', textColor: '#BE123C', isFinal: false, isDelivery: true,  requiresReason: true },
  'Entregue ao Cliente':    { key: 'Entregue ao Cliente',    index: 9, color: '#064E3B', bgColor: '#A7F3D0', textColor: '#064E3B', isFinal: true,  isDelivery: true,  requiresReason: false },
};

/**
 * Returns valid next statuses from a given status.
 * The pipeline is strictly linear (no skipping), except:
 * - "Entregue c/ Ressalva" is a deviation from "Entregue na Loja" (same index level)
 * - From "Entregue na Loja" OR "Entregue c/ Ressalva" → "Entregue ao Cliente"
 */
export function getValidTransitions(currentStatus: ServiceOrderStatus): ServiceOrderStatus[] {
  const meta = STATUS_META[currentStatus];
  // Defensive: unknown status (e.g. from API returning unaccented variant) → no transitions
  if (!meta) return [];
  if (meta.isFinal) return [];

  switch (currentStatus) {
    case 'Em Rota':
      return ['Entregue na Loja', 'Entregue c/ Ressalva'];
    case 'Entregue na Loja':
    case 'Entregue c/ Ressalva':
      return ['Entregue ao Cliente'];
    default: {
      const nextIndex = meta.index + 1;
      const nextStatus = SERVICE_ORDER_STATUSES[nextIndex];
      return nextStatus ? [nextStatus] : [];
    }
  }
}

export function canTransitionTo(from: ServiceOrderStatus, to: ServiceOrderStatus): boolean {
  return getValidTransitions(from).includes(to);
}

export function getPreviousStatus(currentStatus: ServiceOrderStatus): ServiceOrderStatus | null {
  const meta = STATUS_META[currentStatus];
  if (!meta) return null;
  if (meta.index === 0) return null;
  if (currentStatus === 'Entregue c/ Ressalva') return 'Em Rota';
  if (currentStatus === 'Entregue ao Cliente') return null; // Cannot go back from final
  return SERVICE_ORDER_STATUSES[meta.index - 1] ?? null;
}

// ─── Urgency ────────────────────────────────────────────────────────────────

export const URGENCY_LEVELS = [
  { value: 0, label: 'Normal', description: 'Prazo padrão', color: 'transparent' },
  { value: 1, label: 'Urgente', description: 'Cliente aguarda', color: '#DC8C0A' },
  { value: 2, label: 'Super urgente', description: 'Prioridade máxima', color: '#D92B4B' },
] as const;

export type UrgencyLevel = 0 | 1 | 2;

export const URGENCY_REASONS: Record<1 | 2, readonly string[]> = {
  1: ['Cliente aguardando na loja', 'Prazo de evento', 'Reposição urgente', 'Correção de erro anterior', 'Outros'],
  2: ['Única armação (sem enxergar)', 'Emergência médica', 'Prazo crítico - menos de 24h', 'Falha de montagem anterior', 'Outros'],
};

// ─── Time Alert Thresholds (minutes) ────────────────────────────────────────

export const TIME_ALERT_THRESHOLDS = {
  normal: 60,      // < 60 min → Normal
  attention: 180,   // 60–180 min → Atenção
  // > 180 min → Crítico
} as const;

export type TimeAlertLevel = 'normal' | 'attention' | 'critical';

// ─── User Roles ─────────────────────────────────────────────────────────────

export const USER_ROLES = ['vendedor', 'gerente', 'laboratorio', 'admin', 'motoboy'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  vendedor: 'Vendedor',
  gerente: 'Gerente de Loja',
  laboratorio: 'Laboratório',
  admin: 'Supervisor / Admin',
  motoboy: 'Motoboy',
};

// ─── Lab Partners ───────────────────────────────────────────────────────────

export const LAB_PARTNERS = [
  'ORGA', 'LAB CAROL', 'ZEISS', 'HOYA', 'HAYTEK', 'JORGLAIS', 'LAB KATZ',
] as const;

export const AUTOMATED_SUPPLIERS = ['HOYA', 'ESSILOR/ZAS'] as const;
export const MANUAL_SUPPLIERS = ['SHOPNOB'] as const;

// ─── Form Options ───────────────────────────────────────────────────────────

export const RECIPE_TYPES = ['Receita médica', 'Receita óptica', 'Renovação', 'Cópia da OS anterior'] as const;

export const FRAME_ORIGINS = ['Própria do cliente', 'Fornecida pela loja', 'A definir'] as const;

export const FRAME_MATERIALS = ['Metal', 'Acetato', 'Titânio', 'TR90', 'Aço inox', 'Misto', 'Outro'] as const;

export const LENS_TYPES = ['Visão simples', 'Bifocal', 'Progressivo', 'Multifocal', 'Solar', 'Contato'] as const;

export const LENS_MATERIALS = ['CR-39', 'Policarbonato', 'Trivex', 'Índice 1.60', 'Índice 1.67', 'Índice 1.74'] as const;

export const TREATMENTS = [
  'Anti-reflexo', 'Fotossensível', 'Filtro azul', 'Espelhado',
  'Polarizado', 'Hidrofóbico', 'Endurecimento', 'Colorido',
] as const;

export const SERVICE_TYPES = [
  'Montagem completa', 'Lente avulsa', 'Troca de lente',
  'Conserto / Reparo', 'Ajuste de armação', 'Solda', 'Pedido especial',
] as const;

export const MOUNTING_ORIGINS = ['katz', 'externo'] as const;
export type MountingOrigin = (typeof MOUNTING_ORIGINS)[number];
