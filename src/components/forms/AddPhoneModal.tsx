import * as React from 'react';
import { Phone, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { formatPhone } from '../../lib/utils';
import { useUpdateClientPhone } from '../../features/os/hooks';
import type { ServiceOrder } from '../../lib/types';

export interface AddPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder;
}

export function AddPhoneModal({ isOpen, onClose, order }: AddPhoneModalProps) {
  const toast = useToast();
  const updatePhoneMutation = useUpdateClientPhone();
  const [phone, setPhone] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setPhone(order.clientPhone || '');
      setError(null);
    }
  }, [isOpen, order]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Informe um telefone válido com DDD (mínimo 10 dígitos).');
      return;
    }

    updatePhoneMutation.mutate(
      { id: order.id, phone },
      {
        onSuccess: () => {
          toast.success('Telefone do cliente atualizado com sucesso! A ordem foi desbloqueada.');
          onClose();
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Falha ao atualizar telefone do cliente.');
        },
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adicionar Telefone do Cliente"
      description={`OS ${order.osNumber} — ${order.clientName}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        <div className="p-3 rounded-lg bg-warning-50 border border-warning-200 text-xs text-warning-900 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-warning-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            O número de celular é obrigatório para envio ao laboratório e comunicação de notificações sobre o pedido.
          </p>
        </div>

        <Input
          label="Celular do Cliente (com DDD)"
          placeholder="(21) 99999-9999"
          value={phone}
          onChange={handleChange}
          error={error || undefined}
          autoFocus
          leftIcon={<Phone className="h-4 w-4 text-neutral-400" />}
          required
        />

        <div className="flex justify-end gap-2.5 pt-2 border-t border-neutral-100">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={updatePhoneMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={updatePhoneMutation.isPending}
            className="font-bold"
          >
            Salvar e Desbloquear
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export default AddPhoneModal;
