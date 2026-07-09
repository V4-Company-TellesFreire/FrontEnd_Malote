import type { IStoresApi } from './api';
import type { Store } from '../../lib/types';
import { ALL_STORES } from '../../lib/constants';

export class StoresMockApi implements IStoresApi {
  async getStores(): Promise<Store[]> {
    await new Promise(resolve => setTimeout(resolve, 200));

    // Get order counts from mock service orders to represent accurately
    const rawOrders = localStorage.getItem('oc_v7_service_orders');
    const orders = rawOrders ? JSON.parse(rawOrders) : [];

    return ALL_STORES.map(s => {
      const activeOrderCount = orders.filter((o: any) => 
        o.storeId === s.id && 
        o.status !== 'Entregue ao Cliente'
      ).length;

      return {
        id: s.id,
        name: s.name,
        malote: s.malote,
        activeOrderCount,
      };
    });
  }
}
