import React, { useState } from 'react';
import { Role, Patient, Consultation, Appointment, VaccineRecord, PediatricNotification } from '../../types/ppueri';
import { Stethoscope, User, Bell, Database, LogOut, ChevronDown } from 'lucide-react';
import { PpueriBrand } from './PpueriLogo';
import { InstallPwaBanner } from './InstallPwaBanner';
import { ClinicBackupModal } from './ClinicBackupModal';

interface HeaderProps {
  activeRole: Role;
  onRoleChange: (role: Role) => void;
  doctorName: string;
  doctorCrm: string;
  onLogout: () => void;
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
  doctorId: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  onRoleChange,
  doctorName,
  doctorCrm,
  onLogout,
  patients,
  selectedPatientId,
  unreadNotificationCount = 0,
  onOpenNotifications,
  consultations = [],
  appointments = [],
  vaccinesMap = {},
  notifications = [],
  onRestoreData,
  doctorId,
}) => {
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [showDoctorMenu, setShowDoctorMenu] = useState(false);

  // Short display name (first word after "Dr(a)." or just first name)
  const shortName = doctorName.replace(/^Dr[a]?\.\s*/i, '').split(' ')[0];

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md text-white border-b border-sky-900/60 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
          {/* Brand */}
          <div className="flex items-center">
            <PpueriBrand size="md" textColor="white" iconVariant="white" />
          </div>

          {/* Role Switcher */}
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

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <InstallPwaBanner variant="button" />

            {activeRole === 'medico' && onRestoreData && (
              <button
                onClick={() => setIsBackupModalOpen(true)}
                className="p-2 bg-sky-950 hover:bg-sky-900 text-sky-300 hover:text-white rounded-xl transition-all border border-sky-800/80 active:scale-95 flex items-center gap-1.5 text-xs font-bold"
                title="Backup e Persistência de Dados"
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Backup</span>
              </button>
            )}

            {/* Notifications */}
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

            {/* Doctor Account Menu */}
            <div className="relative">
              <button
                onClick={() => setShowDoctorMenu((v) => !v)}
                className="flex items-center gap-1.5 bg-sky-950 hover:bg-sky-900 border border-sky-800/80 rounded-xl px-2.5 py-1.5 transition-all active:scale-95"
                title={`${doctorName} — ${doctorCrm}`}
              >
                <div className="w-6 h-6 rounded-lg bg-sky-600 flex items-center justify-center text-white font-extrabold text-[10px] shrink-0">
                  {shortName.charAt(0)}
                </div>
                <span className="hidden md:block text-xs font-semibold text-sky-100 max-w-[100px] truncate">
                  {shortName}
                </span>
                <ChevronDown className="w-3 h-3 text-sky-400" />
              </button>

              {showDoctorMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDoctorMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-50 bg-slate-900 border border-sky-800/60 rounded-xl shadow-2xl min-w-[220px] overflow-hidden">
                    <div className="p-3 border-b border-sky-900/60">
                      <p className="text-xs font-extrabold text-white truncate">{doctorName}</p>
                      <p className="text-[11px] text-sky-300 truncate mt-0.5">{doctorCrm}</p>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={() => { setShowDoctorMenu(false); onLogout(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sair da Conta
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

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
          doctorId={doctorId}
        />
      )}
    </>
  );
};
