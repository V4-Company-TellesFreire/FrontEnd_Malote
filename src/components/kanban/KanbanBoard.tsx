import type { ServiceOrder } from '../../lib/types';
import { SERVICE_ORDER_STATUSES, type ServiceOrderStatus } from '../../lib/constants';
import { KanbanColumn } from './KanbanColumn';

export interface KanbanBoardProps {
  orders: ServiceOrder[];
  onMoveCard: (id: string, dir: -1 | 1) => void;
  onOpenReceipt: (id: string) => void;
  onOpenPickup: (id: string) => void;
  onOpenCaveat: (id: string) => void;
  statuses?: readonly ServiceOrderStatus[];
}

export function KanbanBoard({
  orders,
  onMoveCard,
  onOpenReceipt,
  onOpenPickup,
  onOpenCaveat,
  statuses,
}: KanbanBoardProps) {
  const activeStatuses = statuses || SERVICE_ORDER_STATUSES;
  const isSevenColumns = activeStatuses.length === 7;

  return (
    <div className={`w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-neutral-300 ${isSevenColumns ? 'xl:overflow-x-hidden' : ''}`}>
      <div className={`flex gap-3 px-1 ${isSevenColumns ? 'min-w-max xl:min-w-0 xl:w-full xl:grid xl:grid-cols-7' : 'min-w-max'}`}>
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
            />
          );
        })}
      </div>
    </div>
  );
}
export default KanbanBoard;
