import { useQuery } from '@tanstack/react-query';
import serviceFactory from '../../services/serviceFactory';

const dashboardApi = serviceFactory.getDashboardApi();

export function useStoreMetrics(storeId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['storeMetrics', storeId],
    queryFn: () => dashboardApi.getStoreMetrics(storeId),
    enabled: enabled && !!storeId,
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

export function useNetworkMetrics(enabled: boolean = true) {
  return useQuery({
    queryKey: ['networkMetrics'],
    queryFn: () => dashboardApi.getNetworkMetrics(),
    enabled,
    refetchInterval: 15000,
    staleTime: 5000,
  });
}
