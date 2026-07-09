import type { DashboardMetrics } from '../../lib/types';

export interface IDashboardApi {
  getStoreMetrics(storeId: string): Promise<DashboardMetrics>;
  getNetworkMetrics(): Promise<DashboardMetrics>;
}
