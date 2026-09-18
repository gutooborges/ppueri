import React, { useState } from 'react';
import { ParentSession } from '../../types/ppueri';
import { loginParent, registerParent } from '../../lib/auth';
import { parentSupabase } from '../../lib/supabase/client';
import { ShieldCheck, ArrowRight, Eye, EyeOff, CheckCircle, Mail } from 'lucide-react';
import { PpueriAppIcon, PpueriBrand } from '../ui/PpueriLogo';

interface PatientLoginProps {
  onLoginSuccess: (session: ParentSession) => void;
}

type AuthTab = 'login' | 'register';

export const PatientLogin: React.FC<PatientLoginProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<AuthTab>('login');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPwd, setRegConfirmPwd] = useState('');
  const [regCode, setRegCode] = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const switchTab = (t: AuthTab) => {
    setTab(t);
    setErrorMsg(null);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotEmail.trim()) {
      setForgotError('Informe seu e-mail cadastrado.');
      return;
    }
    setForgotLoading(true);
    try {
      await parentSupabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setForgotSuccess(true);
    } catch {
      setForgotError('Erro ao enviar o e-mail. Tente novamente.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg('Preencha o e-mail e a senha.');
      return;
    }
    setIsLoading(true);
    try {
      const session = await loginParent(loginEmail.trim(), loginPassword);
      if (!session) {
        setErrorMsg('E-mail ou senha incorretos. Verifique os dados e tente novamente.');
        return;
      }
      onLoginSuccess(session);
    } catch {
      setErrorMsg('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!regName.trim() || !regEmail.trim() || !regPassword || !regCode.trim()) {
      setErrorMsg('Preencha todos os campos obrigatórios.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (regPassword !== regConfirmPwd) {
      setErrorMsg('As senhas não coincidem. Verifique e tente novamente.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerParent(
        regName.trim(),
        regEmail.trim(),
        regPassword,
        regCode.trim().toUpperCase()
      );
      if ('error' in result) {
        setErrorMsg(result.error);
        return;
      }
      onLoginSuccess(result.session);
    } catch {
      setErrorMsg('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full text-sm p-3 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition-all text-slate-900 placeholder-slate-400';

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-[0_20px_60px_rgb(0,0,0,0.08)] rounded-2xl p-6 sm:p-8 space-y-5">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <PpueriAppIcon size="xl" variant="white" className="shadow-md ring-2 ring-blue-200/80" />
          <PpueriBrand size="lg" textColor="dark" iconVariant="white" className="justify-center" />
        </div>

        <div className="text-center">
          <h2 className="text-lg font-extrabold text-slate-900">Portal dos Pais e Responsáveis</h2>
          <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
            Acompanhe o desenvolvimento, curvas de crescimento, vacinas e prescrições do seu filho.
          </p>
        </div>

        {/* ── Forgot Password view ── */}
        {showForgot && (
          <div className="space-y-4">
            {forgotSuccess ? (
              <div className="text-center space-y-4 py-2">
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
                  <p className="text-xs text-slate-500 mb-2">
                    Informe o e-mail da sua conta de responsavel. Enviaremos um link para redefinir sua senha.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
                  <div className="relative">
                    <Mail strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="seu@email.com.br"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className={`${inputClass} pl-9`}
                      autoFocus
                    />
                  </div>
                </div>
                {forgotError && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-medium">
                    {forgotError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-60 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 text-xs"
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar Link de Recuperacao'}
                  {!forgotLoading && <ArrowRight strokeWidth={1.75} className="w-4 h-4" />}
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

        {/* Tabs */}
        {!showForgot && (<>
        <div className="grid grid-cols-2 gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-white text-blue-800 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-blue-700'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => switchTab('register')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'register'
                ? 'bg-white text-blue-800 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-blue-700'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* ── Login Form ── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com.br"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Senha</label>
              <div className="relative">
                <input
                  type={showLoginPwd ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-700 transition-colors"
                  tabIndex={-1}
                >
                  {showLoginPwd ? <EyeOff strokeWidth={1.75} className="w-4 h-4" /> : <Eye strokeWidth={1.75} className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-60 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 text-xs"
            >
              {isLoading ? 'Verificando...' : 'Acessar Portal'}
              {!isLoading && <ArrowRight strokeWidth={1.75} className="w-4 h-4" />}
            </button>

            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-500">
                Ainda sem conta?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('register')}
                  className="font-bold text-blue-700 hover:underline"
                >
                  Criar conta
                </button>
              </p>
              <button
                type="button"
                onClick={() => { setShowForgot(true); setForgotEmail(loginEmail); setForgotError(null); setForgotSuccess(false); }}
                className="text-[11px] text-blue-700 hover:underline font-medium"
              >
                Esqueceu sua senha?
              </button>
            </div>
          </form>
        )}

        {/* ── Register Form ── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo do Responsável</label>
              <input
                type="text"
                placeholder="Nome do pai ou responsável"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className={inputClass}
                autoComplete="name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com.br"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Senha (mínimo 6 caracteres)</label>
              <div className="relative">
                <input
                  type={showRegPwd ? 'text' : 'password'}
                  placeholder="Crie uma senha segura"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-700 transition-colors"
                  tabIndex={-1}
                >
                  {showRegPwd ? <EyeOff strokeWidth={1.75} className="w-4 h-4" /> : <Eye strokeWidth={1.75} className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar Senha</label>
              <input
                type="password"
                placeholder="Repita a senha"
                value={regConfirmPwd}
                onChange={(e) => setRegConfirmPwd(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Código de Acesso do Prontuário
              </label>
              <input
                type="text"
                placeholder="Ex: PPUERI-7821-GAB"
                value={regCode}
                onChange={(e) => setRegCode(e.target.value)}
                className={`${inputClass} text-center font-mono font-extrabold tracking-widest uppercase`}
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Fornecido pelo pediatra do seu filho no momento do cadastro.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-60 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 text-xs"
            >
              {isLoading ? 'Criando conta...' : 'Criar Conta e Acessar Portal'}
              {!isLoading && <ArrowRight strokeWidth={1.75} className="w-4 h-4" />}
            </button>

            <p className="text-center text-[11px] text-slate-500">
              Já tem conta?{' '}
              <button
                type="button"
                onClick={() => switchTab('login')}
                className="font-bold text-blue-700 hover:underline"
              >
                Entrar
              </button>
            </p>
          </form>
        )}

        </>)}

        <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-center gap-1.5 border-t border-slate-200">
          <ShieldCheck strokeWidth={1.75} className="w-3.5 h-3.5 text-blue-700" />
          <span>Dados protegidos em nuvem criptografada. Conformidade com a LGPD.</span>
        </div>
      </div>
    </div>
  );
};
