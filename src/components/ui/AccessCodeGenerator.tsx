import React, { useState } from 'react';
import { Patient } from '../../types/ppueri';
import { Key, Copy, Check, QrCode, Shield, RefreshCw } from 'lucide-react';

interface AccessCodeGeneratorProps {
  patient: Patient;
  onRegenerateCode: (patientId: string) => void;
}

export const AccessCodeGenerator: React.FC<AccessCodeGeneratorProps> = ({ patient, onRegenerateCode }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(patient.accessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/85 backdrop-blur-xl text-white rounded-2xl p-5 shadow-xl border border-slate-700/60 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
            <Key strokeWidth={1.75} className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Código de Acesso do Paciente</h3>
            <p className="text-xs text-slate-400">Token único para o Portal dos Pais / Responsáveis</p>
          </div>
        </div>

        <button
          onClick={() => onRegenerateCode(patient.id)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
          title="Gerar Novo Código"
        >
          <RefreshCw strokeWidth={1.75} className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Token do Prontuário</span>
          <div className="text-2xl font-mono font-extrabold tracking-widest text-blue-400">
            {patient.accessCode}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-center sm:justify-start gap-1">
            <Shield strokeWidth={1.75} className="w-3 h-3 text-blue-400" />
            <span>Vínculo ativo com {patient.name}</span>
          </div>
        </div>

        {/* Action Button & QR Simulation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
          >
            {copied ? (
              <>
                <Check strokeWidth={1.75} className="w-4 h-4 text-emerald-300" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy strokeWidth={1.75} className="w-4 h-4" />
                <span>Copiar Código</span>
              </>
            )}
          </button>

          <div className="p-2 bg-white rounded-xl shadow-sm hidden sm:block" title="QR Code de Acesso Rápido">
            <QrCode strokeWidth={1.75} className="w-8 h-8 text-slate-900" />
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Forneça este código aos pais ou responsáveis legais. Ao acessar o portal <strong>Ppueri</strong> com esta chave, eles terão acesso seguro ao histórico de consultas, receita digital, gráfico de crescimento e carteira vacinal.
      </p>
    </div>
  );
};
