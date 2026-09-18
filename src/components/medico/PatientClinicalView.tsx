import React, { useState, useEffect } from 'react';
import { Patient, Consultation, VaccineRecord, Appointment, LabExam, ConsultationAmendment } from '../../types/ppueri';
import { formatPediatricAge } from '../../lib/pediatric-rules';
import { createExamSignedUrl, logAccessAudit } from '../../lib/storage-sync';
import { GrowthChart } from '../ui/GrowthChart';
import { VaccineTracker } from '../ui/VaccineTracker';
import { AccessCodeGenerator } from '../ui/AccessCodeGenerator';
import {
  ArrowLeft,
  Plus,
  ChevronDown,
  ChevronUp,
  FileText,
  Microscope,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Trash2,
  RefreshCw,
  Lock,
  FilePen,
  History,
  CheckCircle2,
  X,
} from 'lucide-react';

interface PatientClinicalViewProps {
  patient: Patient;
  consultations: Consultation[];
  vaccines: VaccineRecord[];
  appointments: Appointment[];
  amendments: ConsultationAmendment[];
  onStartNewConsultation: () => void;
  onBack: () => void;
  onUpdateVaccineStatus: (vaccineId: string, status: VaccineRecord['status'], date?: string, batch?: string) => void;
  onRegenerateAccessCode: (patientId: string) => void;
  onDeleteExam?: (examId: string, storagePath?: string) => void;
  onFinalizeConsultation: (consultationId: string) => Promise<void>;
  onAddAmendment: (consultationId: string, text: string) => Promise<void>;
  doctorId: string;
  doctorName: string;
  doctorCrm: string;
}

interface RowProps {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}

const Row: React.FC<RowProps> = ({ label, value, mono, highlight }) => (
  <div className="flex justify-between gap-2">
    <span className="text-sky-600 font-medium shrink-0">{label}:</span>
    <span
      className={`text-right font-bold text-sky-950 ${mono ? 'font-mono' : ''} ${
        highlight ? 'text-red-700' : ''
      }`}
    >
      {value}
    </span>
  </div>
);

const birthTypeLabel: Record<string, string> = {
  vaginal: 'Vaginal',
  cesarea: 'Cesariana',
  forcipe: 'Forceps',
};

const breastfeedingLabel: Record<string, string> = {
  exclusivo: 'Aleitamento Exclusivo',
  misto: 'Aleitamento Misto',
  formula: 'Formula',
  desmamado: 'Desmamado',
};

