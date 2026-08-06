import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sun, Sunset, Moon, Store, Loader2, User, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useStores } from '../../features/stores/hooks';
import { useToast } from '../../components/ui';

function getStoreInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0][0];
    const last = parts[parts.length - 1];
    if (/^\d+$/.test(last)) {
      return (first + last).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function StoreSelectorPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const selectStore = useAuthStore((s) => s.selectStore);

  const { data: stores, isLoading } = useStores();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredStores = React.useMemo(() => {
    if (!stores) return [];
    return stores.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stores, searchTerm]);

  // Group stores by shift
  const storesByShift = React.useMemo(() => {
    return {
      Manhã: filteredStores.filter((s) => s.malote === 'Manhã'),
      Tarde: filteredStores.filter((s) => s.malote === 'Tarde'),
      Noite: filteredStores.filter((s) => s.malote === 'Noite'),
    };
  }, [filteredStores]);

  const handleSelectStore = (storeId: string, storeName: string) => {
    selectStore(storeId, storeName);
    toast.success(`Loja ${storeName} selecionada.`);
    navigate('/');
  };

  // If user is not a manager (gerente) or admin, bypass store selection
  React.useEffect(() => {
    if (user && user.role.toLowerCase() !== 'gerente' && user.role.toLowerCase() !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-brand animate-spin" />
          <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
            Carregando filiais...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-neutral-50 overflow-hidden">
      
      {/* ─── Painel Esquerdo (Institucional/Hero) ─── */}
      <aside className="w-full md:w-[30%] lg:w-[28%] xl:w-[25%] shrink-0 bg-brand-900 text-white p-8 md:p-10 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-brand-800">
        
        {/* Gradients decorativos de fundo */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-highlight-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 pointer-events-none" />

        <div className="space-y-12 z-10">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/logo-malote-lab-branca.svg" alt="Malote Lab" className="h-8 w-auto select-none" />
          </div>

          {/* Mensagem e Saudação */}
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-[9px] uppercase font-bold tracking-widest text-brand-200 bg-brand-805 px-2.5 py-1 rounded-full border border-brand-700/40 inline-block">
                Identificação de Acesso
              </span>
              <h2 className="text-2xl font-extrabold font-display leading-tight text-white">
                Escolha a sua unidade de trabalho
              </h2>
            </div>

            {/* Informações do usuário autenticado */}
            {user && (
              <div className="bg-brand-800/40 border border-brand-700/30 rounded-xl p-4 space-y-3.5 backdrop-blur-xs">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-brand-600 flex items-center justify-center border border-brand-500/25">
                    <User className="h-4 w-4 text-brand-100" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-brand-300 font-medium leading-none">Usuário</p>
                    <h4 className="text-xs font-bold text-white truncate mt-1">{user.name}</h4>
                  </div>
                </div>
                <div className="border-t border-brand-800 pt-2.5 flex items-center justify-between text-[10px]">
                  <span className="text-brand-300">Cargo / Função</span>
                  <span className="font-bold text-highlight uppercase tracking-wider bg-highlight-950/40 px-2 py-0.5 rounded border border-highlight-800/20">
                    {user.role === 'vendedor' ? 'Vendedor' : user.role === 'gerente' ? 'Gerente de Loja' : user.role}
                  </span>
                </div>
              </div>
            )}

            <p className="text-[11px] text-brand-200 leading-relaxed">
              Para registrar coletas de malote e gerenciar ordens de serviço, conecte-se à filial onde você operará hoje.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-brand-800/60 z-10 flex flex-col gap-1.5">
          <p className="text-[9px] text-brand-300 font-medium">
            Óticas Carol · Rede Katz
          </p>
          <p className="text-[8px] text-brand-400">
            © {new Date().getFullYear()} Todos os direitos reservados.
          </p>
        </div>
      </aside>

      {/* ─── Painel Direito (Seleção de Lojas) ─── */}
      <main className="flex-1 bg-neutral-50 p-6 md:p-10 flex flex-col gap-6 overflow-hidden">
        
        {/* Top Header com Busca */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5 shrink-0">
          <div>
            <h3 className="text-base font-bold text-neutral-800 uppercase tracking-wide">
              Lojas Disponíveis
            </h3>
            <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
              Selecione uma loja abaixo para prosseguir. {filteredStores.length} unidades encontradas.
            </p>
          </div>

          {/* Campo de Busca Redesenhado */}
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar loja ou turno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-neutral-200 rounded-lg shadow-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/25 transition-all font-medium placeholder-neutral-400 text-neutral-700"
            />
          </div>
        </div>

        {/* Listagem de Lojas em 3 Colunas (Turnos) */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-4">
            
            {/* Turno Manhã */}
            <div className="flex flex-col h-full bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-350">
              <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 select-none">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-highlight-50 border border-highlight-100/50 text-highlight-600 flex items-center justify-center shrink-0">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black uppercase tracking-wider text-brand-900">Turno Manhã</h4>
                    <p className="text-[9px] text-neutral-400 font-semibold mt-0.5">Coletas ao meio-dia</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-brand-50 text-brand-800 border border-brand-100/50 px-2 py-0.5 rounded-full shadow-xs">
                  {storesByShift.Manhã.length}
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto overflow-x-hidden max-h-[50vh] lg:max-h-none scrollbar-none p-2 bg-neutral-50/60 border border-neutral-100/50 rounded-xl mt-3 pb-3">
                {storesByShift.Manhã.map((s) => (
                  <StoreCard key={s.id} store={s} onSelect={handleSelectStore} shiftColor="amber" />
                ))}
                {storesByShift.Manhã.length === 0 && (
                  <div className="text-center py-6 border border-dashed border-neutral-200 rounded-xl text-[10px] text-neutral-400 font-medium bg-white/40">
                    Nenhuma loja para o turno da manhã
                  </div>
                )}
              </div>
            </div>

            {/* Turno Tarde */}
            <div className="flex flex-col h-full bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-350">
              <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 select-none">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-brand-50 border border-brand-100/50 text-brand flex items-center justify-center shrink-0">
                    <Sunset className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black uppercase tracking-wider text-brand-900">Turno Tarde</h4>
                    <p className="text-[9px] text-neutral-400 font-semibold mt-0.5">Coletas no fim da tarde</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-brand-50 text-brand-800 border border-brand-100/50 px-2 py-0.5 rounded-full shadow-xs">
                  {storesByShift.Tarde.length}
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto overflow-x-hidden max-h-[50vh] lg:max-h-none scrollbar-none p-2 bg-neutral-50/60 border border-neutral-100/50 rounded-xl mt-3 pb-3">
                {storesByShift.Tarde.map((s) => (
                  <StoreCard key={s.id} store={s} onSelect={handleSelectStore} shiftColor="blue" />
                ))}
                {storesByShift.Tarde.length === 0 && (
                  <div className="text-center py-6 border border-dashed border-neutral-200 rounded-xl text-[10px] text-neutral-400 font-medium bg-white/40">
                    Nenhuma loja para o turno da tarde
                  </div>
                )}
              </div>
            </div>

            {/* Turno Noite */}
            <div className="flex flex-col h-full bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-350">
              <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 select-none">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-brand-900 border border-brand-850 text-brand-100 flex items-center justify-center shrink-0">
                    <Moon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black uppercase tracking-wider text-brand-900">Turno Noite</h4>
                    <p className="text-[9px] text-neutral-400 font-semibold mt-0.5">Coletas no período noturno</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-brand-50 text-brand-800 border border-brand-100/50 px-2 py-0.5 rounded-full shadow-xs">
                  {storesByShift.Noite.length}
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto overflow-x-hidden max-h-[50vh] lg:max-h-none scrollbar-none p-2 bg-neutral-50/60 border border-neutral-100/50 rounded-xl mt-3 pb-3">
                {storesByShift.Noite.map((s) => (
                  <StoreCard key={s.id} store={s} onSelect={handleSelectStore} shiftColor="purple" />
                ))}
                {storesByShift.Noite.length === 0 && (
                  <div className="text-center py-6 border border-dashed border-neutral-200 rounded-xl text-[10px] text-neutral-400 font-medium bg-white/40">
                    Nenhuma loja para o turno da noite
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Mensagem se o filtro não retornar resultados */}
        {filteredStores.length === 0 && (
          <div className="text-center py-12 bg-white border border-neutral-200 rounded-xl shadow-xs">
            <Store className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-xs text-neutral-500 font-semibold">Nenhuma loja encontrada</p>
            <p className="text-[10px] text-neutral-400 mt-1">Experimente buscar por outro nome ou termo</p>
          </div>
        )}

      </main>
    </div>
  );
}

// Subcomponente StoreCard Redenhado
function StoreCard({ 
  store, 
  onSelect,
  shiftColor
}: { 
  store: any; 
  onSelect: (id: string, name: string) => void;
  shiftColor: 'amber' | 'blue' | 'purple';
}) {
  const initials = getStoreInitials(store.name);

  // Determinar cores semânticas com base no turno da loja
  const avatarColors = {
    amber: 'bg-highlight-50 text-highlight-800 border-highlight-200',
    blue: 'bg-brand-50 text-brand-800 border-brand-200',
    purple: 'bg-brand-900 text-brand-100 border-brand-850',
  }[shiftColor];

  return (
    <button
      onClick={() => onSelect(store.id, store.name)}
      className="w-full cursor-pointer bg-white border border-neutral-200/70 rounded-xl p-3 flex items-center justify-between gap-3 text-left hover:border-brand-400 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      type="button"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar Circular com Iniciais da Loja */}
        <div className={`h-9 w-9 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 select-none ${avatarColors}`}>
          {initials}
        </div>
        
        {/* Informações da Loja */}
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-neutral-800 truncate uppercase group-hover:text-brand-700 transition-colors">
            {store.name}
          </h4>
          <span className="text-[9px] text-neutral-400 font-medium">
            Malote: {store.malote}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Contagem de OS Ativas */}
        {store.activeOrderCount > 0 && (
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-brand-50 border border-brand-100 text-[9px] font-bold text-brand shadow-xs">
            {store.activeOrderCount} OS
          </span>
        )}
        {/* Ícone de Flecha animado */}
        <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all duration-200" />
      </div>
    </button>
  );
}
