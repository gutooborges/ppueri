/**
 * storage-sync.ts — Persistência em nuvem via Supabase PostgreSQL
 *
 * Todas as funções são assíncronas. O mapeamento camelCase ↔ snake_case
 * é feito localmente para manter compatibilidade com os tipos TypeScript.
 */
import { supabase, parentSupabase } from './supabase/client';
import {
  Patient,
  Consultation,
  Appointment,
  AppointmentStatus,
  VaccineRecord,
  PediatricNotification,
} from '../types/ppueri';
import { getInitialVaccinesForPatient } from './mock-data';
import { getAgeInMonths } from './pediatric-rules';

// ─── Interfaces auxiliares ────────────────────────────────────────────────────

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

// ─── Mappers: DB row → App type ───────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPatient(r: any): Patient {
  return {
    id: r.id,
    doctorId: r.doctor_id,
    name: r.name,
    birthDate: r.birth_date,
    gender: r.gender,
    motherName: r.mother_name,
    fatherName: r.father_name ?? undefined,
    cpf: r.cpf ?? undefined,
    susNumber: r.sus_number ?? undefined,
    accessCode: r.access_code,
    accessCodeCreatedAt: r.access_code_created_at,
    bloodType: r.blood_type ?? undefined,
    allergies: r.allergies ?? [],
    chronicConditions: r.chronic_conditions ?? [],
    photoUrl: r.photo_url ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToConsultation(r: any): Consultation {
  return {
    id: r.id,
    doctorId: r.doctor_id,
    patientId: r.patient_id,
    doctorName: r.doctor_name,
    doctorCrm: r.doctor_crm,
    date: r.date,
    anamnesis: r.anamnesis,
    antropometry: r.antropometry,
    vitals: r.vitals,
    vitalsEvaluations: r.vitals_evaluations ?? [],
    exams: r.exams ?? [],
    vaccineUpdates: r.vaccine_updates ?? [],
    carePlan: r.care_plan,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAppointment(r: any): Appointment {
  return {
    id: r.id,
    doctorId: r.doctor_id,
    patientId: r.patient_id,
    patientName: r.patient_name,
    motherName: r.mother_name,
    doctorName: r.doctor_name,
    doctorCrm: r.doctor_crm,
    date: r.date,
    time: r.time,
    durationMinutes: r.duration_minutes ?? undefined,
    type: r.type,
    status: r.status,
    notes: r.notes ?? undefined,
    preparationChecklist: r.preparation_checklist ?? [],
    createdAt: r.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToVaccine(r: any): VaccineRecord {
  return {
    id: r.id,
    vaccineId: r.vaccine_id,
    vaccineName: r.vaccine_name,
    targetDisease: r.target_disease,
    targetAgeBracket: r.target_age_bracket,
    ageMonthsRecommended: r.age_months_recommended,
    doseNumber: r.dose_number,
    totalDoses: r.total_doses,
    status: r.status,
    applicationDate: r.application_date ?? undefined,
    batchNumber: r.batch_number ?? undefined,
    clinicName: r.clinic_name ?? undefined,
    notes: r.notes ?? undefined,
  };
}

// ─── Patients ─────────────────────────────────────────────────────────────────

export async function loadStoredPatients(doctorId: string): Promise<Patient[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Ppueri Storage] Erro ao carregar pacientes:', error.message);
    return [];
  }
  return (data ?? []).map(rowToPatient);
}

export async function saveStoredPatients(doctorId: string, patients: Patient[]): Promise<void> {
  // Usado no backup: upsert em lote
  if (patients.length === 0) return;
  const rows = patients.map((p) => ({
    id: p.id,
    doctor_id: doctorId,
    name: p.name,
    birth_date: p.birthDate,
    gender: p.gender,
    mother_name: p.motherName,
    father_name: p.fatherName ?? null,
    cpf: p.cpf ?? null,
    sus_number: p.susNumber ?? null,
    access_code: p.accessCode,
    access_code_created_at: p.accessCodeCreatedAt,
    blood_type: p.bloodType ?? null,
    allergies: p.allergies,
    chronic_conditions: p.chronicConditions,
    photo_url: p.photoUrl ?? null,
  }));
  const { error } = await supabase.from('patients').upsert(rows, { onConflict: 'id' });
  if (error) console.error('[Ppueri Storage] Erro ao salvar pacientes:', error.message);
}

export async function insertPatient(patient: Patient): Promise<void> {
  const { error } = await supabase.from('patients').insert({
    id: patient.id,
    doctor_id: patient.doctorId,
    name: patient.name,
    birth_date: patient.birthDate,
    gender: patient.gender,
    mother_name: patient.motherName,
    father_name: patient.fatherName ?? null,
    cpf: patient.cpf ?? null,
    sus_number: patient.susNumber ?? null,
    access_code: patient.accessCode,
    access_code_created_at: patient.accessCodeCreatedAt,
    blood_type: patient.bloodType ?? null,
    allergies: patient.allergies,
    chronic_conditions: patient.chronicConditions,
    photo_url: patient.photoUrl ?? null,
  });
  if (error) console.error('[Ppueri Storage] Erro ao inserir paciente:', error.message);
}

export async function updatePatientAccessCode(patientId: string, newCode: string): Promise<void> {
  const { error } = await supabase
    .from('patients')
    .update({ access_code: newCode, access_code_created_at: new Date().toISOString() })
    .eq('id', patientId);
  if (error) console.error('[Ppueri Storage] Erro ao atualizar código de acesso:', error.message);
}

// ─── Consultations ────────────────────────────────────────────────────────────

export async function loadStoredConsultations(doctorId: string): Promise<Consultation[]> {
  const { data, error } = await supabase
    .from('consultations')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('date', { ascending: false });

  if (error) {
    console.error('[Ppueri Storage] Erro ao carregar consultas:', error.message);
    return [];
  }
  return (data ?? []).map(rowToConsultation);
}

export async function insertConsultation(consultation: Consultation): Promise<void> {
  const { error } = await supabase.from('consultations').insert({
    id: consultation.id,
    patient_id: consultation.patientId,
    doctor_id: consultation.doctorId,
    doctor_name: consultation.doctorName,
    doctor_crm: consultation.doctorCrm,
    date: consultation.date,
    anamnesis: consultation.anamnesis,
    antropometry: consultation.antropometry,
    vitals: consultation.vitals,
    vitals_evaluations: consultation.vitalsEvaluations,
    exams: consultation.exams,
    vaccine_updates: consultation.vaccineUpdates ?? [],
    care_plan: consultation.carePlan,
  });
  if (error) console.error('[Ppueri Storage] Erro ao inserir consulta:', error.message);
}

export async function saveStoredConsultations(doctorId: string, consultations: Consultation[]): Promise<void> {
  if (consultations.length === 0) return;
  const rows = consultations.map((c) => ({
    id: c.id,
    patient_id: c.patientId,
    doctor_id: doctorId,
    doctor_name: c.doctorName,
    doctor_crm: c.doctorCrm,
    date: c.date,
    anamnesis: c.anamnesis,
    antropometry: c.antropometry,
    vitals: c.vitals,
    vitals_evaluations: c.vitalsEvaluations,
    exams: c.exams,
    vaccine_updates: c.vaccineUpdates ?? [],
    care_plan: c.carePlan,
  }));
  const { error } = await supabase.from('consultations').upsert(rows, { onConflict: 'id' });
  if (error) console.error('[Ppueri Storage] Erro ao salvar consultas:', error.message);
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export async function loadStoredAppointments(doctorId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('date', { ascending: false });

  if (error) {
    console.error('[Ppueri Storage] Erro ao carregar consultas agendadas:', error.message);
    return [];
  }
  return (data ?? []).map(rowToAppointment);
}

export async function insertAppointment(appointment: Appointment): Promise<void> {
  const { error } = await supabase.from('appointments').insert({
    id: appointment.id,
    doctor_id: appointment.doctorId,
    patient_id: appointment.patientId,
    patient_name: appointment.patientName,
    mother_name: appointment.motherName,
    doctor_name: appointment.doctorName,
    doctor_crm: appointment.doctorCrm,
    date: appointment.date,
    time: appointment.time,
    duration_minutes: appointment.durationMinutes ?? null,
    type: appointment.type,
    status: appointment.status,
    notes: appointment.notes ?? null,
    preparation_checklist: appointment.preparationChecklist ?? [],
  });
  if (error) console.error('[Ppueri Storage] Erro ao inserir agendamento:', error.message);
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId);
  if (error) console.error('[Ppueri Storage] Erro ao atualizar status do agendamento:', error.message);
}

export async function rescheduleAppointment(appointmentId: string, newDate: string, newTime: string): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({ date: newDate, time: newTime })
    .eq('id', appointmentId);
  if (error) console.error('[Ppueri Storage] Erro ao reagendar consulta:', error.message);
}

export async function saveStoredAppointments(doctorId: string, appointments: Appointment[]): Promise<void> {
  if (appointments.length === 0) return;
  const rows = appointments.map((a) => ({
    id: a.id,
    doctor_id: doctorId,
    patient_id: a.patientId,
    patient_name: a.patientName,
    mother_name: a.motherName,
    doctor_name: a.doctorName,
    doctor_crm: a.doctorCrm,
    date: a.date,
    time: a.time,
    duration_minutes: a.durationMinutes ?? null,
    type: a.type,
    status: a.status,
    notes: a.notes ?? null,
    preparation_checklist: a.preparationChecklist ?? [],
  }));
  const { error } = await supabase.from('appointments').upsert(rows, { onConflict: 'id' });
  if (error) console.error('[Ppueri Storage] Erro ao salvar agendamentos:', error.message);
}

// ─── Vaccines ─────────────────────────────────────────────────────────────────

export async function loadStoredVaccinesMap(patients: Patient[]): Promise<Record<string, VaccineRecord[]>> {
  if (patients.length === 0) return {};

  const patientIds = patients.map((p) => p.id);
  const { data, error } = await supabase
    .from('vaccines')
    .select('*')
    .in('patient_id', patientIds);

  if (error) {
    console.error('[Ppueri Storage] Erro ao carregar vacinas:', error.message);
    // Fallback: gera vacinas iniciais localmente
    const map: Record<string, VaccineRecord[]> = {};
    patients.forEach((p) => {
      map[p.id] = getInitialVaccinesForPatient(p.id, getAgeInMonths(p.birthDate));
    });
    return map;
  }

  if (!data || data.length === 0) {
    // Nenhuma vacina no banco ainda — gera localmente
    const map: Record<string, VaccineRecord[]> = {};
    patients.forEach((p) => {
      map[p.id] = getInitialVaccinesForPatient(p.id, getAgeInMonths(p.birthDate));
    });
    return map;
  }

  const map: Record<string, VaccineRecord[]> = {};
  data.forEach((row) => {
    const pid: string = row.patient_id;
    if (!map[pid]) map[pid] = [];
    map[pid].push(rowToVaccine(row));
  });
  return map;
}

export async function saveStoredVaccinesMap(vaccinesMap: Record<string, VaccineRecord[]>): Promise<void> {
  // Não usado diretamente — use upsertPatientVaccines para salvar vacinas de um paciente
}

export async function insertInitialVaccines(patientId: string, doctorId: string, vaccines: VaccineRecord[]): Promise<void> {
  if (vaccines.length === 0) return;
  const rows = vaccines.map((v) => ({
    id: v.id,
    patient_id: patientId,
    doctor_id: doctorId,
    vaccine_id: v.vaccineId,
    vaccine_name: v.vaccineName,
    target_disease: v.targetDisease,
    target_age_bracket: v.targetAgeBracket,
    age_months_recommended: v.ageMonthsRecommended,
    dose_number: v.doseNumber,
    total_doses: v.totalDoses,
    status: v.status,
    application_date: v.applicationDate ?? null,
    batch_number: v.batchNumber ?? null,
    clinic_name: v.clinicName ?? null,
    notes: v.notes ?? null,
  }));
  const { error } = await supabase.from('vaccines').insert(rows);
  if (error) console.error('[Ppueri Storage] Erro ao inserir vacinas iniciais:', error.message);
}

export async function updateVaccineRecord(
  vaccineId: string,
  status: VaccineRecord['status'],
  applicationDate?: string,
  batchNumber?: string,
  clinicName?: string
): Promise<void> {
  const { error } = await supabase
    .from('vaccines')
    .update({
      status,
      application_date: applicationDate ?? null,
      batch_number: batchNumber ?? null,
      clinic_name: clinicName ?? null,
    })
    .eq('id', vaccineId);
  if (error) console.error('[Ppueri Storage] Erro ao atualizar vacina:', error.message);
}

// ─── Supabase Storage — exam-files bucket ────────────────────────────────────

const EXAM_BUCKET = 'exam-files';

/**
 * Faz upload do arquivo bruto para o bucket exam-files.
 * Caminho: {patientId}/{timestamp}_{nomeOriginal}
 * Retorna o storage path ou null em caso de erro.
 */
export async function uploadExamFile(patientId: string, file: File): Promise<string | null> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${patientId}/${Date.now()}_${safeName}`;

  const { error } = await supabase.storage
    .from(EXAM_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error('[Ppueri Storage] Erro ao fazer upload do exame:', error.message);
    return null;
  }
  return path;
}

/**
 * Gera uma URL assinada temporária (1 hora) para o médico visualizar/baixar o arquivo.
 */
export async function createExamSignedUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(EXAM_BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (error) {
    console.error('[Ppueri Storage] Erro ao gerar URL assinada (médico):', error.message);
    return null;
  }
  return data.signedUrl;
}

/**
 * Gera uma URL assinada temporária (1 hora) para o responsável visualizar/baixar o arquivo.
 * Usa o cliente do responsável com sessão isolada.
 */
export async function createParentExamSignedUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await parentSupabase.storage
    .from(EXAM_BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (error) {
    console.error('[Ppueri Storage] Erro ao gerar URL assinada (responsável):', error.message);
    return null;
  }
  return data.signedUrl;
}

/**
 * Remove o arquivo físico do bucket ao excluir um exame.
 */
export async function deleteExamFile(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(EXAM_BUCKET)
    .remove([storagePath]);

  if (error) console.error('[Ppueri Storage] Erro ao excluir arquivo do exame:', error.message);
}

/**
 * Atualiza o array de exames de uma consulta no Supabase (após exclusão de um exame).
 */
export async function updateConsultationExams(
  consultationId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exams: any[]
): Promise<void> {
  const { error } = await supabase
    .from('consultations')
    .update({ exams })
    .eq('id', consultationId);

  if (error) console.error('[Ppueri Storage] Erro ao atualizar exames da consulta:', error.message);
}

// ─── Notifications (mantidas em localStorage — ephemeral) ─────────────────────

const NOTIF_KEY_PREFIX = 'ppueri_notifications_v3_';

function notifKey(doctorId: string): string {
  return `${NOTIF_KEY_PREFIX}${doctorId}`;
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
  } catch { /* ignore */ }

  // Importação dinâmica para evitar dependências circulares
  const { generateInitialNotifications } = require('./notifications');
  return generateInitialNotifications(patients, vaccinesMap, consultations);
}

export function saveStoredNotifications(doctorId: string, notifications: PediatricNotification[]): void {
  try {
    localStorage.setItem(notifKey(doctorId), JSON.stringify(notifications));
  } catch (err) {
    console.error('[Ppueri Storage] Erro ao salvar notificações:', err);
  }
}

// ─── Backup / Export ──────────────────────────────────────────────────────────

export function exportClinicBackup(
  doctorId: string,
  patients: Patient[],
  consultations: Consultation[],
  appointments: Appointment[],
  vaccinesMap: Record<string, VaccineRecord[]>,
  notifications: PediatricNotification[]
): void {
  const backupData: ClinicBackupData = {
    version: '4.0.0-supabase',
    exportedAt: new Date().toISOString(),
    app: 'Ppueri Prontuário Pediátrico',
    doctorId,
    patients,
    consultations,
    appointments,
    vaccinesMap,
    notifications,
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ppueri_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importClinicBackup(
  jsonString: string,
  currentDoctorId: string
): Promise<ClinicBackupData | null> {
  try {
    const parsed = JSON.parse(jsonString) as ClinicBackupData;
    if (!parsed || !Array.isArray(parsed.patients)) return null;

    const patients = parsed.patients.map((p) => ({ ...p, doctorId: currentDoctorId }));
    const consultations = (parsed.consultations ?? []).map((c) => ({ ...c, doctorId: currentDoctorId }));
    const appointments = (parsed.appointments ?? []).map((a) => ({ ...a, doctorId: currentDoctorId }));

    await saveStoredPatients(currentDoctorId, patients);
    await saveStoredConsultations(currentDoctorId, consultations);
    await saveStoredAppointments(currentDoctorId, appointments);

    if (parsed.notifications) saveStoredNotifications(currentDoctorId, parsed.notifications);

    return { ...parsed, doctorId: currentDoctorId, patients, consultations, appointments };
  } catch (err) {
    console.error('[Ppueri Storage] Erro na restauração de backup:', err);
    return null;
  }
}
