import * as React from 'react';
import { ALL_STORES, MALOTE_SHIFTS, URGENCY_LEVELS } from '../../lib/constants';
import { canViewAllStores } from '../../lib/permissions';
import { useAuthStore } from '../../store/authStore';
import { useServiceOrders } from '../../features/os/hooks';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { SearchableDropdown } from '../ui/SearchableDropdown';

export interface KanbanFiltersData {
  osNumber: string;
  client: string;
  seller: string;
  malote: string;
  urgency: string;
  storeId: string;
}

export interface KanbanFiltersProps {
  filters: KanbanFiltersData;
  onChange: (filters: KanbanFiltersData) => void;
  onClear: () => void;
}

export function KanbanFilters({ filters, onChange, onClear }: KanbanFiltersProps) {
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role || 'vendedor';
  const showStoreSelect = canViewAllStores(userRole);

  const { data: orders } = useServiceOrders();

  const osNumberOptions = React.useMemo(() => {
    if (!orders) return [];
    return Array.from(new Set(orders.map((o) => o.osNumber).filter(Boolean))).sort();
  }, [orders]);

  const clientOptions = React.useMemo(() => {
    if (!orders) return [];
    return Array.from(new Set(orders.map((o) => o.clientName).filter(Boolean))).sort();
  }, [orders]);

  const sellerOptions = React.useMemo(() => {
    if (!orders) return [];
    return Array.from(new Set(orders.map((o) => o.sellerName).filter(Boolean))).sort();
  }, [orders]);

  const handleFieldChange = (field: keyof KanbanFiltersData, value: string) => {
    onChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 items-end p-4 rounded-xl border border-neutral-200 bg-white shadow-xs w-full">
      {/* OS Number Dropdown */}
      <div className="w-full md:w-36">
        <SearchableDropdown
          label="Nº da OS"
          placeholder="Todas as OS"
          searchPlaceholder="Buscar OS..."
          options={osNumberOptions}
          value={filters.osNumber}
          onChange={(val) => handleFieldChange('osNumber', val)}
        />
      </div>

      {/* Client Dropdown */}
      <div className="flex-1 min-w-[150px] w-full">
        <SearchableDropdown
          label="Cliente"
          placeholder="Todos os clientes"
          searchPlaceholder="Buscar cliente..."
          options={clientOptions}
          value={filters.client}
          onChange={(val) => handleFieldChange('client', val)}
        />
      </div>

      {/* Seller Dropdown */}
      <div className="w-full md:w-44">
        <SearchableDropdown
          label="Vendedor"
          placeholder="Todos os vendedores"
          searchPlaceholder="Buscar vendedor..."
          options={sellerOptions}
          value={filters.seller}
          onChange={(val) => handleFieldChange('seller', val)}
        />
      </div>

      {/* Store Select (Admin/Lab only) */}
      {showStoreSelect && (
        <div className="w-full md:w-48">
          <Select
            label="Filial / Loja"
            value={filters.storeId}
            onChange={(e) => handleFieldChange('storeId', e.target.value)}
          >
            <option value="">Todas as lojas</option>
            {ALL_STORES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.malote})
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Malote Shift Select */}
      <div className="w-full md:w-40">
        <Select
          label="Turno / Malote"
          value={filters.malote}
          onChange={(e) => handleFieldChange('malote', e.target.value)}
        >
          <option value="">Todos turnos</option>
          {MALOTE_SHIFTS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </div>

      {/* Urgency Level Select */}
      <div className="w-full md:w-40">
        <Select
          label="Prioridade"
          value={filters.urgency}
          onChange={(e) => handleFieldChange('urgency', e.target.value)}
        >
          <option value="">Todas</option>
          {URGENCY_LEVELS.map((u) => (
            <option key={u.value} value={String(u.value)}>
              {u.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Clear Button */}
      <Button
        variant="secondary"
        onClick={onClear}
        className="h-10 px-4 w-full md:w-auto font-bold border-neutral-300"
      >
        Limpar Filtros
      </Button>
    </div>
  );
}
export default KanbanFilters;
