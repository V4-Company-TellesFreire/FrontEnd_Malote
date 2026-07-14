import type { IAuthApi } from './api';
import type { AuthUser, LoginRequest, LoginResponse } from '../../lib/types';

export class AuthHttpApi implements IAuthApi {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
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

  login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  getCurrentUser(token: string): Promise<AuthUser> {
    return this.request<AuthUser>('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  refreshToken(token: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: token }),
    });
  }

  async getUsers(_filters?: { storeId?: string; role?: string }): Promise<(AuthUser & { passwordPin?: string })[]> {
    throw new Error('Not implemented');
  }

  async createUser(_payload: any): Promise<AuthUser> {
    throw new Error('Not implemented');
  }

  async updateUser(_id: string, _payload: any): Promise<AuthUser> {
    throw new Error('Not implemented');
  }
}
