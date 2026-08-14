import { Patient, Consultation, Appointment, VaccineRecord, PediatricNotification } from '../types/ppueri';
import { INITIAL_PATIENTS, INITIAL_CONSULTATIONS, INITIAL_APPOINTMENTS, getInitialVaccinesForPatient } from './mock-data';
import { generateInitialNotifications } from './notifications';
import { getAgeInMonths } from './pediatric-rules';

const STORAGE_KEYS = {
  PATIENTS: 'ppueri_patients_v1',
  CONSULTATIONS: 'ppueri_consultations_v1',
  APPOINTMENTS: 'ppueri_appointments_v1',
  VACCINES: 'ppueri_vaccines_map_v1',
  NOTIFICATIONS: 'ppueri_notifications_v1',
  LAST_SYNC: 'ppueri_last_sync_timestamp',
};

export interface ClinicBackupData {
  version: string;
  exportedAt: string;
  app: string;
  patients: Patient[];
  consultations: Consultation[];
  appointments: Appointment[];
  vaccinesMap: Record<string, VaccineRecord[]>;
  notifications: PediatricNotification[];
}

/**
 * Carrega lista de pacientes do LocalStorage ou fallback para dados iniciais
 */
export function loadStoredPatients(): Patient[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('[Ppueri Storage] Erro ao carregar pacientes do LocalStorage:', err);
  }
  return INITIAL_PATIENTS;
}

/**
 * Salva lista de pacientes
 */
export function saveStoredPatients(patients: Patient[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (err) {
    console.error('[Ppueri Storage] Erro ao salvar pacientes:', err);
  }
}

/**
 * Carrega consultas do LocalStorage ou fallback
 */
export function loadStoredConsultations(): Consultation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONSULTATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('[Ppueri Storage] Erro ao carregar consultas do LocalStorage:', err);
  }
  return INITIAL_CONSULTATIONS;
}

/**
 * Salva consultas
 */
export function saveStoredConsultations(consultations: Consultation[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(consultations));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (err) {
    console.error('[Ppueri Storage] Erro ao salvar consultas:', err);
  }
}

/**
 * Carrega agendamentos do LocalStorage ou fallback
 */
export function loadStoredAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('[Ppueri Storage] Erro ao carregar agendamentos:', err);
  }
  return INITIAL_APPOINTMENTS;
}

/**
 * Salva agendamentos
 */
export function saveStoredAppointments(appointments: Appointment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (err) {
    console.error('[Ppueri Storage] Erro ao salvar agendamentos:', err);
  }
}

/**
 * Carrega mapa de vacinas por paciente
 */
export function loadStoredVaccinesMap(currentPatients: Patient[]): Record<string, VaccineRecord[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VACCINES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (err) {
    console.warn('[Ppueri Storage] Erro ao carregar mapa de vacinas:', err);
  }

  const initialMap: Record<string, VaccineRecord[]> = {};
  currentPatients.forEach((p) => {
    const ageMonths = getAgeInMonths(p.birthDate);
    initialMap[p.id] = getInitialVaccinesForPatient(p.id, ageMonths);
  });
  return initialMap;
}

/**
 * Salva mapa de vacinas
 */
export function saveStoredVaccinesMap(vaccinesMap: Record<string, VaccineRecord[]>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VACCINES, JSON.stringify(vaccinesMap));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (err) {
    console.error('[Ppueri Storage] Erro ao salvar vacinas:', err);
  }
}

/**
 * Carrega notificações
 */
export function loadStoredNotifications(
  patients: Patient[],
  vaccinesMap: Record<string, VaccineRecord[]>,
  consultations: Consultation[]
): PediatricNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('[Ppueri Storage] Erro ao carregar notificações:', err);
  }
  return generateInitialNotifications(patients, vaccinesMap, consultations);
}

/**
 * Salva notificações
 */
export function saveStoredNotifications(notifications: PediatricNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  } catch (err) {
    console.error('[Ppueri Storage] Erro ao salvar notificações:', err);
  }
}

/**
 * Gera arquivo JSON de backup completo de todos os dados clínicos
 */
export function exportClinicBackup(
  patients: Patient[],
  consultations: Consultation[],
  appointments: Appointment[],
  vaccinesMap: Record<string, VaccineRecord[]>,
  notifications: PediatricNotification[]
): void {
  const backupData: ClinicBackupData = {
    version: '2.5.0-prod',
    exportedAt: new Date().toISOString(),
    app: 'Ppueri Prontuário Pediátrico',
    patients,
    consultations,
    appointments,
    vaccinesMap,
    notifications,
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `ppueri_backup_clinica_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Restaura dados a partir de um arquivo JSON
 */
export function importClinicBackup(jsonString: string): ClinicBackupData | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && parsed.patients && Array.isArray(parsed.patients)) {
      saveStoredPatients(parsed.patients);
      if (parsed.consultations) saveStoredConsultations(parsed.consultations);
      if (parsed.appointments) saveStoredAppointments(parsed.appointments);
      if (parsed.vaccinesMap) saveStoredVaccinesMap(parsed.vaccinesMap);
      if (parsed.notifications) saveStoredNotifications(parsed.notifications);
      return parsed;
    }
  } catch (err) {
    console.error('[Ppueri Storage] Erro na restauração de backup:', err);
  }
  return null;
}

/**
 * Limpa todos os dados salvos e restaura estado inicial de demonstração
 */
export function resetToDemoData(): void {
  localStorage.removeItem(STORAGE_KEYS.PATIENTS);
  localStorage.removeItem(STORAGE_KEYS.CONSULTATIONS);
  localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
  localStorage.removeItem(STORAGE_KEYS.VACCINES);
  localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
  localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
}
