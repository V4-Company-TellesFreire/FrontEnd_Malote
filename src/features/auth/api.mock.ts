import type { IAuthApi } from './api';
import type { AuthUser, LoginRequest, LoginResponse } from '../../lib/types';
import { uid } from '../../lib/utils';

const USERS_STORAGE_KEY = 'oticas_carol_users';

const DEFAULT_USERS: Record<string, AuthUser & { passwordPin: string }> = {
  'vendedor@carol.com': {
    id: 'usr_vend_1',
    name: 'Carlos Vendedor',
    email: 'vendedor@carol.com',
    role: 'vendedor',
    storeId: 'norte-1',
    storeName: 'Norte 1',
    isActive: true,
    createdAt: new Date().toISOString(),
    passwordPin: 'Vendedor@Carol1037',
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
    passwordPin: 'Gerente@Carol1234',
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
    passwordPin: 'Lab@Katz4321',
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
    passwordPin: 'Admin@Katz9999',
  },
  'motoboy@carol.com': {
    id: 'usr_moto_1',
    name: 'Mauro Motoboy',
    email: 'motoboy@carol.com',
    role: 'motoboy',
    storeId: null,
    storeName: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    passwordPin: 'Motoboy@Carol4321',
  },
};

function getStoredUsers(): Record<string, AuthUser & { passwordPin: string }> {
  const data = localStorage.getItem(USERS_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  
  try {
    const parsed = JSON.parse(data);
    
    // Migration: Check if any default users (like motoboy) are missing in localStorage
    let hasMissing = false;
    for (const [email, user] of Object.entries(DEFAULT_USERS)) {
      if (!parsed[email]) {
        parsed[email] = user;
        hasMissing = true;
      }
    }
    
    // If we detect the old simple pin for vendedor, force re-initialization with strong default passwords
    if (parsed['vendedor@carol.com'] && parsed['vendedor@carol.com'].passwordPin === '1037') {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    
    if (hasMissing) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
    }
    
    return parsed;
  } catch {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
}

function saveUsers(users: Record<string, AuthUser & { passwordPin: string }>) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export class AuthMockApi implements IAuthApi {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300)); // reduce login delay for better UX
    
    const users = getStoredUsers();
    const user = users[credentials.email.toLowerCase()];
    if (!user) {
      throw { code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha inválidos.' };
    }

    if (credentials.password !== 'password' && credentials.password !== user.passwordPin) {
      throw { code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha inválidos.' };
    }

    if (!user.isActive) {
      throw { code: 'INACTIVE_USER', message: 'Usuário inativo no sistema.' };
    }

    const { passwordPin: _passwordPin, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token: `mock-jwt-token-for-${user.id}`,
      refreshToken: `mock-refresh-token-for-${user.id}`,
    };
  }

  async getCurrentUser(token: string): Promise<AuthUser> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (!token.startsWith('mock-jwt-token-for-')) {
      throw { code: 'UNAUTHORIZED', message: 'Token de autenticação inválido.' };
    }

    const userId = token.replace('mock-jwt-token-for-', '');
    const users = getStoredUsers();
    const user = Object.values(users).find((u) => u.id === userId);
    
    if (!user) {
      throw { code: 'USER_NOT_FOUND', message: 'Usuário não encontrado.' };
    }

    const { passwordPin: _passwordPin, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const users = getStoredUsers();
    const user = users[email.toLowerCase()];
    if (!user) {
      throw { code: 'EMAIL_NOT_FOUND', message: 'E-mail não cadastrado.' };
    }
    return { message: 'Link de recuperação enviado com sucesso!' };
  }

  async refreshToken(token: string): Promise<LoginResponse> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (!token.startsWith('mock-refresh-token-for-')) {
      throw { code: 'UNAUTHORIZED', message: 'Refresh token inválido.' };
    }
    const userId = token.replace('mock-refresh-token-for-', '');
    const users = getStoredUsers();
    const user = Object.values(users).find((u) => u.id === userId);

    if (!user) {
      throw { code: 'USER_NOT_FOUND', message: 'Usuário não encontrado.' };
    }

    const { passwordPin: _passwordPin, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token: `mock-jwt-token-for-${user.id}`,
      refreshToken: token,
    };
  }

  // Seller / User management
  async getUsers(filters?: { storeId?: string; role?: string }): Promise<(AuthUser & { passwordPin?: string })[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const users = Object.values(getStoredUsers());
    
    let result = users;
    if (filters) {
      if (filters.storeId) {
        result = result.filter(u => u.storeId === filters.storeId);
      }
      if (filters.role) {
        result = result.filter(u => u.role === filters.role);
      }
    }

    // Sort by name
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  async createUser(payload: any): Promise<AuthUser> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const users = getStoredUsers();
    const emailKey = payload.email.toLowerCase();

    if (users[emailKey]) {
      throw { code: 'USER_EXISTS', message: 'Já existe um usuário cadastrado com este e-mail.' };
    }

    const newUser: AuthUser & { passwordPin: string } = {
      id: `usr_${uid()}`,
      name: payload.name,
      email: payload.email,
      role: payload.role || 'vendedor',
      storeId: payload.storeId || null,
      storeName: payload.storeName || null,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
      createdAt: new Date().toISOString(),
      passwordPin: payload.passwordPin || '1234',
    };

    users[emailKey] = newUser;
    saveUsers(users);

    const { passwordPin: _passwordPin, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async updateUser(id: string, payload: any): Promise<AuthUser> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const users = getStoredUsers();
    const emailKey = Object.keys(users).find(key => users[key].id === id);

    if (!emailKey) {
      throw { code: 'USER_NOT_FOUND', message: 'Usuário não encontrado.' };
    }

    const existingUser = users[emailKey];
    
    // Check email changes
    const newEmailKey = payload.email ? payload.email.toLowerCase() : emailKey;
    if (newEmailKey !== emailKey && users[newEmailKey]) {
      throw { code: 'USER_EXISTS', message: 'Já existe um usuário cadastrado com este e-mail.' };
    }

    const updatedUser = {
      ...existingUser,
      name: payload.name !== undefined ? payload.name : existingUser.name,
      email: payload.email !== undefined ? payload.email : existingUser.email,
      role: payload.role !== undefined ? payload.role : existingUser.role,
      storeId: payload.storeId !== undefined ? payload.storeId : existingUser.storeId,
      storeName: payload.storeName !== undefined ? payload.storeName : existingUser.storeName,
      isActive: payload.isActive !== undefined ? payload.isActive : existingUser.isActive,
      passwordPin: payload.passwordPin !== undefined ? payload.passwordPin : existingUser.passwordPin,
    };

    delete users[emailKey];
    users[newEmailKey] = updatedUser;
    saveUsers(users);

    const { passwordPin: _passwordPin, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}
