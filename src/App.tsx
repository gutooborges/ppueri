import React, { useState, useEffect } from 'react';
import { Role, Patient, Consultation, VaccineRecord, PediatricNotification, NotificationPreferences, Appointment, AppointmentStatus, AuthSession } from './types/ppueri';
import { DEFAULT_NOTIFICATION_PREFERENCES } from './lib/notifications';
import {
  loadStoredPatients,
  saveStoredPatients,
  loadStoredConsultations,
  saveStoredConsultations,
  loadStoredAppointments,
  saveStoredAppointments,
  loadStoredVaccinesMap,
  saveStoredVaccinesMap,
  loadStoredNotifications,
  saveStoredNotifications,
} from './lib/storage-sync';
import {
  loadAuthSession,
  saveAuthSession,
  clearAuthSession,
  isSessionValid,
  initializeDemoAccount,
} from './lib/auth';
import { Header } from './components/ui/Header';
import { InstallPwaBanner } from './components/ui/InstallPwaBanner';
import { NotificationCenter } from './components/ui/NotificationCenter';
import { DoctorDashboard } from './components/medico/DoctorDashboard';
import { MedicalRecordForm } from './components/medico/MedicalRecordForm';
import { PatientClinicalView } from './components/medico/PatientClinicalView';
import { ConsultationForm } from './components/medico/ConsultationForm';
import { NewPatientModal } from './components/medico/NewPatientModal';
import { PatientLogin } from './components/paciente/PatientLogin';
import { PatientPortal } from './components/paciente/PatientPortal';
import { DoctorAuthScreen } from './components/auth/DoctorAuthScreen';
import { getAgeInMonths } from './lib/pediatric-rules';
import { getInitialVaccinesForPatient } from './lib/mock-data';

// ─── Auth Gate ──────────────────────────────────────────────────────────────

export default function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Initialize demo account and resolve session on first mount
  useEffect(() => {
    initializeDemoAccount().then(() => {
      const session = loadAuthSession();
      if (session && isSessionValid(session)) {
        setAuthSession(session);
      }
      setAuthReady(true);
    });
  }, []);

  if (!authReady) {
    // Brief loading splash while initializing crypto
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100/70 via-sky-50/90 to-cyan-100/60 flex items-center justify-center">
        <div className="text-sky-700 text-sm font-semibold animate-pulse">Carregando Ppueri...</div>
      </div>
    );
  }

  if (!authSession) {
    return (
      <DoctorAuthScreen
        onLoginSuccess={(session) => {
          saveAuthSession(session);
          setAuthSession(session);
        }}
      />
    );
  }

  return (
    <MainApp
      authSession={authSession}
      onLogout={() => {
        clearAuthSession();
        setAuthSession(null);
      }}
    />
  );
}

// ─── Main Application (authenticated) ──────────────────────────────────────

interface MainAppProps {
  authSession: AuthSession;
  onLogout: () => void;
}

