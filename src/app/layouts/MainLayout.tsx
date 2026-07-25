import * as React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, LogOut, Shield, Store, FlaskConical, PlusCircle, Eye, PackageCheck, BarChart3, RotateCcw, Bell, AlertTriangle, Settings, LayoutGrid, Truck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { getNavItemsForRole } from '../../lib/permissions';
import { ROLE_LABELS } from '../../lib/constants';
import { Button, Avatar, Badge } from '../../components/ui';
import { useLogout } from '../../features/auth/hooks';

// Helper map to dynamic Lucide icon renderers
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  'plus-circle': PlusCircle,
  'eye': Eye,
  'flask-conical': FlaskConical,
  'package-check': PackageCheck,
  'bar-chart-3': BarChart3,
  'rotate-ccw': RotateCcw,
  'bell': Bell,
  'alert-triangle': AlertTriangle,
  'settings': Settings,
  'truck': Truck,
};

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const selectedStoreName = useAuthStore((s) => s.selectedStoreName);
  const clearStore = useAuthStore((s) => s.clearStore);

  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  const logoutMutation = useLogout();

  const handleLogout = async () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/login');
      },
    });
  };

  const navItems = React.useMemo(() => {
    return user ? getNavItemsForRole(user.role) : [];
  }, [user]);

  // Handle auto close sidebar on mobile navigation
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  // Gerente without a selected store = consolidated view
  const isConsolidatedView = user?.role === 'gerente' && !selectedStoreName;
  const activeStoreLabel = user?.role === 'laboratorio'
    ? 'Laboratório Katz'
    : isConsolidatedView
      ? 'Visão Geral das Lojas'
      : selectedStoreName || 'Sem Filial';

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-sticky flex flex-col w-64 bg-brand text-white border-r border-brand-700 transform transition-transform duration-300 md:translate-x-0 md:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-0 -translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-brand-700">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-malote-lab-branca.svg" alt="Malote Lab" className="h-8 w-auto select-none" />
          </Link>
        </div>

        {/* User Card Info */}
        <div className="flex flex-col gap-1 p-4 border-b border-brand-700 bg-brand-600/30">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name || ''} src={user?.avatar} size="sm" className="bg-white/20 text-white border-white/25" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate tracking-wide">{user?.name}</p>
              <p className="text-[10px] text-brand-200 uppercase tracking-wider mt-0.5">
                {user ? ROLE_LABELS[user.role] : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = ICON_MAP[item.icon] || Store;
            const isActive = location.pathname === item.path;

            if (item.id === 'new-os') {
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 mb-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-highlight text-brand-900 hover:bg-highlight-600 active:scale-[0.98] shadow-sm hover:shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-highlight-500/20"
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold tracking-wide transition-colors duration-200 ${
                  isActive
                    ? 'bg-brand-600 text-white font-bold'
                    : 'text-brand-100 hover:bg-brand-600/40 hover:text-white'
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout / Settings */}
        <div className="p-4 border-t border-brand-700 flex flex-col gap-1.5 animate-slide-in-bottom">
          {(user?.role === 'gerente' || user?.role === 'admin') && (
            <Button
              variant="ghost"
              className={`w-full justify-start text-xs ${
                location.pathname === '/store/config'
                  ? 'bg-brand-600 text-white font-bold'
                  : 'text-brand-100 hover:text-white hover:bg-brand-600/40'
              }`}
              leftIcon={<Settings className="h-4.5 w-4.5" />}
              onClick={() => {
                setSidebarOpen(false);
                navigate('/store/config');
              }}
            >
              Configurações
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full text-brand-100 hover:text-white hover:bg-brand-600/40 justify-start text-xs"
            leftIcon={<LogOut className="h-4.5 w-4.5" />}
            onClick={handleLogout}
          >
            Sair da Conta
          </Button>
        </div>
      </aside>

      {/* Backdrop for mobile navigation overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-overlay bg-neutral-900/40 backdrop-blur-xs md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* ─── Main Content Shell ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between px-6 border-b border-neutral-200 bg-white shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-neutral-500 rounded-full hover:bg-neutral-100"
              onClick={toggleSidebar}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 select-none">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black tracking-wide rounded-full shadow-xs ${
                isConsolidatedView
                  ? 'bg-highlight-50 border border-highlight-200 text-highlight-700'
                  : 'bg-brand-50 border border-brand-200 text-brand'
              }`}>
                {isConsolidatedView
                  ? <LayoutGrid className="h-3.5 w-3.5 text-highlight-600" />
                  : <Store className="h-3.5 w-3.5 text-brand" />
                }
                <span>{activeStoreLabel}</span>
              </div>
              {user?.role === 'admin' && (
                <Badge variant="warning" className="text-[9px] px-1.5 py-0.5">
                  <Shield className="h-2.5 w-2.5 mr-1" />
                  Supervisor
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Trocar Loja / Visão Geral buttons */}
            {user?.role === 'gerente' && (
              <div className="flex items-center gap-2">
                {/* Gerente viewing a specific store: show button to return to consolidated view */}
                {user?.role === 'gerente' && selectedStoreName && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs font-semibold px-3 flex items-center gap-1.5 bg-highlight-50 hover:bg-highlight-100 border-highlight-200 rounded-lg text-highlight-700 shadow-xs"
                    onClick={() => {
                      clearStore();
                      navigate('/store/dashboard');
                    }}
                  >
                    <LayoutGrid className="h-3.5 w-3.5 text-highlight-600" />
                    <span>Visão Geral</span>
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs font-semibold px-3 flex items-center gap-1.5 bg-white hover:bg-neutral-50 border-neutral-300 rounded-lg text-neutral-700 shadow-xs"
                  onClick={() => {
                    clearStore();
                    navigate('/selecionar-loja');
                  }}
                >
                  <Store className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Trocar Loja</span>
                </Button>
              </div>
            )}

            {/* Profile trigger dropdown wrapper */}
            <div ref={dropdownRef} className="flex items-center gap-3 pl-4 border-l border-neutral-200 relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all duration-150 focus:outline-none"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-neutral-850 leading-none">{user?.name}</p>
                  <span className="text-[9px] font-bold text-neutral-450 uppercase tracking-wider block mt-1">
                    {user ? ROLE_LABELS[user.role] : ''}
                  </span>
                </div>
                <Avatar name={user?.name || ''} src={user?.avatar} size="sm" className="bg-brand-50 border-brand-200 text-brand font-bold" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-neutral-250 bg-white p-1.5 shadow-lg z-popover animate-fade-in">
                  <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                    <p className="text-xs font-black text-neutral-800">{user?.name}</p>
                    <p className="text-[10px] text-neutral-450 truncate mt-0.5">{user?.email}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/profile');
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-neutral-750 hover:bg-neutral-50 hover:text-neutral-900 rounded-lg transition-colors text-left"
                  >
                    <Settings className="h-3.5 w-3.5 text-neutral-400" />
                    Editar Perfil
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-critical hover:bg-critical-50 rounded-lg transition-colors text-left mt-0.5 border-t border-neutral-100 pt-2"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sair da Conta
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Outlet scroll area */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-neutral-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
export default MainLayout;
