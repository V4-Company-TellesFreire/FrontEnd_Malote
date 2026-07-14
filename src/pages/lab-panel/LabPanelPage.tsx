import * as React from 'react';
import { useServiceOrders, useTransitionStatus, useNotifications, useSendWhatsApp } from '../../features/os/hooks';
import { Tabs, Button, Badge, Skeleton, EmptyState, ErrorState, StatusBadge, Modal, Card, CardContent, useToast } from '../../components/ui';
import { KanbanBoard } from '../../components/kanban/KanbanBoard';
import { KanbanFilters } from '../../components/kanban/KanbanFilters';
import type { KanbanFiltersData } from '../../components/kanban/KanbanFilters';
import { FlaskConical, Bell, AlertTriangle, Truck, ListFilter, Kanban, CheckSquare, ChevronRight } from 'lucide-react';
import { SERVICE_ORDER_STATUSES } from '../../lib/constants';
import { elapsed, formatDateTime } from '../../lib/utils';
import { ReceiptConfirmationModal } from '../../components/forms/ReceiptConfirmationModal';
import { ClientPickupModal } from '../../components/forms/ClientPickupModal';

export interface LabPanelPageProps {
  initialTab?: 'lab' | 'deliveries' | 'notifications' | 'caveats';
}

const PRODUCTION_STATUSES = [
  'Chegada de Malote',
  'Envio Laboratório',
  'Montagem',
  'Controle de Qualidade',
  'Separando',
  'Expedição',
  'Em Rota',
] as const;

const DELIVERY_STATUSES = [
  'Entregue na Loja',
  'Entregue c/ Ressalva',
  'Entregue ao Cliente',
] as const;

