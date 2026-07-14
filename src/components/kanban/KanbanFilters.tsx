import { Search } from 'lucide-react';
import { ALL_STORES, MALOTE_SHIFTS, URGENCY_LEVELS } from '../../lib/constants';
import { canViewAllStores } from '../../lib/permissions';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

export interface KanbanFiltersData {
  search: string;
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

  const handleFieldChange = (field: keyof KanbanFiltersData, value: string) => {
    onChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 items-end p-4 rounded-xl border border-neutral-200 bg-white shadow-xs w-full">
      {/* Search Input */}
      <div className="flex-1 min-w-[200px] w-full">
        <Input
          label="Buscar serviço"
          placeholder="Buscar por OS, cliente..."
          value={filters.search}
          onChange={(e) => handleFieldChange('search', e.target.value)}
          className="pl-9"
          leftIcon={<Search className="h-4 w-4 text-neutral-400" />}
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
