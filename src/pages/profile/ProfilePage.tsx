import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Trash2, Store, Briefcase } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button, Avatar, Input, useToast } from '../../components/ui';
import { ROLE_LABELS } from '../../lib/constants';

export function ProfilePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const selectedStoreName = useAuthStore((s) => s.selectedStoreName);

  const [name, setName] = React.useState(user?.name || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [avatar, setAvatar] = React.useState<string | undefined>(user?.avatar);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync state if user changes
  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setAvatar(user.avatar);
    }
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check size limit (limit to 2MB for base64 localstorage safety)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve possuir no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
      toast.success('Preview da foto carregado.');
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAvatar = () => {
    setAvatar(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Foto removida. Usando iniciais como padrão.');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    updateUser({
      name: name.trim(),
      email: email.trim(),
      avatar: avatar,
    });

    toast.success('Perfil atualizado com sucesso!');
  };

  const activeStoreLabel = user?.role === 'laboratorio' ? 'Laboratório Katz' : selectedStoreName || 'Sem Filial';

  return (
    <div className="max-w-3xl mx-auto py-2">
      {/* Header back navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="h-9 px-3 bg-white"
        >
          Voltar
        </Button>
        <h2 className="text-base font-extrabold text-neutral-850 uppercase tracking-wider">
          Configurações da Conta
        </h2>
        <div className="w-16" /> {/* spacer balance */}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-250 shadow-xs overflow-hidden">
        {/* Decorative banner */}
        <div className="h-28 bg-brand-800 relative">
          <div className="absolute inset-0 bg-radial-gradient from-brand-700/40 to-transparent pointer-events-none" />
        </div>

        {/* Profile Card Form */}
        <form onSubmit={handleSave} className="p-6 md:p-8 pt-0 relative">
          
          {/* Avatar Area */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-8 pb-6 border-b border-neutral-100">
            <div className="relative group shrink-0">
              <Avatar
                name={name}
                src={avatar}
                size="lg"
                className="ring-4 ring-white shadow-md bg-brand-50 border-brand-200"
              />
              <button
                type="button"
                onClick={handleTriggerUpload}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:outline-none"
                aria-label="Alterar foto"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <h3 className="text-lg font-black text-neutral-850 truncate leading-none">
                {name || 'Seu Nome'}
              </h3>
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-neutral-400" />
                {user ? ROLE_LABELS[user.role] : ''}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleTriggerUpload}
                leftIcon={<Camera className="h-3.5 w-3.5" />}
                className="h-9 px-3 bg-white"
              >
                Escolher Foto
              </Button>
              {avatar && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  leftIcon={<Trash2 className="h-3.5 w-3.5 text-critical" />}
                  className="h-9 px-3 text-critical hover:bg-critical-50 rounded-lg"
                >
                  Remover
                </Button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Nome Completo"
              placeholder="Digite seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Endereço de E-mail"
              type="email"
              placeholder="colaborador@oticascarol.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="flex flex-col gap-1.5">
              <Input
                label="Função no Sistema"
                value={user ? ROLE_LABELS[user.role] : ''}
                disabled
              />
              <span className="text-[10px] text-neutral-450 font-medium">
                Sua função é definida pelo administrador e não pode ser editada.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <Input
                  label="Filial Vinculada"
                  value={activeStoreLabel}
                  disabled
                />
              </div>
              <span className="text-[10px] text-neutral-450 font-medium flex items-center gap-1">
                <Store className="h-3.5 w-3.5 text-neutral-400" />
                Filial logada no momento da sessão.
              </span>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-neutral-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              className="h-10 px-4"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="h-10 px-6 font-bold"
            >
              Salvar Alterações
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
export default ProfilePage;
