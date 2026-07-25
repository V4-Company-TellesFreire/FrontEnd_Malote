import type {
  ServiceOrder,
  CreateOSPayload,
  TransitionPayload,
  WhatsAppNotification,
} from '../../lib/types';

export interface IServiceOrdersApi {
  getServiceOrders(filters?: {
    storeId?: string;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ServiceOrder[]>;
  
  createServiceOrder(payload: CreateOSPayload, userId: string, userName: string): Promise<ServiceOrder>;
  
  updateServiceOrder(
    id: string,
    payload: CreateOSPayload,
    userId: string,
    userName: string
  ): Promise<ServiceOrder>;
  
  transitionStatus(
    id: string,
    payload: TransitionPayload,
    userId: string,
    userName: string
  ): Promise<ServiceOrder>;
  
  getServiceOrderById(id: string): Promise<ServiceOrder | null>;

  confirmClientPickup(
    id: string,
    pickedUpBy: string,
    deliveredBy: string,
    observation: string
  ): Promise<ServiceOrder>;

  rectifyOS(
    id: string,
    reason: string,
    action: string,
    createdBy: string,
    userId: string,
    userName: string
  ): Promise<ServiceOrder>;

  getNotifications(period?: string): Promise<WhatsAppNotification[]>;
  
  sendWhatsAppNotification(notification: Partial<WhatsAppNotification>): Promise<void>;
}
