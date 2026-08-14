import React, { useState } from 'react';
import { Patient, Consultation, VaccineRecord, Appointment } from '../../types/ppueri';
import { formatPediatricAge } from '../../lib/pediatric-rules';
import { GrowthChart } from '../ui/GrowthChart';
import { VaccineTracker } from '../ui/VaccineTracker';
import { PatientAgendaTab } from './PatientAgendaTab';
import {
  Stethoscope,
  Activity,
  Syringe,
  FileText,
  Download,
  ShieldAlert,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  CalendarDays,
} from 'lucide-react';

interface PatientPortalProps {
  patient: Patient;
  consultations: Consultation[];
  vaccines: VaccineRecord[];
  appointments?: Appointment[];
  onLogout: () => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  patient,
  consultations,
  vaccines,
  appointments = [],
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'resumo' | 'agenda' | 'crescimento' | 'vacinas' | 'documentos'>('resumo');

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
      <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl p-6 shadow-xl border border-sky-900/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 font-extrabold text-xl shadow-inner">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">{patient.name}</h1>
                <span className="bg-cyan-500/20 text-cyan-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  {formatPediatricAge(patient.birthDate)}
                </span>
              </div>
              <p className="text-xs text-sky-200/80 mt-0.5">
                Mãe: {patient.motherName} | Código: <span className="font-mono font-bold text-sky-300">{patient.accessCode}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-sky-200 hover:text-white bg-sky-950/80 hover:bg-sky-900 border border-sky-800/80 px-4 py-2 rounded-xl transition-all shrink-0 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sair do Portal</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl overflow-x-auto text-xs font-extrabold border border-sky-200/80 shadow-sm">
        <button
          onClick={() => setActiveTab('resumo')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'resumo'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-sky-900 hover:text-sky-950 hover:bg-sky-100/60'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Visão Geral & Consulta</span>
        </button>
        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all relative ${
            activeTab === 'agenda'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-sky-900 hover:text-sky-950 hover:bg-sky-100/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
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
              : 'text-sky-900 hover:text-sky-950 hover:bg-sky-100/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Evolução de Crescimento</span>
        </button>
        <button
          onClick={() => setActiveTab('vacinas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'vacinas'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-sky-900 hover:text-sky-950 hover:bg-sky-100/60'
          }`}
        >
          <Syringe className="w-4 h-4" />
          <span>Carteira Vacinal Digital</span>
        </button>
        <button
          onClick={() => setActiveTab('documentos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'documentos'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-sky-900 hover:text-sky-950 hover:bg-sky-100/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Central de Documentos & Exames</span>
        </button>
      </div>

      {/* TAB 1: RESUMO DA ÚLTIMA CONSULTA & PRÓXIMA CONSULTA HERO */}
      {activeTab === 'resumo' && (
        <div className="space-y-6">
          {/* Próxima Consulta Hero Card */}
          {nextUpcomingAppointment && (
            <div className="bg-gradient-to-r from-sky-900 to-slate-900 text-white rounded-2xl p-5 shadow-md border border-sky-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-sky-500/20 text-cyan-300 rounded-2xl border border-sky-400/30 shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-cyan-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                      Próxima Consulta Agendada
                    </span>
                    <span className="text-sky-300 text-xs font-bold">
                      {nextUpcomingAppointment.type === 'rotina'
                        ? 'Puericultura de Rotina'
                        : nextUpcomingAppointment.type === 'retorno'
                        ? 'Retorno Clínico'
                        : 'Atendimento Pediátrico'}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">
                    {new Date(nextUpcomingAppointment.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}{' '}
                    às <span className="font-mono text-cyan-300 font-black">{nextUpcomingAppointment.time}</span>
                  </h3>
                  <p className="text-xs text-sky-200/90">
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
                <div className="bg-white/80 backdrop-blur-md border border-sky-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-sky-100 text-sky-800 rounded-xl">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-sky-800 font-medium">Peso Atual</span>
                    <div className="text-xl font-extrabold text-sky-950">
                      {lastConsultation.antropometry.weightKg} kg
                    </div>
                    <span className="text-[11px] text-sky-800 font-bold">
                      Percentil P{lastConsultation.antropometry.weightPercentile}
                    </span>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-md border border-sky-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-cyan-100 text-cyan-800 rounded-xl">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-sky-800 font-medium">Estatura / Altura</span>
                    <div className="text-xl font-extrabold text-sky-950">
                      {lastConsultation.antropometry.heightCm} cm
                    </div>
                    <span className="text-[11px] text-cyan-800 font-bold">
                      Percentil P{lastConsultation.antropometry.heightPercentile}
                    </span>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-md border border-sky-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-sky-100 text-sky-800 rounded-xl">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-sky-800 font-medium">Perímetro Cefálico</span>
                    <div className="text-xl font-extrabold text-sky-950">
                      {lastConsultation.antropometry.headCircumferenceCm || 'N/A'} {lastConsultation.antropometry.headCircumferenceCm ? 'cm' : ''}
                    </div>
                    <span className="text-[11px] text-sky-800 font-bold">
                      {lastConsultation.antropometry.headCircumferencePercentile
                        ? `Percentil P${lastConsultation.antropometry.headCircumferencePercentile}`
                        : 'Acompanhamento até 3 anos'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assessment & Care Plan */}
              <div className="bg-white/80 backdrop-blur-md border border-sky-200/80 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-sky-100 pb-3">
                  <div>
                    <span className="text-xs font-extrabold text-sky-700 uppercase tracking-wider">
                      Último Atendimento em {new Date(lastConsultation.date).toLocaleDateString('pt-BR')}
                    </span>
                    <h2 className="text-base font-bold text-sky-950 mt-0.5">
                      Avaliação Pediátrica do Médico
                    </h2>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-extrabold text-sky-950">{lastConsultation.doctorName}</span>
                    <div className="text-sky-800 text-[11px]">{lastConsultation.doctorCrm}</div>
                  </div>
                </div>

                {/* Diagnostic Summary */}
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-950 font-medium">
                  <div className="font-bold text-sky-900 mb-1">Parecer Sintético do Pediatra:</div>
                  {lastConsultation.carePlan.diagnosisText}
                </div>

                {/* Prescriptions */}
                {lastConsultation.carePlan.prescriptions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-sky-900 uppercase tracking-wider">
                      Prescrição Médica e Medicamentos:
                    </h3>
                    <div className="space-y-2">
                      {lastConsultation.carePlan.prescriptions.map((rx) => (
                        <div key={rx.id} className="bg-sky-50/70 border border-sky-200 rounded-xl p-3 text-xs space-y-1">
                          <div className="font-extrabold text-sky-950 text-sm">{rx.medication}</div>
                          <div className="text-sky-900 flex flex-wrap gap-x-4">
                            <span>Dose: <strong>{rx.dosage}</strong></span>
                            <span>Frequência: <strong>{rx.frequency}</strong></span>
                            <span>Duração: <strong>{rx.duration}</strong></span>
                          </div>
                          {rx.instructions && (
                            <p className="text-sky-800 italic pt-1 border-t border-sky-200/60">
                              {rx.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feeding & Care Instructions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200 space-y-1">
                    <div className="font-bold text-sky-950">Orientações de Alimentação:</div>
                    <p className="text-sky-900 leading-relaxed">{lastConsultation.carePlan.feedingInstructions}</p>
                  </div>

                  <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200 space-y-1">
                    <div className="font-bold text-sky-950">Cuidados Gerais e Estimulação:</div>
                    <p className="text-sky-900 leading-relaxed">{lastConsultation.carePlan.generalCareInstructions}</p>
                  </div>
                </div>

                {/* Warning Signs */}
                {lastConsultation.carePlan.warningSignsToReturn.length > 0 && (
                  <div className="bg-sky-100/80 border border-sky-300/80 rounded-xl p-4 text-xs text-sky-950 space-y-2">
                    <div className="font-extrabold text-sky-950 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-sky-700" />
                      Sinais de Alerta para Retorno Imediato ao Pronto-Socorro:
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sky-950 font-semibold">
                      {lastConsultation.carePlan.warningSignsToReturn.map((sign, idx) => (
                        <li key={idx}>{sign}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/80 border border-sky-200 rounded-2xl p-8 text-center text-xs text-sky-800 font-bold">
              Nenhuma consulta registrada para este paciente até o momento.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AGENDA & HISTÓRICO DE CONSULTAS */}
      {activeTab === 'agenda' && (
        <PatientAgendaTab
          patient={patient}
          appointments={appointments}
          consultations={consultations}
        />
      )}

      {/* TAB 3: EVOLUÇÃO DE CRESCIMENTO */}
      {activeTab === 'crescimento' && (
        <GrowthChart patient={patient} consultations={consultations} />
      )}

      {/* TAB 4: CARTEIRA VACINAL */}
      {activeTab === 'vacinas' && (
        <VaccineTracker
          vaccines={vaccines}
          onUpdateVaccineStatus={() => {}}
          isDoctorView={false}
        />
      )}

      {/* TAB 5: CENTRAL DE DOCUMENTOS */}
      {activeTab === 'documentos' && (
        <div className="bg-white/80 border border-sky-200/80 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-sky-100 pb-3">
            <h2 className="text-base font-bold text-sky-950">Central de Exames e Receitas Médicas</h2>
            <p className="text-xs text-sky-800">Documentos digitais validados e laudos em formato PDF</p>
          </div>

          <div className="space-y-3">
            {patientConsultations.flatMap((c) => c.exams).length === 0 ? (
              <div className="py-8 text-center text-xs text-sky-800 font-semibold">
                Nenhum laudo de exame disponível para download no momento.
              </div>
            ) : (
              patientConsultations.flatMap((c) => c.exams).map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-sky-100 text-sky-800 rounded-xl">
                      <FileText className="w-5 h-5 text-sky-700" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sky-950 text-sm">{exam.title}</div>
                      <div className="text-sky-800 font-medium">
                        Categoria: {exam.category} | Data: {new Date(exam.date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => alert(`Iniciando download seguro de ${exam.fileName || 'laudo.pdf'}`)}
                    className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar PDF</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

