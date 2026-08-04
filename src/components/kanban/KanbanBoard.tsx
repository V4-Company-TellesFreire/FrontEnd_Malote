import type { ServiceOrder } from '../../lib/types';
import { SERVICE_ORDER_STATUSES, type ServiceOrderStatus } from '../../lib/constants';
import { KanbanColumn } from './KanbanColumn';
import { useDragToScroll } from '../../hooks/useDragToScroll';

export interface KanbanBoardProps {
  orders: ServiceOrder[];
  onMoveCard: (id: string, dir: -1 | 1) => void;
  onOpenReceipt: (id: string) => void;
  onOpenPickup: (id: string) => void;
  onOpenCaveat: (id: string) => void;
  onDropCard?: (id: string, targetStatus: ServiceOrderStatus) => void;
  onDropPouch?: (pouchCode: string, targetStatus: ServiceOrderStatus) => void;
  onMovePouch?: (pouchCode: string, direction: -1 | 1) => void;
  onCreateMalote?: () => void;
  statuses?: readonly ServiceOrderStatus[];
}

export function KanbanBoard({
  orders,
  onMoveCard,
  onOpenReceipt,
  onOpenPickup,
  onOpenCaveat,
  onDropCard,
  onDropPouch,
  onMovePouch,
  onCreateMalote,
  statuses,
}: KanbanBoardProps) {
  const activeStatuses = statuses || SERVICE_ORDER_STATUSES;
  const dragRef = useDragToScroll();

  return (
    <div 
      ref={dragRef}
      className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-neutral-300 cursor-grab"
    >
      <div className="flex gap-3 px-1 min-w-max">
        {activeStatuses.map((status) => {
          const columnOrders = orders.filter((o) => o.status === status);
          
          return (
            <KanbanColumn
              key={status}
              status={status}
              orders={columnOrders}
              onMoveCard={onMoveCard}
              onOpenReceipt={onOpenReceipt}
              onOpenPickup={onOpenPickup}
              onOpenCaveat={onOpenCaveat}
              onDropCard={onDropCard}
              onDropPouch={onDropPouch}
              onMovePouch={onMovePouch}
              onCreateMalote={onCreateMalote}
            />
          );
        })}
      </div>
    </div>
  );
}
export default KanbanBoard;
