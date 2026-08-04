import * as React from 'react';
import { Briefcase, AlertCircle, Check, Loader2, Store, Calendar, ShieldAlert } from 'lucide-react';
import type { ServiceOrder } from '../../lib/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface CreateMaloteModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: ServiceOrder[];
  initialSelectedOsId: string | null;
  onConfirm: (selectedIds: string[], pouchCode: string) => Promise<void>;
  isSubmitting: boolean;
}

export function CreateMaloteModal({
  isOpen,
  onClose,
  orders,
  initialSelectedOsId,
  onConfirm,
  isSubmitting,
}: CreateMaloteModalProps) {
  const [pouchCode, setPouchCode] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Generate a default pouch code on open
  React.useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
      const randomPart = Math.floor(100 + Math.random() * 900);
      setPouchCode(`ML-${datePart}-${randomPart}`);
      
      // Reset selected IDs with initial trigger OS
      if (initialSelectedOsId) {
        setSelectedIds([initialSelectedOsId]);
      } else {
        setSelectedIds([]);
      }
    }
  }, [isOpen, initialSelectedOsId]);

  // Filter orders in 'Separando' status
  const availableOrders = React.useMemo(() => {
    return orders.filter((o) => o.status === 'Separando');
  }, [orders]);

  const handleToggleSelect = (id: string) => {
    // Cannot deselect the initial trigger OS to ensure it goes into a pouch
    if (id === initialSelectedOsId) return;

    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allIds = availableOrders.map((o) => o.id);
    setSelectedIds(allIds);
  };

  const handleDeselectAll = () => {
    if (initialSelectedOsId) {
      setSelectedIds([initialSelectedOsId]);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pouchCode.trim()) return;
    if (selectedIds.length === 0) return;
    onConfirm(selectedIds, pouchCode);
  };

  const isConfirmDisabled = !pouchCode.trim() || selectedIds.length === 0 || isSubmitting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar Novo Malote"
      description="Agrupe serviços da triagem em um malote físico para envio rápido e seguro."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Pouch Code Input */}
        <div className="flex flex-col gap-1 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
          <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
            Código / Lacre do Malote <span className="text-critical">*</span>
          </label>
          <Input
            value={pouchCode}
            onChange={(e) => setPouchCode(e.target.value.toUpperCase())}
            placeholder="Ex: ML-260804-123"
            required
            className="font-mono font-bold bg-white"
            disabled={isSubmitting}
          />
          <p className="text-[10px] text-neutral-400 font-medium">
            Preencha com a numeração do lacre físico ou código de rastreamento do malote.
          </p>
        </div>

        {/* Selected Counter & Helpers */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <span className="text-xs font-bold text-neutral-800">
            Ordens Selecionadas: <span className="text-brand font-black">{selectedIds.length}</span>
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[10px] font-bold text-brand hover:text-brand-900 select-none cursor-pointer"
              disabled={isSubmitting || availableOrders.length === 0}
            >
              Selecionar Todas
            </button>
            <span className="text-neutral-300 text-[10px] select-none">|</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-[10px] font-bold text-neutral-500 hover:text-neutral-800 select-none cursor-pointer"
              disabled={isSubmitting}
            >
              Limpar Seleção
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
          {availableOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-neutral-200 rounded-xl bg-neutral-50 text-center gap-1.5">
              <AlertCircle className="h-6 w-6 text-neutral-400" />
              <span className="text-xs font-bold text-neutral-500">Nenhum serviço em Triagem</span>
              <span className="text-[10px] text-neutral-400">
                Não há ordens de serviço atualmente na etapa de Separando.
              </span>
            </div>
          ) : (
            availableOrders.map((order) => {
              const isSelected = selectedIds.includes(order.id);
              const isTrigger = order.id === initialSelectedOsId;

              return (
                <div
                  key={order.id}
                  onClick={() => !isSubmitting && handleToggleSelect(order.id)}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-xs transition-all select-none cursor-pointer ${
                    isSelected
                      ? 'border-brand bg-brand-50/15'
                      : 'border-neutral-250 hover:bg-neutral-50/50'
                  } ${isTrigger ? 'relative ring-1 ring-brand-300' : ''}`}
                >
                  {/* Custom Checkbox */}
                  <div
                    className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-brand border-brand text-white'
                        : 'border-neutral-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>

                  {/* OS Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-neutral-850">
                        Nº {order.osNumber}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-500 uppercase tracking-wider shrink-0">
                        {order.malote}
                      </span>
                    </div>

                    <h4 className="font-semibold text-neutral-700 line-clamp-1 mt-0.5">
                      {order.clientName}
                    </h4>

                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-neutral-400 font-medium">
                      <span className="flex items-center gap-0.5">
                        <Store className="h-3 w-3" />
                        {order.storeName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Calendar className="h-3 w-3" />
                        Prazo: {order.deadline ? new Date(order.deadline).toLocaleDateString('pt-BR') : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Trigger tag badge */}
                  {isTrigger && (
                    <div className="absolute right-3 bottom-2 flex items-center gap-1 text-[8px] bg-brand-50 border border-brand-200 text-brand font-bold py-0.5 px-1.5 rounded">
                      <ShieldAlert className="h-2.5 w-2.5 shrink-0" />
                      <span>Origem do Arraste</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-4 mt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            className="font-bold h-10 border-neutral-300"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isConfirmDisabled}
            className="font-bold h-10 px-5 flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando Malote...
              </>
            ) : (
              <>
                <Briefcase className="h-4 w-4" />
                Despachar Malote
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export default CreateMaloteModal;
