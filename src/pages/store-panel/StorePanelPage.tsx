import * as React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useServiceOrders, useTransitionStatus, useNotifications, useSendWhatsApp } from '../../features/os/hooks';
import { Tabs, Button, Badge, Skeleton, EmptyState, ErrorState, StatusBadge, useToast, SearchableDropdown } from '../../components/ui';
import { KanbanColumn } from '../../components/kanban/KanbanColumn';
import { KanbanBoard } from '../../components/kanban/KanbanBoard';
import { KanbanFilters, type KanbanFiltersData } from '../../components/kanban/KanbanFilters';
import { CreateMaloteModal } from '../../components/kanban/CreateMaloteModal';
import { ReceiptConfirmationModal } from '../../components/forms/ReceiptConfirmationModal';
import { ClientPickupModal } from '../../components/forms/ClientPickupModal';
import { Eye, PackageCheck, RotateCcw, PlusCircle, Layers, AlertTriangle, FlaskConical, BarChart2, Loader2, Shield, FileSpreadsheet, Bell, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useStoreMetrics, useNetworkMetrics } from '../../features/dashboard/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { getValidTransitions, getPreviousStatus, canTransitionTo, type ServiceOrderStatus } from '../../lib/constants';
import { canPerformTransition } from '../../lib/permissions';
import { useDragToScroll } from '../../hooks/useDragToScroll';
import { formatDateTime, elapsed } from '../../lib/utils';

const PRODUCTION_STATUSES = [
  'Chegada de Malote',
  'Envio Laboratório',
  'Montagem',
  'Controle de Qualidade',
  'Separando',
  'Pronto para Expedição',
  'Em Rota',
] as const;

export interface StorePanelPageProps {
  initialTab?: 'dashboard' | 'track' | 'deliveries' | 'rectifications' | 'config';
}

