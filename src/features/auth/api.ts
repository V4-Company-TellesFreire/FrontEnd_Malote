import type { AuthUser, LoginRequest, LoginResponse } from '../../lib/types';

export interface IAuthApi {
  login(credentials: LoginRequest): Promise<LoginResponse>;
  getCurrentUser(token: string): Promise<AuthUser>;
  forgotPassword(email: string): Promise<{ message: string }>;
  refreshToken(token: string): Promise<LoginResponse>;
  // Seller / User management
  getUsers(filters?: { storeId?: string; role?: string }): Promise<(AuthUser & { passwordPin?: string })[]>;
  createUser(payload: any): Promise<AuthUser>;
  updateUser(id: string, payload: any): Promise<AuthUser>;
}
