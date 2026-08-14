import React, { useState } from 'react';
import { AuthSession } from '../../types/ppueri';
import {
  loginDoctor,
  registerDoctor,
  saveAuthSession,
  DEMO_DOCTOR_EMAIL,
  DEMO_DOCTOR_PASSWORD,
} from '../../lib/auth';
import { PpueriAppIcon, PpueriBrand } from '../ui/PpueriLogo';
import { Stethoscope, Mail, Lock, User, CreditCard, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles, LogIn } from 'lucide-react';

interface DoctorAuthScreenProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const DoctorAuthScreen: React.FC<DoctorAuthScreenProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCrm, setRegCrm] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const session = await loginDoctor(loginEmail.trim(), loginPassword);
      if (session) {
        saveAuthSession(session);
        onLoginSuccess(session);
      } else {
        setLoginError('E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.');
      }
    } catch {
      setLoginError('Erro ao tentar fazer login. Tente novamente.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const session = await loginDoctor(DEMO_DOCTOR_EMAIL, DEMO_DOCTOR_PASSWORD);
      if (session) {
        saveAuthSession(session);
        onLoginSuccess(session);
      } else {
        setLoginError('Conta de demonstração não encontrada. Recarregue a página.');
      }
    } catch {
      setLoginError('Erro ao acessar conta demo.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim() || !regEmail.trim() || !regCrm.trim() || !regPassword) {
      setRegError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError('As senhas não coincidem. Verifique e tente novamente.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setRegLoading(true);
    try {
      const result = await registerDoctor(regName, regEmail, regCrm, regPassword);
      if ('error' in result) {
        setRegError(result.error);
      } else {
        // Auto-login after successful registration
        const session = await loginDoctor(regEmail, regPassword);
        if (session) {
          saveAuthSession(session);
          onLoginSuccess(session);
        }
      }
    } catch {
      setRegError('Erro ao criar conta. Tente novamente.');
    } finally {
      setRegLoading(false);
    }
  };

  const inputCls =
    'w-full p-3 bg-sky-50/70 border border-sky-200 rounded-xl focus:outline-none focus:border-sky-600 focus:bg-white text-slate-900 text-sm transition-all placeholder:text-slate-400';

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-sky-100/70 via-sky-50/90 to-cyan-100/60 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <PpueriAppIcon size="xl" variant="white" className="shadow-lg ring-2 ring-sky-200/80" />
          <PpueriBrand size="lg" textColor="dark" iconVariant="white" className="justify-center" />
          <p className="text-xs text-slate-500 text-center max-w-xs">
            Prontuário Eletrônico Pediátrico & Puericultura — Sistema de Saúde Infantil
          </p>
        </div>

        <div className="bg-white/85 backdrop-blur-md border border-sky-200/80 rounded-2xl shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-sky-100">
            <button
              onClick={() => { setActiveTab('login'); setLoginError(null); }}
              className={`flex-1 py-3.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-sky-700 border-b-2 border-sky-600'
                  : 'text-slate-500 hover:text-slate-700 bg-sky-50/60'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Entrar na Conta
            </button>
            <button
              onClick={() => { setActiveTab('register'); setRegError(null); }}
              className={`flex-1 py-3.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-sky-700 border-b-2 border-sky-600'
                  : 'text-slate-500 hover:text-slate-700 bg-sky-50/60'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              Criar Conta Médica
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <p className="text-sm font-extrabold text-slate-900 mb-1">Acesso do Médico</p>
                  <p className="text-xs text-slate-500 mb-4">Entre com suas credenciais profissionais para acessar o sistema.</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">E-mail Profissional</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="seu@email.com.br"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showLoginPwd ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className={`${inputCls} pl-9 pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 disabled:opacity-60 text-white font-extrabold py-3 rounded-xl transition-all shadow-md active:scale-98 text-xs"
                >
                  {loginLoading ? (
                    <span className="animate-pulse">Verificando credenciais...</span>
                  ) : (
                    <>
                      <span>Acessar Ppueri</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="relative flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-sky-100" />
                  <span className="text-[10px] text-slate-400 font-medium">ou acesse com</span>
                  <div className="flex-1 h-px bg-sky-100" />
                </div>

                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loginLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-50 to-sky-50 hover:from-cyan-100 hover:to-sky-100 border border-sky-200 hover:border-sky-400 disabled:opacity-60 text-sky-800 font-bold py-2.5 rounded-xl transition-all text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>Conta Demonstração (Dra. Beatriz)</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <p className="text-sm font-extrabold text-slate-900 mb-1">Cadastro Médico</p>
                  <p className="text-xs text-slate-500 mb-3">Crie sua conta profissional para gerenciar seus pacientes com privacidade total.</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Nome Completo *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Dr(a). Nome Sobrenome"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">CRM (com UF) *</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: CRM/SP 123456 - Pediatria"
                      value={regCrm}
                      onChange={(e) => setRegCrm(e.target.value)}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">E-mail Profissional *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="seu@email.com.br"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Senha *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type={showRegPwd ? 'text' : 'password'}
                        required
                        placeholder="Mín. 6 caracteres"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className={`${inputCls} pl-8 pr-9 text-xs`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPwd((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showRegPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Confirmar Senha *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type={showRegPwd ? 'text' : 'password'}
                        required
                        placeholder="Repita a senha"
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                        className={`${inputCls} pl-8 text-xs`}
                      />
                    </div>
                  </div>
                </div>

                {regError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium">
                    {regError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 disabled:opacity-60 text-white font-extrabold py-3 rounded-xl transition-all shadow-md active:scale-98 text-xs mt-1"
                >
                  {regLoading ? (
                    <span className="animate-pulse">Criando conta...</span>
                  ) : (
                    <>
                      <Stethoscope className="w-4 h-4" />
                      <span>Criar Conta e Acessar</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer LGPD notice */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          <span>Dados armazenados localmente. Conformidade com a LGPD.</span>
        </div>
      </div>
    </div>
  );
};