export function StorePanelPage({ initialTab = 'dashboard' }: StorePanelPageProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const storeId = useAuthStore((s) => s.selectedStoreId);
  const trackDragRef = useDragToScroll();
  const deliveriesDragRef = useDragToScroll();

  const [activeTab, setActiveTab] = React.useState<string>(initialTab);
  const [clientFilter, setClientFilter] = React.useState('');
  const [osNumberFilter, setOsNumberFilter] = React.useState('');
  const [sellerFilter, setSellerFilter] = React.useState('');

  const [labFilters, setLabFilters] = React.useState<KanbanFiltersData>({
    osNumber: '',
    client: '',
    seller: '',
    malote: '',
    urgency: '',
    storeId: '',
  });
  const [viewMode, setViewMode] = React.useState<'kanban' | 'table'>('kanban');

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Modals state
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = React.useState(false);
  const [pickupModalOpen, setPickupModalOpen] = React.useState(false);
  const [maloteModalOpen, setMaloteModalOpen] = React.useState(false);
  const [maloteTriggerOsId, setMaloteTriggerOsId] = React.useState<string | null>(null);
  const [isMaloteSubmitting, setIsMaloteSubmitting] = React.useState(false);

  // No auto-filter by seller name — vendedor already sees only their store's OS via API
  // Filtering by seller name here would hide newly created OS when sellerName !== user.name

  // Load orders
  const { data: orders, isLoading, isError, error, refetch } = useServiceOrders({
    storeId: storeId || undefined,
  });

  // Lab notifications queries (only for admin/lab)
  const { data: notifications } = useNotifications();
  const sendWhatsAppMutation = useSendWhatsApp();



  // Consolidated view flag (gerente or admin without a selected store)
  const isConsolidatedView = (user?.role === 'gerente' || user?.role === 'admin') && !storeId;

  // Load dashboard metrics — network-wide for consolidated, per-store otherwise
  const { data: storeMetrics, isLoading: isStoreMetricsLoading } = useStoreMetrics(storeId || '', !isConsolidatedView && !!storeId);
  const { data: networkMetrics, isLoading: isNetworkMetricsLoading } = useNetworkMetrics(isConsolidatedView);
  const metrics = isConsolidatedView ? networkMetrics : storeMetrics;
  const isMetricsLoading = isConsolidatedView ? isNetworkMetricsLoading : isStoreMetricsLoading;

  const chartData = React.useMemo(() => {
    if (!metrics) return [];
    const stageMap: Record<string, { count: number; color: string }> = {
      'Malote': { count: 0, color: '#FFC20E' },
      'Laboratório': { count: 0, color: '#4338CA' },
      'Montagem': { count: 0, color: '#DC8C0A' },
      'Qualidade': { count: 0, color: '#64748B' },
      'Triagem': { count: 0, color: '#0891B2' },
      'Pronto para Expedição': { count: 0, color: '#7C3AED' },
      'Em Rota': { count: 0, color: '#0369A1' },
      'Entregue': { count: 0, color: '#0D9F6F' },
    };

    const statusToStage: Record<ServiceOrderStatus, string> = {
      'Chegada de Malote': 'Malote',
      'Envio Laboratório': 'Laboratório',
      'Montagem': 'Montagem',
      'Controle de Qualidade': 'Qualidade',
      'Separando': 'Triagem',
      'Pronto para Expedição': 'Pronto para Expedição',
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

  // Unique options for dropdown lists extracted from active orders
  const osNumberOptions = React.useMemo(() => {
    if (!orders) return [];
    return Array.from(new Set(orders.map((o) => o.osNumber).filter(Boolean))).sort();
  }, [orders]);

  const clientOptions = React.useMemo(() => {
    if (!orders) return [];
    return Array.from(new Set(orders.map((o) => o.clientName).filter(Boolean))).sort();
  }, [orders]);

  const sellerOptions = React.useMemo(() => {
    if (!orders) return [];
    return Array.from(new Set(orders.map((o) => o.sellerName).filter(Boolean))).sort();
  }, [orders]);

  const transitionMutation = useTransitionStatus();

  // Filter orders (regular roles)
  const filteredOrders = React.useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      const matchesClient = clientFilter
        ? o.clientName.toLowerCase().includes(clientFilter.toLowerCase())
        : true;

      const matchesOsNumber = osNumberFilter
        ? o.osNumber.toLowerCase().includes(osNumberFilter.toLowerCase()) ||
          o.osStore.toLowerCase().includes(osNumberFilter.toLowerCase())
        : true;

      const matchesSeller = sellerFilter
        ? (o.sellerName || '').toLowerCase().includes(sellerFilter.toLowerCase())
        : true;

      return matchesClient && matchesOsNumber && matchesSeller;
    });
  }, [orders, clientFilter, osNumberFilter, sellerFilter]);

  // Filter orders (admin role with lab/consolidated filters)
  const adminFilteredOrders = React.useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      const matchesOsNumber = labFilters.osNumber
        ? o.osNumber.toLowerCase().includes(labFilters.osNumber.toLowerCase()) ||
          o.osStore.toLowerCase().includes(labFilters.osNumber.toLowerCase())
        : true;

      const matchesClient = labFilters.client
        ? o.clientName.toLowerCase().includes(labFilters.client.toLowerCase())
        : true;

      const matchesSeller = labFilters.seller
        ? (o.sellerName || '').toLowerCase().includes(labFilters.seller.toLowerCase())
        : true;

      const matchesMalote = labFilters.malote ? o.malote === labFilters.malote : true;
      const matchesUrgency = labFilters.urgency !== '' ? o.urgency === Number(labFilters.urgency) : true;
      const matchesStore = labFilters.storeId ? o.storeId === labFilters.storeId : true;

      return matchesOsNumber && matchesClient && matchesSeller && matchesMalote && matchesUrgency && matchesStore;
    });
  }, [orders, labFilters]);

  const activeFilteredOrders = user?.role === 'admin' ? adminFilteredOrders : filteredOrders;

  // Orders counts
  const activeOrders = React.useMemo(() => {
    return activeFilteredOrders.filter(
      (o) =>
        o.status !== 'Entregue na Loja' &&
        o.status !== 'Entregue c/ Ressalva' &&
        o.status !== 'Entregue ao Cliente'
    );
  }, [activeFilteredOrders]);

  const deliveryOrders = React.useMemo(() => {
    return activeFilteredOrders.filter(
      (o) => o.status === 'Entregue na Loja' || o.status === 'Entregue c/ Ressalva'
    );
  }, [activeFilteredOrders]);

  const clientPickupOrders = React.useMemo(() => {
    return activeFilteredOrders.filter((o) => o.status === 'Entregue ao Cliente');
  }, [activeFilteredOrders]);

  const rectificationOrders = React.useMemo(() => {
    return activeFilteredOrders.filter((o) => !!o.parentOsId || !!o.rectification);
  }, [activeFilteredOrders]);

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

        // Intercept transition to 'Pronto para Expedição' for vendedor role
        if (order.status === 'Separando' && targetStatus === 'Pronto para Expedição' && user?.role === 'vendedor') {
          setMaloteTriggerOsId(id);
          setMaloteModalOpen(true);
          return;
        }

        const isCreator = order.createdBy === user?.id;
        if (!canPerformTransition(user?.role || 'vendedor', order.status, targetStatus, isCreator)) {
          toast.error('Você não tem permissão para mover esta ordem de serviço.');
          return;
        }

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
        const isCreator = order.createdBy === user?.id;
        if (!canPerformTransition(user?.role || 'vendedor', order.status, prevStatus, isCreator)) {
          toast.error('Você não tem permissão para mover esta ordem de serviço.');
          return;
        }

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

  const handleConfirmCreateMalote = async (selectedIds: string[], pouchCode: string) => {
    setIsMaloteSubmitting(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          transitionMutation.mutateAsync({
            id,
            payload: {
              to: 'Pronto para Expedição',
              pouchCode,
            },
          })
        )
      );
      toast.success(`Malote ${pouchCode} criado com sucesso contendo ${selectedIds.length} OSs!`);
      setMaloteModalOpen(false);
      setMaloteTriggerOsId(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Falha ao criar o malote.');
    } finally {
      setIsMaloteSubmitting(false);
    }
  };

  const handleDropCard = (id: string, targetStatus: ServiceOrderStatus) => {
    const order = orders?.find((o) => o.id === id);
    if (!order) return;

    // Validate transition feasibility
    if (!canTransitionTo(order.status, targetStatus)) {
      toast.error('Transição de status inválida.');
      return;
    }

    const isCreator = order.createdBy === user?.id;
    if (!canPerformTransition(user?.role || 'vendedor', order.status, targetStatus, isCreator)) {
      toast.error('Você não tem permissão para mover esta ordem de serviço.');
      return;
    }

    if (order.status === 'Separando' && targetStatus === 'Pronto para Expedição' && user?.role === 'vendedor') {
      setMaloteTriggerOsId(id);
      setMaloteModalOpen(true);
      return;
    }

    // Check special modal-based transitions
    if (targetStatus === 'Entregue na Loja') {
      setSelectedOrderId(id);
      setReceiptModalOpen(true);
      return;
    }
    if (targetStatus === 'Entregue ao Cliente') {
      setSelectedOrderId(id);
      setPickupModalOpen(true);
      return;
    }

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
  };

  const handleDropPouch = async (pouchCode: string, targetStatus: ServiceOrderStatus) => {
    const pouchOrders = orders?.filter(o => o.pouchCode === pouchCode) || [];
    if (pouchOrders.length === 0) return;

    const firstOrder = pouchOrders[0];
    if (!canTransitionTo(firstOrder.status, targetStatus)) {
      toast.error('Transição de status inválida para este malote.');
      return;
    }

    if (targetStatus === 'Pronto para Expedição' && user?.role === 'vendedor') {
      toast.error('O malote já está pronto para expedição.');
      return;
    }

    try {
      await Promise.all(pouchOrders.map(o => 
        transitionMutation.mutateAsync({
          id: o.id,
          payload: { to: targetStatus, pouchCode }
        })
      ));
      toast.success(`Malote ${pouchCode} movido com sucesso para ${targetStatus}!`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao mover malote.');
    }
  };

  const handleMovePouch = async (pouchCode: string, direction: -1 | 1) => {
    const pouchOrders = orders?.filter(o => o.pouchCode === pouchCode) || [];
    if (pouchOrders.length === 0) return;

    const firstOrder = pouchOrders[0];
    const targetStatus = direction === 1 
      ? getValidTransitions(firstOrder.status)[0]
      : getPreviousStatus(firstOrder.status);

    if (!targetStatus) return;

    try {
      await Promise.all(pouchOrders.map(o => 
        transitionMutation.mutateAsync({
          id: o.id,
          payload: { to: targetStatus, pouchCode }
        })
      ));
      toast.success(`Malote ${pouchCode} movido para ${targetStatus}!`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao mover malote.');
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

  const handleWhatsAppManual = (notif: any) => {
    sendWhatsAppMutation.mutate(notif, {
      onSuccess: () => {
        toast.success(`Notificação WhatsApp disparada manualmente para ${notif.clientName}!`);
      },
    });
  };


  const tabItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 className="h-4 w-4" /> },
    { id: 'track', label: 'Acompanhamento', count: activeOrders.length, icon: <Eye className="h-4 w-4" /> },
    { id: 'deliveries', label: 'Entregues', count: deliveryOrders.length, icon: <PackageCheck className="h-4 w-4" /> },
    { id: 'rectifications', label: 'Retificações', count: rectificationOrders.length, icon: <RotateCcw className="h-4 w-4" /> },
  ];
  if (user?.role === 'admin') {
    tabItems.push(
      { id: 'notifications', label: 'Alertas WhatsApp', count: notifications?.length || 0, icon: <Bell className="h-4 w-4" /> },
      { id: 'caveats', label: 'Ressalvas Relatadas', count: filteredOrders.filter(o => o.status === 'Entregue c/ Ressalva').length, icon: <AlertTriangle className="h-4 w-4" /> }
    );
  }

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
                {isConsolidatedView
                  ? 'Visão consolidada de todas as filiais da rede.'
                  : 'Aqui está o resumo operacional da sua filial hoje.'
                }
              </p>
            </div>

            {renderMetrics()}
            {renderCharts()}

            {/* Network Power BI frame placeholder (admin only in consolidated view) */}
            {isConsolidatedView && user?.role === 'admin' && (
              <Card className="border-neutral-200 shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-100">
                  <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-brand-900 select-none">
                    <Shield className="h-4.5 w-4.5 text-warning" />
                    <span>Painel Executivo Power BI Incorporado</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-96 w-full bg-neutral-50 flex flex-col items-center justify-center gap-4 text-center border-t border-neutral-200">
                    <FileSpreadsheet className="h-12 w-12 text-neutral-400 animate-pulse" />
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-neutral-700">Embed Power BI Integrado via Iframe</span>
                      <span className="text-[10px] text-neutral-400 max-w-xs leading-normal">
                        Este container carrega o iframe seguro com os relatórios analíticos de faturamento do Grupo Katz
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {(activeTab === 'track' || activeTab === 'deliveries' || activeTab === 'rectifications') && (
          <div className="flex flex-col gap-6">
            {/* Search and Filters Section */}
            {user?.role === 'admin' ? (
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-neutral-200 shadow-xs w-full">
                <KanbanFilters
                  filters={labFilters}
                  onChange={setLabFilters}
                  onClear={() => setLabFilters({ osNumber: '', client: '', seller: '', malote: '', urgency: '', storeId: '' })}
                />
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-3 items-end p-4 rounded-xl border border-neutral-200 bg-white shadow-xs w-full">
                <div className="w-full md:w-44">
                  <SearchableDropdown
                    label="Nº da OS"
                    placeholder="Todas as OS"
                    searchPlaceholder="Buscar OS..."
                    options={osNumberOptions}
                    value={osNumberFilter}
                    onChange={setOsNumberFilter}
                  />
                </div>

                <div className="flex-1 w-full">
                  <SearchableDropdown
                    label="Cliente"
                    placeholder="Todos os clientes"
                    searchPlaceholder="Buscar cliente..."
                    options={clientOptions}
                    value={clientFilter}
                    onChange={setClientFilter}
                  />
                </div>

                <div className="w-full md:w-56">
                  <SearchableDropdown
                    label="Vendedor"
                    placeholder="Todos os vendedores"
                    searchPlaceholder="Buscar vendedor..."
                    options={sellerOptions}
                    value={sellerFilter}
                    onChange={setSellerFilter}
                  />
                </div>

                <Button
                  variant="highlight"
                  onClick={() => navigate('/store/new')}
                  leftIcon={<PlusCircle className="h-4.5 w-4.5" />}
                  className="h-10 font-bold w-full md:w-auto shrink-0"
                >
                  Nova OS
                </Button>
              </div>
            )}

            {/* Acompanhamento (track) */}
            {activeTab === 'track' && (
              user?.role === 'admin' ? (
                <div className="flex flex-col gap-5 animate-fade-in">
                  {/* Quick stats grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-neutral-200/80 shadow-xs bg-white rounded-2xl">
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-black text-brand font-mono">{activeOrders.length}</span>
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">
                          Total em Produção
                        </span>
                      </CardContent>
                    </Card>
                    <Card className="border-neutral-200/80 shadow-xs bg-white rounded-2xl">
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-black text-warning font-mono">
                          {activeOrders.filter(o => o.status === 'Montagem' || o.status === 'Controle de Qualidade').length}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Montando / QC</span>
                      </CardContent>
                    </Card>
                    <Card className="border-neutral-200/80 shadow-xs bg-white rounded-2xl">
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-black text-accent font-mono">
                          {activeOrders.filter(o => o.status === 'Pronto para Expedição' || o.status === 'Em Rota').length}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Pronto / Em rota</span>
                      </CardContent>
                    </Card>
                    <Card className="border-neutral-200/80 shadow-xs bg-white rounded-2xl">
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <span className={`text-2xl font-black font-mono ${activeOrders.filter(o => o.urgency > 0).length > 0 ? 'text-critical animate-pulse' : 'text-neutral-700'}`}>
                          {activeOrders.filter(o => o.urgency > 0).length}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Urgências Ativas</span>
                      </CardContent>
                    </Card>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant={viewMode === 'kanban' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setViewMode('kanban')}
                      className="text-xs font-bold"
                      leftIcon={<BarChart2 className="h-4 w-4" />}
                    >
                      Kanban
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="text-xs font-bold border-neutral-300"
                      leftIcon={<Layers className="h-4 w-4" />}
                    >
                      Tabela
                    </Button>
                  </div>

                  {viewMode === 'kanban' ? (
                    <KanbanBoard
                      orders={activeOrders}
                      statuses={PRODUCTION_STATUSES}
                      onMoveCard={handleMoveCard}
                      onOpenReceipt={handleOpenReceiptModal}
                      onOpenPickup={handleOpenPickupModal}
                      onOpenCaveat={handleOpenCaveatModal}
                      onDropCard={handleDropCard}
                      onDropPouch={handleDropPouch}
                      onMovePouch={handleMovePouch}
                      onCreateMalote={() => {
                        setMaloteTriggerOsId(null);
                        setMaloteModalOpen(true);
                      }}
                    />
                  ) : (
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
                              <th className="p-3 font-mono">Parado Há</th>
                              <th className="p-3 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {activeOrders.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-neutral-400 font-semibold">
                                  Nenhum serviço nesta etapa correspondente aos filtros.
                                </td>
                              </tr>
                            ) : (
                              activeOrders.map((o) => (
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
              ) : (
                <div ref={trackDragRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-neutral-200 cursor-grab animate-fade-in">
                  <KanbanColumn
                    status="Chegada de Malote"
                    orders={activeOrders.filter((o) => o.status === 'Chegada de Malote')}
                    onMoveCard={handleMoveCard}
                    onOpenReceipt={handleOpenReceiptModal}
                    onOpenPickup={handleOpenPickupModal}
                    onOpenCaveat={handleOpenCaveatModal}
                    onDropCard={handleDropCard}
                  />
                  <KanbanColumn
                    status="Envio Laboratório"
                    orders={activeOrders.filter((o) => o.status === 'Envio Laboratório')}
                    onMoveCard={handleMoveCard}
                    onOpenReceipt={handleOpenReceiptModal}
                    onOpenPickup={handleOpenPickupModal}
                    onOpenCaveat={handleOpenCaveatModal}
                    onDropCard={handleDropCard}
                  />
                  <KanbanColumn
                    status="Montagem"
                    orders={activeOrders.filter((o) => o.status === 'Montagem')}
                    onMoveCard={handleMoveCard}
                    onOpenReceipt={handleOpenReceiptModal}
                    onOpenPickup={handleOpenPickupModal}
                    onOpenCaveat={handleOpenCaveatModal}
                    onDropCard={handleDropCard}
                  />
                  <KanbanColumn
                    status="Controle de Qualidade"
                    orders={activeOrders.filter((o) => o.status === 'Controle de Qualidade')}
                    onMoveCard={handleMoveCard}
                    onOpenReceipt={handleOpenReceiptModal}
                    onOpenPickup={handleOpenPickupModal}
                    onOpenCaveat={handleOpenCaveatModal}
                    onDropCard={handleDropCard}
                  />
                  <KanbanColumn
                    status="Separando"
                    orders={activeOrders.filter((o) => o.status === 'Separando')}
                    onMoveCard={handleMoveCard}
                    onOpenReceipt={handleOpenReceiptModal}
                    onOpenPickup={handleOpenPickupModal}
                    onOpenCaveat={handleOpenCaveatModal}
                    onDropCard={handleDropCard}
                    onDropPouch={handleDropPouch}
                  />
                  <KanbanColumn
                    status="Pronto para Expedição"
                    orders={activeOrders.filter((o) => o.status === 'Pronto para Expedição')}
                    onMoveCard={handleMoveCard}
                    onOpenReceipt={handleOpenReceiptModal}
                    onOpenPickup={handleOpenPickupModal}
                    onOpenCaveat={handleOpenCaveatModal}
                    onDropCard={handleDropCard}
                    onDropPouch={handleDropPouch}
                    onMovePouch={handleMovePouch}
                    onCreateMalote={() => {
                      setMaloteTriggerOsId(null);
                      setMaloteModalOpen(true);
                    }}
                  />
                  <KanbanColumn
                    status="Em Rota"
                    orders={activeOrders.filter((o) => o.status === 'Em Rota')}
                    onMoveCard={handleMoveCard}
                    onOpenReceipt={handleOpenReceiptModal}
                    onOpenPickup={handleOpenPickupModal}
                    onOpenCaveat={handleOpenCaveatModal}
                    onDropCard={handleDropCard}
                    onDropPouch={handleDropPouch}
                  />
                </div>
              )
            )}

            {/* Entregues (deliveries) */}
            {activeTab === 'deliveries' && (
              <div ref={deliveriesDragRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-neutral-200 cursor-grab">
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

        {/* Alertas WhatsApp (notifications) */}
        {activeTab === 'notifications' && (
          <div className="flex flex-col gap-4 mt-2">
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
                  <div key={n.id} className="p-4 rounded-xl border border-neutral-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs animate-fade-in">
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

        {/* Ressalvas Relatadas (caveats) */}
        {activeTab === 'caveats' && (
          <div className="flex flex-col gap-4 mt-2">
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
                  <div key={o.id} className="p-4 rounded-xl border border-critical-200 bg-white flex flex-col gap-3 shadow-xs animate-fade-in">
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

      {/* Create Pouch (Malote) Modal */}
      <CreateMaloteModal
        isOpen={maloteModalOpen}
        onClose={() => {
          setMaloteModalOpen(false);
          setMaloteTriggerOsId(null);
        }}
        orders={orders || []}
        initialSelectedOsId={maloteTriggerOsId}
        onConfirm={handleConfirmCreateMalote}
        isSubmitting={isMaloteSubmitting}
      />
    </div>
  );
}
export default StorePanelPage;
