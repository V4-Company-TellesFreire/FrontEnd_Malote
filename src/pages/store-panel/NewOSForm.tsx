import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { ALL_STORES, RECIPE_TYPES, FRAME_ORIGINS, FRAME_MATERIALS, LENS_TYPES, LENS_MATERIALS, TREATMENTS, LAB_PARTNERS, SERVICE_TYPES, URGENCY_LEVELS, URGENCY_REASONS } from '../../lib/constants';
import { useCreateServiceOrder } from '../../features/os/hooks';
import { useAuthStore } from '../../store/authStore';
import { Input, Select, Button, Chip, Card, CardContent, useToast } from '../../components/ui';
import { formatPhone } from '../../lib/utils';

// Validation Schema
const newOsSchema = z.object({
  storeName: z.string().min(1, 'Selecione a loja'),
  osStore: z.string().min(1, 'Informe a OS da loja'),
  clientName: z.string().min(1, 'Informe o nome do cliente'),
  clientPhone: z.string().optional(),
  sellerName: z.string().min(1, 'Informe o nome do vendedor'),
  entryDate: z.string().min(1, 'Informe a data de entrada'),
  recipeType: z.string().min(1, 'Selecione o tipo de receita'),
  prescription: z.any().optional(),
  frameOrigin: z.string().min(1, 'Selecione a procedência da armação'),
  frameMaterial: z.string().optional(),
  frameReference: z.string().optional(),
  frameColor: z.string().optional(),
  frameBrand: z.string().optional(),
  lensType: z.string().min(1, 'Selecione o tipo de lente'),
  lensMaterial: z.string().min(1, 'Selecione o material da lente'),
  treatments: z.string().optional(),
  externalLab: z.boolean(),
  labName: z.string().optional(),
  serviceType: z.string().min(1, 'Selecione o tipo de serviço'),
  deadline: z.string().min(1, 'Informe o prazo previsto'),
  technician: z.string().optional(),
  observations: z.string().optional(),
  urgency: z.coerce.number().min(0).max(2),
  urgencyReason: z.string().optional(),
  urgencyObservation: z.string().optional(),
  urgencyExtreme: z.string().optional(),
  receiptImage: z.any().optional(),
}).refine(data => {
  if (data.externalLab && !data.labName) {
    return false;
  }
  return true;
}, {
  message: "Informe o laboratório externo",
  path: ["labName"]
}).refine(data => {
  if (data.urgency > 0 && !data.urgencyReason) {
    return false;
  }
  return true;
}, {
  message: "Informe o motivo da urgência",
  path: ["urgencyReason"]
}).refine(data => {
  if (data.urgency === 2 && !data.urgencyExtreme) {
    return false;
  }
  return true;
}, {
  message: "Informe a justificativa extrema da super urgência",
  path: ["urgencyExtreme"]
});

type NewOSFormValues = z.infer<typeof newOsSchema>;

