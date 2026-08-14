import React, { useState } from 'react';
import { Role, Patient, Consultation, Appointment, VaccineRecord, PediatricNotification } from '../../types/ppueri';
import { Stethoscope, User, Key, Bell, Database } from 'lucide-react';
import { PpueriBrand } from './PpueriLogo';
import { InstallPwaBanner } from './InstallPwaBanner';
import { ClinicBackupModal } from './ClinicBackupModal';

interface HeaderProps {
  activeRole: Role;
  onRoleChange: (role: Role) => void;
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  onOpenNewPatientModal: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
  consultations?: Consultation[];
  appointments?: Appointment[];
  vaccinesMap?: Record<string, VaccineRecord[]>;
  notifications?: PediatricNotification[];
  onRestoreData?: (
    patients: Patient[],
    consultations: Consultation[],
    appointments: Appointment[],
    vaccinesMap: Record<string, VaccineRecord[]>,
    notifications: PediatricNotification[]
  ) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  onRoleChange,
  patients,
  selectedPatientId,
  unreadNotificationCount = 0,
  onOpenNotifications,
  consultations = [],
  appointments = [],
  vaccinesMap = {},
  notifications = [],
  onRestoreData,
}) => {
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md text-white border-b border-sky-900/60 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
          {/* Nova Identidade Visual: Símbolo em contêiner quadrado + Texto "Ppueri" logo ao lado */}
          <div className="flex items-center">
            <PpueriBrand size="md" textColor="white" iconVariant="white" />
          </div>

          {/* Role Switcher Pills */}
          <div className="bg-sky-950/80 backdrop-blur-md p-1 rounded-xl border border-sky-800/60 flex items-center gap-1 shadow-inner">
            <button
              onClick={() => onRoleChange('medico')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'medico'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-sky-200 hover:text-white hover:bg-sky-900/50'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Área Médica</span>
              <span className="sm:hidden">Médico</span>
            </button>
            <button
              onClick={() => onRoleChange('paciente')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'paciente'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-sky-200 hover:text-white hover:bg-sky-900/50'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Portal dos Pais</span>
              <span className="sm:hidden">Pais</span>
            </button>
          </div>

          {/* Right Actions: PWA Install Button, Backup Modal, Patient Key, Notifications */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* PWA Install Button */}
            <InstallPwaBanner variant="button" />

            {/* Backup & Persistence Manager Button (Doctor Only) */}
            {activeRole === 'medico' && onRestoreData && (
              <button
                onClick={() => setIsBackupModalOpen(true)}
                className="p-2 bg-sky-950 hover:bg-sky-900 text-sky-300 hover:text-white rounded-xl transition-all border border-sky-800/80 active:scale-95 flex items-center gap-1.5 text-xs font-bold"
                title="Backup e Persistência de Dados do Consultório"
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Backup</span>
              </button>
            )}

            {/* Patient Access Key indicator */}
            {activeRole === 'paciente' && selectedPatient && (
              <div className="hidden md:flex items-center gap-2 bg-sky-950/80 border border-sky-800/80 rounded-xl px-3 py-1 text-xs">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-sky-200">Código:</span>
                <span className="font-mono font-bold text-sky-300">{selectedPatient.accessCode}</span>
              </div>
            )}

            {/* Notification Center Trigger Button */}
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="p-2 bg-sky-950 hover:bg-sky-900 text-sky-300 hover:text-white rounded-xl transition-all border border-sky-800/80 relative active:scale-95"
                title="Central de Notificações"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-sky-500 text-slate-950 font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-slate-950 shadow-sm animate-pulse">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Backup & Data Persistence Modal */}
      {onRestoreData && (
        <ClinicBackupModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
          patients={patients}
          consultations={consultations}
          appointments={appointments}
          vaccinesMap={vaccinesMap}
          notifications={notifications}
          onRestoreData={onRestoreData}
        />
      )}
    </>
  );
};
