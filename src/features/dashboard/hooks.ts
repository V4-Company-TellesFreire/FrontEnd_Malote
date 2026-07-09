import { useQuery } from '@tanstack/react-query';
import serviceFactory from '../../services/serviceFactory';

const dashboardApi = serviceFactory.getDashboardApi();

export function useStoreMetrics(storeId: string) {
  return useQuery({
    queryKey: ['storeMetrics', storeId],
    queryFn: () => dashboardApi.getStoreMetrics(storeId),
    enabled: !!storeId,
    refetchInterval: 10000,
  });
}

export function useNetworkMetrics() {
  return useQuery({
    queryKey: ['networkMetrics'],
    queryFn: () => dashboardApi.getNetworkMetrics(),
    refetchInterval: 15000,
  });
}
