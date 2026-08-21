import React, { useState, useRef } from 'react';
import { Download, Upload, Database, AlertTriangle, CheckCircle, X, FileJson, Shield } from 'lucide-react';
import { Patient, Consultation, Appointment, VaccineRecord, PediatricNotification } from '../../types/ppueri';
import { exportClinicBackup, importClinicBackup } from '../../lib/storage-sync';

interface ClinicBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  consultations: Consultation[];
  appointments: Appointment[];
  vaccinesMap: Record<string, VaccineRecord[]>;
  notifications: PediatricNotification[];
  onRestoreData: (
    patients: Patient[],
    consultations: Consultation[],
    appointments: Appointment[],
    vaccinesMap: Record<string, VaccineRecord[]>,
    notifications: PediatricNotification[]
  ) => void;
  doctorId: string;
}

export const ClinicBackupModal: React.FC<ClinicBackupModalProps> = ({
  isOpen,
  onClose,
  patients,
  consultations,
  appointments,
  vaccinesMap,
  notifications,
  onRestoreData,
  doctorId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      exportClinicBackup(doctorId, patients, consultations, appointments, vaccinesMap, notifications);
      setStatusMessage({ text: 'Backup exportado com sucesso! Arquivo JSON salvo no seu dispositivo.', type: 'success' });
    } catch (err) {
      setStatusMessage({ text: 'Falha ao exportar backup clínico.', type: 'error' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const restored = await importClinicBackup(content, doctorId);
        if (restored) {
          onRestoreData(
            restored.patients,
            restored.consultations || [],
            restored.appointments || [],
            restored.vaccinesMap || {},
            restored.notifications || []
          );
          setStatusMessage({
            text: `Backup restaurado com sucesso! ${restored.patients.length} pacientes carregados no Supabase.`,
            type: 'success',
          });
        } else {
          setStatusMessage({ text: 'Arquivo inválido. Certifique-se de usar um arquivo JSON exportado pelo Ppueri.', type: 'error' });
        }
      } catch (err) {
        setStatusMessage({ text: 'Erro ao processar o arquivo de backup.', type: 'error' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-sky-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-100 text-sky-800 rounded-xl">
              <Database className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Persistência & Backup dos Prontuários</h2>
              <p className="text-xs text-slate-500">Gerenciamento de dados clínicos locais e exportação segura</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-sky-50 border border-sky-300 text-sky-950'
                : 'bg-amber-50 border border-amber-300 text-amber-950'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-sky-700 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Current Data Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-sky-50/80 border border-sky-200/80 rounded-xl p-3 text-center">
            <span className="text-[11px] text-sky-800 font-bold block">Pacientes</span>
            <span className="text-lg font-extrabold text-sky-950">{patients.length}</span>
          </div>
          <div className="bg-sky-50/80 border border-sky-200/80 rounded-xl p-3 text-center">
            <span className="text-[11px] text-sky-800 font-bold block">Consultas</span>
            <span className="text-lg font-extrabold text-sky-950">{consultations.length}</span>
          </div>
          <div className="bg-sky-50/80 border border-sky-200/80 rounded-xl p-3 text-center">
            <span className="text-[11px] text-sky-800 font-bold block">Agendamentos</span>
            <span className="text-lg font-extrabold text-sky-950">{appointments.length}</span>
          </div>
        </div>

        {/* Backup Actions */}
        <div className="space-y-2.5">
          {/* Export JSON */}
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between p-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-sm font-bold text-xs group"
          >
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div>Exportar Backup Completo (JSON)</div>
                <div className="text-[10px] text-sky-300 font-normal">Baixa arquivo com todos os prontuários, vacinas e anamneses</div>
              </div>
            </div>
            <FileJson className="w-4 h-4 text-sky-400" />
          </button>

          {/* Import JSON */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between p-3.5 bg-sky-50 hover:bg-sky-100/80 border border-sky-200 text-sky-950 rounded-xl transition-all font-bold text-xs group"
          >
            <div className="flex items-center gap-2.5">
              <Upload className="w-4 h-4 text-sky-700 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div>Restaurar / Importar Backup</div>
                <div className="text-[10px] text-sky-700 font-normal">Carrega base de dados a partir de arquivo JSON exportado</div>
              </div>
            </div>
            <FileJson className="w-4 h-4 text-sky-700" />
          </button>
        </div>

        {/* LGPD & Cloud Security Notice */}
        <div className="p-3 bg-sky-50/60 border border-sky-200 rounded-xl text-[11px] text-sky-900 space-y-1">
          <div className="font-extrabold flex items-center gap-1.5 text-sky-950">
            <Shield className="w-3.5 h-3.5 text-sky-700" />
            <span>Dados Protegidos em Nuvem PostgreSQL (Supabase)</span>
          </div>
          <p className="text-sky-800 leading-relaxed">
            Todos os prontuários são persistidos em nuvem com RLS (Row Level Security) por médico. O backup JSON permite migração entre contas ou cópia de segurança local.
          </p>
        </div>

        <div className="pt-2 border-t border-sky-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
