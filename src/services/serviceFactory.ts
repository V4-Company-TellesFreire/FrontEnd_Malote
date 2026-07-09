import { AuthMockApi } from '../features/auth/api.mock';
import { AuthHttpApi } from '../features/auth/api.http';
import type { IAuthApi } from '../features/auth/api';

import { ServiceOrdersMockApi } from '../features/os/api.mock';
import { ServiceOrdersHttpApi } from '../features/os/api.http';
import type { IServiceOrdersApi } from '../features/os/api';

import { StoresMockApi } from '../features/stores/api.mock';
import type { IStoresApi } from '../features/stores/api';

import { DashboardMockApi } from '../features/dashboard/api.mock';
import type { IDashboardApi } from '../features/dashboard/api';

const useMock = import.meta.env.VITE_USE_MOCK_API === 'true';

class ServiceFactory {
  private authApiInstance?: IAuthApi;
  private osApiInstance?: IServiceOrdersApi;
  private storesApiInstance?: IStoresApi;
  private dashboardApiInstance?: IDashboardApi;

  getAuthApi(): IAuthApi {
    if (!this.authApiInstance) {
      this.authApiInstance = useMock ? new AuthMockApi() : new AuthHttpApi();
    }
    return this.authApiInstance;
  }

  getServiceOrdersApi(): IServiceOrdersApi {
    if (!this.osApiInstance) {
      this.osApiInstance = useMock ? new ServiceOrdersMockApi() : new ServiceOrdersHttpApi();
    }
    return this.osApiInstance;
  }

  getStoresApi(): IStoresApi {
    if (!this.storesApiInstance) {
      // For now we only have mock, but it defaults to HTTP when real is added
      this.storesApiInstance = new StoresMockApi();
    }
    return this.storesApiInstance;
  }

  getDashboardApi(): IDashboardApi {
    if (!this.dashboardApiInstance) {
      this.dashboardApiInstance = new DashboardMockApi();
    }
    return this.dashboardApiInstance;
  }
}

export const serviceFactory = new ServiceFactory();
export default serviceFactory;
