import type { IAuthApi } from './api';
import type { AuthUser, LoginRequest, LoginResponse } from '../../lib/types';

// Predefined mock users
const MOCK_USERS: Record<string, AuthUser & { passwordPin: string }> = {
  'vendedor@carol.com': {
    id: 'usr_vend_1',
    name: 'Carlos Vendedor',
    email: 'vendedor@carol.com',
    role: 'vendedor',
    storeId: 'norte-1',
    storeName: 'Norte 1',
    isActive: true,
    createdAt: new Date().toISOString(),
    passwordPin: '1037', // default pin for Norte 1 or password
  },
  'gerente@carol.com': {
    id: 'usr_ger_1',
    name: 'Mariana Gerente',
    email: 'gerente@carol.com',
    role: 'gerente',
    storeId: 'norte-1',
    storeName: 'Norte 1',
    isActive: true,
    createdAt: new Date().toISOString(),
    passwordPin: '1234',
  },
  'lab@katz.com': {
    id: 'usr_lab_1',
    name: 'Roberto Lab',
    email: 'lab@katz.com',
    role: 'laboratorio',
    storeId: null,
    storeName: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    passwordPin: '4321',
  },
  'admin@katz.com': {
    id: 'usr_admin_1',
    name: 'Julio Admin',
    email: 'admin@katz.com',
    role: 'admin',
    storeId: null,
    storeName: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    passwordPin: '9999',
  },
};

export class AuthMockApi implements IAuthApi {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    await new Promise((resolve) => setTimeout(resolve, 800)); // simulate network delay

    const user = MOCK_USERS[credentials.email.toLowerCase()];
    if (!user) {
      throw { code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha inválidos.' };
    }

    // Accept both 'password' or the role's PIN as password for easy demonstration
    if (credentials.password !== 'password' && credentials.password !== user.passwordPin) {
      throw { code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha inválidos.' };
    }

    if (!user.isActive) {
      throw { code: 'INACTIVE_USER', message: 'Usuário inativo no sistema.' };
    }

    const { passwordPin, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token: `mock-jwt-token-for-${user.id}`,
      refreshToken: `mock-refresh-token-for-${user.id}`,
    };
  }

  async getCurrentUser(token: string): Promise<AuthUser> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (!token.startsWith('mock-jwt-token-for-')) {
      throw { code: 'UNAUTHORIZED', message: 'Token de autenticação inválido.' };
    }

    const userId = token.replace('mock-jwt-token-for-', '');
    const user = Object.values(MOCK_USERS).find((u) => u.id === userId);
    
    if (!user) {
      throw { code: 'USER_NOT_FOUND', message: 'Usuário não encontrado.' };
    }

    const { passwordPin, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const user = MOCK_USERS[email.toLowerCase()];
    if (!user) {
      throw { code: 'EMAIL_NOT_FOUND', message: 'E-mail não cadastrado.' };
    }
    return { message: 'Link de recuperação enviado com sucesso!' };
  }

  async refreshToken(token: string): Promise<LoginResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (!token.startsWith('mock-refresh-token-for-')) {
      throw { code: 'UNAUTHORIZED', message: 'Refresh token inválido.' };
    }
    const userId = token.replace('mock-refresh-token-for-', '');
    const user = Object.values(MOCK_USERS).find((u) => u.id === userId);

    if (!user) {
      throw { code: 'USER_NOT_FOUND', message: 'Usuário não encontrado.' };
    }

    const { passwordPin, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token: `mock-jwt-token-for-${user.id}`,
      refreshToken: token,
    };
  }
}
