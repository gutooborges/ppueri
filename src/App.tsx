import React, { useState, useEffect, useCallback } from 'react';
import {
  Role, Patient, Consultation, VaccineRecord, PediatricNotification,
  NotificationPreferences, Appointment, AppointmentStatus, AuthSession, ParentSession,
  ConsultationAmendment,
} from './types/ppueri';
import { DEFAULT_NOTIFICATION_PREFERENCES } from './lib/notifications';
import {
  loadStoredPatients,
  loadStoredConsultations,
  loadStoredAppointments,
  loadStoredVaccinesMap,
  loadStoredNotifications,
  saveStoredNotifications,
  insertPatient,
  insertConsultation,
  insertAppointment,
  updateAppointmentStatus as dbUpdateAppointmentStatus,
  rescheduleAppointment as dbRescheduleAppointment,
  updatePatientAccessCode,
  updateVaccineRecord,
  insertInitialVaccines,
  exportClinicBackup,
  importClinicBackup,
  updateConsultationExams,
  deleteExamFile,
  finalizeConsultation,
  loadConsultationAmendments,
  insertConsultationAmendment,
} from './lib/storage-sync';
import {
  loadAuthSession,
  clearAuthSession,
  loadParentSession,
  clearParentSession,
  isParentSessionValid,
} from './lib/auth';
import { supabase } from './lib/supabase/client';
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
import { ResetPasswordScreen } from './components/auth/ResetPasswordScreen';
import { getAgeInMonths } from './lib/pediatric-rules';
import { getInitialVaccinesForPatient } from './lib/mock-data';

// ─── Auth Gate ──────────────────────────────────────────────────────────────

