import { type UserRole, type ServiceOrderStatus, getValidTransitions, getPreviousStatus } from './constants';

/**
 * RBAC permission matrix.
 * Each function encodes a business rule from the spec.
 */

export function canViewAllStores(role: UserRole): boolean {
  return role === 'laboratorio' || role === 'admin';
}

export function canViewStore(role: UserRole, userStoreId: string | null, targetStoreId: string): boolean {
  if (canViewAllStores(role)) return true;
  return userStoreId === targetStoreId;
}

export function canCreateOS(role: UserRole): boolean {
  return role === 'vendedor' || role === 'gerente' || role === 'admin';
}

export function canConfirmReceipt(role: UserRole): boolean {
  return role === 'vendedor' || role === 'gerente' || role === 'admin';
}

export function canConfirmClientPickup(role: UserRole): boolean {
  return role === 'vendedor' || role === 'gerente' || role === 'admin';
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'gerente' || role === 'admin';
}

export function canViewDashboardNetwork(role: UserRole): boolean {
  return role === 'admin';
}

export function canViewDashboardStore(role: UserRole): boolean {
  return role === 'gerente' || role === 'admin';
}

export function canViewAuditLog(role: UserRole): boolean {
  return role === 'admin';
}

export function canBackupData(role: UserRole): boolean {
  return role === 'admin';
}

export function canDeactivateUsers(role: UserRole): boolean {
  return role === 'gerente' || role === 'admin';
}

/**
 * Returns which status transitions a given role can perform.
 * Vendedor / Gerente: can move Chegada de Malote → Envio Laboratório, and delivery/pickup (Entregue na Loja, Entregue ao Cliente).
 *                     CANNOT move to Montagem or any subsequent laboratory production stages.
 * Laboratório: controls the production pipeline (Envio Laboratório → Pronto para Expedição).
 * Admin: unrestricted.
 * Motoboy: delivery route only.
 */
export function canPerformTransition(
  role: UserRole,
  fromStatus: ServiceOrderStatus,
  toStatus: ServiceOrderStatus,
  _isCreator: boolean = false
): boolean {
  // First check if transition is valid in the state machine (forward or backward)
  const validForwardTargets = getValidTransitions(fromStatus);
  const prevTarget = getPreviousStatus(fromStatus);
  const isValidTransition = validForwardTargets.includes(toStatus) || (prevTarget !== null && prevTarget === toStatus);
  if (!isValidTransition) return false;

  // Strict rule: Montagem and subsequent internal production stages can NEVER be initiated by vendedor or gerente
  if (role === 'vendedor' || role === 'gerente') {
    if (
      toStatus === 'Montagem' ||
      toStatus === 'Controle de Qualidade' ||
      toStatus === 'Separando' ||
      toStatus === 'Pronto para Expedição'
    ) {
      return false;
    }

    // Permitted store forward transitions:
    // 1. Chegada de Malote -> Envio Laboratório
    // 2. Receipt / delivery steps
    if (
      (fromStatus === 'Chegada de Malote' && toStatus === 'Envio Laboratório') ||
      toStatus === 'Entregue na Loja' ||
      toStatus === 'Entregue c/ Ressalva' ||
      toStatus === 'Entregue ao Cliente'
    ) {
      return true;
    }

    // Permitted store backward transition:
    if (fromStatus === 'Envio Laboratório' && toStatus === 'Chegada de Malote') {
      return true;
    }

    return false;
  }

  switch (role) {
    case 'laboratorio':
      // Lab: full pipeline control over production (Envio Laboratório → Pronto para Expedição)
      // Lab cannot deliver to client or mark store receipt
      return (
        toStatus === 'Montagem' ||
        toStatus === 'Controle de Qualidade' ||
        toStatus === 'Separando' ||
        toStatus === 'Pronto para Expedição' ||
        (fromStatus === 'Montagem' && toStatus === 'Envio Laboratório')
      );

    case 'admin':
      return true;

    case 'motoboy':
      // Motoboy can only: start route (Pronto para Expedição → Em Rota) and deliver (Em Rota → Entregue na Loja)
      return (
        (fromStatus === 'Pronto para Expedição' && toStatus === 'Em Rota') ||
        (fromStatus === 'Em Rota' && toStatus === 'Entregue na Loja')
      );

    default:
      return false;
  }
}

/**
 * Returns allowed transitions for a role given a current status.
 */
export function getAllowedTransitions(
  role: UserRole,
  currentStatus: ServiceOrderStatus,
): ServiceOrderStatus[] {
  const valid = getValidTransitions(currentStatus);
  return valid.filter((target) => canPerformTransition(role, currentStatus, target));
}

/**
 * Nav items visible per role.
 */
export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string; // lucide icon name
  roles: UserRole[];
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'new-os',       label: 'Nova OS',             path: '/store/new',          icon: 'plus-circle',    roles: ['vendedor', 'gerente', 'admin'] },
  { id: 'store-overview', label: 'Overview',          path: '/store/dashboard',    icon: 'bar-chart-3',    roles: ['vendedor', 'gerente', 'admin'] },
  
  // Laboratório specific items
  { id: 'lab-monitor',  label: 'Monitor de Produção',  path: '/lab',                icon: 'flask-conical',  roles: ['laboratorio'] },
  { id: 'lab-deliveries',label: 'Fluxo de Entregas',   path: '/lab/deliveries',     icon: 'truck',          roles: ['laboratorio'] },
  { id: 'notifications',label: 'Alertas WhatsApp',    path: '/notifications',      icon: 'bell',           roles: ['laboratorio'] },
  { id: 'caveats',      label: 'Ressalvas Relatadas', path: '/caveats',            icon: 'alert-triangle', roles: ['laboratorio'] },
  // Motoboy specific items
  { id: 'delivery-panel', label: 'Painel do Motoboy',  path: '/delivery-panel',     icon: 'truck',          roles: ['motoboy', 'admin'] },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
