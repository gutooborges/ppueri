import React, { useState, useEffect } from 'react';
import { Patient, Consultation, VaccineRecord, Appointment } from '../../types/ppueri';
import { formatPediatricAge } from '../../lib/pediatric-rules';
import {
  createParentExamSignedUrl,
  checkParentLegalConsent,
  insertParentLegalConsent,
  logParentAccessAudit,
} from '../../lib/storage-sync';
import { GrowthChart } from '../ui/GrowthChart';
import { VaccineTracker } from '../ui/VaccineTracker';
import { PatientAgendaTab } from './PatientAgendaTab';
import { LgpdConsentModal } from '../ui/LgpdConsentModal';
import {
  Stethoscope,
  Activity,
  Syringe,
  FileText,
  Download,
  ShieldAlert,
  ArrowLeft,
  Calendar,
  CheckCircle,
  CalendarDays,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

const TERM_VERSION = '1.0';

interface PatientPortalProps {
  parentId: string;
  patient: Patient;
  consultations: Consultation[];
  vaccines: VaccineRecord[];
  appointments?: Appointment[];
  onLogout: () => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  parentId,
  patient,
  consultations,
  vaccines,
  appointments = [],
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'resumo' | 'agenda' | 'crescimento' | 'vacinas' | 'documentos'>('resumo');
  const [loadingUrlExamId, setLoadingUrlExamId] = useState<string | null>(null);

  // LGPD consent state
  const [consentChecking, setConsentChecking] = useState(true);
  const [consentAccepted, setConsentAccepted] = useState(false);

  // Check if parent has already given consent for this patient
  useEffect(() => {
    if (!parentId || !patient?.id) {
      setConsentChecking(false);
      return;
    }
    checkParentLegalConsent(parentId, patient.id).then((hasConsent) => {
      setConsentAccepted(hasConsent);
      if (hasConsent) {
        // CFM 1.821/07 — Log access on every portal open when consent already exists
        logParentAccessAudit(parentId, patient.id, 'parent_view_patient_portal');
      }
      setConsentChecking(false);
    }).catch(() => {
      setConsentAccepted(false);
      setConsentChecking(false);
    });
  }, [parentId, patient?.id]);

  const handleConsentAccepted = async (guardianName: string, guardianCpf: string) => {
    // Insert both consent records (TCLE + Privacy Policy) atomically
    await Promise.all([
      insertParentLegalConsent({
        userId: parentId,
        patientId: patient.id,
        guardianName,
        guardianCpf,
        consentType: 'tcle_pediatric',
        termVersion: TERM_VERSION,
      }),
      insertParentLegalConsent({
        userId: parentId,
        patientId: patient.id,
        guardianName,
        guardianCpf,
        consentType: 'privacy_policy',
        termVersion: TERM_VERSION,
      }),
    ]);
    // CFM 1.821/07 — Log first access after consent
    await logParentAccessAudit(parentId, patient.id, 'parent_first_consent_and_access');
    setConsentAccepted(true);
  };

  const handleDownloadExam = async (examId: string, storagePath?: string) => {
    if (!storagePath) return;
    setLoadingUrlExamId(examId);
    const url = await createParentExamSignedUrl(storagePath);
    setLoadingUrlExamId(null);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Loading state while checking consent
  if (consentChecking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-600 text-sm font-semibold animate-pulse">
          Verificando autorizacao de acesso...
        </div>
      </div>
    );
  }

  // LGPD blocking modal — first access or no consent on record
  if (!consentAccepted) {
    return (
      <LgpdConsentModal
        patientName={patient?.name ?? 'Paciente'}
        onAccept={handleConsentAccepted}
      />
    );
  }

  const patientConsultations = consultations
    .filter((c) => c.patientId === patient.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const lastConsultation = patientConsultations[0];

  const patientAppointments = appointments
    .filter((a) => a.patientId === patient.id)
    .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());

  const nextUpcomingAppointment = patientAppointments.find((a) => a.status === 'agendada');

  return (
    <div className="space-y-6">
      {/* Patient Header Banner */}
      <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl p-6 shadow-xl border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-extrabold text-xl shadow-inner">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">{patient.name}</h1>
                <span className="bg-cyan-500/20 text-cyan-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  {formatPediatricAge(patient.birthDate)}
                </span>
              </div>
              <p className="text-xs text-blue-300/80 mt-0.5">
                Mae: {patient.motherName} | Codigo: <span className="font-mono font-bold text-blue-300">{patient.accessCode}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-white bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 px-4 py-2 rounded-xl transition-all shrink-0 shadow-sm"
          >
            <ArrowLeft strokeWidth={1.75} className="w-4 h-4" />
            <span>Sair do Portal</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 bg-white/85 backdrop-blur-sm p-1.5 rounded-2xl overflow-x-auto text-xs font-extrabold border border-slate-200/60 shadow-sm">
        <button
          onClick={() => setActiveTab('resumo')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'resumo'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-900 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Stethoscope strokeWidth={1.75} className="w-4 h-4" />
          <span>Visao Geral & Consulta</span>
        </button>
        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all relative ${
            activeTab === 'agenda'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-900 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Calendar strokeWidth={1.75} className="w-4 h-4" />
          <span>Agenda de Consultas</span>
          {nextUpcomingAppointment && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('crescimento')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'crescimento'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-900 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Activity strokeWidth={1.75} className="w-4 h-4" />
          <span>Evolucao de Crescimento</span>
        </button>
        <button
          onClick={() => setActiveTab('vacinas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'vacinas'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-900 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Syringe strokeWidth={1.75} className="w-4 h-4" />
          <span>Carteira Vacinal Digital</span>
        </button>
        <button
          onClick={() => setActiveTab('documentos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'documentos'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-900 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <FileText strokeWidth={1.75} className="w-4 h-4" />
          <span>Central de Documentos & Exames</span>
        </button>
      </div>

      {/* TAB 1: RESUMO DA ULTIMA CONSULTA */}
      {activeTab === 'resumo' && (
        <div className="space-y-6">
          {nextUpcomingAppointment && (
            <div className="bg-gradient-to-r from-slate-900 to-slate-900 text-white rounded-2xl p-5 shadow-md border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-blue-500/20 text-cyan-300 rounded-2xl border border-blue-400/30 shrink-0">
                  <Calendar strokeWidth={1.75} className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-cyan-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                      Proxima Consulta Agendada
                    </span>
                    <span className="text-blue-300 text-xs font-bold">
                      {nextUpcomingAppointment.type === 'rotina'
                        ? 'Puericultura de Rotina'
                        : nextUpcomingAppointment.type === 'retorno'
                        ? 'Retorno Clinico'
                        : 'Atendimento Pediatrico'}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">
                    {new Date(nextUpcomingAppointment.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}{' '}
                    as <span className="font-mono text-cyan-300 font-black">{nextUpcomingAppointment.time}</span>
                  </h3>
                  <p className="text-xs text-blue-200/90">
                    Com {nextUpcomingAppointment.doctorName} ({nextUpcomingAppointment.doctorCrm})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setActiveTab('agenda')}
                  className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  Ver Lembrete & Detalhes
                </button>
              </div>
            </div>
          )}

          {lastConsultation ? (
            <div className="space-y-6">
              {/* Antropometric Cards Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/85 backdrop-blur-sm border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
                    <Activity strokeWidth={1.75} className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-700 font-medium">Peso Atual</span>
                    <div className="text-xl font-extrabold text-slate-900">
                      {lastConsultation.antropometry.weightKg} kg
                    </div>
                    <span className="text-[11px] text-slate-700 font-bold">
                      Percentil P{lastConsultation.antropometry.weightPercentile}
                    </span>
                  </div>
                </div>

                <div className="bg-white/85 backdrop-blur-sm border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-3 bg-cyan-100 text-cyan-800 rounded-xl">
                    <Activity strokeWidth={1.75} className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-700 font-medium">Estatura / Altura</span>
                    <div className="text-xl font-extrabold text-slate-900">
                      {lastConsultation.antropometry.heightCm} cm
                    </div>
                    <span className="text-[11px] text-cyan-800 font-bold">
                      Percentil P{lastConsultation.antropometry.heightPercentile}
                    </span>
                  </div>
                </div>

                <div className="bg-white/85 backdrop-blur-sm border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
                    <Activity strokeWidth={1.75} className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-700 font-medium">Perimetro Cefalico</span>
                    <div className="text-xl font-extrabold text-slate-900">
                      {lastConsultation.antropometry.headCircumferenceCm || 'N/A'}{' '}
                      {lastConsultation.antropometry.headCircumferenceCm ? 'cm' : ''}
                    </div>
                    <span className="text-[11px] text-slate-700 font-bold">
                      {lastConsultation.antropometry.headCircumferencePercentile
                        ? `Percentil P${lastConsultation.antropometry.headCircumferencePercentile}`
                        : 'Acompanhamento ate 3 anos'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assessment & Care Plan */}
              <div className="bg-white/85 backdrop-blur-sm border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                      Ultimo Atendimento em {new Date(lastConsultation.date).toLocaleDateString('pt-BR')}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">
                      Avaliacao Pediatrica do Medico
                    </h2>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-extrabold text-slate-900">{lastConsultation.doctorName}</span>
                    <div className="text-slate-700 text-[11px]">{lastConsultation.doctorCrm}</div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-900 font-medium">
                  <div className="font-bold text-slate-900 mb-1">Parecer Sintetico do Pediatra:</div>
                  {lastConsultation.carePlan.diagnosisText}
                </div>

                {lastConsultation.carePlan.prescriptions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Prescricao Medica e Medicamentos:
                    </h3>
                    <div className="space-y-2">
                      {lastConsultation.carePlan.prescriptions.map((rx) => (
                        <div key={rx.id} className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                          <div className="font-extrabold text-slate-900 text-sm">{rx.medication}</div>
                          <div className="text-slate-900 flex flex-wrap gap-x-4">
                            <span>Dose: <strong>{rx.dosage}</strong></span>
                            <span>Frequencia: <strong>{rx.frequency}</strong></span>
                            <span>Duracao: <strong>{rx.duration}</strong></span>
                          </div>
                          {rx.instructions && (
                            <p className="text-slate-700 italic pt-1 border-t border-slate-200/60">
                              {rx.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900">Orientacoes de Alimentacao:</div>
                    <p className="text-slate-900 leading-relaxed">{lastConsultation.carePlan.feedingInstructions}</p>
                  </div>
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900">Cuidados Gerais e Estimulacao:</div>
                    <p className="text-slate-900 leading-relaxed">{lastConsultation.carePlan.generalCareInstructions}</p>
                  </div>
                </div>

                {lastConsultation.carePlan.warningSignsToReturn.length > 0 && (
                  <div className="bg-slate-100/80 border border-slate-300/80 rounded-xl p-4 text-xs text-slate-900 space-y-2">
                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <ShieldAlert strokeWidth={1.75} className="w-4 h-4 text-slate-600" />
                      Sinais de Alerta para Retorno Imediato ao Pronto-Socorro:
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-900 font-semibold">
                      {lastConsultation.carePlan.warningSignsToReturn.map((sign, idx) => (
                        <li key={idx}>{sign}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/85 backdrop-blur-sm border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-8 text-center text-xs text-slate-700 font-bold">
              Nenhuma consulta registrada para este paciente ate o momento.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AGENDA */}
      {activeTab === 'agenda' && (
        <PatientAgendaTab
          patient={patient}
          appointments={appointments}
          consultations={consultations}
        />
      )}

      {/* TAB 3: CRESCIMENTO */}
      {activeTab === 'crescimento' && (
        <GrowthChart patient={patient} consultations={consultations} />
      )}

      {/* TAB 4: VACINAS */}
      {activeTab === 'vacinas' && (
        <VaccineTracker
          vaccines={vaccines}
          onUpdateVaccineStatus={() => {}}
          isDoctorView={false}
        />
      )}

      {/* TAB 5: DOCUMENTOS */}
      {activeTab === 'documentos' && (
        <div className="bg-white/85 backdrop-blur-sm border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Central de Exames e Receitas Medicas</h2>
            <p className="text-xs text-slate-700">Documentos digitais validados e laudos em formato PDF</p>
          </div>

          <div className="space-y-3">
            {patientConsultations.flatMap((c) => c.exams).length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-700 font-semibold">
                Nenhum laudo de exame disponivel para download no momento.
              </div>
            ) : (
              patientConsultations.flatMap((c) => c.exams).map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                      <FileText strokeWidth={1.75} className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">{exam.title}</div>
                      <div className="text-slate-700 font-medium">
                        Categoria: {exam.category} | Data: {new Date(exam.date).toLocaleDateString('pt-BR')}
                      </div>
                      {exam.doctorInterpretation && (
                        <p className="text-slate-600 italic mt-0.5 text-[11px] max-w-xs">
                          Parecer: {exam.doctorInterpretation}
                        </p>
                      )}
                    </div>
                  </div>

                  {exam.storagePath ? (
                    <button
                      onClick={() => handleDownloadExam(exam.id, exam.storagePath)}
                      disabled={loadingUrlExamId === exam.id}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-4 py-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 shadow-sm shrink-0"
                    >
                      {loadingUrlExamId === exam.id ? (
                        <><RefreshCw strokeWidth={1.75} className="w-3.5 h-3.5 animate-spin" /><span>Gerando link...</span></>
                      ) : (
                        <><ExternalLink strokeWidth={1.75} className="w-3.5 h-3.5" /><span>Visualizar Arquivo</span></>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-slate-100 text-slate-500 font-semibold px-4 py-2 rounded-xl text-xs shrink-0 cursor-not-allowed">
                      <Download strokeWidth={1.75} className="w-3.5 h-3.5" />
                      <span>Sem arquivo</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
