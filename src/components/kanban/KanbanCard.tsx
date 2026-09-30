import * as React from 'react';
import { ChevronLeft, ChevronRight, Clock, Image, AlertTriangle, Store, Edit2, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { canPerformTransition } from '../../lib/permissions';
import { getPreviousStatus, getValidTransitions } from '../../lib/constants';
import { elapsed, getTimeAlertLevel, prescriptionSummary } from '../../lib/utils';
import type { ServiceOrder } from '../../lib/types';
import { Button } from '../ui/Button';
import { AddPhoneModal } from '../forms/AddPhoneModal';

export interface KanbanCardProps {
  order: ServiceOrder;
  onMoveCard: (id: string, dir: -1 | 1) => void;
  onOpenReceipt: (id: string) => void;
  onOpenPickup: (id: string) => void;
  onOpenCaveat: (id: string) => void;
  inPouch?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  isForceExpanded?: boolean | null;
}

export function KanbanCard({
  order,
  onMoveCard,
  onOpenReceipt,
  onOpenPickup,
  onOpenCaveat,
  inPouch = false,
  collapsible,
  defaultCollapsed,
  isForceExpanded,
}: KanbanCardProps) {
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role || 'vendedor';

  const isCollapsible = collapsible ?? true;
  const [isExpanded, setIsExpanded] = React.useState(
    defaultCollapsed !== undefined ? !defaultCollapsed : !isCollapsible
  );
  const [isPhoneModalOpen, setIsPhoneModalOpen] = React.useState(false);
  const isDraggingRef = React.useRef(false);

  React.useEffect(() => {
    if (isForceExpanded !== undefined && isForceExpanded !== null) {
      setIsExpanded(isForceExpanded);
    }
  }, [isForceExpanded]);

  const handleToggle = () => {
    if (!isCollapsible || isDraggingRef.current) return;
    setIsExpanded((prev) => !prev);
  };

  const elapsedText = elapsed(order.statusChangedAt || order.createdAt);
  const timeAlert = getTimeAlertLevel(order.statusChangedAt || order.createdAt);

  // Uniform light gray background color for all cards
  const bgClass = 'bg-neutral-50 hover:bg-neutral-100/70';

  // Urgency left border mapping (highlight is applied only on the left border)
  const urgencyBorderClasses = {
    0: 'border-l border-neutral-300',
    1: 'border-l-[3px] border-l-warning shadow-xs',
    2: 'border-l-[4px] border-l-critical shadow-sm animate-pulse-urgency',
  };

  // Determine transition buttons disabled states
  const validTransitions = getValidTransitions(order.status);
  const prevStatus = getPreviousStatus(order.status);

  // Vendedor/Gerente role check-in or client delivery prompts instead of standard button if in-stage
  const isPendingReceipt = (order.status === 'Pronto para Expedição' || order.status === 'Em Rota') && !order.reception;
  const isPendingPickup = (order.status === 'Entregue na Loja' || order.status === 'Entregue c/ Ressalva') && !order.clientPickup;

  // Next standard navigation allows check
  const nextTarget = validTransitions[0];
  const isCreator = order.createdBy === user?.id;
  const isMissingPhone = order.status === 'Chegada de Malote' && (!order.clientPhone || !order.clientPhone.trim());
  const canGoForward = nextTarget && !isMissingPhone && canPerformTransition(userRole, order.status, nextTarget, isCreator) && !isPendingReceipt && !isPendingPickup;
  const canGoBackward = prevStatus && canPerformTransition(userRole, order.status, prevStatus, isCreator);

  const canEdit =
    userRole === 'admin' ||
    userRole === 'gerente' ||
    (userRole === 'vendedor' && isCreator);

  const labTag = (() => {
    if (order.labName && order.labName.trim()) {
      return order.labName.trim();
    }
    const combined = `${order.lensType || ''} ${order.serviceType || ''} ${order.observations || ''}`.toLowerCase();
    if (combined.includes('hoya')) return 'HOYA';
    if (combined.includes('zeiss')) return 'ZEISS';
    return null;
  })();

  const getLabBadgeStyle = (lab: string) => {
    const normalized = lab.toUpperCase();
    if (normalized.includes('ZEISS')) {
      return 'bg-blue-600 text-white border-blue-700 shadow-2xs';
    }
    if (normalized.includes('HOYA')) {
      return 'bg-rose-600 text-white border-rose-700 shadow-2xs';
    }
    if (normalized.includes('ESSILOR')) {
      return 'bg-indigo-600 text-white border-indigo-700 shadow-2xs';
    }
    return 'bg-purple-100 text-purple-900 border-purple-300';
  };

  return (
    <div
      draggable={true}
      onDragStart={(e) => {
        isDraggingRef.current = true;
        e.dataTransfer.setData('text/plain', order.id);
      }}
      onDragEnd={() => {
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 150);
      }}
      className={`kanban-card cursor-grab active:cursor-grabbing flex flex-col ${
        isCollapsible && !isExpanded ? 'gap-1.5 p-2.5' : 'gap-2.5 p-3'
      } rounded-lg border border-neutral-300 text-xs transition-all duration-150 ${bgClass} ${urgencyBorderClasses[order.urgency]}`}
    >
      {/* Header: OS and Loja always visible */}
      <div
        onClick={handleToggle}
        className={`flex flex-col gap-1.5 ${isCollapsible ? 'cursor-pointer select-none group' : ''}`}
      >
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <h4 className="font-mono font-bold text-xs text-neutral-900 tracking-tight group-hover:text-brand transition-colors">
              {order.osNumber}
            </h4>
            {order.osStore && (
              <span
                className="text-[9px] font-mono font-semibold px-1 py-0.5 rounded bg-neutral-200/70 text-neutral-600 border border-neutral-200 shrink-0"
                title={`OS Loja: ${order.osStore}`}
              >
                {order.osStore}
              </span>
            )}
            {/* Se o card NÃO tiver urgência, a tag do lab parceiro fica ao lado da OS */}
            {labTag && order.urgency === 0 && (
              <span
                className={`inline-flex items-center text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${getLabBadgeStyle(
                  labTag
                )} shrink-0`}
                title={`Laboratório Parceiro: ${labTag}`}
              >
                {labTag}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Store tag: always visible */}
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 border border-brand-100 text-[9px] font-bold text-brand-700 max-w-[120px]"
              title={order.storeName}
            >
              <Store className="h-3 w-3 text-brand-500 shrink-0" />
              <span className="truncate">{order.storeName}</span>
            </div>

            {/* Collapsible toggle icon */}
            {isCollapsible && (
              <span
                className={`p-0.5 rounded hover:bg-neutral-200/60 text-neutral-400 group-hover:text-neutral-700 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180 text-brand' : ''
                }`}
                title={isExpanded ? 'Recolher detalhes' : 'Clique para ver detalhes'}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>

        {/* In collapsed mode, quick status preview if urgent or on hold */}
        {!isExpanded && (
          <div className="flex items-center justify-between gap-1 text-[9px]">
            {order.urgency > 0 ? (
              <div className="flex items-center gap-1 shrink-0">
                {/* Tag ZEISS/HOYA ao lado esquerdo da tag Urgente/Super Urgente */}
                {labTag && (
                  <span
                    className={`inline-flex items-center text-[7px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border ${getLabBadgeStyle(
                      labTag
                    )} shrink-0`}
                    title={`Laboratório Parceiro: ${labTag}`}
                  >
                    {labTag}
                  </span>
                )}
                <span
                  className={`px-1.5 py-0.2 rounded text-[7px] font-bold uppercase ${
                    order.urgency === 2
                      ? 'bg-critical text-white'
                      : 'bg-warning-50 text-warning-800 border border-warning-200'
                  }`}
                >
                  {order.urgency === 2 ? 'Super Urgente' : 'Urgente'}
                </span>
                <span className="text-neutral-400 text-[9px] font-medium ml-1">
                  {elapsedText}
                </span>
              </div>
            ) : (
              <span className="text-neutral-400 text-[9px] font-medium">
                {elapsedText}
              </span>
            )}

            <div className="flex items-center gap-1.5 shrink-0">
              {isMissingPhone && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPhoneModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-warning-100 hover:bg-warning-200 border border-warning-300 text-warning-900 text-[8px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Clique para adicionar o telefone do cliente e desbloquear a OS"
                >
                  <AlertTriangle className="h-2.5 w-2.5 text-warning-700 shrink-0" />
                  Falta Telefone
                </button>
              )}

              {order.isStopped && (
                <span className="text-[8px] font-bold text-critical flex items-center gap-0.5">
                  <AlertTriangle className="h-2.5 w-2.5" /> HOLD
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expandable details body */}
      {(!isCollapsible || isExpanded) && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col gap-2.5 pt-1.5 border-t border-neutral-200/70 animate-fade-in"
        >
          {/* Missing Phone Alert Banner */}
          {isMissingPhone && (
            <div className="p-2 rounded-lg bg-warning-50 border border-warning-200 text-warning-900 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertTriangle className="h-3.5 w-3.5 text-warning-600 shrink-0" />
                <span className="text-[10px] font-bold leading-tight">
                  Falta telefone do cliente (obrigatório).
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPhoneModalOpen(true);
                }}
                className="px-2 py-0.5 rounded bg-warning-600 hover:bg-warning-700 active:scale-95 text-white font-bold text-[9px] shrink-0 transition-all cursor-pointer shadow-xs"
              >
                Adicionar
              </button>
            </div>
          )}

          {/* Client & Store Details */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1 text-xs text-neutral-700 leading-tight">
              <span className="text-[10px] font-medium text-neutral-400 shrink-0">Cliente:</span>
              <span className="font-medium text-neutral-800 line-clamp-1" title={order.clientName}>
                {order.clientName}
              </span>
            </div>
            <span className="text-[10px] text-neutral-500 font-medium">
              Malote: {order.malote}
            </span>
          </div>

          {/* Description / Summary details */}
          <div className="text-[10px] text-neutral-500 font-medium leading-relaxed bg-neutral-50 p-1.5 rounded-sm border border-neutral-100 flex flex-col gap-0.5">
            {order.prescription && (
              <span className="font-mono line-clamp-1 text-neutral-600">
                {prescriptionSummary(order.prescription)}
              </span>
            )}
            <div className="flex justify-between items-center text-[9px] mt-1 pt-1 border-t border-neutral-150">
              <span>{order.lensType || order.serviceType}</span>
              {order.externalLab && (
                <span className="text-accent font-bold uppercase">{order.labName}</span>
              )}
            </div>
          </div>

          {/* Time indicators / badging */}
          <div className="flex items-center justify-between mt-0.5">
            <div className="flex items-center gap-1 text-[10px] text-neutral-500">
              <Clock className="h-3.5 w-3.5 text-neutral-400" />
              <span className={timeAlert === 'critical' ? 'text-critical font-bold' : ''}>
                {elapsedText}
              </span>
            </div>
            {order.urgency > 0 && (
              <div className="flex items-center gap-1">
                {/* Tag ZEISS/HOYA ao lado esquerdo da tag Urgente/Super Urgente */}
                {labTag && (
                  <span
                    className={`inline-flex items-center text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${getLabBadgeStyle(
                      labTag
                    )} shrink-0`}
                    title={`Laboratório Parceiro: ${labTag}`}
                  >
                    {labTag}
                  </span>
                )}
                <span
                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                    order.urgency === 2
                      ? 'bg-critical text-white'
                      : 'bg-warning-50 text-warning-800 border border-warning-200'
                  }`}
                >
                  {order.urgency === 2 ? 'Super Urgente' : 'Urgente'}
                </span>
              </div>
            )}
          </div>

          {/* Attachments verify trigger */}
          {order.receiptImageUrl && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenReceipt(order.id);
              }}
              className="flex items-center justify-center gap-1.5 w-full py-1 rounded bg-brand-50 border border-brand-100 text-brand text-[10px] font-bold hover:bg-brand-100/60 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <Image className="h-3.5 w-3.5" />
              Visualizar Receita / Anexo
            </button>
          )}

          {/* Edit OS button if permitted */}
          {canEdit && (
            <Link
              to={`/store/edit/${order.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 w-full py-1 rounded bg-white border border-neutral-350 text-neutral-700 text-[10px] font-bold hover:bg-neutral-100 hover:text-neutral-900 active:scale-95 transition-all duration-150 cursor-pointer select-none"
            >
              <Edit2 className="h-3 w-3" />
              Editar Informações
            </Link>
          )}

          {/* Critical Deviation / Manual Alerts */}
          {order.isStopped && (
            <div className="p-1.5 rounded bg-critical-50 border border-critical-200 text-critical text-[9px] font-bold flex gap-1 items-start">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>HOLD: {order.stoppedReason}</span>
            </div>
          )}

          {/* Caveat description display */}
          {order.status === 'Entregue c/ Ressalva' && order.reception?.observation && (
            <div className="p-1.5 rounded bg-critical-50 border border-critical-200 text-critical text-[9px] font-bold flex gap-1 items-start leading-normal">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span>Ressalva relatada:</span>
                <span className="font-semibold text-neutral-600 italic">"{order.reception.observation}"</span>
              </div>
            </div>
          )}

          {/* Custom Action Strips for Vendedor/Gerente checks */}
          {isPendingReceipt && (
            <div className="mt-1 pt-1.5 border-t border-neutral-100">
              <Button
                variant="success"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCaveat(order.id);
                }}
                className="w-full text-[10px] h-8 justify-center font-bold"
              >
                Confirmar Recebimento
              </Button>
            </div>
          )}

          {isPendingPickup && (
            <div className="mt-1 pt-1.5 border-t border-neutral-100">
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPickup(order.id);
                }}
                className="w-full text-[10px] h-8 justify-center font-bold"
              >
                Dar Baixa de Retirada
              </Button>
            </div>
          )}

          {/* Navigation Buttons for operational users */}
          {!isPendingReceipt && !isPendingPickup && !inPouch && (
            <div className="flex items-center justify-between gap-1.5 mt-1 pt-1.5 border-t border-neutral-150">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveCard(order.id, -1);
                }}
                disabled={!canGoBackward}
                className="flex items-center justify-center h-6 px-1 rounded border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 flex-1 min-w-0 cursor-pointer"
                title={prevStatus ? `Voltar para ${prevStatus}` : ''}
              >
                <ChevronLeft className="h-3 w-3 mr-0.5 shrink-0" />
                <span className="truncate text-[8px] font-bold">
                  {prevStatus ? prevStatus.split(' ')[0] : 'Voltar'}
                </span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveCard(order.id, 1);
                }}
                disabled={!canGoForward}
                className="flex items-center justify-center h-6 px-1 rounded border border-brand-200 bg-brand-50 text-brand hover:bg-brand-100/60 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 flex-1 min-w-0 font-bold cursor-pointer"
                title={
                  isMissingPhone
                    ? 'Adicione o telefone do cliente para avançar a OS'
                    : !canGoForward && nextTarget === 'Montagem' && (userRole === 'vendedor' || userRole === 'gerente')
                    ? 'Apenas o Laboratório pode iniciar a Montagem'
                    : nextTarget ? `Avançar para ${nextTarget}` : ''
                }
              >
                <span className="truncate text-[8px] font-bold">
                  {nextTarget ? nextTarget.split(' ')[0] : 'Avançar'}
                </span>
                <ChevronRight className="h-3 w-3 ml-0.5 shrink-0" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Add Phone Modal */}
      {isPhoneModalOpen && (
        <AddPhoneModal
          isOpen={isPhoneModalOpen}
          onClose={() => setIsPhoneModalOpen(false)}
          order={order}
        />
      )}
    </div>
  );
}
export default KanbanCard;
