import type { AuthUser, LoginRequest, LoginResponse } from '../../lib/types';

export interface IAuthApi {
  login(credentials: LoginRequest): Promise<LoginResponse>;
  getCurrentUser(token: string): Promise<AuthUser>;
  forgotPassword(email: string): Promise<{ message: string }>;
  refreshToken(token: string): Promise<LoginResponse>;
}