export function LabPanelPage({ initialTab = 'lab' }: LabPanelPageProps) {
  const toast = useToast();

  const [activeTab, setActiveTab] = React.useState<string>(initialTab);
  const [viewMode, setViewMode] = React.useState<'kanban' | 'table'>('kanban');

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Filters State
  const [filters, setFilters] = React.useState<KanbanFiltersData>({
    search: '',
    malote: '',
    urgency: '',
    storeId: '',
  });

  // Modal control
  const [dispatchModalOpen, setDispatchModalOpen] = React.useState(false);
  const [dispatchedOrdersCount, setDispatchedOrdersCount] = React.useState(0);
  const [dispatchedSummary, setDispatchedSummary] = React.useState<string[]>([]);

  // Card attachment viewer modal
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const [pickupOpen, setPickupOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  // Queries
  const { data: orders, isLoading, isError, error, refetch } = useServiceOrders();
  const { data: notifications } = useNotifications();

  const transitionMutation = useTransitionStatus();
  const sendWhatsAppMutation = useSendWhatsApp();

  const handleClearFilters = () => {
    setFilters({ search: '', malote: '', urgency: '', storeId: '' });
  };

  // Filter orders lists
  const filteredOrders = React.useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      const matchesSearch =
        o.osNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
        o.osStore.toLowerCase().includes(filters.search.toLowerCase()) ||
        o.clientName.toLowerCase().includes(filters.search.toLowerCase());

      const matchesMalote = filters.malote ? o.malote === filters.malote : true;
      const matchesUrgency = filters.urgency !== '' ? o.urgency === Number(filters.urgency) : true;
      const matchesStore = filters.storeId ? o.storeId === filters.storeId : true;

      return matchesSearch && matchesMalote && matchesUrgency && matchesStore;
    });
  }, [orders, filters]);

  // Aggregate stats
  const stats = React.useMemo(() => {
    if (!filteredOrders) return { total: 0, productionTotal: 0, deliveriesTotal: 0, mounting: 0, transit: 0, urgent: 0 };
    return {
      total: filteredOrders.length,
      productionTotal: filteredOrders.filter((o) => PRODUCTION_STATUSES.includes(o.status as any)).length,
      deliveriesTotal: filteredOrders.filter((o) => DELIVERY_STATUSES.includes(o.status as any)).length,
      mounting: filteredOrders.filter((o) => o.status === 'Montagem' || o.status === 'Controle de Qualidade').length,
      transit: filteredOrders.filter((o) => o.status === 'Expedição' || o.status === 'Em Rota').length,
      urgent: filteredOrders.filter((o) => o.urgency > 0).length,
    };
  }, [filteredOrders]);

  // Handle card moves
  const handleMoveCard = (id: string, direction: -1 | 1) => {
    const order = orders?.find((o) => o.id === id);
    if (!order) return;

    const currentIndex = SERVICE_ORDER_STATUSES.indexOf(order.status);
    const nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= SERVICE_ORDER_STATUSES.length) return;
    const targetStatus = SERVICE_ORDER_STATUSES[nextIndex];

    // If nextStatus is Montagem, prompt for katz vs external choice (simulate by setting default katz for demo, or prompts)
    const payload: any = { to: targetStatus };
    if (targetStatus === 'Montagem') {
      payload.mountingOrigin = 'katz';
    }

    transitionMutation.mutate(
      { id, payload },
      {
        onSuccess: () => {
          toast.success(`Ordem avançada para ${targetStatus}`);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Falha ao avançar ordem.');
        },
      }
    );
  };

  // Dispatch motoboy action (Seguindo com Renato)
  // Shifts all "Expedição" statuses to "Em Rota"
  const handleMotoboyDispatch = () => {
    const readyOrders = orders?.filter((o) => o.status === 'Expedição') || [];
    if (readyOrders.length === 0) {
      toast.warning('Nenhum serviço pronto em Expedição para despachar.');
      return;
    }

    setDispatchedOrdersCount(readyOrders.length);
    setDispatchedSummary(readyOrders.map((o) => `OS ${o.osNumber} — ${o.clientName} (${o.storeName})`));

    // Simulate batch mutations in mock list
    readyOrders.forEach((o) => {
      transitionMutation.mutate({
        id: o.id,
        payload: { to: 'Em Rota', reason: 'Enviado via Motoboy Renato' },
      });
    });

    setDispatchModalOpen(true);
    toast.success(`${readyOrders.length} serviços despachados com motoboy.`);
  };

  // WhatsApp manual trigger preview
  const handleWhatsAppManual = (notif: any) => {
    sendWhatsAppMutation.mutate(notif, {
      onSuccess: () => {
        toast.success(`Notificação WhatsApp disparada manualmente para ${notif.clientName}!`);
      },
    });
  };

  const handleOpenReceipt = (id: string) => {
    setSelectedOrderId(id);
    setReceiptOpen(true);
  };

  const handleOpenPickup = (id: string) => {
    setSelectedOrderId(id);
    setPickupOpen(true);
  };

  const handleOpenCaveat = (id: string) => {
    setSelectedOrderId(id);
    setConfirmOpen(true);
  };

  const tabItems = [
    { id: 'lab', label: 'Monitor de Produção', count: stats.productionTotal, icon: <FlaskConical className="h-4 w-4" /> },
    { id: 'deliveries', label: 'Fluxo de Entregas', count: stats.deliveriesTotal, icon: <Truck className="h-4 w-4" /> },
    { id: 'notifications', label: 'Alertas WhatsApp', count: notifications?.length || 0, icon: <Bell className="h-4 w-4" /> },
    { id: 'caveats', label: 'Ressalvas Relatadas', count: filteredOrders.filter(o => o.status === 'Entregue c/ Ressalva').length, icon: <AlertTriangle className="h-4 w-4" /> },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error?.message || 'Falha ao carregar monitor de produção.'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Motoboy dispatch action bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-accent-200 bg-accent-50/20 shadow-xs gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center text-white">
            <Truck className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-neutral-800">Despacho de Malote Rápido</span>
            <span className="text-[10px] text-neutral-500">
              Despachar todas as ordens com status "Expedição" via Motoboy Renato
            </span>
          </div>
        </div>
        <Button
          variant="accent"
          size="sm"
          onClick={handleMotoboyDispatch}
          className="font-bold flex items-center gap-1.5 shrink-0"
        >
          Seguindo com Renato
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs list filter */}
      <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />

      {/* Monitor dashboard display */}
      {(activeTab === 'lab' || activeTab === 'deliveries') && (() => {
        const activeStatuses = activeTab === 'lab' ? PRODUCTION_STATUSES : DELIVERY_STATUSES;
        const tabOrders = filteredOrders.filter(o => activeStatuses.includes(o.status as any));
        const activeUrgentCount = tabOrders.filter(o => o.urgency > 0).length;

        return (
          <div className="flex flex-col gap-4">
            
            {/* Quick stats grids */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-neutral-200">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-brand font-mono">{tabOrders.length}</span>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">
                    {activeTab === 'lab' ? 'Total em Produção' : 'Total em Entrega'}
                  </span>
                </CardContent>
              </Card>

              {activeTab === 'lab' ? (
                <>
                  <Card className="border-neutral-200">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-warning font-mono">{stats.mounting}</span>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Montando / QC</span>
                    </CardContent>
                  </Card>

                  <Card className="border-neutral-200">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-accent font-mono">{stats.transit}</span>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Expedição / Em rota</span>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <Card className="border-neutral-200">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-success-700 font-mono">
                        {tabOrders.filter(o => o.status === 'Entregue na Loja' || o.status === 'Entregue c/ Ressalva').length}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Recebidas nas Lojas</span>
                    </CardContent>
                  </Card>

                  <Card className="border-neutral-200">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-brand-900 font-mono">
                        {tabOrders.filter(o => o.status === 'Entregue ao Cliente').length}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Entregues ao Cliente</span>
                    </CardContent>
                  </Card>
                </>
              )}

              <Card className="border-neutral-200">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <span className={`text-2xl font-black font-mono ${activeUrgentCount > 0 ? 'text-critical animate-pulse' : 'text-neutral-700'}`}>
                    {activeUrgentCount}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Urgências Ativas</span>
                </CardContent>
              </Card>
            </div>

          {/* Filters and View toggles */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <KanbanFilters
                filters={filters}
                onChange={setFilters}
                onClear={handleClearFilters}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant={viewMode === 'kanban' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="text-xs font-bold"
                leftIcon={<Kanban className="h-4 w-4" />}
              >
                Kanban
              </Button>
              <Button
                variant={viewMode === 'table' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="text-xs font-bold border-neutral-300"
                leftIcon={<ListFilter className="h-4 w-4" />}
              >
                Tabela
              </Button>
            </div>
          </div>

            {/* Kanban Board rendering */}
            {viewMode === 'kanban' ? (
              <KanbanBoard
                orders={tabOrders}
                statuses={activeStatuses}
                onMoveCard={handleMoveCard}
                onOpenReceipt={handleOpenReceipt}
                onOpenPickup={handleOpenPickup}
                onOpenCaveat={handleOpenCaveat}
              />
            ) : (
              /* Table list layouts */
              <Card className="border-neutral-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                        <th className="p-3">Nº OS</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Loja / Turno</th>
                        <th className="p-3">Lente / Serviço</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Parado Há</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {tabOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-neutral-400 font-semibold">
                            Nenhum serviço nesta etapa correspondente aos filtros.
                          </td>
                        </tr>
                      ) : (
                        tabOrders.map((o) => (
                          <tr key={o.id} className="hover:bg-neutral-50/50">
                            <td className="p-3 font-mono font-bold text-neutral-700">{o.osNumber}</td>
                            <td className="p-3 font-bold text-neutral-850">{o.clientName}</td>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-bold">{o.storeName}</span>
                                <span className="text-[10px] text-neutral-400 mt-0.5">{o.malote}</span>
                              </div>
                            </td>
                            <td className="p-3 text-neutral-600">{o.lensType || o.serviceType}</td>
                            <td className="p-3">
                              <StatusBadge status={o.status} />
                            </td>
                            <td className="p-3 font-mono text-neutral-500">
                              {elapsed(o.statusChangedAt || o.createdAt)}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex gap-1.5 justify-end">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleMoveCard(o.id, -1)}
                                  className="h-7 text-[10px]"
                                  disabled={o.status === 'Chegada de Malote'}
                                >
                                  Voltar
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleMoveCard(o.id, 1)}
                                  className="h-7 text-[10px]"
                                  disabled={o.status === 'Entregue ao Cliente'}
                                >
                                  Avançar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        );
      })()}

      {/* Notifications History Panel */}
      {activeTab === 'notifications' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-neutral-700">Histórico de Mensagens WhatsApp</h3>
          </div>
          
          {notifications && notifications.length === 0 ? (
            <EmptyState
              title="Sem alertas hoje"
              description="Alertas automáticos disparados para clientes ao registrar malotes aparecerão aqui."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {notifications?.map((n) => (
                <div key={n.id} className="p-4 rounded-xl border border-neutral-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
                  <div className="flex flex-col gap-1.5 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-neutral-700">OS {n.osNumber}</span>
                      <span className="text-[10px] text-neutral-400">• {formatDateTime(n.timestamp)}</span>
                      <Badge variant={n.type === 'receipt_ok' ? 'success' : 'critical'} className="text-[9px] px-1.5 py-0">
                        {n.type === 'receipt_ok' ? 'Chegada OK' : 'Ressalva'}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-600 font-medium italic">
                      "{n.messagePreview}"
                    </p>
                    <span className="text-[10px] text-neutral-500 font-semibold">
                      Enviado por: {n.receivedBy} | Celular do Cliente: {n.clientName}
                    </span>
                  </div>

                  <Button
                    variant="whatsapp"
                    size="sm"
                    onClick={() => handleWhatsAppManual(n)}
                    className="font-bold flex items-center gap-1 text-xs shrink-0 self-end md:self-auto"
                  >
                    <CheckSquare className="h-4 w-4" />
                    Disparar Manual
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ressalvas list view */}
      {activeTab === 'caveats' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-neutral-700 font-display border-b border-neutral-100 pb-2">
            Serviços Recebidos com Problema / Ressalva
          </h3>

          {filteredOrders.filter(o => o.status === 'Entregue c/ Ressalva').length === 0 ? (
            <EmptyState
              title="Sem ressalvas relatadas"
              description="Serviços que chegaram nas lojas com problemas reportados pelos vendedores aparecerão listados aqui."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.filter(o => o.status === 'Entregue c/ Ressalva').map((o) => (
                <div key={o.id} className="p-4 rounded-xl border border-critical-200 bg-white flex flex-col gap-3 shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs text-neutral-500">OS {o.osNumber}</span>
                    <Badge variant="critical">Com Ressalva</Badge>
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-850 text-sm">{o.clientName}</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">{o.storeName} ({o.malote})</p>
                  </div>
                  {o.reception && (
                    <div className="p-3 bg-critical-50/50 border border-critical-100 rounded-lg text-xs text-critical-900 leading-normal flex flex-col gap-2">
                      <p className="font-semibold">Problema reportado:</p>
                      <p className="text-neutral-700 italic">"{o.reception.observation}"</p>
                      <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                        Relatado por: {o.reception.confirmedBy} em {formatDateTime(o.reception.ts)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary modal for Motoboy Dispatch */}
      <Modal
        isOpen={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        title="Despacho Motoboy Renato Concluído"
        description="A saída de malote foi registrada para os seguintes serviços:"
      >
        <div className="flex flex-col gap-3">
          <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded-lg bg-neutral-50 p-3 divide-y divide-neutral-150">
            {dispatchedSummary.map((line, i) => (
              <div key={i} className="py-2 text-xs text-neutral-600 font-semibold">
                {line}
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-500 leading-normal">
            Total despachado: <strong className="text-neutral-800">{dispatchedOrdersCount} serviços</strong>. 
            O status dessas OS foi alterado para <strong className="text-success-800 font-bold bg-success-50 px-2 py-0.5 rounded">Em Rota</strong>.
          </p>
        </div>
      </Modal>

      {/* Confirmation and Pickup Modals overlays */}
      {selectedOrderId && (
        <ReceiptConfirmationModal
          isOpen={confirmOpen}
          onClose={() => {
            setConfirmOpen(false);
            setSelectedOrderId(null);
          }}
          orderId={selectedOrderId}
        />
      )}

      {selectedOrderId && (
        <ClientPickupModal
          isOpen={pickupOpen}
          onClose={() => {
            setPickupOpen(false);
            setSelectedOrderId(null);
          }}
          orderId={selectedOrderId}
        />
      )}

      {/* Receipt Photo Viewer Overlay */}
      {selectedOrderId && (
        <Modal
          isOpen={receiptOpen}
          onClose={() => {
            setReceiptOpen(false);
            setSelectedOrderId(null);
          }}
          title="Visualizar Receita / Anexo"
        >
          <div className="flex justify-center p-2">
            <img
              src={orders?.find(o => o.id === selectedOrderId)?.receiptImageUrl || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=400&q=80'}
              alt="Anexo da OS"
              className="max-w-full max-h-[70vh] rounded border shadow-sm object-contain"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
export default LabPanelPage;
