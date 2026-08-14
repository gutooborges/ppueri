import { Patient, Consultation, Appointment, VaccineRecord, PediatricNotification } from '../types/ppueri';
import { INITIAL_PATIENTS, INITIAL_CONSULTATIONS, INITIAL_APPOINTMENTS, getInitialVaccinesForPatient } from './mock-data';
import { generateInitialNotifications } from './notifications';
import { getAgeInMonths } from './pediatric-rules';
import { DEMO_DOCTOR_ID } from './auth';

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
  doctorId: string;
  patients: Patient[];
  consultations: Consultation[];
  appointments: Appointment[];
  vaccinesMap: Record<string, VaccineRecord[]>;
  notifications: PediatricNotification[];
}

// ─── Helper: read/write full arrays ────────────────────────────────────────

function readAll<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as T[];
    }
  } catch {
    // fall through to empty
  }
  return [];
}

function writeAll<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (err) {
    console.error(`[Ppueri Storage] Erro ao salvar ${key}:`, err);
  }
}

// ─── Patients ──────────────────────────────────────────────────────────────

export function loadStoredPatients(doctorId: string): Patient[] {
  const all = readAll<Patient>(STORAGE_KEYS.PATIENTS);
  if (all.length > 0) {
    const mine = all.filter((p) => p.doctorId === doctorId);
    if (mine.length > 0) return mine;
  }
  // Fallback: demo data only for the demo account
  if (doctorId === DEMO_DOCTOR_ID) return INITIAL_PATIENTS;
  return [];
}

export function saveStoredPatients(doctorId: string, myPatients: Patient[]): void {
  // Preserve other doctors' records; replace only current doctor's
  const others = readAll<Patient>(STORAGE_KEYS.PATIENTS).filter((p) => p.doctorId !== doctorId);
  writeAll(STORAGE_KEYS.PATIENTS, [...others, ...myPatients]);
}

// ─── Consultations ─────────────────────────────────────────────────────────

export function loadStoredConsultations(doctorId: string): Consultation[] {
  const all = readAll<Consultation>(STORAGE_KEYS.CONSULTATIONS);
  if (all.length > 0) {
    const mine = all.filter((c) => c.doctorId === doctorId);
    if (mine.length > 0) return mine;
  }
  if (doctorId === DEMO_DOCTOR_ID) return INITIAL_CONSULTATIONS;
  return [];
}

export function saveStoredConsultations(doctorId: string, myConsultations: Consultation[]): void {
  const others = readAll<Consultation>(STORAGE_KEYS.CONSULTATIONS).filter((c) => c.doctorId !== doctorId);
  writeAll(STORAGE_KEYS.CONSULTATIONS, [...others, ...myConsultations]);
}

// ─── Appointments ──────────────────────────────────────────────────────────

export function loadStoredAppointments(doctorId: string): Appointment[] {
  const all = readAll<Appointment>(STORAGE_KEYS.APPOINTMENTS);
  if (all.length > 0) {
    const mine = all.filter((a) => a.doctorId === doctorId);
    if (mine.length > 0) return mine;
  }
  if (doctorId === DEMO_DOCTOR_ID) return INITIAL_APPOINTMENTS;
  return [];
}

export function saveStoredAppointments(doctorId: string, myAppointments: Appointment[]): void {
  const others = readAll<Appointment>(STORAGE_KEYS.APPOINTMENTS).filter((a) => a.doctorId !== doctorId);
  writeAll(STORAGE_KEYS.APPOINTMENTS, [...others, ...myAppointments]);
}

// ─── Vaccines Map ──────────────────────────────────────────────────────────

/**
 * Loads the vaccines map. vaccinesMap is keyed by patientId; isolation is
 * enforced by only accessing keys that belong to the current doctor's patients.
 */
