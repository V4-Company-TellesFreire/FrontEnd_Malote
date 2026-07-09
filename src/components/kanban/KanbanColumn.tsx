import { STATUS_META } from '../../lib/constants';
import type { ServiceOrderStatus } from '../../lib/constants';
import type { ServiceOrder } from '../../lib/types';
import { KanbanCard } from './KanbanCard';

export interface KanbanColumnProps {
  status: ServiceOrderStatus;
  orders: ServiceOrder[];
  onMoveCard: (id: string, dir: -1 | 1) => void;
  onOpenReceipt: (id: string) => void;
  onOpenPickup: (id: string) => void;
  onOpenCaveat: (id: string) => void;
}

export function KanbanColumn({
  status,
  orders,
  onMoveCard,
  onOpenReceipt,
  onOpenPickup,
  onOpenCaveat,
}: KanbanColumnProps) {
  const meta = STATUS_META[status];
  
  // Sort by urgency level first (2: Super Urgente, 1: Urgente, 0: Normal)
  const sortedOrders = [...orders].sort((a, b) => b.urgency - a.urgency);

  return (
    <div className="flex flex-col w-72 h-fit rounded-xl border border-neutral-200 bg-neutral-50 shadow-xs">
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <span 
            className="h-2 w-2 rounded-full" 
            style={{ backgroundColor: meta.color }} 
          />
          <h3 className="text-xs font-bold tracking-wider text-neutral-700 uppercase">
            {status}
          </h3>
        </div>
        <span className="inline-flex items-center justify-center h-5 px-2 rounded-full bg-neutral-100 border border-neutral-200 text-[10px] font-bold text-neutral-500">
          {orders.length}
        </span>
      </div>

      {/* Cards Area */}
      <div className="p-2 flex flex-col gap-2">
        {sortedOrders.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-[10px] text-neutral-400 font-medium border border-dashed border-neutral-300 rounded-lg bg-white/40">
            Sem serviços nesta etapa
          </div>
        ) : (
          sortedOrders.map((order) => (
            <KanbanCard
              key={order.id}
              order={order}
              onMoveCard={onMoveCard}
              onOpenReceipt={onOpenReceipt}
              onOpenPickup={onOpenPickup}
              onOpenCaveat={onOpenCaveat}
            />
          ))
        )}
      </div>
    </div>
  );
}
export default KanbanColumn;