export function NewOSForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const activeStoreName = useAuthStore((s) => s.selectedStoreName);
  
  const createMutation = useCreateServiceOrder();

  const [selectedTreatments, setSelectedTreatments] = React.useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [currentStep, setCurrentStep] = React.useState(1);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<NewOSFormValues>({
    resolver: zodResolver(newOsSchema) as any,
    defaultValues: {
      storeName: activeStoreName || '',
      osStore: '',
      clientName: '',
      clientPhone: '',
      sellerName: user?.name || '',
      entryDate: new Date().toISOString().slice(0, 10),
      recipeType: 'Receita médica',
      frameOrigin: 'Fornecida pela loja',
      frameMaterial: 'Acetato',
      lensType: 'Visão simples',
      lensMaterial: 'CR-39',
      treatments: '',
      externalLab: false,
      labName: '',
      serviceType: 'Montagem completa',
      deadline: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      technician: '',
      observations: '',
      urgency: 0,
      urgencyReason: '',
      urgencyObservation: '',
      urgencyExtreme: '',
    },
  });

  const watchExternalLab = watch('externalLab');
  const watchUrgency = watch('urgency');
  const watchUrgencyReason = watch('urgencyReason');

  // Compute progress indicator (1 to 4 steps)
  const progressPercent = React.useMemo(() => {
    return currentStep * 25;
  }, [currentStep]);

  // Step validation and transition
  const validateAndNext = async () => {
    let fieldsToValidate: Array<keyof NewOSFormValues> = [];
    if (currentStep === 1) {
      fieldsToValidate = ['storeName', 'osStore', 'clientName', 'sellerName', 'entryDate', 'recipeType'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['frameOrigin'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['lensType', 'lensMaterial'];
    }

    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast.error('Por favor, preencha os campos obrigatórios da etapa atual.');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Handle treatment Chip clicks
  const toggleTreatment = (treatment: string) => {
    setSelectedTreatments(prev => {
      const next = prev.includes(treatment)
        ? prev.filter(t => t !== treatment)
        : [...prev, treatment];
      
      setValue('treatments', next.join(', '));
      return next;
    });
  };

  // Handle prescription photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setValue('receiptImage', file);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setValue('receiptImage', undefined);
  };

  const onSubmit = (data: NewOSFormValues) => {
    createMutation.mutate(
      {
        osStore: data.osStore,
        clientName: data.clientName,
        clientPhone: data.clientPhone || '',
        storeName: data.storeName,
        sellerName: data.sellerName,
        entryDate: data.entryDate,
        recipeType: data.recipeType,
        prescription: data.prescription || null,
        frameOrigin: data.frameOrigin,
        frameMaterial: data.frameMaterial || '',
        frameReference: data.frameReference || '',
        frameColor: data.frameColor || '',
        frameBrand: data.frameBrand || '',
        lensType: data.lensType,
        lensMaterial: data.lensMaterial,
        treatments: data.treatments || '',
        externalLab: data.externalLab,
        labName: data.labName || '',
        serviceType: data.serviceType,
        deadline: data.deadline,
        technician: data.technician || '',
        observations: data.observations || '',
        urgency: data.urgency as any,
        urgencyReason: data.urgencyReason || '',
        urgencyObservation: data.urgencyObservation || '',
        urgencyExtreme: data.urgencyExtreme || '',
        receiptImage: photoFile,
      },
      {
        onSuccess: () => {
          toast.success('Ordem de serviço cadastrada com sucesso!');
          navigate('/store/dashboard');
        },
        onError: (err: any) => {
          toast.error(err.message || 'Falha ao salvar OS.');
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header back trigger */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-neutral-900 leading-tight">
            CADASTRAR NOVA OS
          </h2>
          <p className="text-xs text-neutral-500">
            Preencha a receita e especificações do óculos
          </p>
        </div>
      </div>

      {/* Progress Bar indicator */}
      <Card className="border-neutral-200 shadow-xs">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-neutral-600">Progresso do cadastro</span>
          <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden border border-neutral-200">
            <div 
              className="h-full bg-brand rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono text-neutral-500 font-bold">{progressPercent}%</span>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        
        {/* SECTION 1: IDENTIFICAÇÃO */}
        {currentStep === 1 && (
          <Card className="border-neutral-200 shadow-xs animate-slide-in-bottom">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3 mb-1">
                <span className="h-6 w-6 rounded-full bg-brand-50 border border-brand-200 text-brand font-bold text-xs flex items-center justify-center font-mono">
                  1
                </span>
                <h3 className="text-sm font-bold text-neutral-850">Identificação do Pedido</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Select
                  label="Loja Emitente"
                  error={errors.storeName?.message}
                  required
                  {...register('storeName')}
                >
                  <option value="">Selecione...</option>
                  {ALL_STORES.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.malote})</option>
                  ))}
                </Select>

                <Input
                  label="Nº OS da Loja"
                  placeholder="Ex: 994522"
                  error={errors.osStore?.message}
                  required
                  {...register('osStore')}
                />

                <Input
                  label="Nome do Cliente"
                  placeholder="Nome completo"
                  error={errors.clientName?.message}
                  required
                  {...register('clientName')}
                />

                <Controller
                  name="clientPhone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="Celular do Cliente"
                      placeholder="(21) 99999-9999"
                      value={field.value}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      error={errors.clientPhone?.message}
                    />
                  )}
                />

                <Input
                  label="Vendedor Colaborador"
                  placeholder="Ex: Lucas"
                  error={errors.sellerName?.message}
                  required
                  {...register('sellerName')}
                />

                <Input
                  label="Data de Entrada"
                  type="date"
                  error={errors.entryDate?.message}
                  required
                  {...register('entryDate')}
                />

                <Select
                  label="Tipo de Receita"
                  error={errors.recipeType?.message}
                  required
                  {...register('recipeType')}
                >
                  {RECIPE_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>

              {/* Receipt upload zone */}
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                  Anexar Receita ou Pedido (Foto / PDF)
                </span>
                
                {!photoPreview ? (
                  <div className="relative border-2 border-dashed border-neutral-300 rounded-xl p-6 bg-neutral-50/50 hover:bg-neutral-50 hover:border-brand cursor-pointer flex flex-col items-center justify-center gap-2 group transition-all duration-150">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handlePhotoChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="h-8 w-8 text-neutral-400 group-hover:text-brand transition-colors duration-150" />
                    <span className="text-xs text-neutral-600 font-semibold">
                      Selecione uma imagem ou PDF para upload
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Formatos suportados: JPG, PNG, PDF. Limite: 5MB
                    </span>
                  </div>
                ) : (
                  <div className="relative rounded-xl border border-neutral-200 p-4 bg-neutral-50 flex flex-col gap-3 items-center justify-center">
                    <img
                      src={photoPreview}
                      alt="Receita anexo"
                      className="max-h-48 rounded border border-neutral-200 shadow-sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removePhoto}
                      className="text-critical hover:bg-critical-50 rounded-sm font-bold text-xs"
                      leftIcon={<X className="h-4 w-4" />}
                    >
                      Remover Imagem
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION 2: ARMAÇÃO */}
        {currentStep === 2 && (
          <Card className="border-neutral-200 shadow-xs animate-slide-in-bottom">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3 mb-1">
                <span className="h-6 w-6 rounded-full bg-brand-50 border border-brand-200 text-brand font-bold text-xs flex items-center justify-center font-mono">
                  2
                </span>
                <h3 className="text-sm font-bold text-neutral-850">Procedência da Armação</h3>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                  Procedência
                </span>
                <Controller
                  name="frameOrigin"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {FRAME_ORIGINS.map(opt => (
                        <Chip
                          key={opt}
                          label={opt}
                          isSelected={field.value === opt}
                          onClick={() => field.onChange(opt)}
                        />
                      ))}
                    </div>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <Select
                  label="Material"
                  error={errors.frameMaterial?.message}
                  {...register('frameMaterial')}
                >
                  {FRAME_MATERIALS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>

                <Input
                  label="Referência / Modelo"
                  placeholder="Ex: RB7047"
                  error={errors.frameReference?.message}
                  {...register('frameReference')}
                />

                <Input
                  label="Cor da Armação"
                  placeholder="Ex: Preto fosco"
                  error={errors.frameColor?.message}
                  {...register('frameColor')}
                />

                <Input
                  label="Marca"
                  placeholder="Ex: Ray-Ban"
                  error={errors.frameBrand?.message}
                  {...register('frameBrand')}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION 3: LENTES E TRATAMENTOS */}
        {currentStep === 3 && (
          <Card className="border-neutral-200 shadow-xs animate-slide-in-bottom">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3 mb-1">
                <span className="h-6 w-6 rounded-full bg-brand-50 border border-brand-200 text-brand font-bold text-xs flex items-center justify-center font-mono">
                  3
                </span>
                <h3 className="text-sm font-bold text-neutral-850">Lentes e Tratamentos</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Tipo de Lente"
                  error={errors.lensType?.message}
                  required
                  {...register('lensType')}
                >
                  {LENS_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>

                <Select
                  label="Material da Lente"
                  error={errors.lensMaterial?.message}
                  required
                  {...register('lensMaterial')}
                >
                  {LENS_MATERIALS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-2.5 mt-2">
                <span className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                  Tratamentos Aplicados
                </span>
                <div className="flex flex-wrap gap-2">
                  {TREATMENTS.map(treatment => (
                    <Chip
                      key={treatment}
                      label={treatment}
                      isSelected={selectedTreatments.includes(treatment)}
                      onClick={() => toggleTreatment(treatment)}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION 4: LABORATÓRIO E URGÊNCIA */}
        {currentStep === 4 && (
          <Card className="border-neutral-200 shadow-xs animate-slide-in-bottom">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3 mb-1">
                <span className="h-6 w-6 rounded-full bg-brand-50 border border-brand-200 text-brand font-bold text-xs flex items-center justify-center font-mono">
                  4
                </span>
                <h3 className="text-sm font-bold text-neutral-850">Laboratório e Urgência</h3>
              </div>

              {/* External Lab Toggle */}
              <div className="flex justify-between items-center p-3 rounded-lg border border-neutral-200 bg-neutral-50">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-neutral-800">Serviço Terceirizado (Lab Externo)?</span>
                  <span className="text-[10px] text-neutral-500">Marque se a montagem não for feita no Lab Central Katz</span>
                </div>
                <Controller
                  name="externalLab"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-5 w-5 rounded border-neutral-300 text-brand focus:ring-brand cursor-pointer"
                    />
                  )}
                />
              </div>

              {watchExternalLab && (
                <Select
                  label="Selecione o Laboratório"
                  error={errors.labName?.message}
                  required
                  {...register('labName')}
                >
                  <option value="">Selecione o laboratório parceiro...</option>
                  {LAB_PARTNERS.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </Select>
              )}

              {/* Urgency selection */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                  Grau de Urgência
                </span>
                <Controller
                  name="urgency"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {URGENCY_LEVELS.map(level => {
                        const isSelected = Number(field.value) === level.value;
                        const borderColors = {
                          0: 'hover:border-success border-neutral-200',
                          1: 'hover:border-warning border-neutral-200',
                          2: 'hover:border-critical border-neutral-200',
                        };
                        const selectedColors = {
                          0: 'border-success-300 bg-success-50/20 text-success-850',
                          1: 'border-warning-300 bg-warning-50/20 text-warning-850',
                          2: 'border-critical-300 bg-critical-50/20 text-critical-850',
                        };

                        return (
                          <div
                            key={level.value}
                            onClick={() => field.onChange(level.value)}
                            className={`flex items-center gap-3 p-3 rounded-lg border text-xs font-semibold select-none cursor-pointer transition-all duration-150 ${
                              isSelected ? selectedColors[level.value] : borderColors[level.value]
                            }`}
                          >
                            <span 
                              className="h-3 w-3 rounded-full shrink-0" 
                              style={{ 
                                backgroundColor: level.value === 0 ? '#0D9F6F' : level.value === 1 ? '#DC8C0A' : '#D92B4B'
                              }} 
                            />
                            <div className="flex flex-col">
                              <span className="font-bold">{level.label}</span>
                              <span className="text-[10px] opacity-70 mt-0.5">{level.description}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                />
              </div>

              {/* Urgency Reason conditional block */}
              {watchUrgency > 0 && (
                <div className="flex flex-col gap-3 p-4 border border-warning-100 rounded-lg bg-warning-50/10">
                  <span className="text-[10px] font-bold tracking-wider text-warning-800 uppercase">
                    Motivo da Urgência
                  </span>
                  
                  <Controller
                    name="urgencyReason"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {URGENCY_REASONS[watchUrgency as 1 | 2].map(reason => (
                          <label key={reason} className="flex items-center gap-2 text-xs text-neutral-600 font-semibold cursor-pointer py-1">
                            <input
                              type="radio"
                              value={reason}
                              checked={field.value === reason}
                              onChange={() => field.onChange(reason)}
                              className="h-4 w-4 border-neutral-300 text-warning focus:ring-warning"
                            />
                            <span>{reason}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  />
                  {errors.urgencyReason && (
                    <span className="text-xs text-critical font-medium">{errors.urgencyReason.message}</span>
                  )}

                  {/* Optional observation if Outros */}
                  {watchUrgencyReason === 'Outros' && (
                    <Input
                      label="Descreva o Outro Motivo"
                      placeholder="Descreva..."
                      error={errors.urgencyObservation?.message}
                      {...register('urgencyObservation')}
                    />
                  )}

                  {/* Justificativa extrema (required for Super Urgente level 2) */}
                  {watchUrgency === 2 && (
                    <div className="flex flex-col gap-1 mt-2">
                      <label className="text-[10px] font-bold tracking-wider text-critical-800 uppercase">
                        Justificativa para Prioridade Máxima (Super Urgência) <span className="text-critical">*</span>
                      </label>
                      <textarea
                        placeholder="Descreva o que ocasionou esta urgência extrema..."
                        rows={3}
                        className={`w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-critical disabled:opacity-50 transition-all duration-150 ${
                          errors.urgencyExtreme ? 'border-critical' : ''
                        }`}
                        {...register('urgencyExtreme')}
                      />
                      {errors.urgencyExtreme && (
                        <span className="text-xs text-critical font-medium">{errors.urgencyExtreme.message}</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                <Select
                  label="Tipo de Serviço"
                  error={errors.serviceType?.message}
                  required
                  {...register('serviceType')}
                >
                  {SERVICE_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>

                <Input
                  label="Prazo de Entrega Previsto"
                  type="date"
                  error={errors.deadline?.message}
                  required
                  {...register('deadline')}
                />

                <Input
                  label="Técnico Solicitado"
                  placeholder="Opcional"
                  error={errors.technician?.message}
                  {...register('technician')}
                />
              </div>

              <div className="w-full flex flex-col gap-1">
                <label className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                  Observações de Produção
                </label>
                <textarea
                  placeholder="Instruções especiais ou observações..."
                  rows={2}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50 transition-all duration-150"
                  {...register('observations')}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action bar submit */}
        <div className="flex justify-between items-center p-4 rounded-xl border border-neutral-200 bg-white shadow-xs w-full mb-12">
          <span className="text-xs text-neutral-500 font-semibold">
            {currentStep < 4 ? `Etapa ${currentStep} de 4` : 'Etapa final - revise os dados'}
          </span>
          <div className="flex gap-3">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={prevStep}
                className="font-bold border-neutral-300"
              >
                Voltar
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
                className="font-bold border-neutral-300"
              >
                Cancelar
              </Button>
            )}

            {currentStep < 4 ? (
              <Button
                type="button"
                variant="primary"
                onClick={validateAndNext}
                className="font-bold"
              >
                Avançar
              </Button>
            ) : (
              <Button
                type="submit"
                isLoading={createMutation.isPending}
                className="font-bold"
              >
                Enviar ao Laboratório
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
export default NewOSForm;