export function loadStoredVaccinesMap(currentPatients: Patient[]): Record<string, VaccineRecord[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VACCINES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        // Only return entries for the supplied (already-filtered) patients
        const result: Record<string, VaccineRecord[]> = {};
        currentPatients.forEach((p) => {
          if (parsed[p.id]) result[p.id] = parsed[p.id];
        });
        if (Object.keys(result).length > 0) return result;
      }
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

export function saveStoredVaccinesMap(vaccinesMap: Record<string, VaccineRecord[]>): void {
  try {
    // Merge with any existing entries (other doctors' patients)
    const raw = localStorage.getItem(STORAGE_KEYS.VACCINES);
    let existing: Record<string, VaccineRecord[]> = {};
    if (raw) {
      try { existing = JSON.parse(raw); } catch { /**/ }
    }
    localStorage.setItem(STORAGE_KEYS.VACCINES, JSON.stringify({ ...existing, ...vaccinesMap }));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (err) {
    console.error('[Ppueri Storage] Erro ao salvar vacinas:', err);
  }
}

// ─── Notifications ─────────────────────────────────────────────────────────

const NOTIF_KEY_PREFIX = 'ppueri_notifications_';

function notifKey(doctorId: string): string {
  return `${NOTIF_KEY_PREFIX}${doctorId}_v1`;
}

export function loadStoredNotifications(
  doctorId: string,
  patients: Patient[],
  vaccinesMap: Record<string, VaccineRecord[]>,
  consultations: Consultation[]
): PediatricNotification[] {
  try {
    const raw = localStorage.getItem(notifKey(doctorId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('[Ppueri Storage] Erro ao carregar notificações:', err);
  }
  return generateInitialNotifications(patients, vaccinesMap, consultations);
}

export function saveStoredNotifications(doctorId: string, notifications: PediatricNotification[]): void {
  try {
    localStorage.setItem(notifKey(doctorId), JSON.stringify(notifications));
  } catch (err) {
    console.error('[Ppueri Storage] Erro ao salvar notificações:', err);
  }
}

// ─── Backup / Export ───────────────────────────────────────────────────────

export function exportClinicBackup(
  doctorId: string,
  patients: Patient[],
  consultations: Consultation[],
  appointments: Appointment[],
  vaccinesMap: Record<string, VaccineRecord[]>,
  notifications: PediatricNotification[]
): void {
  const backupData: ClinicBackupData = {
    version: '3.0.0-auth',
    exportedAt: new Date().toISOString(),
    app: 'Ppueri Prontuário Pediátrico',
    doctorId,
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
  a.download = `ppueri_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importClinicBackup(jsonString: string, currentDoctorId: string): ClinicBackupData | null {
  try {
    const parsed = JSON.parse(jsonString) as ClinicBackupData;
    if (!parsed || !Array.isArray(parsed.patients)) return null;

    // Re-stamp all records with the current doctor's ID to enforce ownership
    const patients = parsed.patients.map((p) => ({ ...p, doctorId: currentDoctorId }));
    const consultations = (parsed.consultations || []).map((c) => ({ ...c, doctorId: currentDoctorId }));
    const appointments = (parsed.appointments || []).map((a) => ({ ...a, doctorId: currentDoctorId }));

    saveStoredPatients(currentDoctorId, patients);
    saveStoredConsultations(currentDoctorId, consultations);
    saveStoredAppointments(currentDoctorId, appointments);
    if (parsed.vaccinesMap) saveStoredVaccinesMap(parsed.vaccinesMap);
    if (parsed.notifications) saveStoredNotifications(currentDoctorId, parsed.notifications);

    return { ...parsed, doctorId: currentDoctorId, patients, consultations, appointments };
  } catch (err) {
    console.error('[Ppueri Storage] Erro na restauração de backup:', err);
  }
  return null;
}

export function resetToDemoData(doctorId: string): void {
  saveStoredPatients(doctorId, []);
  saveStoredConsultations(doctorId, []);
  saveStoredAppointments(doctorId, []);
  try {
    localStorage.removeItem(notifKey(doctorId));
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
  } catch { /**/ }
}
