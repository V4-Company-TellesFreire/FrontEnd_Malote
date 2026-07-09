import type { ServiceOrder } from '../../lib/types';
import { SERVICE_ORDER_STATUSES } from '../../lib/constants';
import { KanbanColumn } from './KanbanColumn';

export interface KanbanBoardProps {
  orders: ServiceOrder[];
  onMoveCard: (id: string, dir: -1 | 1) => void;
  onOpenReceipt: (id: string) => void;
  onOpenPickup: (id: string) => void;
  onOpenCaveat: (id: string) => void;
}

export function KanbanBoard({
  orders,
  onMoveCard,
  onOpenReceipt,
  onOpenPickup,
  onOpenCaveat,
}: KanbanBoardProps) {
  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-neutral-300">
      <div className="flex gap-4 min-w-max px-1">
        {SERVICE_ORDER_STATUSES.map((status) => {
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
            />
          );
        })}
      </div>
    </div>
  );
}
export default KanbanBoard;
