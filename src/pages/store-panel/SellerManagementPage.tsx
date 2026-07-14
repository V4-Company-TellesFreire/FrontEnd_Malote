import * as React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUsers, useCreateUser, useUpdateUser } from '../../features/auth/hooks';
import { ALL_STORES } from '../../lib/constants';
import {
  Button,
  Card,
  Input,
  Select,
  Modal,
  Badge,
  Skeleton,
  EmptyState,
  useToast,
} from '../../components/ui';
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit2, 
  ToggleLeft, 
  ToggleRight, 
  Store, 
  Shield, 
  Mail, 
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SellerFormValues {
  name: string;
  email: string;
  passwordPin: string;
  storeId: string;
  role: string;
  isActive: boolean;
}

const initialFormValues: SellerFormValues = {
  name: '',
  email: '',
  passwordPin: '',
  storeId: '',
  role: 'vendedor',
  isActive: true,
};

const validateStrongPassword = (pwd: string): string | null => {
  if (pwd.length < 8) {
    return 'A senha deve ter no mínimo 8 caracteres.';
  }
  if (!/[A-Z]/.test(pwd)) {
    return 'A senha deve conter pelo menos uma letra maiúscula.';
  }
  if (!/[a-z]/.test(pwd)) {
    return 'A senha deve conter pelo menos uma letra minúscula.';
  }
  if (!/\d/.test(pwd)) {
    return 'A senha deve conter pelo menos um número.';
  }
  if (!/[@$!%*?&#.\-_]/.test(pwd)) {
    return 'A senha deve conter pelo menos um caractere especial (ex: @, $, !, %, *, ?, &, #, ., -, _).';
  }
  return null;
};

export function SellerManagementPage() {
  const toast = useToast();
  const manager = useAuthStore((s) => s.user);
  const managerStoreId = useAuthStore((s) => s.selectedStoreId);
  const managerStoreName = useAuthStore((s) => s.selectedStoreName);

  // Queries & Mutations
  const { data: users, isLoading, isError, refetch } = useUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  // Local UI State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  
  // Form State
  const [formValues, setFormValues] = React.useState<SellerFormValues>(initialFormValues);
  const [formError, setFormError] = React.useState<string | null>(null);
  
  // Password Visibility States
  const [visiblePasswords, setVisiblePasswords] = React.useState<Record<string, boolean>>({});
  const [showFormPassword, setShowFormPassword] = React.useState(false);

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Filtered sellers list (managers manage sellers, but can also manage other gerentes if admin)
  const filteredSellers = React.useMemo(() => {
    if (!users) return [];
    
    // Managers can see/manage users. Vendedores and Gerentes are within store operations.
    // If manager has a selected store, filter only users for that store.
    // Otherwise show all sellers.
    let list = users;
    
    if (manager?.role !== 'admin' && managerStoreId) {
      list = list.filter(u => u.storeId === managerStoreId);
    }

    return list.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? u.isActive
            : !u.isActive;

      // Only show seller and gerente roles in this view (avoid lab/admin unless admin is logged in)
      const matchesRole = manager?.role === 'admin' ? true : (u.role === 'vendedor' || u.role === 'gerente');

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchQuery, statusFilter, managerStoreId, manager]);

  const handleOpenCreateModal = () => {
    setEditingUserId(null);
    setFormValues({
      ...initialFormValues,
      // Default to manager's current active store if selected
      storeId: managerStoreId || '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (user: any) => {
    setEditingUserId(user.id);
    setFormValues({
      name: user.name,
      email: user.email,
      passwordPin: user.passwordPin || '1234',
      storeId: user.storeId || '',
      role: user.role || 'vendedor',
      isActive: user.isActive,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleToggleStatus = (user: any) => {
    updateUserMutation.mutate(
      {
        id: user.id,
        payload: { isActive: !user.isActive },
      },
      {
        onSuccess: () => {
          toast.success(`Usuário ${user.name} ${!user.isActive ? 'ativado' : 'desativado'} com sucesso!`);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Falha ao alterar status do usuário.');
        },
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic validation
    if (!formValues.name.trim()) {
      setFormError('Informe o nome completo.');
      return;
    }
    if (!formValues.email.trim()) {
      setFormError('Informe o e-mail de acesso.');
      return;
    }
    if (!formValues.passwordPin.trim()) {
      setFormError('Informe a senha de acesso.');
      return;
    }

    const pwdErr = validateStrongPassword(formValues.passwordPin);
    if (pwdErr) {
      setFormError(pwdErr);
      return;
    }

    // Resolve store name
    const selectedStore = ALL_STORES.find(s => s.id === formValues.storeId);
    const storeName = selectedStore ? selectedStore.name : null;

    const payload = {
      name: formValues.name,
      email: formValues.email,
      passwordPin: formValues.passwordPin,
      storeId: formValues.storeId || null,
      storeName: storeName,
      role: formValues.role,
      isActive: formValues.isActive,
    };

    if (editingUserId) {
      // Edit
      updateUserMutation.mutate(
        { id: editingUserId, payload },
        {
          onSuccess: () => {
            toast.success('Cadastro do vendedor atualizado com sucesso!');
            setModalOpen(false);
          },
          onError: (err: any) => {
            setFormError(err.message || 'Erro ao salvar alterações.');
          },
        }
      );
    } else {
      // Create
      createUserMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Novo vendedor cadastrado com sucesso!');
          setModalOpen(false);
        },
        onError: (err: any) => {
          setFormError(err.message || 'Erro ao criar vendedor.');
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 p-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Erro ao carregar dados"
        description="Não foi possível carregar a lista de vendedores. Tente recarregar a página."
        action={
          <Button onClick={() => refetch()} variant="primary">
            Tentar Novamente
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl border border-brand-200 bg-brand-50/20 shadow-xs gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-brand rounded-lg flex items-center justify-center text-white">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-neutral-800">Gestão de Vendedores</span>
            <span className="text-[10px] text-neutral-500">
              {managerStoreId 
                ? `Administre os colaboradores associados à filial ${managerStoreName}.` 
                : 'Administre todos os colaboradores e vendedores da rede.'
              }
            </span>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreateModal}
          className="font-bold flex items-center gap-1.5 shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          Cadastrar Vendedor
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-end p-4 rounded-xl border border-neutral-200 bg-white shadow-xs w-full">
        <div className="flex-1 w-full relative">
          <Input
            label="Buscar por nome ou e-mail"
            placeholder="Ex: Carlos, vendedor@carol.com..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-neutral-400" />}
          />
        </div>

        <div className="w-full md:w-48">
          <Select
            label="Filtrar por Status"
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos os vendedores</option>
            <option value="active">Apenas Ativos</option>
            <option value="inactive">Apenas Inativos</option>
          </Select>
        </div>
      </div>

      {/* Sellers List / Grid */}
      <Card className="border-neutral-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                <th className="p-3">Colaborador</th>
                <th className="p-3">Acesso / E-mail</th>
                <th className="p-3">Loja Vinculada</th>
                <th className="p-3">Função / Cargo</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredSellers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-400 font-semibold">
                    Nenhum colaborador encontrado com os filtros informados.
                  </td>
                </tr>
              ) : (
                filteredSellers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/30 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-neutral-850 text-sm">{u.name}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">ID: {u.id}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-neutral-600 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-neutral-400" />
                        {u.email}
                      </div>
                      <div className="text-[10px] text-neutral-450 mt-1 flex items-center gap-1.5">
                        <Key className="h-3 w-3 text-neutral-400 shrink-0" />
                        Senha:{' '}
                        <strong className="font-mono text-neutral-700 select-all">
                          {visiblePasswords[u.id] ? u.passwordPin : '••••••••'}
                        </strong>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(u.id)}
                          className="pointer-events-auto text-neutral-400 hover:text-neutral-600 focus:outline-none ml-1 shrink-0"
                          title={visiblePasswords[u.id] ? 'Ocultar Senha' : 'Exibir Senha'}
                        >
                          {visiblePasswords[u.id] ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 font-bold text-neutral-750">
                        <Store className="h-3.5 w-3.5 text-brand-400" />
                        {u.storeName || 'Sem Loja Vinculada'}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-[10px] font-bold text-neutral-600 capitalize">
                        <Shield className="h-3 w-3 text-neutral-500" />
                        {u.role === 'gerente' ? 'Gerente de Loja' : 'Vendedor'}
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge variant={u.isActive ? 'success' : 'neutral'} className="text-[10px] font-bold px-2 py-0.5">
                        {u.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end items-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 w-8 p-0 justify-center border-neutral-300"
                          onClick={() => handleOpenEditModal(u)}
                          title="Editar Cadastro"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-neutral-500" />
                        </Button>
                        <Button
                          variant={u.isActive ? 'secondary' : 'primary'}
                          size="sm"
                          className={`h-8 w-8 p-0 justify-center ${u.isActive ? 'border-neutral-300' : 'bg-success hover:bg-success-600 border-success-200'}`}
                          onClick={() => handleToggleStatus(u)}
                          title={u.isActive ? 'Desativar Usuário' : 'Ativar Usuário'}
                        >
                          {u.isActive ? (
                            <ToggleRight className="h-5 w-5 text-success-600" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-neutral-400" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards List View */}
        <div className="block md:hidden divide-y divide-neutral-100">
          {filteredSellers.length === 0 ? (
            <div className="p-8 text-center text-neutral-400 font-semibold text-xs">
              Nenhum colaborador encontrado.
            </div>
          ) : (
            filteredSellers.map((u) => (
              <div key={u.id} className="p-4 flex flex-col gap-3 hover:bg-neutral-50/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-neutral-850 text-sm">{u.name}</h4>
                    <span className="text-[9px] text-neutral-400">ID: {u.id}</span>
                  </div>
                  <Badge variant={u.isActive ? 'success' : 'neutral'} className="text-[9px] font-bold px-2">
                    {u.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <div className="flex flex-col gap-1.5 text-xs text-neutral-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Key className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                    <span>Senha de Acesso: <strong className="font-mono text-neutral-800">{visiblePasswords[u.id] ? u.passwordPin : '••••••••'}</strong></span>
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(u.id)}
                      className="pointer-events-auto text-neutral-450 hover:text-neutral-650 focus:outline-none ml-1 shrink-0"
                      title={visiblePasswords[u.id] ? 'Ocultar Senha' : 'Exibir Senha'}
                    >
                      {visiblePasswords[u.id] ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Store className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                    <span className="font-bold text-neutral-750">{u.storeName || 'Sem Loja'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                    <span className="font-bold capitalize">{u.role === 'gerente' ? 'Gerente' : 'Vendedor'}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-1 border-t border-neutral-100 pt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 font-bold border-neutral-300 h-8 justify-center gap-1.5"
                    onClick={() => handleOpenEditModal(u)}
                  >
                    <Edit2 className="h-3.5 w-3.5 text-neutral-500" />
                    Editar
                  </Button>
                  <Button
                    variant={u.isActive ? 'secondary' : 'primary'}
                    size="sm"
                    className={`flex-1 font-bold h-8 justify-center gap-1.5 ${u.isActive ? 'border-neutral-300 text-critical-700' : 'bg-success hover:bg-success-600 border-success'}`}
                    onClick={() => handleToggleStatus(u)}
                  >
                    {u.isActive ? (
                      <>
                        <ToggleRight className="h-4.5 w-4.5 text-success-600" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4.5 w-4.5 text-white" />
                        Ativar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Create / Edit Seller Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUserId ? 'Editar Cadastro de Vendedor' : 'Cadastrar Novo Vendedor'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="p-3 rounded-lg bg-critical-50 border border-critical-200 text-critical text-xs font-semibold">
              {formError}
            </div>
          )}

          <Input
            label="Nome Completo"
            placeholder="Ex: Carlos da Silva"
            value={formValues.name}
            onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
            required
          />

          <Input
            label="E-mail de Acesso"
            type="email"
            placeholder="Ex: carlos@carol.com"
            value={formValues.email}
            onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
            required
            disabled={!!editingUserId} // Email key change restrictions in mock
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Senha de Acesso"
              type={showFormPassword ? 'text' : 'password'}
              placeholder="Senha forte (mín. 8 caracteres)"
              value={formValues.passwordPin}
              onChange={(e) => setFormValues({ ...formValues, passwordPin: e.target.value })}
              required
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowFormPassword(!showFormPassword)}
                  className="pointer-events-auto text-neutral-450 hover:text-neutral-650 focus:outline-none"
                  title={showFormPassword ? 'Ocultar Senha' : 'Exibir Senha'}
                >
                  {showFormPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              }
            />

            <Select
              label="Cargo / Função"
              value={formValues.role}
              onChange={(e) => setFormValues({ ...formValues, role: e.target.value })}
              required
            >
              <option value="vendedor">Vendedor</option>
              <option value="gerente">Gerente de Loja</option>
            </Select>
          </div>

          <Select
            label="Loja de Origem"
            value={formValues.storeId}
            onChange={(e) => setFormValues({ ...formValues, storeId: e.target.value })}
            required
          >
            <option value="">Selecione uma loja...</option>
            {ALL_STORES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.malote})
              </option>
            ))}
          </Select>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="isActiveCheckbox"
              checked={formValues.isActive}
              onChange={(e) => setFormValues({ ...formValues, isActive: e.target.checked })}
              className="h-4.5 w-4.5 text-brand rounded border-neutral-300 focus:ring-brand"
            />
            <label htmlFor="isActiveCheckbox" className="text-xs font-bold text-neutral-700 select-none cursor-pointer">
              Conta de acesso ativa no sistema
            </label>
          </div>

          <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-neutral-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              className="font-bold border-neutral-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="font-bold"
              isLoading={createUserMutation.isPending || updateUserMutation.isPending}
            >
              {editingUserId ? 'Salvar Alterações' : 'Criar Vendedor'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default SellerManagementPage;
