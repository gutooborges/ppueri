import React, { useState } from 'react';
import { Patient, Consultation, VaccineRecord, Appointment } from '../../types/ppueri';
import { formatPediatricAge } from '../../lib/pediatric-rules';
import { GrowthChart } from '../ui/GrowthChart';
import { VaccineTracker } from '../ui/VaccineTracker';
import { AccessCodeGenerator } from '../ui/AccessCodeGenerator';
import { ArrowLeft, Plus, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface PatientClinicalViewProps {
  patient: Patient;
  consultations: Consultation[];
  vaccines: VaccineRecord[];
  appointments: Appointment[];
  onStartNewConsultation: () => void;
  onBack: () => void;
  onUpdateVaccineStatus: (vaccineId: string, status: VaccineRecord['status'], date?: string, batch?: string) => void;
  onRegenerateAccessCode: (patientId: string) => void;
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
  forcipe: 'Fórceps',
};

const breastfeedingLabel: Record<string, string> = {
  exclusivo: 'Aleitamento Exclusivo',
  misto: 'Aleitamento Misto',
  formula: 'Fórmula',
  desmamado: 'Desmamado',
};

export const PatientClinicalView: React.FC<PatientClinicalViewProps> = ({
  patient,
  consultations,
  vaccines,
  appointments,
  onStartNewConsultation,
  onBack,
  onUpdateVaccineStatus,
  onRegenerateAccessCode,
  doctorName: _doctorName,
  doctorCrm: _doctorCrm,
}) => {
  const [vaccinesExpanded, setVaccinesExpanded] = useState(false);

  const patientConsultations = [...consultations]
    .filter((c) => c.patientId === patient.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const latestConsultation = patientConsultations[0];
  const anamnesis = latestConsultation?.anamnesis;

  const nextApt = appointments.find(
    (a) => a.patientId === patient.id && a.status === 'agendada'
  );

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
                Mãe: {patient.motherName}&nbsp;·&nbsp;Código:{' '}
                <span className="font-mono font-bold text-sky-300">{patient.accessCode}</span>
                {nextApt && (
                  <span className="ml-2 text-sky-500">
                    · Próxima consulta:{' '}
                    {new Date(nextApt.date + 'T00:00:00').toLocaleDateString('pt-BR')} às{' '}
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

      {/* Summary Cards 2×2 */}
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
            {patient.bloodType && <Row label="Tipo Sanguíneo" value={patient.bloodType} />}
            {patient.cpf && <Row label="CPF" value={patient.cpf} />}
            <Row label="Código de Acesso" value={patient.accessCode} mono />
            {patient.allergies.length > 0 && (
              <Row
                label="Alergias"
                value={patient.allergies.join(', ')}
                highlight={
                  patient.allergies[0] !== 'Aprovado sem alergias conhecidas até o momento'
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

        {/* Histórico Familiar */}
        <div className="bg-white/80 border border-sky-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-extrabold text-sky-950 uppercase tracking-wider border-b border-sky-100 pb-2">
            Histórico Familiar
          </h3>
          {anamnesis?.familyHistory ? (
            <p className="text-xs text-sky-950 leading-relaxed">{anamnesis.familyHistory}</p>
          ) : (
            <p className="text-xs text-sky-700 font-medium">Sem dados registrados</p>
          )}
        </div>

        {/* Hábitos Atuais */}
        <div className="bg-white/80 border border-sky-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-extrabold text-sky-950 uppercase tracking-wider border-b border-sky-100 pb-2">
            Hábitos Atuais
          </h3>
          {anamnesis?.currentHabits ? (
            <p className="text-xs text-sky-950 leading-relaxed">{anamnesis.currentHabits}</p>
          ) : (
            <p className="text-xs text-sky-700 font-medium">Sem dados registrados</p>
          )}
        </div>
      </div>

      {/* Growth Chart - fed only by saved consultations */}
      <GrowthChart patient={patient} consultations={patientConsultations} />

      {/* Consultation Timeline */}
      <div className="bg-white/80 border border-sky-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-sky-100 pb-3">
          <FileText className="w-5 h-5 text-sky-700" />
          <h3 className="text-sm font-extrabold text-sky-950">Histórico de Consultas</h3>
          <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2 py-0.5 rounded-full border border-sky-200">
            {patientConsultations.length}{' '}
            {patientConsultations.length === 1 ? 'consulta' : 'consultas'}
          </span>
        </div>

        {patientConsultations.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm font-semibold text-sky-700">Nenhuma consulta registrada</p>
            <p className="text-xs text-sky-600">
              Clique em "Nova Consulta" para iniciar o primeiro atendimento.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {patientConsultations.map((c) => {
              const prescCount = c.carePlan.prescriptions.length;
              return (
                <div
                  key={c.id}
                  className="border border-sky-200 rounded-xl p-4 bg-sky-50/50 space-y-2"
                >
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
                    </div>
                    {prescCount > 0 && (
                      <span className="bg-sky-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {prescCount} prescrição{prescCount > 1 ? 'ões' : ''}
                      </span>
                    )}
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
                      <span className="text-sky-600 font-semibold">Hipótese:</span>{' '}
                      {c.carePlan.diagnosisText}
                    </p>
                  )}
                </div>
              );
            })}
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
            <span className="text-sm font-extrabold text-sky-950">Calendário Vacinal</span>
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
