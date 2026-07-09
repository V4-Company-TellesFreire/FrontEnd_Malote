import type { Store } from '../../lib/types';

export interface IStoresApi {
  getStores(): Promise<Store[]>;
}
