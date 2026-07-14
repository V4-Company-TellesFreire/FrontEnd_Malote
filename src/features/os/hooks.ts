import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import serviceFactory from '../../services/serviceFactory';
import { useAuthStore } from '../../store/authStore';
import type { CreateOSPayload, TransitionPayload } from '../../lib/types';

const osApi = serviceFactory.getServiceOrdersApi();

export function useServiceOrders(filters?: {
  storeId?: string;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: ['serviceOrders', filters],
    queryFn: () => osApi.getServiceOrders(filters),
    refetchInterval: 5000, // Poll every 5 seconds to simulate real-time updates without fully forcing websockets
    staleTime: 5000,
  });
}

export function useServiceOrderById(id: string) {
  return useQuery({
    queryKey: ['serviceOrder', id],
    queryFn: () => osApi.getServiceOrderById(id),
    enabled: !!id,
  });
}

export function useCreateServiceOrder() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (payload: CreateOSPayload) =>
      osApi.createServiceOrder(payload, user?.id || 'anonymous', user?.name || 'Anonymous'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
      queryClient.invalidateQueries({ queryKey: ['storeMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['networkMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });
}

export function useTransitionStatus() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TransitionPayload }) =>
      osApi.transitionStatus(id, payload, user?.id || 'anonymous', user?.name || 'Anonymous'),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
      queryClient.invalidateQueries({ queryKey: ['serviceOrder', data.id] });
      queryClient.invalidateQueries({ queryKey: ['storeMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['networkMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useConfirmClientPickup() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: ({ id, pickedUpBy, observation }: { id: string; pickedUpBy: string; observation: string }) =>
      osApi.confirmClientPickup(id, pickedUpBy, user?.name || 'Funcionário', observation),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
      queryClient.invalidateQueries({ queryKey: ['serviceOrder', data.id] });
      queryClient.invalidateQueries({ queryKey: ['storeMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['networkMetrics'] });
    },
  });
}

export function useRectifyOS() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: ({ id, reason, action }: { id: string; reason: string; action: string }) =>
      osApi.rectifyOS(id, reason, action, user?.name || 'Funcionário', user?.id || 'anonymous', user?.name || 'Anonymous'),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
      queryClient.invalidateQueries({ queryKey: ['serviceOrder', data.id] });
      queryClient.invalidateQueries({ queryKey: ['storeMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['networkMetrics'] });
    },
  });
}

export function useNotifications(period?: string) {
  return useQuery({
    queryKey: ['notifications', period],
    queryFn: () => osApi.getNotifications(period),
    refetchInterval: 10000,
  });
}

export function useSendWhatsApp() {
  return useMutation({
    mutationFn: (notif: any) => osApi.sendWhatsAppNotification(notif),
  });
}
export default useServiceOrders;
