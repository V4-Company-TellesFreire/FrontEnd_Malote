import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Award } from 'lucide-react';
import { useConfirmClientPickup, useServiceOrderById } from '../../features/os/hooks';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';

export interface ClientPickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

const pickupSchema = z.object({
  pickedUpBy: z.string().min(1, 'Informe o nome de quem está retirando os óculos'),
  observation: z.string().optional(),
});

type PickupFormValues = z.infer<typeof pickupSchema>;

export function ClientPickupModal({
  isOpen,
  onClose,
  orderId,
}: ClientPickupModalProps) {
  const toast = useToast();
  
  const { data: order, isLoading } = useServiceOrderById(orderId);
  const confirmPickupMutation = useConfirmClientPickup();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PickupFormValues>({
    resolver: zodResolver(pickupSchema),
    defaultValues: {
      pickedUpBy: '',
      observation: '',
    },
  });

  React.useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const onSubmit = (data: PickupFormValues) => {
    confirmPickupMutation.mutate(
      {
        id: orderId,
        pickedUpBy: data.pickedUpBy,
        observation: data.observation || '',
      },
      {
        onSuccess: () => {
          toast.success('Retirada registrada com sucesso! OS arquivada.');
          onClose();
        },
        onError: (err: any) => {
          toast.error(err.message || 'Falha ao registrar entrega ao cliente.');
        },
      }
    );
  };

  if (isLoading || !order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Entrega ao Cliente Final"
      description={`OS ${order.osNumber} — Cliente: ${order.clientName}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        
        {/* Info header */}
        <div className="flex gap-2.5 items-start p-3 bg-neutral-50 rounded-lg border border-neutral-200">
          <Award className="h-5 w-5 text-brand shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-brand uppercase tracking-wider">
              Atenção
            </span>
            <p className="text-[9px] text-neutral-500 leading-relaxed">
              Confirmar esta ação mudará o status da ordem de serviço para "Entregue ao Cliente", arquivando-a e interrompendo o cálculo de tempo de parada.
            </p>
          </div>
        </div>

        {/* Input: Name of person picking up */}
        <Input
          label="Quem está retirando os óculos?"
          placeholder="Ex: Próprio cliente, Cônjuge, Filho..."
          error={errors.pickedUpBy?.message}
          required
          {...register('pickedUpBy')}
        />

        {/* Textarea observations */}
        <div className="w-full flex flex-col gap-1">
          <label className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
            Observações de Entrega
          </label>
          <textarea
            placeholder="Ex: Assinou canhoto físico, conferiu grau na hora..."
            rows={2}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50 transition-all duration-150"
            {...register('observation')}
          />
        </div>

        <div className="flex gap-2 justify-end mt-4 pt-2 border-t border-neutral-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="font-bold border-neutral-300"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={confirmPickupMutation.isPending}
            className="font-bold"
          >
            Confirmar Retirada
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export default ClientPickupModal;
