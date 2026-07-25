import * as React from 'react';
import { useServiceOrders, useTransitionStatus } from '../../features/os/hooks';
import { useUsers } from '../../features/auth/hooks';
import { Button, Card, CardContent, Modal, Select, Skeleton, EmptyState, useToast } from '../../components/ui';
import { Truck, CheckCircle2, RefreshCw } from 'lucide-react';
import type { ServiceOrder } from '../../lib/types';

export function DeliveryPanelPage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = React.useState<'pending' | 'routing'>('pending');
  const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<ServiceOrder | null>(null);
  const [selectedSeller, setSelectedSeller] = React.useState('');

  // Load OSs
  const { data: orders, isLoading: isOrdersLoading, refetch } = useServiceOrders();

  // Load Sellers of the store of the selected order
  const { data: users, isLoading: isUsersLoading } = useUsers(
    selectedOrder ? { storeId: selectedOrder.storeId, role: 'vendedor' } : undefined
  );

  const transitionMutation = useTransitionStatus();

  // Filter lists
  const pendingOrders = React.useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => o.status === 'Expedição');
  }, [orders]);

  const routingOrders = React.useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => o.status === 'Em Rota');
  }, [orders]);

  const activeList = activeTab === 'pending' ? pendingOrders : routingOrders;

  const handleStartRoute = (order: ServiceOrder) => {
    transitionMutation.mutate(
      {
        id: order.id,
        payload: { to: 'Em Rota' },
      },
      {
        onSuccess: () => {
          toast.success(`OS ${order.osNumber} está agora em rota de entrega!`);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Falha ao iniciar rota.');
        },
      }
    );
  };

  const handleOpenConfirmDelivery = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setSelectedSeller('');
    setConfirmModalOpen(true);
  };

  const handleConfirmDelivery = () => {
    if (!selectedOrder || !selectedSeller) return;

    transitionMutation.mutate(
      {
        id: selectedOrder.id,
        payload: {
          to: 'Entregue na Loja',
          receivedBy: selectedSeller,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Malote entregue com sucesso e recebido por ${selectedSeller}.`);
          setConfirmModalOpen(false);
          setSelectedOrder(null);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Falha ao concluir entrega.');
        },
      }
    );
  };

  const sellerOptions = React.useMemo(() => {
    if (!users) return [];
    // Only return active vendors linkados to the order's store
    return users
      .filter((u) => u.role === 'vendedor' && u.isActive)
      .map((u) => ({
        value: u.name,
        label: u.name,
      }));
  }, [users]);

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto px-4 py-2">
      {/* Header Panel */}
      <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-lg font-black text-brand-900 leading-tight flex items-center gap-2">
            <Truck className="h-5 w-5 text-brand" />
            Painel do Motoboy
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Mauro Motoboy · Gestão de Rotas de Malotes
          </p>
        </div>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => refetch()}
          className="rounded-full h-8 w-8 hover:bg-neutral-100 shrink-0 border-neutral-300"
          title="Sincronizar dados"
        >
          <RefreshCw className="h-4 w-4 text-neutral-600" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all select-none cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-white text-brand shadow-xs border border-neutral-200'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Retiradas ({pendingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('routing')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all select-none cursor-pointer ${
            activeTab === 'routing'
              ? 'bg-white text-brand shadow-xs border border-neutral-200'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Em Rota ({routingOrders.length})
        </button>
      </div>

      {/* List content */}
      <div className="flex flex-col gap-3.5">
        {isOrdersLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="border-neutral-200 shadow-xs bg-white rounded-xl">
              <CardContent className="p-4 flex flex-col gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))
        ) : activeList.length === 0 ? (
          <EmptyState
            title={activeTab === 'pending' ? 'Tudo limpo!' : 'Nenhuma entrega em rota'}
            description={
              activeTab === 'pending'
                ? 'Nenhum malote pendente de retirada na expedição no momento.'
                : 'Você não iniciou nenhuma entrega de malote ainda.'
            }
          />
        ) : (
          activeList.map((order) => (
            <Card
              key={order.id}
              className="border-neutral-200 shadow-xs hover:shadow-sm bg-white rounded-xl border-l-[4px] border-l-brand transition-all animate-slide-in-bottom"
            >
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      OS: {order.osNumber}
                    </span>
                    <span className="text-sm font-extrabold text-neutral-850 mt-0.5 block">
                      Loja: {order.storeName}
                    </span>
                  </div>
                  {order.urgency > 0 && (
                    <span className="px-2 py-0.5 text-[8px] font-bold rounded-full bg-warning-50 text-warning-850 border border-warning-200 uppercase">
                      Urgente
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1 text-[11px] text-neutral-500 font-semibold">
                  <p>Cliente: {order.clientName}</p>
                  <p>OS Loja: {order.osStore}</p>
                </div>

                {activeTab === 'pending' ? (
                  <Button
                    onClick={() => handleStartRoute(order)}
                    isLoading={transitionMutation.isPending}
                    className="w-full text-xs font-bold mt-1 h-9 rounded-lg"
                    leftIcon={<Truck className="h-4 w-4" />}
                  >
                    Iniciar rota
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleOpenConfirmDelivery(order)}
                    className="w-full text-xs font-bold mt-1 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    Realizar Entrega
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirmar Entrega do Malote"
        description="Selecione o vendedor que recebeu o malote físico na loja para finalizar."
        className="max-w-sm rounded-2xl"
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-neutral-400 font-bold block uppercase">
              Destino
            </span>
            <span className="text-sm font-extrabold text-neutral-800">
              {selectedOrder?.storeName}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-neutral-500 block">
              Quem recebeu o malote? <span className="text-critical">*</span>
            </label>
            {isUsersLoading ? (
              <Skeleton className="h-10 w-full rounded-lg" />
            ) : sellerOptions.length === 0 ? (
              <p className="text-[11px] text-critical font-bold bg-critical-50 border border-critical-200 p-2.5 rounded-lg">
                Nenhum vendedor cadastrado nesta loja. Por favor, solicite o cadastro de um vendedor para esta filial.
              </p>
            ) : (
              <Select
                value={selectedSeller}
                onChange={(e) => setSelectedSeller(e.target.value)}
                className="w-full text-xs h-10 bg-white"
              >
                <option value="">Selecione o vendedor...</option>
                {sellerOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            )}
          </div>

          <div className="flex gap-3 mt-2">
            <Button
              variant="secondary"
              onClick={() => setConfirmModalOpen(false)}
              className="flex-1 text-xs font-bold h-9 rounded-lg border-neutral-350"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelivery}
              disabled={!selectedSeller}
              isLoading={transitionMutation.isPending}
              className="flex-1 text-xs font-bold h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
export default DeliveryPanelPage;
