import type { IServiceOrdersApi } from './api';
import type {
  ServiceOrder,
  CreateOSPayload,
  TransitionPayload,
  WhatsAppNotification,
} from '../../lib/types';import { useAuthStore } from '../../store/authStore';

export class ServiceOrdersHttpApi implements IServiceOrdersApi {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const token = useAuthStore.getState().token;
    const isFormData = options?.body instanceof FormData;
    
    const headers: HeadersInit = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    };

    if (!isFormData && !('Content-Type' in headers)) {
      (headers as any)['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw {
        code: errorData.code || 'API_ERROR',
        message: errorData.message || 'Erro de conexão com o servidor.',
        fields: errorData.fields,
      };
    }

    return res.json();
  }

  getServiceOrders(filters?: {
    storeId?: string;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ServiceOrder[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null) params.append(key, val);
      });
    }
    return this.request<ServiceOrder[]>(`/service-orders?${params.toString()}`);
  }

  createServiceOrder(payload: CreateOSPayload, userId: string, userName: string): Promise<ServiceOrder> {
    const formData = new FormData();
    formData.append('osStore', payload.osStore);
    formData.append('clientName', payload.clientName);
    formData.append('clientPhone', payload.clientPhone);
    formData.append('storeName', payload.storeName);
    formData.append('sellerName', payload.sellerName);
    formData.append('entryDate', payload.entryDate);
    formData.append('recipeType', payload.recipeType);
    formData.append('frameOrigin', payload.frameOrigin);
    formData.append('frameMaterial', payload.frameMaterial);
    formData.append('frameReference', payload.frameReference);
    formData.append('frameColor', payload.frameColor);
    formData.append('frameBrand', payload.frameBrand);
    formData.append('lensType', payload.lensType);
    formData.append('lensMaterial', payload.lensMaterial);
    formData.append('treatments', payload.treatments);
    formData.append('externalLab', String(payload.externalLab));
    formData.append('labName', payload.labName);
    formData.append('serviceType', payload.serviceType);
    formData.append('deadline', payload.deadline);
    formData.append('technician', payload.technician);
    formData.append('observations', payload.observations);
    formData.append('urgency', String(payload.urgency));
    formData.append('urgencyReason', payload.urgencyReason);
    formData.append('urgencyObservation', payload.urgencyObservation);
    formData.append('urgencyExtreme', payload.urgencyExtreme);
    formData.append('userId', userId);
    formData.append('userName', userName);
    if (payload.receiptImage) {
      formData.append('receiptImage', payload.receiptImage);
    }
    if (payload.prescription) {
      formData.append('prescription', JSON.stringify(payload.prescription));
    }

    return this.request<ServiceOrder>('/service-orders', {
      method: 'POST',
      headers: {
        // Fetch will automatically populate multipart/form-data headers with boundaries
      },
      body: formData as any,
    });
  }

  updateServiceOrder(
    id: string,
    payload: CreateOSPayload,
    userId: string,
    userName: string
  ): Promise<ServiceOrder> {
    const formData = new FormData();
    formData.append('osStore', payload.osStore);
    formData.append('clientName', payload.clientName);
    formData.append('clientPhone', payload.clientPhone);
    formData.append('storeName', payload.storeName);
    formData.append('sellerName', payload.sellerName);
    formData.append('entryDate', payload.entryDate);
    formData.append('recipeType', payload.recipeType);
    formData.append('frameOrigin', payload.frameOrigin);
    formData.append('frameMaterial', payload.frameMaterial);
    formData.append('frameReference', payload.frameReference);
    formData.append('frameColor', payload.frameColor);
    formData.append('frameBrand', payload.frameBrand);
    formData.append('lensType', payload.lensType);
    formData.append('lensMaterial', payload.lensMaterial);
    formData.append('treatments', payload.treatments);
    formData.append('externalLab', String(payload.externalLab));
    formData.append('labName', payload.labName);
    formData.append('serviceType', payload.serviceType);
    formData.append('deadline', payload.deadline);
    formData.append('technician', payload.technician);
    formData.append('observations', payload.observations);
    formData.append('urgency', String(payload.urgency));
    formData.append('urgencyReason', payload.urgencyReason);
    formData.append('urgencyObservation', payload.urgencyObservation);
    formData.append('urgencyExtreme', payload.urgencyExtreme);
    formData.append('userId', userId);
    formData.append('userName', userName);
    if (payload.receiptImage) {
      formData.append('receiptImage', payload.receiptImage);
    }
    if (payload.prescription) {
      formData.append('prescription', JSON.stringify(payload.prescription));
    }

    return this.request<ServiceOrder>(`/service-orders/${id}`, {
      method: 'PUT',
      headers: {},
      body: formData as any,
    });
  }

  updateClientPhone(
    id: string,
    phone: string,
    userId: string,
    userName: string
  ): Promise<ServiceOrder> {
    return this.request<ServiceOrder>(`/service-orders/${id}/phone`, {
      method: 'PATCH',
      body: JSON.stringify({ clientPhone: phone, userId, userName }),
    });
  }

  transitionStatus(
    id: string,
    payload: TransitionPayload,
    userId: string,
    userName: string
  ): Promise<ServiceOrder> {
    return this.request<ServiceOrder>(`/service-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ ...payload, userId, userName }),
    });
  }

  getServiceOrderById(id: string): Promise<ServiceOrder | null> {
    return this.request<ServiceOrder | null>(`/service-orders/${id}`);
  }

  confirmClientPickup(
    id: string,
    pickedUpBy: string,
    deliveredBy: string,
    observation: string
  ): Promise<ServiceOrder> {
    return this.request<ServiceOrder>(`/service-orders/${id}/delivery-confirmation`, {
      method: 'POST',
      body: JSON.stringify({ pickedUpBy, deliveredBy, observation }),
    });
  }

  rectifyOS(
    id: string,
    reason: string,
    action: string,
    createdBy: string,
    userId: string,
    userName: string
  ): Promise<ServiceOrder> {
    return this.request<ServiceOrder>(`/service-orders/${id}/rectifications`, {
      method: 'POST',
      body: JSON.stringify({ reason, action, createdBy, userId, userName }),
    });
  }

  getNotifications(period?: string): Promise<WhatsAppNotification[]> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    return this.request<WhatsAppNotification[]>(`/notifications?${params.toString()}`);
  }

  sendWhatsAppNotification(notification: Partial<WhatsAppNotification>): Promise<void> {
    return this.request<void>('/notifications/whatsapp', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }
}
