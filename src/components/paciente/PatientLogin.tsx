import React, { useState } from 'react';
import { Patient } from '../../types/ppueri';
import { ShieldCheck, ArrowRight, User } from 'lucide-react';
import { PpueriAppIcon, PpueriBrand } from '../ui/PpueriLogo';

interface PatientLoginProps {
  patients: Patient[];
  onLoginSuccess: (patientId: string) => void;
}

export const PatientLogin: React.FC<PatientLoginProps> = ({ patients, onLoginSuccess }) => {
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCode = inputCode.trim().toUpperCase();
    const found = patients.find((p) => p.accessCode.toUpperCase() === cleanCode);

    if (found) {
      onLoginSuccess(found.id);
    } else {
      setErrorMsg('Código de acesso não localizado. Verifique os caracteres e tente novamente.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4 space-y-6">
      <div className="bg-white/85 backdrop-blur-md border border-sky-200/80 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-5">
        {/* Identidade Visual Ppueri: Ícone no quadradinho + Marca */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <PpueriAppIcon size="xl" variant="white" className="shadow-md ring-2 ring-sky-200/80" />
          <PpueriBrand size="lg" textColor="dark" iconVariant="white" className="justify-center" />
        </div>

        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Portal dos Pais & Responsáveis</h2>
          <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
            Digite o Código de Acesso do seu filho fornecido pelo pediatra para visualizar a evolução, curvas de crescimento e prescrições.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Código de Acesso do Prontuário:
            </label>
            <input
              type="text"
              placeholder="Ex: PPUERI-7821-GAB"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="w-full text-center font-mono font-extrabold tracking-widest text-base p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl focus:outline-none focus:border-sky-600 focus:bg-white text-slate-900 uppercase shadow-inner transition-all"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-medium">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md active:scale-98 text-xs"
          >
            <span>Acessar Prontuário Pediátrico</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-center gap-1.5 border-t border-sky-100">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-700" />
          <span>Conexão Segura e Criptografada em Conformidade com a LGPD</span>
        </div>
      </div>

      {/* Demo Patient Fast Login */}
      <div className="bg-white/70 backdrop-blur-sm border border-sky-200/70 rounded-2xl p-4 text-xs space-y-3 shadow-sm">
        <div className="font-bold text-slate-800 text-center">
          Atalhos de Demonstração Rápidos (Clique para Entrar):
        </div>
        <div className="space-y-2">
          {patients.slice(0, 3).map((p) => (
            <button
              key={p.id}
              onClick={() => onLoginSuccess(p.id)}
              className="w-full bg-white/90 hover:bg-sky-50/90 border border-sky-200/80 hover:border-sky-400 p-2.5 rounded-xl flex items-center justify-between transition-all shadow-sm group"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-800 font-bold text-xs shrink-0 border border-sky-200">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <User className="w-4 h-4 text-sky-700" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-sky-900">{p.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">Código: {p.accessCode}</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-sky-700 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
