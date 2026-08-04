import { type UserRole, type ServiceOrderStatus, getValidTransitions } from './constants';

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
 * Vendedor: can only confirm receipt (Entregue na Loja) and client pickup (Entregue ao Cliente).
 * Gerente: same as vendedor + any valid transition within store context.
 * Laboratório: can move cards through the entire production pipeline.
 * Admin: unrestricted.
 */
export function canPerformTransition(
  role: UserRole,
  fromStatus: ServiceOrderStatus,
  toStatus: ServiceOrderStatus,
  isCreator: boolean = false
): boolean {
  // First check if transition is valid in the state machine
  const validTargets = getValidTransitions(fromStatus);
  if (!validTargets.includes(toStatus)) return false;

  switch (role) {
    case 'vendedor':
      // If they are the creator, they have full control. Otherwise only receipt/pickup delivery steps.
      if (isCreator) return true;
      return (
        toStatus === 'Entregue na Loja' ||
        toStatus === 'Entregue c/ Ressalva' ||
        toStatus === 'Entregue ao Cliente'
      );

    case 'gerente':
      // Gerente: any valid transition within store-visible statuses
      return (
        toStatus === 'Entregue na Loja' ||
        toStatus === 'Entregue c/ Ressalva' ||
        toStatus === 'Entregue ao Cliente'
      );

    case 'laboratorio':
      // Lab: full pipeline control (Montagem → Pronto para Expedição stages)
      return true;

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
  { id: 'store-track',  label: 'Acompanhamento',      path: '/store/track',        icon: 'eye',            roles: ['vendedor', 'gerente', 'admin'] },
  { id: 'deliveries',   label: 'Entregues',           path: '/store/deliveries',   icon: 'package-check',  roles: ['vendedor', 'gerente', 'admin'] },
  { id: 'dashboard-n',  label: 'Dashboard Rede',      path: '/dashboard/network',  icon: 'bar-chart-3',    roles: ['admin'] },
  { id: 'rectify',      label: 'Retificações',        path: '/rectifications',     icon: 'rotate-ccw',     roles: ['vendedor', 'gerente', 'admin'] },
  
  // Laboratório specific items
  { id: 'lab-monitor',  label: 'Monitor de Produção',  path: '/lab',                icon: 'flask-conical',  roles: ['laboratorio', 'admin'] },
  { id: 'lab-deliveries',label: 'Fluxo de Entregas',   path: '/lab/deliveries',     icon: 'truck',          roles: ['laboratorio', 'admin'] },
  { id: 'notifications',label: 'Alertas WhatsApp',    path: '/notifications',      icon: 'bell',           roles: ['laboratorio', 'admin'] },
  { id: 'caveats',      label: 'Ressalvas Relatadas', path: '/caveats',            icon: 'alert-triangle', roles: ['laboratorio', 'admin'] },
  
  { id: 'admin',        label: 'Configurações',       path: '/admin',              icon: 'settings',       roles: ['admin'] },
  
  // Motoboy specific items
  { id: 'delivery-panel', label: 'Painel do Motoboy',  path: '/delivery-panel',     icon: 'truck',          roles: ['motoboy', 'admin'] },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
