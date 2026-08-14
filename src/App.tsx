import React, { useState, useEffect } from 'react';
import { Role, Patient, Consultation, VaccineRecord, PediatricNotification, NotificationPreferences, Appointment, AppointmentStatus } from './types/ppueri';
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
import { Header } from './components/ui/Header';
import { InstallPwaBanner } from './components/ui/InstallPwaBanner';
import { NotificationCenter } from './components/ui/NotificationCenter';
import { DoctorDashboard } from './components/medico/DoctorDashboard';
import { MedicalRecordForm } from './components/medico/MedicalRecordForm';
import { NewPatientModal } from './components/medico/NewPatientModal';
import { PatientLogin } from './components/paciente/PatientLogin';
import { PatientPortal } from './components/paciente/PatientPortal';
import { getAgeInMonths } from './lib/pediatric-rules';
import { getInitialVaccinesForPatient } from './lib/mock-data';

export default function App() {
  // Global State com Persistência Automática no Navegador (LocalStorage / PWA Cache)
  const [activeRole, setActiveRole] = useState<Role>('medico');
  const [patients, setPatients] = useState<Patient[]>(() => loadStoredPatients());
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    const loaded = loadStoredPatients();
    return loaded.length > 0 ? loaded[0].id : '';
  });
  const [consultations, setConsultations] = useState<Consultation[]>(() => loadStoredConsultations());
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadStoredAppointments());
  const [searchQuery, setSearchQuery] = useState('');

  // Doctor View Mode: 'dashboard' | 'consultation'
  const [doctorViewMode, setDoctorViewMode] = useState<'dashboard' | 'consultation'>('dashboard');
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  // Parent Portal State: Logged in patient ID or null
  const [parentLoggedInPatientId, setParentLoggedInPatientId] = useState<string | null>(() => {
    const loaded = loadStoredPatients();
    return loaded.length > 0 ? loaded[0].id : null;
  });

  // Vaccines map per patientId: Record<patientId, VaccineRecord[]>
  const [vaccinesMap, setVaccinesMap] = useState<Record<string, VaccineRecord[]>>(() =>
    loadStoredVaccinesMap(loadStoredPatients())
  );

  // Notifications State & Preferences
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [notifications, setNotifications] = useState<PediatricNotification[]>(() =>
    loadStoredNotifications(loadStoredPatients(), loadStoredVaccinesMap(loadStoredPatients()), loadStoredConsultations())
  );

  // Sincronização contínua com LocalStorage
  useEffect(() => {
    saveStoredPatients(patients);
  }, [patients]);

  useEffect(() => {
    saveStoredConsultations(consultations);
  }, [consultations]);

  useEffect(() => {
    saveStoredAppointments(appointments);
  }, [appointments]);

  useEffect(() => {
    saveStoredVaccinesMap(vaccinesMap);
  }, [vaccinesMap]);

  useEffect(() => {
    saveStoredNotifications(notifications);
  }, [notifications]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0] || ({} as Patient);
  const activeVaccines = vaccinesMap[selectedPatientId] || [];

  const unreadCount = notifications.filter(
    (n) => (!n.isRead && (n.targetRole === 'ambos' || n.targetRole === activeRole))
  ).length;

  // Handlers para Notificações
  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleAddSimulatedNotification = (newNotif: PediatricNotification) => {
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleSelectNotificationAction = (actionLink: string, patientId?: string) => {
    if (patientId) {
      setSelectedPatientId(patientId);
      if (activeRole === 'paciente') {
        setParentLoggedInPatientId(patientId);
      }
    }
  };

  // Handlers para Agendamentos
  const handleAddAppointment = (newApt: Appointment) => {
    setAppointments((prev) => [newApt, ...prev]);

    // Notificação automática de consulta agendada
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
        message: `Novo horário de atendimento: ${new Date(newDate + 'T00:00:00').toLocaleDateString('pt-BR')} às ${newTime}.`,
        category: 'consulta',
        targetRole: 'ambos',
        priority: 'media',
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  };

  // Handler para adicionar novo paciente
  const handleAddPatient = (newPatient: Patient) => {
    setPatients((prev) => [newPatient, ...prev]);
    setSelectedPatientId(newPatient.id);

    // Inicializa vacinas do novo paciente
    const ageMonths = getAgeInMonths(newPatient.birthDate);
    const newVaccs = getInitialVaccinesForPatient(newPatient.id, ageMonths);
    setVaccinesMap((prev) => ({
      ...prev,
      [newPatient.id]: newVaccs,
    }));

    // Gera notificação de boas-vindas ao novo paciente
    const welcomeNotif: PediatricNotification = {
      id: `notif_welcome_${newPatient.id}`,
      patientId: newPatient.id,
      patientName: newPatient.name,
      title: `Paciente Cadastrado com Sucesso: ${newPatient.name}`,
      message: `Código de acesso gerado: ${newPatient.accessCode}. Prontuário pronto para atendimento.`,
      category: 'orientacao',
      targetRole: 'medico',
      priority: 'media',
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setNotifications((prev) => [welcomeNotif, ...prev]);
  };

  // Handler para atualizar status de vacina
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

  // Handler para regenerar Código de Acesso do Paciente
  const handleRegenerateAccessCode = (patientId: string) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const target = patients.find((p) => p.id === patientId);
    const suffix = target ? target.name.substring(0, 3).toUpperCase() : 'PPU';
    const newCode = `PPUERI-${randomNum}-${suffix}`;

    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, accessCode: newCode, accessCodeCreatedAt: new Date().toISOString() } : p))
    );
  };

  // Handler para salvar nova consulta no prontuário
  const handleSaveConsultation = (newConsultation: Consultation) => {
    setConsultations((prev) => [newConsultation, ...prev]);
    setDoctorViewMode('dashboard');

    // Notificação automática para os pais sobre a nova consulta
    const targetPatient = patients.find((p) => p.id === newConsultation.patientId);
    const notif: PediatricNotification = {
      id: `notif_cons_new_${Date.now()}`,
      patientId: newConsultation.patientId,
      patientName: targetPatient?.name,
      title: 'Nova Consulta Registrada no Prontuário',
      message: `Atendimento de puericultura concluído por ${newConsultation.doctorName}. Novas prescrições e recomendações disponíveis.`,
      category: 'orientacao',
      targetRole: 'paciente',
      priority: 'alta',
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Handler para restauração completa de backup clínico
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
      {/* Top Main Navigation Header */}
      <Header
        activeRole={activeRole}
        onRoleChange={(role) => {
          setActiveRole(role);
          if (role === 'paciente' && !parentLoggedInPatientId) {
            setParentLoggedInPatientId(selectedPatientId);
          }
        }}
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
      />

      {/* Main Container Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Banner discreto de Instalação PWA (Dispensável) */}
        <InstallPwaBanner variant="banner" />

        {activeRole === 'medico' ? (
          doctorViewMode === 'dashboard' ? (
            <DoctorDashboard
              patients={patients}
              consultations={consultations}
              appointments={appointments}
              selectedPatientId={selectedPatientId}
              onSelectPatient={(id) => setSelectedPatientId(id)}
              onStartNewConsultation={(id) => {
                setSelectedPatientId(id);
                setDoctorViewMode('consultation');
              }}
              onOpenNewPatientModal={() => setIsNewPatientModalOpen(true)}
              onAddAppointment={handleAddAppointment}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              onRescheduleAppointment={handleRescheduleAppointment}
            />
          ) : (
            <MedicalRecordForm
              patient={selectedPatient}
              consultations={consultations}
              vaccines={activeVaccines}
              onSaveConsultation={handleSaveConsultation}
              onUpdateVaccineStatus={handleUpdateVaccineStatus}
              onRegenerateAccessCode={handleRegenerateAccessCode}
              onBack={() => setDoctorViewMode('dashboard')}
            />
          )
        ) : (
          /* Portal do Paciente / Pais */
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

      {/* Modal para Cadastrar Novo Paciente */}
      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onAddPatient={handleAddPatient}
      />

      {/* Central de Notificações Drawer */}
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
