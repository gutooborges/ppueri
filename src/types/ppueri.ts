export type Role = 'medico' | 'paciente';

export interface DoctorAccount {
  id: string;
  name: string;
  email: string;
  crm: string;
  passwordHash: string;
  createdAt: string;
}

export interface AuthSession {
  doctorId: string;
  doctorName: string;
  doctorCrm: string;
  email: string;
  expiresAt: string;
}

export interface ParentAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  linkedPatientId: string;
  createdAt: string;
}

export interface ParentSession {
  parentId: string;
  parentName: string;
  linkedPatientId: string;
  linkedPatientName?: string;
  expiresAt: string;
}

export type Gender = 'masculino' | 'feminino';

export type AgeBracket = 
  | 'recem_nascido' // 0 - 28 dias
  | 'lactente'       // 1 - 12 meses
  | 'pre_escolar'    // 1 - 5 anos
  | 'escolar'        // 6 - 12 anos
  | 'adolescente';   // 13 - 16 anos

export interface Patient {
  id: string;
  doctorId: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  gender: Gender;
  motherName: string;
  fatherName?: string;
  cpf?: string;
  susNumber?: string;
  accessCode: string; // Token único ex: PPUERI-8392-X
  accessCodeCreatedAt: string;
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies: string[];
  chronicConditions: string[];
  photoUrl?: string;
}

export interface AntropometricParams {
  weightKg: number;
  heightCm: number;
  headCircumferenceCm?: number; // Relevante até 3 anos
  weightZScore?: number;
  heightZScore?: number;
  headCircumferenceZScore?: number;
  weightPercentile?: number;
  heightPercentile?: number;
  headCircumferencePercentile?: number;
}

export interface ClinicalVitals {
  systolicBP: number; // mmHg
  diastolicBP: number; // mmHg
  heartRateBpm: number; // bpm
  respiratoryRateRpm: number; // rpm
  temperatureC: number; // °C
  oxygenSaturationPct: number; // %
}

export interface VitalsEvaluation {
  parameterKey: keyof ClinicalVitals;
  parameterName: string;
  value: number;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'alterado';
  severity?: 'warning' | 'alert';
  explanation: string;
}

export interface Anamnesis {
  gestationalHistory: string; // Gestação a termo, pré-termo, complicações
  birthType: 'vaginal' | 'cesarea' | 'forcipe';
  birthWeightKg: number;
  birthLengthCm: number;
  headCircumferenceAtBirthCm: number;
  apgar1Min: number;
  apgar5Min: number;
  breastfeedingStatus: 'exclusivo' | 'misto' | 'formula' | 'desmamado';
  familyHistory: string;
  chiefComplaint: string; // Queixa principal
  historyOfPresentIllness: string; // HDA
  currentMedications: string[];
  allergies: string[];
  currentHabits?: string;   // Hábitos atuais (alimentação, sono, atividade)
  physicalExam?: string;    // Exame físico pediátrico (campo livre)
}

export interface LabExamItem {
  parameter: string;
  value: string;
  numericValue?: number;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'alterado_alto' | 'alterado_baixo';
  notes?: string;
}

export interface LabExam {
  id: string;
  patientId: string;
  title: string;
  category: 'Hemograma' | 'Urina' | 'Bioquímica' | 'Imagem' | 'Sorologia' | 'Outro';
  date: string; // YYYY-MM-DD
  fileUrl?: string;
  fileName?: string;
  storagePath?: string; // Caminho no bucket exam-files para URL assinada
  items: LabExamItem[];
  doctorInterpretation?: string;
  isOcrParsed?: boolean;
}

export type VaccineDoseStatus = 'aplicada' | 'pendente' | 'atrasada' | 'proxima';

export interface VaccineRecord {
  id: string;
  vaccineId: string;
  vaccineName: string;
  targetDisease: string;
  targetAgeBracket: string;
  ageMonthsRecommended: number;
  doseNumber: number;
  totalDoses: number;
  status: VaccineDoseStatus;
  applicationDate?: string;
  batchNumber?: string;
  clinicName?: string;
  notes?: string;
}

export interface PrescriptionItem {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface CarePlan {
  diagnosisText: string;
  prescriptions: PrescriptionItem[];
  feedingInstructions: string;
  generalCareInstructions: string;
  warningSignsToReturn: string[];
  nextAppointmentRecommended: string; // e.g. "30 dias" ou data
}

export type ConsultationStatus = 'draft' | 'finalized';

export interface Consultation {
  id: string;
  doctorId: string;
  patientId: string;
  doctorName: string;
  doctorCrm: string;
  date: string; // ISO date
  anamnesis: Anamnesis;
  antropometry: AntropometricParams;
  vitals: ClinicalVitals;
  vitalsEvaluations: VitalsEvaluation[];
  exams: LabExam[];
  vaccineUpdates?: VaccineRecord[];
  carePlan: CarePlan;
  status?: ConsultationStatus;  // CFM 1.821/07 — imutabilidade
  finalizedAt?: string;
}

export interface ConsultationAmendment {
  id: string;
  consultationId: string;
  doctorId: string;
  doctorName: string;
  doctorCrm: string;
  amendmentText: string;
  createdAt: string;
}

export interface LegalConsent {
  id?: string;
  userId: string;
  patientId: string;
  consentType: 'tcle_pediatric' | 'privacy_policy';
  acceptedAt?: string;
  ipAddress?: string;
  guardianName: string;
  guardianCpf: string;
  termVersion: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  crm?: string;
  email: string;
  avatarUrl?: string;
}

export type NotificationCategory = 'vacina' | 'exame' | 'consulta' | 'orientacao' | 'alerta_clinico';
export type NotificationTarget = 'medico' | 'paciente' | 'ambos';

export interface PediatricNotification {
  id: string;
  patientId?: string;
  patientName?: string;
  title: string;
  message: string;
  category: NotificationCategory;
  targetRole: NotificationTarget;
  priority: 'baixa' | 'media' | 'alta' | 'critica';
  timestamp: string; // ISO date
  isRead: boolean;
  actionLink?: string;
  actionLabel?: string;
}

export type AppointmentType = 'rotina' | 'retorno' | 'urgencia' | 'desenvolvimento';
export type AppointmentStatus = 'agendada' | 'concluida' | 'cancelada';

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  motherName: string;
  doctorName: string;
  doctorCrm: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes?: number;
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  preparationChecklist?: string[];
  createdAt: string;
}

export interface NotificationPreferences {
  vaccineAlerts: boolean;
  criticalLabAlerts: boolean;
  appointmentReminders: boolean;
  newCarePlanAlerts: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsWhatsAppEnabled: boolean;
}

export interface DiagnosticHypothesis {
  condition: string;
  likelihood: 'Alta' | 'Moderada' | 'Acompanhar';
  reason: string;
  icd10?: string;
}

export interface ClinicalAlert {
  type: 'danger' | 'warning' | 'info';
  title: string;
  detail: string;
}

export interface ClinicalAiAnalysis {
  diagnosticHypotheses: DiagnosticHypothesis[];
  clinicalAlerts: ClinicalAlert[];
  recommendedExams: string[];
  carePlanSuggestions: {
    prescriptionsText?: string;
    feedingAdvice?: string;
    returnDays?: number;
    warningSigns?: string[];
  };
  growthSummary: string;
  disclaimer: string;
}

