import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import serviceFactory from '../../services/serviceFactory';
import { useAuthStore } from '../../store/authStore';
import type { LoginRequest } from '../../lib/types';

const authApi = serviceFactory.getAuthApi();

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data) => {
      setAuth(data.user, data.token, data.refreshToken);
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Simulate calling backend logout if needed
      logout();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useCurrentUser() {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['currentUser', token],
    queryFn: () => authApi.getCurrentUser(token || ''),
    enabled: isAuthenticated && !!token,
    retry: false,
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });
}

export function useUsers(filters?: { storeId?: string; role?: string }) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => authApi.getUsers(filters),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => authApi.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => authApi.updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