export default function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // Resolve sessão inicial do médico (única chamada ao Supabase no carregamento)
    loadAuthSession().then((session) => {
      setAuthSession(session);
      setAuthReady(true);
    }).catch(() => setAuthReady(true));

    // Escuta apenas eventos que não exigem nova chamada ao Supabase
    // SIGNED_IN dispara automaticamente no mount — não reatribuímos aqui para
    // evitar duplicar chamadas e atingir o rate limit do Supabase.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      } else if (event === 'SIGNED_OUT') {
        setAuthSession(null);
        setAuthReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-blue-700 text-sm font-semibold animate-pulse">Carregando Ppueri...</div>
      </div>
    );
  }

  // Fluxo de recuperação de senha — sobrepõe qualquer outra tela
  if (isPasswordRecovery) {
    return (
      <ResetPasswordScreen
        onDone={() => {
          setIsPasswordRecovery(false);
          setAuthSession(null);
        }}
      />
    );
  }

  if (!authSession) {
    return (
      <DoctorAuthScreen
        onLoginSuccess={(session) => setAuthSession(session)}
      />
    );
  }

  return (
    <MainApp
      authSession={authSession}
      onLogout={async () => {
        await clearAuthSession();
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
  const [dataLoading, setDataLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vaccinesMap, setVaccinesMap] = useState<Record<string, VaccineRecord[]>>({});
  const [amendments, setAmendments] = useState<ConsultationAmendment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Doctor View Mode
  const [doctorViewMode, setDoctorViewMode] = useState<'dashboard' | 'patient-view' | 'consultation'>('dashboard');
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  // Parent portal session
  const [parentSession, setParentSession] = useState<ParentSession | null>(null);
  const [parentSessionReady, setParentSessionReady] = useState(false);

  // Notifications (mantidas em localStorage)
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [notifications, setNotifications] = useState<PediatricNotification[]>([]);

  // ── Carrega todos os dados do Supabase ao montar ──────────────────────────
  const loadAllData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [pts, cons, apts] = await Promise.all([
        loadStoredPatients(doctorId),
        loadStoredConsultations(doctorId),
        loadStoredAppointments(doctorId),
      ]);

      const consIds = cons.map((c) => c.id);
      const [vmap, amends] = await Promise.all([
        loadStoredVaccinesMap(pts),
        loadConsultationAmendments(consIds),
      ]);
      const notifs = loadStoredNotifications(doctorId, pts, vmap, cons);

      setPatients(pts);
      setConsultations(cons);
      setAppointments(apts);
      setVaccinesMap(vmap);
      setAmendments(amends);
      setNotifications(notifs);
      if (pts.length > 0) setSelectedPatientId(pts[0].id);
    } catch (err) {
      console.error('[Ppueri App] Erro ao carregar dados:', err);
    } finally {
      setDataLoading(false);
    }
  }, [doctorId]);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  // ── Carrega sessão do responsável ─────────────────────────────────────────
  useEffect(() => {
    loadParentSession().then((s) => {
      if (s && isParentSessionValid(s)) setParentSession(s);
      setParentSessionReady(true);
    }).catch(() => setParentSessionReady(true));
  }, []);

  // ── Persiste notificações no localStorage ─────────────────────────────────
  useEffect(() => {
    if (!dataLoading) {
      saveStoredNotifications(doctorId, notifications);
    }
  }, [doctorId, notifications, dataLoading]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0] || ({} as Patient);
  const activeVaccines = vaccinesMap[selectedPatientId] || [];

  const unreadCount = notifications.filter(
    (n) => !n.isRead && (n.targetRole === 'ambos' || n.targetRole === activeRole)
  ).length;

  // ── Notification handlers ─────────────────────────────────────────────────
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
    if (patientId && activeRole === 'medico') setSelectedPatientId(patientId);
  };

  // ── Appointment handlers ──────────────────────────────────────────────────
  const handleAddAppointment = async (newApt: Appointment) => {
    setAppointments((prev) => [newApt, ...prev]);
    await insertAppointment(newApt).catch(console.error);

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

  const handleUpdateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus) => {
    setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, status } : a)));
    await dbUpdateAppointmentStatus(appointmentId, status).catch(console.error);
  };

  const handleRescheduleAppointment = async (appointmentId: string, newDate: string, newTime: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, date: newDate, time: newTime } : a))
    );
    await dbRescheduleAppointment(appointmentId, newDate, newTime).catch(console.error);

    const targetApt = appointments.find((a) => a.id === appointmentId);
    if (targetApt) {
      setNotifications((prev) => [
        {
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
        },
        ...prev,
      ]);
    }
  };

  // ── Add new patient ───────────────────────────────────────────────────────
  const handleAddPatient = async (newPatient: Patient) => {
    setPatients((prev) => [newPatient, ...prev]);
    setSelectedPatientId(newPatient.id);
    setDoctorViewMode('patient-view');

    const ageMonths = getAgeInMonths(newPatient.birthDate);
    const newVaccs = getInitialVaccinesForPatient(newPatient.id, ageMonths);
    setVaccinesMap((prev) => ({ ...prev, [newPatient.id]: newVaccs }));

    // Persiste no Supabase
    await insertPatient(newPatient).catch(console.error);
    await insertInitialVaccines(newPatient.id, doctorId, newVaccs).catch(console.error);

    setNotifications((prev) => [
      {
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
      },
      ...prev,
    ]);
  };

  // ── Vaccine handler ───────────────────────────────────────────────────────
  const handleUpdateVaccineStatus = async (
    vaccineId: string,
    status: VaccineRecord['status'],
    date?: string,
    batch?: string
  ) => {
    const clinicName = 'Clínica Ppueri Pediatria';
    setVaccinesMap((prev) => {
      const currentList = prev[selectedPatientId] || [];
      const updatedList = currentList.map((v) =>
        v.id === vaccineId
          ? { ...v, status, applicationDate: date || v.applicationDate || new Date().toISOString().split('T')[0], batchNumber: batch || v.batchNumber || 'LOTE-2026-PNI', clinicName }
          : v
      );
      return { ...prev, [selectedPatientId]: updatedList };
    });
    await updateVaccineRecord(vaccineId, status, date, batch, clinicName).catch(console.error);
  };

  // ── Regenerate access code ────────────────────────────────────────────────
  const handleRegenerateAccessCode = async (patientId: string) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const target = patients.find((p) => p.id === patientId);
    const suffix = target ? target.name.substring(0, 3).toUpperCase() : 'PPU';
    const newCode = `PPUERI-${randomNum}-${suffix}`;
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, accessCode: newCode, accessCodeCreatedAt: new Date().toISOString() } : p))
    );
    await updatePatientAccessCode(patientId, newCode).catch(console.error);
  };

  // ── Delete exam (remove from consultation JSONB + Storage) ───────────────
  const handleDeleteExam = async (examId: string, storagePath?: string) => {
    const parentConsultation = consultations.find((c) => c.exams?.some((e) => e.id === examId));
    if (!parentConsultation) return;

    const updatedExams = (parentConsultation.exams ?? []).filter((e) => e.id !== examId);
    setConsultations((prev) =>
      prev.map((c) => c.id === parentConsultation.id ? { ...c, exams: updatedExams } : c)
    );
    await updateConsultationExams(parentConsultation.id, updatedExams).catch(console.error);
    if (storagePath) await deleteExamFile(storagePath).catch(console.error);
  };

  // ── Finalize consultation (CFM 1.821/07) ─────────────────────────────────
  const handleFinalizeConsultation = async (consultationId: string) => {
    await finalizeConsultation(consultationId).catch(console.error);
    setConsultations((prev) =>
      prev.map((c) =>
        c.id === consultationId
          ? { ...c, status: 'finalized' as const, finalizedAt: new Date().toISOString() }
          : c
      )
    );
  };

  // ── Add amendment (CFM 1.821/07 — adendo clinico) ─────────────────────────
  const handleAddAmendment = async (consultationId: string, text: string) => {
    const amendment = await insertConsultationAmendment({
      consultationId,
      doctorId,
      doctorName,
      doctorCrm,
      amendmentText: text,
    }).catch(console.error);
    if (amendment) {
      setAmendments((prev) => [...prev, amendment]);
    }
  };

  // ── Save consultation ─────────────────────────────────────────────────────
  const handleSaveConsultation = async (newConsultation: Consultation) => {
    setConsultations((prev) => [newConsultation, ...prev]);
    setDoctorViewMode('patient-view');
    await insertConsultation(newConsultation).catch(console.error);

    const targetPatient = patients.find((p) => p.id === newConsultation.patientId);
    setNotifications((prev) => [
      {
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
      },
      ...prev,
    ]);
  };

  // ── Restore data (backup import) ──────────────────────────────────────────
  const handleRestoreData = async (
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

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-blue-700 text-sm font-semibold animate-pulse">Carregando prontuários...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-slate-900 selection:bg-blue-500 selection:text-white pb-12 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-slate-50 to-slate-100">
      <Header
        activeRole={activeRole}
        onRoleChange={(role) => setActiveRole(role)}
        doctorName={doctorName}
        doctorCrm={doctorCrm}
        onLogout={onLogout}
        patients={patients}
        selectedPatientId={selectedPatientId}
        onSelectPatient={(id) => setSelectedPatientId(id)}
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
              onViewPatient={(id) => { setSelectedPatientId(id); setDoctorViewMode('patient-view'); }}
              onStartNewConsultation={(id) => { setSelectedPatientId(id); setDoctorViewMode('consultation'); }}
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
              amendments={amendments}
              onStartNewConsultation={() => setDoctorViewMode('consultation')}
              onBack={() => setDoctorViewMode('dashboard')}
              onUpdateVaccineStatus={handleUpdateVaccineStatus}
              onRegenerateAccessCode={handleRegenerateAccessCode}
              onDeleteExam={handleDeleteExam}
              onFinalizeConsultation={handleFinalizeConsultation}
              onAddAmendment={handleAddAmendment}
              doctorId={doctorId}
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
        ) : parentSessionReady && parentSession ? (
          <PatientPortal
            parentId={parentSession.parentId}
            patient={patients.find((p) => p.id === parentSession.linkedPatientId) || ({} as Patient)}
            consultations={consultations.filter((c) => c.patientId === parentSession.linkedPatientId)}
            vaccines={vaccinesMap[parentSession.linkedPatientId] || []}
            appointments={appointments.filter((a) => a.patientId === parentSession.linkedPatientId)}
            onLogout={async () => {
              await clearParentSession();
              setParentSession(null);
            }}
          />
        ) : (
          <PatientLogin
            onLoginSuccess={(session) => setParentSession(session)}
          />
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
