import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { PpueriAppIcon, PpueriBrand } from '../ui/PpueriLogo';

interface ResetPasswordScreenProps {
  onDone: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onDone }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas nao coincidem. Verifique e tente novamente.');
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError('Erro ao redefinir a senha. O link pode ter expirado. Solicite um novo link de recuperacao.');
        return;
      }
      setSuccess(true);
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full p-3 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 text-sm transition-all placeholder:text-slate-400';

  return (
    <div className="min-h-screen font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-slate-50 to-slate-100 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col items-center gap-3 mb-2">
          <PpueriAppIcon size="xl" variant="white" className="shadow-lg ring-2 ring-blue-200/80" />
          <PpueriBrand size="lg" textColor="dark" iconVariant="white" className="justify-center" />
        </div>

        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-[0_20px_60px_rgb(0,0,0,0.08)] rounded-2xl p-6">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="flex justify-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <CheckCircle strokeWidth={1.75} className="w-10 h-10 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-900">Senha Redefinida com Sucesso</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Sua senha foi atualizada. Acesse o sistema com a nova senha.
                </p>
              </div>
              <button
                onClick={onDone}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-extrabold py-3 rounded-xl transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 text-xs"
              >
                Ir para o Login
                <ArrowRight strokeWidth={1.75} className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-sm font-extrabold text-slate-900 mb-1">Redefinir Senha</p>
                <p className="text-xs text-slate-500 mb-4">
                  Crie uma nova senha segura para acessar o Ppueri.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Nova Senha</label>
                <div className="relative">
                  <Lock strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    placeholder="Minimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputCls} pl-9 pr-10`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPwd ? <EyeOff strokeWidth={1.75} className="w-4 h-4" /> : <Eye strokeWidth={1.75} className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Confirmar Nova Senha</label>
                <div className="relative">
                  <Lock strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    placeholder="Repita a nova senha"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={`${inputCls} pl-9`}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-60 text-white font-extrabold py-3 rounded-xl transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 active:scale-98 text-xs"
              >
                {loading ? (
                  <span className="animate-pulse">Salvando senha...</span>
                ) : (
                  <>
                    <span>Salvar Nova Senha</span>
                    <ArrowRight strokeWidth={1.75} className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
