import React, { useState } from 'react';
import { AuthSession } from '../../types/ppueri';
import {
  loginDoctor,
  registerDoctor,
  DEMO_DOCTOR_EMAIL,
  DEMO_DOCTOR_PASSWORD,
} from '../../lib/auth';
import { supabase } from '../../lib/supabase/client';
import { PpueriAppIcon, PpueriBrand } from '../ui/PpueriLogo';
import { Stethoscope, Mail, Lock, User, CreditCard, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles, LogIn, CheckCircle } from 'lucide-react';

interface DoctorAuthScreenProps {
  onLoginSuccess: (session: AuthSession) => void;
  onBack?: () => void;
}

export const DoctorAuthScreen: React.FC<DoctorAuthScreenProps> = ({ onLoginSuccess, onBack }) => {
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
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const session = await loginDoctor(loginEmail.trim(), loginPassword);
      onLoginSuccess(session);
    } catch (e: unknown) {
      setLoginError(e instanceof Error ? e.message : 'Erro ao tentar fazer login. Tente novamente.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const session = await loginDoctor(DEMO_DOCTOR_EMAIL, DEMO_DOCTOR_PASSWORD);
      onLoginSuccess(session);
    } catch (e: unknown) {
      setLoginError(
        e instanceof Error
          ? e.message
          : 'Conta de demonstração não encontrada. Cadastre-se com o e-mail demo@ppueri.com.br para criá-la.',
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

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
      } else if ('needsConfirmation' in result) {
        // Conta criada, confirmação de e-mail necessária
        setRegSuccess(
          'Conta criada com sucesso! Verifique sua caixa de entrada e clique no link de confirmação para ativar o acesso.',
        );
      } else {
        // signUp retornou sessão — login automático imediato
        onLoginSuccess(result.session);
      }
    } catch (e: unknown) {
      setRegError(e instanceof Error ? e.message : 'Erro ao criar conta. Tente novamente.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotEmail.trim()) {
      setForgotError('Informe seu e-mail profissional.');
      return;
    }
    setForgotLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setForgotSuccess(true);
    } catch {
      setForgotError('Erro ao enviar o e-mail. Tente novamente.');
    } finally {
      setForgotLoading(false);
    }
  };

  const inputCls =
    'w-full p-3 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white text-slate-900 text-sm transition-all placeholder:text-slate-400';

  return (
    <div className="min-h-screen font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-slate-50 to-slate-100 flex flex-col items-center justify-center px-4 py-10">
      {onBack && (
        <div className="w-full max-w-md mb-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" strokeWidth={1.75} />
            Voltar ao início
          </button>
        </div>
      )}
      <div className="w-full max-w-md space-y-4">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <PpueriAppIcon size="xl" variant="white" className="shadow-lg ring-2 ring-blue-200/80" />
          <PpueriBrand size="lg" textColor="dark" iconVariant="white" className="justify-center" />
          <p className="text-xs text-slate-500 text-center max-w-xs">
            Prontuário Eletrônico Pediátrico & Puericultura — Sistema de Saúde Infantil
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-[0_20px_60px_rgb(0,0,0,0.08)] rounded-2xl overflow-hidden">
          {/* ── Forgot Password view ── */}
          {showForgot && (
            <div className="p-6">
              {forgotSuccess ? (
                <div className="text-center space-y-4 py-4">
                  <div className="flex justify-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <CheckCircle strokeWidth={1.75} className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">E-mail Enviado</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Se o e-mail estiver cadastrado, voce recebera as instrucoes para redefinir
                      sua senha. Verifique sua caixa de entrada.
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowForgot(false); setForgotSuccess(false); setForgotEmail(''); }}
                    className="w-full text-xs font-bold text-blue-700 hover:underline py-1"
                  >
                    Voltar ao login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900 mb-1">Recuperar Acesso</p>
                    <p className="text-xs text-slate-500 mb-4">
                      Informe o e-mail profissional da sua conta. Enviaremos um link para redefinir sua senha.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">E-mail Profissional</label>
                    <div className="relative">
                      <Mail strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="seu@email.com.br"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className={`${inputCls} pl-9`}
                        autoFocus
                      />
                    </div>
                  </div>
                  {forgotError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium">
                      {forgotError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-60 text-white font-extrabold py-3 rounded-xl transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 text-xs"
                  >
                    {forgotLoading ? (
                      <span className="animate-pulse">Enviando...</span>
                    ) : (
                      <>
                        <span>Enviar Link de Recuperacao</span>
                        <ArrowRight strokeWidth={1.75} className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForgot(false); setForgotError(null); }}
                    className="w-full text-xs font-semibold text-slate-500 hover:text-slate-700 py-1"
                  >
                    Voltar ao login
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ── Main Tabs (hidden while showForgot) ── */}
          {!showForgot && (
          <>
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => { setActiveTab('login'); setLoginError(null); setRegError(null); setRegSuccess(null); }}
              className={`flex-1 py-3.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-blue-700 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700 bg-slate-50/60'
              }`}
            >
              <LogIn strokeWidth={1.75} className="w-3.5 h-3.5" />
              Entrar na Conta
            </button>
            <button
              onClick={() => { setActiveTab('register'); setRegError(null); setRegSuccess(null); setLoginError(null); }}
              className={`flex-1 py-3.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-blue-700 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700 bg-slate-50/60'
              }`}
            >
              <Stethoscope strokeWidth={1.75} className="w-3.5 h-3.5" />
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
                    <Mail strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                    <Lock strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                      {showLoginPwd ? <EyeOff strokeWidth={1.75} className="w-4 h-4" /> : <Eye strokeWidth={1.75} className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium">
                    {loginError}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowForgot(true); setForgotEmail(loginEmail); setForgotError(null); setForgotSuccess(false); }}
                    className="text-[11px] text-blue-700 hover:underline font-medium"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-60 text-white font-extrabold py-3 rounded-xl transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 active:scale-98 text-xs"
                >
                  {loginLoading ? (
                    <span className="animate-pulse">Verificando credenciais...</span>
                  ) : (
                    <>
                      <span>Acessar Ppueri</span>
                      <ArrowRight strokeWidth={1.75} className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="relative flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] text-slate-400 font-medium">ou acesse com</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loginLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-slate-100 hover:to-blue-100 border border-blue-200 hover:border-blue-400 disabled:opacity-60 text-blue-800 font-bold py-2.5 rounded-xl transition-all text-xs"
                >
                  <Sparkles strokeWidth={1.75} className="w-3.5 h-3.5 text-blue-600" />
                  <span>Conta Demonstração (Dra. Beatriz)</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <p className="text-sm font-extrabold text-slate-900 mb-1">Cadastro Médico</p>
                  <p className="text-xs text-slate-500 mb-3">Crie sua conta profissional para gerenciar seus pacientes com segurança em nuvem.</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Nome Completo *</label>
                  <div className="relative">
                    <User strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                    <CreditCard strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                    <Mail strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                      <Lock strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
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
                        {showRegPwd ? <EyeOff strokeWidth={1.75} className="w-3.5 h-3.5" /> : <Eye strokeWidth={1.75} className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Confirmar Senha *</label>
                    <div className="relative">
                      <Lock strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
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

                {regSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-medium flex items-start gap-2">
                    <CheckCircle strokeWidth={1.75} className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
                    <span>{regSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-60 text-white font-extrabold py-3 rounded-xl transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 active:scale-98 text-xs mt-1"
                >
                  {regLoading ? (
                    <span className="animate-pulse">Criando conta...</span>
                  ) : (
                    <>
                      <Stethoscope strokeWidth={1.75} className="w-4 h-4" />
                      <span>Criar Conta e Acessar</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
          </>
          )}
        </div>

        {/* Footer notice */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck strokeWidth={1.75} className="w-3.5 h-3.5 text-blue-600" />
          <span>Dados protegidos em nuvem PostgreSQL. Conformidade com a LGPD.</span>
        </div>
      </div>
    </div>
  );
};
