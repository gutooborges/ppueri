import React, { useState } from 'react';
import { ParentSession } from '../../types/ppueri';
import { loginParent, registerParent } from '../../lib/auth';
import { ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
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

  const switchTab = (t: AuthTab) => {
    setTab(t);
    setErrorMsg(null);
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
    'w-full text-sm p-3 bg-sky-50/70 border border-sky-200 rounded-xl focus:outline-none focus:border-sky-600 focus:bg-white transition-all text-slate-900 placeholder-slate-400';

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <div className="bg-white/85 backdrop-blur-md border border-sky-200/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <PpueriAppIcon size="xl" variant="white" className="shadow-md ring-2 ring-sky-200/80" />
          <PpueriBrand size="lg" textColor="dark" iconVariant="white" className="justify-center" />
        </div>

        <div className="text-center">
          <h2 className="text-lg font-extrabold text-slate-900">Portal dos Pais e Responsáveis</h2>
          <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
            Acompanhe o desenvolvimento, curvas de crescimento, vacinas e prescrições do seu filho.
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-sky-50 border border-sky-200 rounded-xl p-1">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-white text-sky-800 shadow-sm border border-sky-200'
                : 'text-slate-600 hover:text-sky-700'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => switchTab('register')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'register'
                ? 'bg-white text-sky-800 shadow-sm border border-sky-200'
                : 'text-slate-600 hover:text-sky-700'
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-700 transition-colors"
                  tabIndex={-1}
                >
                  {showLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 disabled:opacity-60 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md text-xs"
            >
              {isLoading ? 'Verificando...' : 'Acessar Portal'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>

            <p className="text-center text-[11px] text-slate-500">
              Ainda sem conta?{' '}
              <button
                type="button"
                onClick={() => switchTab('register')}
                className="font-bold text-sky-700 hover:underline"
              >
                Criar conta gratuita
              </button>
            </p>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-700 transition-colors"
                  tabIndex={-1}
                >
                  {showRegPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 disabled:opacity-60 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md text-xs"
            >
              {isLoading ? 'Criando conta...' : 'Criar Conta e Acessar Portal'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>

            <p className="text-center text-[11px] text-slate-500">
              Já tem conta?{' '}
              <button
                type="button"
                onClick={() => switchTab('login')}
                className="font-bold text-sky-700 hover:underline"
              >
                Entrar
              </button>
            </p>
          </form>
        )}

        <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-center gap-1.5 border-t border-sky-100">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-700" />
          <span>Dados protegidos em nuvem criptografada. Conformidade com a LGPD.</span>
        </div>
      </div>
    </div>
  );
};
