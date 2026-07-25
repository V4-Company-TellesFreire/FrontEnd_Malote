import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useLogin } from '../../features/auth/hooks';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

const loginSchema = z.object({
  email: z.string().email('E-mail informado é inválido'),
  password: z.string().min(4, 'A senha deve possuir pelo menos 4 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: (res) => {
        toast.success(`Bem-vindo, ${res.user.name}!`);
        // Navigate based on user role
        if (res.user.role === 'laboratorio') {
          navigate('/lab');
        } else if (res.user.role === 'motoboy') {
          navigate('/delivery-panel');
        } else if (res.user.role === 'gerente' || res.user.role === 'admin' || res.user.role === 'vendedor') {
          navigate('/store/dashboard');
        } else {
          navigate('/selecionar-loja');
        }
      },
      onError: (err: any) => {
        toast.error(err.message || 'Falha ao autenticar credenciais.');
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
      {/* Background Graphic Accents */}
      <div className="absolute inset-0 bg-radial-gradient from-brand-50/50 to-transparent pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-xl border border-neutral-200 shadow-xl p-8 z-10 flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/logo-malote-lab.svg" alt="Malote Lab Logo" className="h-10 w-auto select-none" />
          <h2 className="text-xs font-bold tracking-wider text-brand-900 mt-2 uppercase">
            Módulo Operacional
          </h2>
          <p className="text-[10px] text-neutral-450 uppercase tracking-widest font-semibold max-w-xs">
            Rastreamento de Malotes
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="E-mail de acesso"
            type="email"
            placeholder="colaborador@carol.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Senha ou PIN"
            type="password"
            placeholder="Digite sua senha de acesso"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button
            type="submit"
            className="w-full mt-2 font-bold justify-center"
            isLoading={loginMutation.isPending}
          >
            Entrar no Sistema
          </Button>
        </form>

        {/* Access info helper card */}
        <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex gap-2.5 items-start">
          <ShieldAlert className="h-4.5 w-4.5 text-brand shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <h5 className="text-[10px] font-bold text-brand uppercase tracking-wider">
              Acesso Demonstrativo
            </h5>
            <p className="text-[9px] text-neutral-500 leading-relaxed">
              Use <strong className="text-neutral-700">vendedor@carol.com</strong> (senha: Vendedor@Carol1037),{' '}
              <strong className="text-neutral-700">gerente@carol.com</strong> (senha: Gerente@Carol1234),{' '}
              <strong className="text-neutral-700">lab@katz.com</strong> (senha: Lab@Katz4321), ou{' '}
              <strong className="text-neutral-700">motoboy@carol.com</strong> (senha: Motoboy@Carol4321) para testar os perfis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default LoginPage;
