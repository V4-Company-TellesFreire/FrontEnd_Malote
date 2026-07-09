import * as React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useServiceOrders, useTransitionStatus } from '../../features/os/hooks';
import { Tabs, Input, Button, Skeleton, EmptyState, ErrorState, useToast } from '../../components/ui';
import { KanbanColumn } from '../../components/kanban/KanbanColumn';
import { ReceiptConfirmationModal } from '../../components/forms/ReceiptConfirmationModal';
import { ClientPickupModal } from '../../components/forms/ClientPickupModal';
import { Eye, PackageCheck, RotateCcw, PlusCircle, Search, Layers, AlertTriangle, FlaskConical, BarChart2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useStoreMetrics } from '../../features/dashboard/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { getValidTransitions, getPreviousStatus, type ServiceOrderStatus } from '../../lib/constants';

export interface StorePanelPageProps {
  initialTab?: 'dashboard' | 'track' | 'deliveries' | 'rectifications' | 'config';
}

export function StorePanelPage({ initialTab = 'dashboard' }: StorePanelPageProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const storeId = useAuthStore((s) => s.selectedStoreId);

  const [activeTab, setActiveTab] = React.useState<string>(initialTab);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sellerFilter, setSellerFilter] = React.useState('');

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Modals state
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = React.useState(false);
  const [pickupModalOpen, setPickupModalOpen] = React.useState(false);

  // Pre-filter seller initial check if vendedor
  React.useEffect(() => {
    if (user?.role === 'vendedor') {
      setSellerFilter(user.name);
    }
  }, [user]);

  // Load orders
  const { data: orders, isLoading, isError, error, refetch } = useServiceOrders({
    storeId: storeId || undefined,
  });

  // Load dashboard metrics
  const { data: metrics, isLoading: isMetricsLoading } = useStoreMetrics(storeId || '');

  const chartData = React.useMemo(() => {
    if (!metrics) return [];
    const stageMap: Record<string, { count: number; color: string }> = {
      'Malote': { count: 0, color: '#FFC20E' },
      'Laboratório': { count: 0, color: '#4338CA' },
      'Montagem': { count: 0, color: '#DC8C0A' },
      'Qualidade': { count: 0, color: '#64748B' },
      'Triagem': { count: 0, color: '#0891B2' },
      'Expedição': { count: 0, color: '#7C3AED' },
      'Em Rota': { count: 0, color: '#0369A1' },
      'Entregue': { count: 0, color: '#0D9F6F' },
    };

    const statusToStage: Record<ServiceOrderStatus, string> = {
      'Chegada de Malote': 'Malote',
      'Envio Laboratório': 'Laboratório',
      'Montagem': 'Montagem',
      'Controle de Qualidade': 'Qualidade',
      'Separando': 'Triagem',
      'Expedição': 'Expedição',
      'Em Rota': 'Em Rota',
      'Entregue na Loja': 'Entregue',
      'Entregue c/ Ressalva': 'Entregue',
      'Entregue ao Cliente': 'Entregue',
    };

    Object.entries(metrics.ordersByStatus).forEach(([status, count]) => {
      const stage = statusToStage[status as ServiceOrderStatus];
      if (stage && stageMap[stage]) {
        stageMap[stage].count += count;
      }
    });

    return Object.entries(stageMap).map(([name, data]) => ({
      name,
      Quantidade: data.count,
      color: data.color,
    }));
  }, [metrics]);

  const pieData = React.useMemo(() => {
    if (!metrics) return [];
    return [
      { name: 'Katz Central', value: metrics.mountingsKatz, color: '#1F3F77' },
      { name: 'Parceiro Externo', value: metrics.mountingsExternal, color: '#1B9AAA' },
    ].filter(v => v.value > 0);
  }, [metrics]);

  const transitionMutation = useTransitionStatus();

  // Filter orders
  const filteredOrders = React.useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      // Search OS number, store number or client name
      const matchesSearch =
        o.osNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.osStore.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.clientName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeller = sellerFilter
        ? o.sellerName.toLowerCase().includes(sellerFilter.toLowerCase())
        : true;

      return matchesSearch && matchesSeller;
    });
  }, [orders, searchQuery, sellerFilter]);

  // Orders counts
  const activeOrders = React.useMemo(() => {
    return filteredOrders.filter(
      (o) =>
        o.status !== 'Entregue na Loja' &&
        o.status !== 'Entregue c/ Ressalva' &&
        o.status !== 'Entregue ao Cliente'
    );
  }, [filteredOrders]);

  const deliveryOrders = React.useMemo(() => {
    return filteredOrders.filter(
      (o) => o.status === 'Entregue na Loja' || o.status === 'Entregue c/ Ressalva'
    );
  }, [filteredOrders]);

  const clientPickupOrders = React.useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'Entregue ao Cliente');
  }, [filteredOrders]);

  const rectificationOrders = React.useMemo(() => {
    return filteredOrders.filter((o) => !!o.parentOsId || !!o.rectification);
  }, [filteredOrders]);

  // Handle manual column status updates (forward/backward click)
  const handleMoveCard = (id: string, direction: -1 | 1) => {
    const order = orders?.find((o) => o.id === id);
    if (!order) return;

    if (direction === 1) {
      // Forward transition rules
      // If moving from route to store, trigger receipt photo modal instead of auto updating
      if (order.status === 'Em Rota') {
        setSelectedOrderId(id);
        setReceiptModalOpen(true);
        return;
      }
      // If moving from store/caveat to client, trigger pickup modal
      if (order.status === 'Entregue na Loja' || order.status === 'Entregue c/ Ressalva') {
        setSelectedOrderId(id);
        setPickupModalOpen(true);
        return;
      }

      // Default linear forward transition
      const nextStatuses = getValidTransitions(order.status);
      if (nextStatuses.length > 0) {
        const targetStatus = nextStatuses[0];
        transitionMutation.mutate(
          {
            id,
            payload: { to: targetStatus },
          },
          {
            onSuccess: () => {
              toast.success('Status da OS atualizado com sucesso.');
            },
            onError: (err: any) => {
              toast.error(err.message || 'Falha ao atualizar status da OS.');
            },
          }
        );
      }
    } else {
      // Backward transition
      const prevStatus = getPreviousStatus(order.status);
      if (prevStatus) {
        transitionMutation.mutate(
          {
            id,
            payload: { to: prevStatus },
          },
          {
            onSuccess: () => {
              toast.success('Status da OS atualizado com sucesso.');
            },
            onError: (err: any) => {
              toast.error(err.message || 'Falha ao atualizar status da OS.');
            },
          }
        );
      }
    }
  };

  const handleOpenReceiptModal = (id: string) => {
    setSelectedOrderId(id);
    setReceiptModalOpen(true);
  };

  const handleOpenPickupModal = (id: string) => {
    setSelectedOrderId(id);
    setPickupModalOpen(true);
  };

  const handleOpenCaveatModal = (id: string) => {
    setSelectedOrderId(id);
    setReceiptModalOpen(true);
  };

  const tabItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 className="h-4 w-4" /> },
    { id: 'track', label: 'Acompanhamento', count: activeOrders.length, icon: <Eye className="h-4 w-4" /> },
    { id: 'deliveries', label: 'Entregues', count: deliveryOrders.length, icon: <PackageCheck className="h-4 w-4" /> },
    { id: 'rectifications', label: 'Retificações', count: rectificationOrders.length, icon: <RotateCcw className="h-4 w-4" /> },
  ];

  const renderMetrics = () => {
    if (isMetricsLoading || !metrics) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-neutral-200/80 shadow-xs bg-white rounded-2xl">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-neutral-200/80 shadow-xs bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Volume no Pipeline
              </span>
              <span className="text-2xl font-black text-brand-900 font-display block mt-1">
                {metrics.totalOrders || 0}
              </span>
            </div>
            <div className="h-9 w-9 rounded-[8px] bg-brand flex items-center justify-center shrink-0">
              <Layers className="h-4.5 w-4.5 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200/80 shadow-xs bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Urgências Ativas
              </span>
              <span className="text-2xl font-black text-brand-900 font-display block mt-1">
                {metrics.urgentCount || 0}
              </span>
            </div>
            <div className="h-9 w-9 rounded-[8px] bg-brand flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4.5 w-4.5 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200/80 shadow-xs bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Entregues Hoje
              </span>
              <span className="text-2xl font-black text-brand-900 font-display block mt-1">
                {metrics.deliveredToday || 0}
              </span>
            </div>
            <div className="h-9 w-9 rounded-[8px] bg-brand flex items-center justify-center shrink-0">
              <PackageCheck className="h-4.5 w-4.5 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200/80 shadow-xs bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Lab Terceirizado
              </span>
              <span className="text-2xl font-black text-brand-900 font-display block mt-1">
                {metrics.externalLabCount || 0}
              </span>
            </div>
            <div className="h-9 w-9 rounded-[8px] bg-brand flex items-center justify-center shrink-0">
              <FlaskConical className="h-4.5 w-4.5 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCharts = () => {
    if (isMetricsLoading || !metrics) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-neutral-200/80 shadow-xs bg-white rounded-2xl">
            <CardContent className="h-72 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </CardContent>
          </Card>
          <Card className="border-neutral-200/80 shadow-xs bg-white rounded-2xl">
            <CardContent className="h-72 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-neutral-200/80 shadow-xs bg-white rounded-2xl">
          <CardHeader className="pb-3 border-b border-neutral-100">
            <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-brand-900 select-none">
              <BarChart2 className="h-4.5 w-4.5 text-neutral-400" />
              <span>Distribuição por Etapa do Kanban</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} fontStyle="bold" />
                <YAxis stroke="#94A3B8" fontSize={9} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E7EC',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'Inter',
                  }}
                  cursor={{ fill: '#F8FAFB' }}
                />
                <Bar dataKey="Quantidade" fill="#1F3F77" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-neutral-200/80 shadow-xs bg-white rounded-2xl">
          <CardHeader className="pb-3 border-b border-neutral-100">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-brand-900 select-none">Locais de Montagem</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex flex-col items-center justify-center relative pt-4">
            {pieData.length === 0 ? (
              <span className="text-neutral-400 text-xs font-semibold">Nenhum óculos montado hoje</span>
            ) : (
              <div className="h-full w-full relative flex items-center justify-center pb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-0 flex justify-center gap-4 w-full px-2">
                  {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-[9px] text-neutral-600 font-bold">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      <span>{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

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
        message={error?.message || 'Falha ao carregar ordens de serviço.'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Tabs */}
      <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Panels */}
      <div className="flex-1">
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-extrabold text-brand-900 leading-tight">
                Olá, {user?.name}!
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Aqui está o resumo operacional da sua filial hoje.
              </p>
            </div>

            {renderMetrics()}
            {renderCharts()}
          </div>
        )}

        {activeTab !== 'dashboard' && (
          <div className="flex flex-col gap-6">
            {/* Search and Filters Section */}
            <div className="flex flex-col md:flex-row gap-3 items-end p-4 rounded-xl border border-neutral-200 bg-white shadow-xs w-full">
              <div className="flex-1 w-full relative">
                <Input
                  label="Buscar por OS ou cliente"
                  placeholder="Ex: 123456, João..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4 text-neutral-400" />}
                />
              </div>

              {/* Seller Filter (only for non-vendedores) */}
              {user?.role !== 'vendedor' && (
                <div className="w-full md:w-56">
                  <Input
                    label="Filtrar por Vendedor"
                    placeholder="Nome do vendedor"
                    value={sellerFilter}
                    onChange={(e) => setSellerFilter(e.target.value)}
                  />
                </div>
              )}

              <Button
                variant="highlight"
                onClick={() => navigate('/store/new')}
                leftIcon={<PlusCircle className="h-4.5 w-4.5" />}
                className="h-10 font-bold w-full md:w-auto shrink-0"
              >
                Nova OS
              </Button>
            </div>

            {/* Acompanhamento (track) */}
            {activeTab === 'track' && (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-neutral-200">
                <KanbanColumn
                  status="Chegada de Malote"
                  orders={activeOrders.filter((o) => o.status === 'Chegada de Malote')}
                  onMoveCard={handleMoveCard}
                  onOpenReceipt={handleOpenReceiptModal}
                  onOpenPickup={handleOpenPickupModal}
                  onOpenCaveat={handleOpenCaveatModal}
                />
                <KanbanColumn
                  status="Envio Laboratório"
                  orders={activeOrders.filter((o) => o.status === 'Envio Laboratório')}
                  onMoveCard={handleMoveCard}
                  onOpenReceipt={handleOpenReceiptModal}
                  onOpenPickup={handleOpenPickupModal}
                  onOpenCaveat={handleOpenCaveatModal}
                />
                <KanbanColumn
                  status="Montagem"
                  orders={activeOrders.filter((o) => o.status === 'Montagem')}
                  onMoveCard={handleMoveCard}
                  onOpenReceipt={handleOpenReceiptModal}
                  onOpenPickup={handleOpenPickupModal}
                  onOpenCaveat={handleOpenCaveatModal}
                />
                <KanbanColumn
                  status="Controle de Qualidade"
                  orders={activeOrders.filter((o) => o.status === 'Controle de Qualidade')}
                  onMoveCard={handleMoveCard}
                  onOpenReceipt={handleOpenReceiptModal}
                  onOpenPickup={handleOpenPickupModal}
                  onOpenCaveat={handleOpenCaveatModal}
                />
                <KanbanColumn
                  status="Separando"
                  orders={activeOrders.filter((o) => o.status === 'Separando')}
                  onMoveCard={handleMoveCard}
                  onOpenReceipt={handleOpenReceiptModal}
                  onOpenPickup={handleOpenPickupModal}
                  onOpenCaveat={handleOpenCaveatModal}
                />
                <KanbanColumn
                  status="Expedição"
                  orders={activeOrders.filter((o) => o.status === 'Expedição')}
                  onMoveCard={handleMoveCard}
                  onOpenReceipt={handleOpenReceiptModal}
                  onOpenPickup={handleOpenPickupModal}
                  onOpenCaveat={handleOpenCaveatModal}
                />
                <KanbanColumn
                  status="Em Rota"
                  orders={activeOrders.filter((o) => o.status === 'Em Rota')}
                  onMoveCard={handleMoveCard}
                  onOpenReceipt={handleOpenReceiptModal}
                  onOpenPickup={handleOpenPickupModal}
                  onOpenCaveat={handleOpenCaveatModal}
                />
              </div>
            )}

            {/* Entregues (deliveries) */}
            {activeTab === 'deliveries' && (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-neutral-200">
                <KanbanColumn
                  status="Entregue na Loja"
                  orders={deliveryOrders.filter((o) => o.status === 'Entregue na Loja')}
                  onMoveCard={handleMoveCard}
                  onOpenReceipt={handleOpenReceiptModal}
                  onOpenPickup={handleOpenPickupModal}
                  onOpenCaveat={handleOpenCaveatModal}
                />
                <KanbanColumn
                  status="Entregue c/ Ressalva"
                  orders={deliveryOrders.filter((o) => o.status === 'Entregue c/ Ressalva')}
                  onMoveCard={handleMoveCard}
                  onOpenReceipt={handleOpenReceiptModal}
                  onOpenPickup={handleOpenPickupModal}
                  onOpenCaveat={handleOpenCaveatModal}
                />
                <KanbanColumn
                  status="Entregue ao Cliente"
                  orders={clientPickupOrders}
                  onMoveCard={handleMoveCard}
                  onOpenReceipt={handleOpenReceiptModal}
                  onOpenPickup={handleOpenPickupModal}
                  onOpenCaveat={handleOpenCaveatModal}
                />
              </div>
            )}

            {/* Retificações (rectifications) */}
            {activeTab === 'rectifications' && (
              <div className="flex flex-col gap-4">
                {rectificationOrders.length === 0 ? (
                  <EmptyState
                    title="Nenhuma retificação aberta"
                    description="Serviços que retornaram ao laboratório para correção aparecerão listados aqui."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rectificationOrders.map((o) => (
                      <div key={o.id} className="p-4 rounded-xl border border-neutral-200 bg-white flex flex-col gap-3 shadow-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs text-neutral-500">Mãe: {o.osNumber}</span>
                          <span className="px-2 py-0.5 rounded-full bg-warning-50 border border-warning-200 text-warning text-[10px] font-bold">
                            RETIFICAÇÃO
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-neutral-850 text-sm">{o.clientName}</h4>
                          <p className="text-xs text-neutral-500 mt-0.5">Filial: {o.storeName}</p>
                        </div>
                        {o.rectification && (
                          <div className="p-2.5 rounded bg-neutral-50 border border-neutral-150 text-xs text-neutral-600">
                            <p className="font-semibold text-neutral-800">Motivo: {o.rectification.reason}</p>
                            <p className="mt-1">Ação tomada: {o.rectification.action}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {selectedOrderId && (
        <ReceiptConfirmationModal
          isOpen={receiptModalOpen}
          onClose={() => {
            setReceiptModalOpen(false);
            setSelectedOrderId(null);
          }}
          orderId={selectedOrderId}
        />
      )}

      {/* Client Pickup Baixa Modal */}
      {selectedOrderId && (
        <ClientPickupModal
          isOpen={pickupModalOpen}
          onClose={() => {
            setPickupModalOpen(false);
            setSelectedOrderId(null);
          }}
          orderId={selectedOrderId}
        />
      )}
    </div>
  );
}
export default StorePanelPage;
