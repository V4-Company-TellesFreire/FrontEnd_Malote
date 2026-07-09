import { ChevronLeft, ChevronRight, Clock, Image, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { canPerformTransition } from '../../lib/permissions';
import { getPreviousStatus, getValidTransitions } from '../../lib/constants';
import { elapsed, getTimeAlertLevel, prescriptionSummary } from '../../lib/utils';
import type { ServiceOrder } from '../../lib/types';
import { Button } from '../ui/Button';

export interface KanbanCardProps {
  order: ServiceOrder;
  onMoveCard: (id: string, dir: -1 | 1) => void;
  onOpenReceipt: (id: string) => void;
  onOpenPickup: (id: string) => void;
  onOpenCaveat: (id: string) => void;
}

export function KanbanCard({
  order,
  onMoveCard,
  onOpenReceipt,
  onOpenPickup,
  onOpenCaveat,
}: KanbanCardProps) {
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role || 'vendedor';

  const elapsedText = elapsed(order.statusChangedAt || order.createdAt);
  const timeAlert = getTimeAlertLevel(order.statusChangedAt || order.createdAt);

  // Time-stopped alert background color mapping
  const timeAlertBgClasses = {
    normal: 'bg-white hover:bg-neutral-50/50',
    attention: 'bg-warning-50/40 border-warning-200 hover:bg-warning-50/60',
    critical: 'bg-critical-50/30 border-critical-200 hover:bg-critical-50/50',
  };

  // Urgency left border mapping
  const urgencyBorderClasses = {
    0: 'border-l border-neutral-200',
    1: 'border-l-[3px] border-l-warning shadow-xs',
    2: 'border-l-[4px] border-l-critical shadow-sm animate-pulse-urgency',
  };

  // Determine transition buttons disabled states
  const validTransitions = getValidTransitions(order.status);
  const prevStatus = getPreviousStatus(order.status);

  // Vendedor/Gerente role check-in or client delivery prompts instead of standard button if in-stage
  const isPendingReceipt = (order.status === 'Expedição' || order.status === 'Em Rota') && !order.reception;
  const isPendingPickup = (order.status === 'Entregue na Loja' || order.status === 'Entregue c/ Ressalva') && !order.clientPickup;

  // Next standard navigation allows check
  const nextTarget = validTransitions[0];
  const canGoForward = nextTarget && canPerformTransition(userRole, order.status, nextTarget) && !isPendingReceipt && !isPendingPickup;
  const canGoBackward = prevStatus && canPerformTransition(userRole, order.status, prevStatus);

  return (
    <div
      className={`flex flex-col gap-2.5 p-3 rounded-lg border text-xs shadow-xs transition-all duration-150 ${timeAlertBgClasses[timeAlert]} ${urgencyBorderClasses[order.urgency]}`}
    >
      {/* Header OS info */}
      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
        <span>Nº {order.osNumber}</span>
        {order.osStore && <span>OS: {order.osStore}</span>}
      </div>

      {/* Client Name */}
      <div className="flex flex-col gap-0.5">
        <h4 className="font-semibold text-neutral-900 line-clamp-1">
          {order.clientName}
        </h4>
        <span className="text-[10px] text-neutral-500 font-medium">
          {order.storeName} ({order.malote})
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
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1 text-[10px] text-neutral-500">
          <Clock className="h-3.5 w-3.5 text-neutral-400" />
          <span className={timeAlert === 'critical' ? 'text-critical font-bold' : ''}>
            {elapsedText}
          </span>
        </div>
        {order.urgency > 0 && (
          <span
            className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
              order.urgency === 2
                ? 'bg-critical text-white'
                : 'bg-warning-50 text-warning-800 border border-warning-200'
            }`}
          >
            {order.urgency === 2 ? 'Super Urgente' : 'Urgente'}
          </span>
        )}
      </div>

      {/* Attachments verify trigger */}
      {order.receiptImageUrl && (
        <button
          onClick={() => onOpenReceipt(order.id)}
          className="flex items-center justify-center gap-1.5 w-full py-1 rounded bg-brand-50 border border-brand-100 text-brand text-[10px] font-bold hover:bg-brand-100/60 active:scale-95 transition-all duration-150 cursor-pointer"
        >
          <Image className="h-3.5 w-3.5" />
          Visualizar Receita / Anexo
        </button>
      )}

      {/* Critical Deviation / Manual Alerts */}
      {order.isStopped && (
        <div className="p-1.5 rounded bg-critical-50 border border-critical-200 text-critical text-[9px] font-bold flex gap-1 items-start">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>HOLD: {order.stoppedReason}</span>
        </div>
      )}

      {/* Custom Action Strips for Vendedor/Gerente checks */}
      {isPendingReceipt && (
        <div className="mt-1 pt-1.5 border-t border-neutral-100">
          <Button
            variant="success"
            size="sm"
            onClick={() => onOpenCaveat(order.id)}
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
            onClick={() => onOpenPickup(order.id)}
            className="w-full text-[10px] h-8 justify-center font-bold"
          >
            Dar Baixa de Retirada
          </Button>
        </div>
      )}

      {/* Navigation Buttons for operational users */}
      {!isPendingReceipt && !isPendingPickup && (
        <div className="flex items-center justify-between gap-1.5 mt-1 pt-1.5 border-t border-neutral-150">
          <button
            onClick={() => onMoveCard(order.id, -1)}
            disabled={!canGoBackward}
            className="flex items-center justify-center h-6 px-2 rounded border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all duration-150 flex-1 cursor-pointer"
            title={prevStatus ? `Voltar para ${prevStatus}` : ''}
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-0.5 shrink-0" />
            <span className="truncate max-w-[60px] text-[9px]">
              {prevStatus ? prevStatus.split(' ')[0] : 'Voltar'}
            </span>
          </button>

          <button
            onClick={() => onMoveCard(order.id, 1)}
            disabled={!canGoForward}
            className="flex items-center justify-center h-6 px-2 rounded border border-brand-200 bg-brand-50 text-brand hover:bg-brand-100/60 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all duration-150 flex-1 cursor-pointer font-bold"
            title={nextTarget ? `Avançar para ${nextTarget}` : ''}
          >
            <span className="truncate max-w-[60px] text-[9px]">
              {nextTarget ? nextTarget.split(' ')[0] : 'Avançar'}
            </span>
            <ChevronRight className="h-3.5 w-3.5 ml-0.5 shrink-0" />
          </button>
        </div>
      )}
    </div>
  );
}
export default KanbanCard;
