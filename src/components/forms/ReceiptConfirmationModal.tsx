import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, CheckCircle2, AlertTriangle, Calendar, Award } from 'lucide-react';
import { useTransitionStatus, useServiceOrderById } from '../../features/os/hooks';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { formatDate } from '../../lib/utils';

export interface ReceiptConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

// Zod Validation schema for Receipt Confirmation
const receiptSchema = z.object({
  isOk: z.boolean(),
  receiverName: z.string().min(1, 'Informe quem está recebendo o malote'),
  problemDescription: z.string().optional(),
  problemPhoto: z.any().optional(),
}).superRefine((data, ctx) => {
  if (data.isOk === false) {
    if (!data.problemDescription || data.problemDescription.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Descreva o problema encontrado',
        path: ['problemDescription'],
      });
    }
    if (!data.problemPhoto) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A foto do produto com problema é obrigatória',
        path: ['problemPhoto'],
      });
    }
  }
});

type ReceiptFormValues = z.infer<typeof receiptSchema>;

export function ReceiptConfirmationModal({
  isOpen,
  onClose,
  orderId,
}: ReceiptConfirmationModalProps) {
  const toast = useToast();
  
  // Queries
  const { data: order, isLoading } = useServiceOrderById(orderId);
  const transitionMutation = useTransitionStatus();

  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [showDeadlineResult, setShowDeadlineResult] = React.useState(false);
  const [isWithinDeadline, setIsWithinDeadline] = React.useState(true);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      isOk: true,
      receiverName: '',
      problemDescription: '',
    },
  });

  const watchIsOk = watch('isOk');

  // Handle local state resets on close
  React.useEffect(() => {
    if (!isOpen) {
      reset();
      setPhotoPreview(null);
      setShowDeadlineResult(false);
    }
  }, [isOpen, reset]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValue('problemPhoto', file);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setValue('problemPhoto', undefined);
  };

  const onSubmit = (data: ReceiptFormValues) => {
    const targetStatus = data.isOk ? 'Entregue na Loja' : 'Entregue c/ Ressalva';
    
    // Simulate image uploading base64 string
    const photoUrl = photoPreview || undefined;

    // Evaluate deadline
    let withinDeadline = true;
    if (order?.deadline) {
      withinDeadline = new Date() <= new Date(order.deadline + 'T23:59:59');
      setIsWithinDeadline(withinDeadline);
    }

    transitionMutation.mutate(
      {
        id: orderId,
        payload: {
          to: targetStatus,
          reason: data.problemDescription,
          photoUrl,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            data.isOk
              ? 'Recebimento confirmado!'
              : 'Problema registrado e foto enviada ao laboratório.'
          );
          
          if (order?.deadline) {
            setShowDeadlineResult(true);
          } else {
            onClose();
          }
        },
        onError: (err: any) => {
          toast.error(err.message || 'Falha ao confirmar recebimento.');
        },
      }
    );
  };

  if (isLoading || !order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={showDeadlineResult ? "Relatório de Prazo de Entrega" : "Confirmar Recebimento de Malote"}
      description={showDeadlineResult ? undefined : `OS ${order.osNumber} — Cliente: ${order.clientName}`}
    >
      {showDeadlineResult ? (
        /* Step 2: Deadline indicator overlay */
        <div className="flex flex-col gap-6 text-center py-4">
          {isWithinDeadline ? (
            <div className="flex flex-col items-center gap-3 p-6 rounded-xl border border-success-200 bg-success-50/20">
              <Award className="h-14 w-14 text-success animate-bounce" />
              <h4 className="text-base font-bold text-success-800">
                Parabéns! Serviço entregue no prazo!
              </h4>
              <p className="text-xs text-neutral-600 leading-normal max-w-xs">
                Malote recebido dentro do prazo previsto ({formatDate(order.deadline)}). Excelente eficiência operacional!
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-6 rounded-xl border border-warning-200 bg-warning-50/15">
              <Calendar className="h-14 w-14 text-warning" />
              <h4 className="text-base font-bold text-warning-850">
                Atenção: Serviço entregue com atraso
              </h4>
              <p className="text-xs text-neutral-600 leading-normal max-w-xs">
                O prazo limite previsto era {formatDate(order.deadline)}. Comunique o cliente e registre o motivo se necessário.
              </p>
            </div>
          )}
          
          <Button onClick={onClose} className="w-full font-bold justify-center mt-2">
            Fechar Modal
          </Button>
        </div>
      ) : (
        /* Step 1: OK / Problem form inputs */
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          
          {/* OK vs Problem selector grids */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
              Estado de Chegada do Óculos
            </span>
            <Controller
              name="isOk"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => field.onChange(true)}
                    className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer hover:border-success-400 hover:bg-success-50/10 transition-all duration-150 ${
                      field.value === true
                        ? 'border-success-400 bg-success-50/20 text-success-850 font-bold'
                        : 'border-neutral-200 bg-white text-neutral-500'
                    }`}
                  >
                    <CheckCircle2 className="h-6 w-6 text-success shrink-0 mb-2" />
                    <span className="text-xs font-bold">Em perfeito estado</span>
                    <span className="text-[9px] opacity-70 mt-1">Nenhuma avaria</span>
                  </div>

                  <div
                    onClick={() => field.onChange(false)}
                    className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer hover:border-critical-400 hover:bg-critical-50/10 transition-all duration-150 ${
                      field.value === false
                        ? 'border-critical-400 bg-critical-50/20 text-critical-850 font-bold'
                        : 'border-neutral-200 bg-white text-neutral-500'
                    }`}
                  >
                    <AlertTriangle className="h-6 w-6 text-critical shrink-0 mb-2" />
                    <span className="text-xs font-bold">Com Problema / Avaria</span>
                    <span className="text-[9px] opacity-70 mt-1">Armação quebrada, etc.</span>
                  </div>
                </div>
              )}
            />
          </div>

          {/* If Problem: Render details description and required photo upload */}
          {watchIsOk === false && (
            <div className="flex flex-col gap-3 p-4 border border-critical-200 rounded-lg bg-critical-50/10 animate-fade-in">
              <span className="text-[10px] font-bold tracking-wider text-critical-800 uppercase">
                Detalhes da Avaria
              </span>
              
              <Input
                label="Descreva o problema"
                placeholder="Ex: Lente arranhada, parafuso solto..."
                error={errors.problemDescription?.message}
                {...register('problemDescription')}
              />

              {/* Required photo upload */}
              <div className="flex flex-col gap-1.5 mt-1">
                <span className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                  Foto comprovante do problema <span className="text-critical">*</span>
                </span>
                
                {!photoPreview ? (
                  <div className="relative border border-dashed border-critical-300 rounded-lg p-5 bg-white hover:border-critical hover:bg-critical-50/5 cursor-pointer flex flex-col items-center justify-center gap-1 group transition-all duration-150">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="h-6 w-6 text-neutral-400 group-hover:text-critical" />
                    <span className="text-[10px] text-neutral-600 font-bold">Enviar foto do problema</span>
                  </div>
                ) : (
                  <div className="relative rounded border border-neutral-200 p-2 bg-white flex items-center justify-between gap-3">
                    <img src={photoPreview} alt="Avaria" className="h-16 rounded border" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removePhoto}
                      className="text-critical hover:bg-critical-50 h-8"
                    >
                      Remover
                    </Button>
                  </div>
                )}
                {errors.problemPhoto && (
                  <span className="text-xs text-critical font-medium">{errors.problemPhoto.message as string}</span>
                )}
              </div>
            </div>
          )}

          {/* Receiver validation name */}
          <Input
            label="Colaborador que conferiu / recebeu"
            placeholder="Nome completo do colaborador"
            error={errors.receiverName?.message}
            required
            {...register('receiverName')}
          />

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
              isLoading={transitionMutation.isPending}
              className="font-bold"
            >
              Confirmar Chegada
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
export default ReceiptConfirmationModal;