function MainApp({ authSession, onLogout }: MainAppProps) {
  const doctorId = authSession.doctorId;
  const doctorName = authSession.doctorName;
  const doctorCrm = authSession.doctorCrm;

  const [activeRole, setActiveRole] = useState<Role>('medico');
  const [patients, setPatients] = useState<Patient[]>(() => loadStoredPatients(doctorId));
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    const loaded = loadStoredPatients(doctorId);
    return loaded.length > 0 ? loaded[0].id : '';
  });
  const [consultations, setConsultations] = useState<Consultation[]>(() => loadStoredConsultations(doctorId));
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadStoredAppointments(doctorId));
  const [searchQuery, setSearchQuery] = useState('');

  // Doctor View Mode
  const [doctorViewMode, setDoctorViewMode] = useState<'dashboard' | 'patient-view' | 'consultation'>('dashboard');
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  // Parent Portal: starts as null (must log in explicitly)
  const [parentLoggedInPatientId, setParentLoggedInPatientId] = useState<string | null>(null);

  // Vaccines map per patientId
  const [vaccinesMap, setVaccinesMap] = useState<Record<string, VaccineRecord[]>>(() =>
    loadStoredVaccinesMap(loadStoredPatients(doctorId))
  );

  // Notifications
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [notifications, setNotifications] = useState<PediatricNotification[]>(() => {
    const pts = loadStoredPatients(doctorId);
    const vmap = loadStoredVaccinesMap(pts);
    const cons = loadStoredConsultations(doctorId);
    return loadStoredNotifications(doctorId, pts, vmap, cons);
  });

  // Persist to localStorage on each change (scoped to current doctor)
  useEffect(() => { saveStoredPatients(doctorId, patients); }, [doctorId, patients]);
  useEffect(() => { saveStoredConsultations(doctorId, consultations); }, [doctorId, consultations]);
  useEffect(() => { saveStoredAppointments(doctorId, appointments); }, [doctorId, appointments]);
  useEffect(() => { saveStoredVaccinesMap(vaccinesMap); }, [vaccinesMap]);
  useEffect(() => { saveStoredNotifications(doctorId, notifications); }, [doctorId, notifications]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0] || ({} as Patient);
  const activeVaccines = vaccinesMap[selectedPatientId] || [];

  const unreadCount = notifications.filter(
    (n) => (!n.isRead && (n.targetRole === 'ambos' || n.targetRole === activeRole))
  ).length;

  // Notification handlers
  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleAddSimulatedNotification = (newNotif: PediatricNotification) => {
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleSelectNotificationAction = (_actionLink: string, patientId?: string) => {
    if (patientId) {
      setSelectedPatientId(patientId);
      if (activeRole === 'paciente') setParentLoggedInPatientId(patientId);
    }
  };

  // Appointment handlers
  const handleAddAppointment = (newApt: Appointment) => {
    setAppointments((prev) => [newApt, ...prev]);
    const notif: PediatricNotification = {
      id: `notif_apt_${newApt.id}`,
      patientId: newApt.patientId,
      patientName: newApt.patientName,
      title: `Consulta Agendada: ${new Date(newApt.date + 'T00:00:00').toLocaleDateString('pt-BR')} às ${newApt.time}`,
      message: `Consulta de ${newApt.type === 'rotina' ? 'puericultura' : newApt.type} confirmada com ${newApt.doctorName}.`,
      category: 'consulta',
      targetRole: 'ambos',
      priority: 'media',
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleUpdateAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status } : a))
    );
  };

  const handleRescheduleAppointment = (appointmentId: string, newDate: string, newTime: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, date: newDate, time: newTime } : a))
    );
    const targetApt = appointments.find((a) => a.id === appointmentId);
    if (targetApt) {
      const notif: PediatricNotification = {
        id: `notif_resched_${Date.now()}`,
        patientId: targetApt.patientId,
        patientName: targetApt.patientName,
        title: 'Consulta Reagendada',
        message: `Novo horário: ${new Date(newDate + 'T00:00:00').toLocaleDateString('pt-BR')} às ${newTime}.`,
        category: 'consulta',
        targetRole: 'ambos',
        priority: 'media',
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  };

  // Add new patient (always tagged with current doctorId)
  const handleAddPatient = (newPatient: Patient) => {
    setPatients((prev) => [newPatient, ...prev]);
    setSelectedPatientId(newPatient.id);
    setDoctorViewMode('patient-view');

    const ageMonths = getAgeInMonths(newPatient.birthDate);
    const newVaccs = getInitialVaccinesForPatient(newPatient.id, ageMonths);
    setVaccinesMap((prev) => ({ ...prev, [newPatient.id]: newVaccs }));

    const welcomeNotif: PediatricNotification = {
      id: `notif_welcome_${newPatient.id}`,
      patientId: newPatient.id,
      patientName: newPatient.name,
      title: `Paciente Cadastrado: ${newPatient.name}`,
      message: `Código de acesso gerado: ${newPatient.accessCode}. Prontuário pronto para atendimento.`,
      category: 'orientacao',
      targetRole: 'medico',
      priority: 'media',
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setNotifications((prev) => [welcomeNotif, ...prev]);
  };

  const handleUpdateVaccineStatus = (
    vaccineId: string,
    status: VaccineRecord['status'],
    date?: string,
    batch?: string
  ) => {
    setVaccinesMap((prev) => {
      const currentList = prev[selectedPatientId] || [];
      const updatedList = currentList.map((v) =>
        v.id === vaccineId
          ? {
              ...v,
              status,
              applicationDate: date || v.applicationDate || new Date().toISOString().split('T')[0],
              batchNumber: batch || v.batchNumber || 'LOTE-2026-PNI',
              clinicName: 'Clínica Ppueri Pediatria',
            }
          : v
      );
      return { ...prev, [selectedPatientId]: updatedList };
    });
  };

  const handleRegenerateAccessCode = (patientId: string) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const target = patients.find((p) => p.id === patientId);
    const suffix = target ? target.name.substring(0, 3).toUpperCase() : 'PPU';
    const newCode = `PPUERI-${randomNum}-${suffix}`;
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, accessCode: newCode, accessCodeCreatedAt: new Date().toISOString() } : p))
    );
  };

  const handleSaveConsultation = (newConsultation: Consultation) => {
    setConsultations((prev) => [newConsultation, ...prev]);
    setDoctorViewMode('patient-view');
    const targetPatient = patients.find((p) => p.id === newConsultation.patientId);
    const notif: PediatricNotification = {
      id: `notif_cons_new_${Date.now()}`,
      patientId: newConsultation.patientId,
      patientName: targetPatient?.name,
      title: 'Nova Consulta Registrada no Prontuário',
      message: `Atendimento concluído por ${newConsultation.doctorName}. Prescrições e recomendações disponíveis.`,
      category: 'orientacao',
      targetRole: 'paciente',
      priority: 'alta',
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleRestoreData = (
    newPatients: Patient[],
    newConsultations: Consultation[],
    newAppointments: Appointment[],
    newVaccinesMap: Record<string, VaccineRecord[]>,
    newNotifications: PediatricNotification[]
  ) => {
    setPatients(newPatients);
    if (newPatients.length > 0) setSelectedPatientId(newPatients[0].id);
    setConsultations(newConsultations);
    setAppointments(newAppointments);
    setVaccinesMap(newVaccinesMap);
    setNotifications(newNotifications);
  };

  return (
    <div className="min-h-screen font-sans text-slate-900 selection:bg-sky-500 selection:text-white pb-12 bg-gradient-to-br from-sky-100/70 via-sky-50/90 to-cyan-100/60 backdrop-blur-3xl">
      <Header
        activeRole={activeRole}
        onRoleChange={(role) => {
          setActiveRole(role);
          if (role === 'paciente') setParentLoggedInPatientId(null);
        }}
        doctorName={doctorName}
        doctorCrm={doctorCrm}
        onLogout={onLogout}
        patients={patients}
        selectedPatientId={selectedPatientId}
        onSelectPatient={(id) => {
          setSelectedPatientId(id);
          if (activeRole === 'paciente') setParentLoggedInPatientId(id);
        }}
        onOpenNewPatientModal={() => setIsNewPatientModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        unreadNotificationCount={unreadCount}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        consultations={consultations}
        appointments={appointments}
        vaccinesMap={vaccinesMap}
        notifications={notifications}
        onRestoreData={handleRestoreData}
        doctorId={doctorId}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <InstallPwaBanner variant="banner" />

        {activeRole === 'medico' ? (
          doctorViewMode === 'dashboard' ? (
            <DoctorDashboard
              patients={patients}
              consultations={consultations}
              appointments={appointments}
              selectedPatientId={selectedPatientId}
              onSelectPatient={(id) => setSelectedPatientId(id)}
              onViewPatient={(id) => {
                setSelectedPatientId(id);
                setDoctorViewMode('patient-view');
              }}
              onStartNewConsultation={(id) => {
                setSelectedPatientId(id);
                setDoctorViewMode('consultation');
              }}
              onOpenNewPatientModal={() => setIsNewPatientModalOpen(true)}
              onAddAppointment={handleAddAppointment}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              onRescheduleAppointment={handleRescheduleAppointment}
              doctorName={doctorName}
              doctorCrm={doctorCrm}
            />
          ) : doctorViewMode === 'patient-view' ? (
            <PatientClinicalView
              patient={selectedPatient}
              consultations={consultations}
              vaccines={activeVaccines}
              appointments={appointments}
              onStartNewConsultation={() => setDoctorViewMode('consultation')}
              onBack={() => setDoctorViewMode('dashboard')}
              onUpdateVaccineStatus={handleUpdateVaccineStatus}
              onRegenerateAccessCode={handleRegenerateAccessCode}
              doctorName={doctorName}
              doctorCrm={doctorCrm}
            />
          ) : (
            <ConsultationForm
              patient={selectedPatient}
              consultations={consultations}
              vaccines={activeVaccines}
              onSaveConsultation={handleSaveConsultation}
              onUpdateVaccineStatus={handleUpdateVaccineStatus}
              onBack={() => setDoctorViewMode('patient-view')}
              doctorId={doctorId}
              doctorName={doctorName}
              doctorCrm={doctorCrm}
            />
          )
        ) : (
          parentLoggedInPatientId ? (
            <PatientPortal
              patient={patients.find((p) => p.id === parentLoggedInPatientId) || selectedPatient}
              consultations={consultations}
              vaccines={vaccinesMap[parentLoggedInPatientId] || activeVaccines}
              appointments={appointments}
              onLogout={() => setParentLoggedInPatientId(null)}
            />
          ) : (
            <PatientLogin
              patients={patients}
              onLoginSuccess={(patientId) => {
                setParentLoggedInPatientId(patientId);
                setSelectedPatientId(patientId);
              }}
            />
          )
        )}
      </main>

      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onAddPatient={handleAddPatient}
        doctorId={doctorId}
      />

      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        activeRole={activeRole}
        onMarkAsRead={handleMarkNotificationAsRead}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onAddSimulatedNotification={handleAddSimulatedNotification}
        preferences={notificationPreferences}
        onUpdatePreferences={setNotificationPreferences}
        onSelectNotificationAction={handleSelectNotificationAction}
      />
    </div>
  );
}