export const PatientClinicalView: React.FC<PatientClinicalViewProps> = ({
  patient,
  consultations,
  vaccines,
  appointments,
  amendments,
  onStartNewConsultation,
  onBack,
  onUpdateVaccineStatus,
  onRegenerateAccessCode,
  onDeleteExam,
  onFinalizeConsultation,
  onAddAmendment,
  doctorId,
  doctorName: _doctorName,
  doctorCrm: _doctorCrm,
}) => {
  const [vaccinesExpanded, setVaccinesExpanded] = useState(false);
  const [examsExpanded, setExamsExpanded] = useState(false);
  const [loadingUrlExamId, setLoadingUrlExamId] = useState<string | null>(null);
  const [finalizingId, setFinalizingId] = useState<string | null>(null);
  const [amendingConsultationId, setAmendingConsultationId] = useState<string | null>(null);
  const [amendmentText, setAmendmentText] = useState('');
  const [savingAmendment, setSavingAmendment] = useState(false);

  // CFM 1.821/07 — Trilha de auditoria: registra acesso ao prontuario
  useEffect(() => {
    if (patient?.id && doctorId) {
      logAccessAudit(doctorId, patient.id, 'view_patient_record');
    }
  }, [patient?.id, doctorId]);

  const handleViewOriginal = async (exam: LabExam) => {
    if (!exam.storagePath) return;
    setLoadingUrlExamId(exam.id);
    const url = await createExamSignedUrl(exam.storagePath);
    setLoadingUrlExamId(null);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDeleteExam = (exam: LabExam) => {
    if (!onDeleteExam) return;
    if (!window.confirm(`Excluir o exame "${exam.title}"? O arquivo original tambem sera removido do armazenamento seguro.`)) return;
    onDeleteExam(exam.id, exam.storagePath);
  };

  const handleFinalizeConsultation = async (consultationId: string) => {
    if (!window.confirm(
      'Finalizar esta evolucao? Apos a finalizacao, o texto original nao podera ser editado diretamente.\n\n' +
      'Correcoes e retificacoes serao feitas exclusivamente por meio de adendos clinicos, conforme a Resolucao CFM n. 1.821/07.'
    )) return;
    setFinalizingId(consultationId);
    await onFinalizeConsultation(consultationId);
    setFinalizingId(null);
  };

  const handleSaveAmendment = async () => {
    if (!amendingConsultationId || !amendmentText.trim() || savingAmendment) return;
    setSavingAmendment(true);
    await onAddAmendment(amendingConsultationId, amendmentText.trim());
    setSavingAmendment(false);
    setAmendingConsultationId(null);
    setAmendmentText('');
  };

  const patientConsultations = [...consultations]
    .filter((c) => c.patientId === patient.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const latestConsultation = patientConsultations[0];
  const anamnesis = latestConsultation?.anamnesis;

  const allExams: LabExam[] = patientConsultations.flatMap((c) => c.exams ?? []);

  const nextApt = appointments.find(
    (a) => a.patientId === patient.id && a.status === 'agendada'
  );

  const getConsultationAmendments = (consultationId: string) =>
    amendments.filter((a) => a.consultationId === consultationId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-sky-900/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-sky-950/80 hover:bg-sky-900 text-sky-300 hover:text-white transition-all border border-sky-800"
              title="Voltar ao painel"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-white">{patient.name}</h1>
                <span className="bg-sky-500/20 text-sky-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-sky-500/30">
                  {formatPediatricAge(patient.birthDate)}
                </span>
                <span className="bg-sky-900/60 text-sky-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {patient.gender === 'masculino' ? 'Menino' : 'Menina'}
                </span>
              </div>
              <p className="text-xs text-sky-400 mt-0.5">
                Mae: {patient.motherName}&nbsp;·&nbsp;Codigo:{' '}
                <span className="font-mono font-bold text-sky-300">{patient.accessCode}</span>
                {nextApt && (
                  <span className="ml-2 text-sky-500">
                    · Proxima consulta:{' '}
                    {new Date(nextApt.date + 'T00:00:00').toLocaleDateString('pt-BR')} as{' '}
                    {nextApt.time}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onStartNewConsultation}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md border border-sky-500/40 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nova Consulta
          </button>
        </div>
      </div>

      {/* Summary Cards 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dados Gerais */}
        <div className="bg-white/80 border border-sky-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-extrabold text-sky-950 uppercase tracking-wider border-b border-sky-100 pb-2">
            Dados Gerais
          </h3>
          <div className="space-y-1.5 text-xs">
            <Row label="Nome" value={patient.name} />
            <Row
              label="Data de Nascimento"
              value={new Date(patient.birthDate + 'T00:00:00').toLocaleDateString('pt-BR')}
            />
            <Row
              label="Sexo"
              value={patient.gender === 'masculino' ? 'Masculino' : 'Feminino'}
            />
            {patient.bloodType && <Row label="Tipo Sanguineo" value={patient.bloodType} />}
            {patient.cpf && <Row label="CPF" value={patient.cpf} />}
            <Row label="Codigo de Acesso" value={patient.accessCode} mono />
            {patient.allergies.length > 0 && (
              <Row
                label="Alergias"
                value={patient.allergies.join(', ')}
                highlight={
                  patient.allergies[0] !== 'Aprovado sem alergias conhecidas ate o momento'
                }
              />
            )}
          </div>
        </div>

        {/* Antecedentes Perinatais */}
        <div className="bg-white/80 border border-sky-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-extrabold text-sky-950 uppercase tracking-wider border-b border-sky-100 pb-2">
            Antecedentes Perinatais
          </h3>
          {anamnesis ? (
            <div className="space-y-1.5 text-xs">
              <Row
                label="Tipo de Parto"
                value={birthTypeLabel[anamnesis.birthType] ?? anamnesis.birthType}
              />
              <Row label="Peso ao Nascer" value={`${anamnesis.birthWeightKg} kg`} />
              <Row
                label="APGAR 1'/5'"
                value={`${anamnesis.apgar1Min} / ${anamnesis.apgar5Min}`}
              />
              <Row
                label="Aleitamento"
                value={
                  breastfeedingLabel[anamnesis.breastfeedingStatus] ??
                  anamnesis.breastfeedingStatus
                }
              />
              {anamnesis.currentMedications.length > 0 && (
                <Row
                  label="Medicamentos Atuais"
                  value={anamnesis.currentMedications.join(', ')}
                />
              )}
            </div>
          ) : (
            <p className="text-xs text-sky-700 font-medium">Sem dados registrados</p>
          )}
        </div>

        {/* Historico Familiar */}
        <div className="bg-white/80 border border-sky-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-extrabold text-sky-950 uppercase tracking-wider border-b border-sky-100 pb-2">
            Historico Familiar
          </h3>
          {anamnesis?.familyHistory ? (
            <p className="text-xs text-sky-950 leading-relaxed">{anamnesis.familyHistory}</p>
          ) : (
            <p className="text-xs text-sky-700 font-medium">Sem dados registrados</p>
          )}
        </div>

        {/* Habitos Atuais */}
        <div className="bg-white/80 border border-sky-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-extrabold text-sky-950 uppercase tracking-wider border-b border-sky-100 pb-2">
            Habitos Atuais
          </h3>
          {anamnesis?.currentHabits ? (
            <p className="text-xs text-sky-950 leading-relaxed">{anamnesis.currentHabits}</p>
          ) : (
            <p className="text-xs text-sky-700 font-medium">Sem dados registrados</p>
          )}
        </div>
      </div>

      {/* Consultation Timeline — CFM 1.821/07 — imutabilidade e adendos */}
      <div className="bg-white/80 border border-sky-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-sky-100 pb-3">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-sky-700" />
            <h3 className="text-sm font-extrabold text-sky-950">Historico de Consultas</h3>
            <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2 py-0.5 rounded-full border border-sky-200">
              {patientConsultations.length}{' '}
              {patientConsultations.length === 1 ? 'consulta' : 'consultas'}
            </span>
          </div>
          <button
            onClick={onStartNewConsultation}
            className="flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-100 hover:bg-sky-200 border border-sky-300 px-3 py-1.5 rounded-xl transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Consulta
          </button>
        </div>

        {patientConsultations.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm font-semibold text-sky-700">Nenhuma consulta registrada</p>
            <p className="text-xs text-sky-600">
              Clique em "Nova Consulta" para iniciar o primeiro atendimento.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {patientConsultations.map((c) => {
              const prescCount = c.carePlan.prescriptions.length;
              const examCount = (c.exams ?? []).length;
              const isFinalized = c.status === 'finalized';
              const consultAmendments = getConsultationAmendments(c.id);
              const isAmending = amendingConsultationId === c.id;

              return (
                <div
                  key={c.id}
                  className={`border rounded-xl overflow-hidden ${
                    isFinalized
                      ? 'border-sky-300 bg-sky-50/30'
                      : 'border-sky-200 bg-sky-50/50'
                  }`}
                >
                  {/* Consultation header */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-sky-950">
                          {new Date(c.date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-xs text-sky-600 font-medium">· {c.doctorName}</span>
                        {/* Status badge — CFM 1.821/07 */}
                        {isFinalized ? (
                          <span className="inline-flex items-center gap-1 bg-sky-900 text-sky-200 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-sky-700">
                            <Lock className="w-2.5 h-2.5" />
                            FINALIZADO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-300">
                            RASCUNHO
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {examCount > 0 && (
                          <span className="bg-sky-100 text-sky-800 border border-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {examCount} exame{examCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {prescCount > 0 && (
                          <span className="bg-sky-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {prescCount} prescricao{prescCount > 1 ? 'oes' : ''}
                          </span>
                        )}
                        {/* Action buttons — CFM 1.821/07 */}
                        {!isFinalized && (
                          <button
                            onClick={() => handleFinalizeConsultation(c.id)}
                            disabled={finalizingId === c.id}
                            className="flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 border border-sky-300 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                            title="Finalizar evolucao — bloqueia edicao direta (CFM 1.821/07)"
                          >
                            {finalizingId === c.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            Finalizar Evolucao
                          </button>
                        )}
                        {isFinalized && (
                          <button
                            onClick={() => {
                              if (isAmending) {
                                setAmendingConsultationId(null);
                                setAmendmentText('');
                              } else {
                                setAmendingConsultationId(c.id);
                                setAmendmentText('');
                              }
                            }}
                            className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg transition-colors"
                            title="Adicionar retificacao ou adendo clinico (CFM 1.821/07)"
                          >
                            <FilePen className="w-3 h-3" />
                            {isAmending ? 'Cancelar Adendo' : 'Adicionar Retificacao / Adendo Clinico'}
                          </button>
                        )}
                      </div>
                    </div>

                    {c.anamnesis.chiefComplaint && (
                      <p className="text-xs text-sky-900 font-medium">
                        <span className="text-sky-600 font-semibold">QP:</span>{' '}
                        {c.anamnesis.chiefComplaint}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs text-sky-800 font-medium">
                      {c.antropometry.weightKg > 0 && (
                        <span>
                          Peso: <strong>{c.antropometry.weightKg} kg</strong>
                          {c.antropometry.weightZScore !== undefined && (
                            <span className="text-sky-600">
                              {' '}
                              (Z: {c.antropometry.weightZScore > 0 ? '+' : ''}
                              {c.antropometry.weightZScore})
                            </span>
                          )}
                        </span>
                      )}
                      {c.antropometry.heightCm > 0 && (
                        <span>
                          Estatura: <strong>{c.antropometry.heightCm} cm</strong>
                          {c.antropometry.heightZScore !== undefined && (
                            <span className="text-sky-600">
                              {' '}
                              (Z: {c.antropometry.heightZScore > 0 ? '+' : ''}
                              {c.antropometry.heightZScore})
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    {c.carePlan.diagnosisText && (
                      <p className="text-xs text-sky-900 font-medium">
                        <span className="text-sky-600 font-semibold">Hipotese:</span>{' '}
                        {c.carePlan.diagnosisText}
                      </p>
                    )}

                    {isFinalized && c.finalizedAt && (
                      <p className="text-[10px] text-sky-500 font-medium mt-1">
                        <Lock className="inline w-2.5 h-2.5 mr-1" />
                        Prontuario finalizado em{' '}
                        {new Date(c.finalizedAt).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}{' '}
                        — Resolucao CFM n. 1.821/07
                      </p>
                    )}
                  </div>

                  {/* Amendment form — inline, opens when "Adicionar Adendo" is clicked */}
                  {isAmending && (
                    <div className="border-t border-amber-200 bg-amber-50/60 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <FilePen className="w-4 h-4 text-amber-700" />
                        <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                          Novo Adendo / Retificacao Clinica
                        </span>
                        <span className="text-[10px] text-amber-700 font-medium">
                          — sera assinado em {new Date().toLocaleString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', second: '2-digit',
                          })}
                        </span>
                      </div>
                      <textarea
                        value={amendmentText}
                        onChange={(e) => setAmendmentText(e.target.value)}
                        placeholder="Descreva a retificacao ou informacao complementar a ser adicionada ao prontuario. Este adendo nao substitui o registro original — sera exibido abaixo da evolucao com carimbo indelevel de autoria e data/hora."
                        rows={4}
                        className="w-full text-xs bg-white border border-amber-300 text-slate-900 px-3 py-2.5 rounded-xl placeholder-amber-400/70 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 resize-none"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => {
                            setAmendingConsultationId(null);
                            setAmendmentText('');
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <X className="w-3 h-3" />
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveAmendment}
                          disabled={!amendmentText.trim() || savingAmendment}
                          className="flex items-center gap-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 border border-amber-500 disabled:border-amber-300 px-4 py-1.5 rounded-lg transition-colors disabled:cursor-not-allowed"
                        >
                          {savingAmendment ? (
                            <><RefreshCw className="w-3 h-3 animate-spin" /> Salvando...</>
                          ) : (
                            <><FilePen className="w-3 h-3" /> Salvar Adendo</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Amendments list — CFM 1.821/07 — carimbo indelevel */}
                  {consultAmendments.length > 0 && (
                    <div className="border-t border-amber-200 bg-amber-50/40 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <History className="w-3.5 h-3.5 text-amber-700" />
                        <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">
                          Adendos e Retificacoes Clinicas ({consultAmendments.length})
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {consultAmendments.map((amendment) => (
                          <div
                            key={amendment.id}
                            className="border-l-4 border-amber-500 pl-3.5 py-1 space-y-1"
                          >
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                              <FilePen className="w-3 h-3 shrink-0" />
                              <span>Adendo Clinico</span>
                              <span className="font-normal text-amber-600">·</span>
                              <span className="font-bold text-amber-700 normal-case tracking-normal">
                                {new Date(amendment.createdAt).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>
                              <span className="font-normal text-amber-600">·</span>
                              <span className="font-bold text-amber-700 normal-case tracking-normal">
                                {amendment.doctorName} — {amendment.doctorCrm}
                              </span>
                            </div>
                            <p className="text-xs text-amber-900 leading-relaxed">
                              {amendment.amendmentText}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Growth Chart */}
      <GrowthChart patient={patient} consultations={patientConsultations} />

      {/* Lab Exams (collapsible) */}
      <div className="bg-white/80 border border-sky-200 rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setExamsExpanded(!examsExpanded)}
          className="w-full flex items-center justify-between p-5 hover:bg-sky-50/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Microscope className="w-4 h-4 text-sky-700" />
            <span className="text-sm font-extrabold text-sky-950">Exames Complementares</span>
            <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2 py-0.5 rounded-full border border-sky-200">
              {allExams.length} {allExams.length === 1 ? 'exame' : 'exames'}
            </span>
          </div>
          {examsExpanded ? (
            <ChevronUp className="w-4 h-4 text-sky-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-sky-700" />
          )}
        </button>

        {examsExpanded && (
          <div className="border-t border-sky-200 p-4 space-y-4">
            {allExams.length === 0 ? (
              <p className="text-xs text-sky-700 font-medium text-center py-4">
                Nenhum exame complementar registrado. Vincule exames durante uma consulta usando o Leitor OCR.
              </p>
            ) : (
              allExams.map((exam) => (
                <div key={exam.id} className="border border-sky-200 rounded-xl overflow-hidden">
                  <div className="bg-sky-50 px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-sky-950">{exam.title}</span>
                      <span className="bg-sky-200 text-sky-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {exam.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-sky-600 font-medium">
                        {new Date(exam.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      {exam.storagePath && (
                        <button
                          onClick={() => handleViewOriginal(exam)}
                          disabled={loadingUrlExamId === exam.id}
                          className="flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 border border-sky-300 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                          title="Abrir arquivo original no Supabase Storage"
                        >
                          {loadingUrlExamId === exam.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <ExternalLink className="w-3 h-3" />
                          )}
                          <span>Arquivo Original</span>
                        </button>
                      )}
                      {onDeleteExam && (
                        <button
                          onClick={() => handleDeleteExam(exam)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir exame e arquivo do storage"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-3 py-2">Parametro</th>
                          <th className="px-3 py-2">Resultado</th>
                          <th className="px-3 py-2">Unidade</th>
                          <th className="px-3 py-2">Referencia Pediatrica</th>
                          <th className="px-3 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800">
                        {exam.items.map((item, idx) => {
                          const isNormal = item.status === 'normal';
                          return (
                            <tr
                              key={idx}
                              className={
                                isNormal ? 'hover:bg-slate-50' : 'bg-sky-50/70 font-semibold'
                              }
                            >
                              <td className="px-3 py-2 font-medium text-slate-900">
                                {item.parameter}
                              </td>
                              <td className="px-3 py-2 font-bold">{item.value}</td>
                              <td className="px-3 py-2 text-slate-500">{item.unit}</td>
                              <td className="px-3 py-2 text-slate-600">{item.referenceRange}</td>
                              <td className="px-3 py-2 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isNormal
                                      ? 'bg-sky-100 text-sky-800'
                                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                                  }`}
                                >
                                  {isNormal ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 text-sky-600" />
                                      Normal
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                                      {item.status === 'alterado_alto' ? 'Elevado' : 'Abaixo'}
                                    </>
                                  )}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {exam.doctorInterpretation && (
                    <div className="px-4 py-2.5 border-t border-sky-100 bg-sky-50/30">
                      <p className="text-xs text-sky-800">
                        <span className="font-semibold text-sky-700">Parecer medico: </span>
                        {exam.doctorInterpretation}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Vaccine Tracker (collapsible) */}
      <div className="bg-white/80 border border-sky-200 rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setVaccinesExpanded(!vaccinesExpanded)}
          className="w-full flex items-center justify-between p-5 hover:bg-sky-50/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-extrabold text-sky-950">Calendario Vacinal</span>
            <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2 py-0.5 rounded-full border border-sky-200">
              {vaccines.filter((v) => v.status === 'aplicada').length}/{vaccines.length} aplicadas
            </span>
          </div>
          {vaccinesExpanded ? (
            <ChevronUp className="w-4 h-4 text-sky-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-sky-700" />
          )}
        </button>
        {vaccinesExpanded && (
          <div className="border-t border-sky-200 p-4">
            <VaccineTracker
              vaccines={vaccines}
              onUpdateVaccineStatus={onUpdateVaccineStatus}
              isDoctorView
            />
          </div>
        )}
      </div>

      {/* Access Code Generator */}
      <AccessCodeGenerator patient={patient} onRegenerateCode={onRegenerateAccessCode} />
    </div>
  );
};
