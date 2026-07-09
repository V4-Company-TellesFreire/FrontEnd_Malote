import type { IDashboardApi } from './api';
import type { DashboardMetrics, ServiceOrder } from '../../lib/types';
import { SERVICE_ORDER_STATUSES } from '../../lib/constants';

function getStoredOrders(): ServiceOrder[] {
  const raw = localStorage.getItem('oc_v7_service_orders');
  return raw ? JSON.parse(raw) : [];
}

export class DashboardMockApi implements IDashboardApi {
  private calculateMetrics(orders: ServiceOrder[]): DashboardMetrics {
    const ordersByStatus: Record<string, number> = {};
    SERVICE_ORDER_STATUSES.forEach(status => {
      ordersByStatus[status] = 0;
    });

    let urgentCount = 0;
    let externalLabCount = 0;
    let mountingsKatz = 0;
    let mountingsExternal = 0;
    let deliveredToday = 0;

    const todayStr = new Date().toISOString().slice(0, 10);

    orders.forEach(o => {
      if (ordersByStatus[o.status] !== undefined) {
        ordersByStatus[o.status]++;
      }
      if (o.urgency > 0) {
        urgentCount++;
      }
      if (o.externalLab) {
        externalLabCount++;
        if (o.status === 'Controle de Qualidade' || o.status === 'Separando' || o.status === 'Expedição' || o.status === 'Em Rota' || o.status === 'Entregue na Loja' || o.status === 'Entregue ao Cliente') {
          mountingsExternal++;
        }
      } else {
        if (o.status === 'Controle de Qualidade' || o.status === 'Separando' || o.status === 'Expedição' || o.status === 'Em Rota' || o.status === 'Entregue na Loja' || o.status === 'Entregue ao Cliente') {
          mountingsKatz++;
        }
      }

      // Check deliveries completed today
      if (o.reception?.ts.startsWith(todayStr)) {
        deliveredToday++;
      }
    });

    // Realistic static placeholders for average time spent in each status (minutes)
    const averageTimeByStatus: Record<string, number> = {
      'Chegada de Malote': 45,
      'Envio Laboratório': 90,
      'Montagem': 180,
      'Controle de Qualidade': 30,
      'Separando': 20,
      'Expedição': 60,
      'Em Rota': 120,
      'Entregue na Loja': 1440, // 24 hours
      'Entregue c/ Ressalva': 2880, // 48 hours
      'Entregue ao Cliente': 0
    };

    return {
      totalOrders: orders.length,
      ordersByStatus: ordersByStatus as Record<any, number>,
      urgentCount,
      externalLabCount,
      mountingsKatz,
      mountingsExternal,
      deliveredToday,
      averageTimeByStatus: averageTimeByStatus as Record<any, number>,
    };
  }

  async getStoreMetrics(storeId: string): Promise<DashboardMetrics> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const allOrders = getStoredOrders();
    const storeOrders = allOrders.filter(o => o.storeId === storeId);
    return this.calculateMetrics(storeOrders);
  }

  async getNetworkMetrics(): Promise<DashboardMetrics> {
    await new Promise(resolve => setTimeout(resolve, 600));
    const allOrders = getStoredOrders();
    return this.calculateMetrics(allOrders);
  }
}
