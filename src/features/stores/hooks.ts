import { useQuery } from '@tanstack/react-query';
import serviceFactory from '../../services/serviceFactory';

const storesApi = serviceFactory.getStoresApi();

export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: () => storesApi.getStores(),
    refetchInterval: 10000,
  });
}
