import * as React from 'react';
import { STATUS_META } from '../../lib/constants';
import type { ServiceOrderStatus } from '../../lib/constants';
import type { ServiceOrder } from '../../lib/types';
import { KanbanCard } from './KanbanCard';
import { cn } from '../../lib/utils';
import { Briefcase, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

export interface KanbanColumnProps {
  status: ServiceOrderStatus;
  orders: ServiceOrder[];
  onMoveCard: (id: string, dir: -1 | 1) => void;
  onOpenReceipt: (id: string) => void;
  onOpenPickup: (id: string) => void;
  onOpenCaveat: (id: string) => void;
  onDropCard?: (id: string, targetStatus: ServiceOrderStatus) => void;
  onDropPouch?: (pouchCode: string, targetStatus: ServiceOrderStatus) => void;
  onMovePouch?: (pouchCode: string, direction: -1 | 1) => void;
  onCreateMalote?: () => void;
  className?: string;
}

export function KanbanColumn({
  status,
  orders,
  onMoveCard,
  onOpenReceipt,
  onOpenPickup,
  onOpenCaveat,
  onDropCard,
  onDropPouch,
  onMovePouch,
  onCreateMalote,
  className,
}: KanbanColumnProps) {
  const meta = STATUS_META[status];
  
  // State to track expanded pouches
  const [expandedPouches, setExpandedPouches] = React.useState<Record<string, boolean>>({});

  const togglePouchExpand = (pouchCode: string) => {
    setExpandedPouches((prev) => ({
      ...prev,
      [pouchCode]: !prev[pouchCode],
    }));
  };

  // Sort by urgency level first (2: Super Urgente, 1: Urgente, 0: Normal)
  const sortedOrders = [...orders].sort((a, b) => b.urgency - a.urgency);

  // Group orders by pouchCode if status is 'Pronto para Expedição'
  const groupedOrders = React.useMemo(() => {
    if (status !== 'Pronto para Expedição') return null;

    const groups: Record<string, ServiceOrder[]> = {};
    const unassigned: ServiceOrder[] = [];

    orders.forEach((order) => {
      if (order.pouchCode) {
        if (!groups[order.pouchCode]) {
          groups[order.pouchCode] = [];
        }
        groups[order.pouchCode].push(order);
      } else {
        unassigned.push(order);
      }
    });

    return { groups, unassigned };
  }, [orders, status]);

  return (
    <div 
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('text/plain');
        const pouchCode = e.dataTransfer.getData('text/malote');
        if (pouchCode && onDropPouch) {
          onDropPouch(pouchCode, status);
        } else if (cardId && onDropCard) {
          onDropCard(cardId, status);
        }
      }}
      className={cn("flex flex-col w-80 shrink-0 h-fit rounded-xl border border-neutral-200 bg-neutral-50 shadow-xs", className)}
    >
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

      {/* Create Malote Button */}
      {status === 'Pronto para Expedição' && onCreateMalote && (
        <div className="px-2 pt-2 pb-1">
          <button
            onClick={onCreateMalote}
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg border border-brand-200 bg-brand-50 hover:bg-brand text-brand hover:text-white text-xs font-extrabold transition-all duration-150 cursor-pointer shadow-xs active:scale-98"
          >
            <span>+ Criar Malote</span>
          </button>
        </div>
      )}

      {/* Cards Area */}
      <div className="p-2 flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-1">
        {status === 'Pronto para Expedição' && groupedOrders ? (
          <>
            {/* Grouped Pouches */}
            {Object.entries(groupedOrders.groups).map(([pouchCode, pouchOrders]) => {
              const sortedPouchOrders = [...pouchOrders].sort((a, b) => b.urgency - a.urgency);
              const isExpanded = !!expandedPouches[pouchCode];

              return (
                <div
                  key={pouchCode}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/malote', pouchCode);
                  }}
                  className="flex flex-col gap-2 p-2.5 rounded-lg border border-brand-300 bg-brand-50/15 shadow-xs transition-all hover:bg-brand-50/25"
                >
                  {/* Pouch Header */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-brand-200">
                    <div 
                      onClick={() => togglePouchExpand(pouchCode)}
                      className="flex items-center gap-1.5 min-w-0 cursor-pointer select-none hover:opacity-80 flex-1 py-1"
                      title={isExpanded ? "Clique para recolher" : "Clique para expandir"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-brand shrink-0" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                      )}
                      <Briefcase className="h-3.5 w-3.5 text-brand shrink-0" />
                      <span className="font-mono font-extrabold text-neutral-800 text-[11px] truncate">
                        {pouchCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-brand-100 border border-brand-200 text-[9px] font-black text-brand-850">
                        {pouchOrders.length} {pouchOrders.length === 1 ? 'OS' : 'OSs'}
                      </span>
                      
                      {/* Pouch Action Buttons */}
                      <div className="flex gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMovePouch?.(pouchCode, -1);
                          }}
                          className="p-0.5 rounded border border-neutral-250 bg-white hover:bg-neutral-50 active:scale-95 text-neutral-500 hover:text-neutral-700 cursor-pointer"
                          title="Voltar malote inteiro"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMovePouch?.(pouchCode, 1);
                          }}
                          className="p-0.5 rounded border border-brand-300 bg-brand-50 hover:bg-brand text-brand hover:text-white active:scale-95 cursor-pointer font-bold"
                          title="Despachar malote inteiro"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pouch OSs list (Accordion content) */}
                  {isExpanded && (
                    <div className="flex flex-col gap-2 mt-1.5 pt-2 border-t border-brand-200/50 animate-fade-in">
                      {sortedPouchOrders.map((order) => (
                        <KanbanCard
                          key={order.id}
                          order={order}
                          onMoveCard={onMoveCard}
                          onOpenReceipt={onOpenReceipt}
                          onOpenPickup={onOpenPickup}
                          onOpenCaveat={onOpenCaveat}
                          inPouch={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unassigned OSs (fallback if admin/gerente moved card directly) */}
            {groupedOrders.unassigned.map((order) => (
              <KanbanCard
                key={order.id}
                order={order}
                onMoveCard={onMoveCard}
                onOpenReceipt={onOpenReceipt}
                onOpenPickup={onOpenPickup}
                onOpenCaveat={onOpenCaveat}
              />
            ))}

            {Object.keys(groupedOrders.groups).length === 0 && groupedOrders.unassigned.length === 0 && (
              <div className="flex items-center justify-center h-20 text-[10px] text-neutral-400 font-medium border border-dashed border-neutral-300 rounded-lg bg-white/40">
                Sem serviços nesta etapa
              </div>
            )}
          </>
        ) : (
          sortedOrders.length === 0 ? (
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
          )
        )}
      </div>
    </div>
  );
}
export default KanbanColumn;
