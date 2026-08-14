import React, { useState } from 'react';
import { Appointment, Consultation, Patient, AppointmentStatus, AppointmentType } from '../../types/ppueri';
import {
  Calendar,
  Clock,
  CalendarCheck,
  CalendarDays,
  CheckCircle,
  XCircle,
  FileText,
  Stethoscope,
  Download,
  AlertCircle,
  Sparkles,
  ListChecks,
  User,
  Phone,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PatientAgendaTabProps {
  patient: Patient;
  appointments: Appointment[];
  consultations: Consultation[];
  onRequestAppointmentClick?: () => void;
}

export const PatientAgendaTab: React.FC<PatientAgendaTabProps> = ({
  patient,
  appointments,
  consultations,
  onRequestAppointmentClick,
}) => {
  const [expandedConsultationId, setExpandedConsultationId] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [requestPreferredShift, setRequestPreferredShift] = useState<'manha' | 'tarde'>('manha');
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Filtra agendamentos deste paciente
  const patientAppointments = appointments
    .filter((a) => a.patientId === patient.id)
    .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());

  const upcomingAppointments = patientAppointments.filter((a) => a.status === 'agendada');
  const pastAppointments = patientAppointments.filter((a) => a.status !== 'agendada');

  // Filtra consultas médicas registradas no prontuário
  const patientConsultations = [...consultations]
    .filter((c) => c.patientId === patient.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Download do arquivo .ics para salvar na agenda do celular dos pais
  const handleDownloadICS = (apt: Appointment) => {
    const startStr = apt.date.replace(/-/g, '') + 'T' + apt.time.replace(':', '') + '00';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Ppueri//Pediatric Care Agenda//PT-BR',
      'BEGIN:VEVENT',
      `SUMMARY:Consulta Pediátrica Ppueri - ${apt.patientName}`,
      `DESCRIPTION:Consulta com ${apt.doctorName} (${apt.doctorCrm}). Lembre-se de levar: ${apt.preparationChecklist?.join(', ') || 'Caderneta de Vacinação'}`,
      `DTSTART:${startStr}`,
      `DTEND:${startStr}`,
      'LOCATION:Clínica Ppueri de Pediatria & Puericultura',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `consulta_ppueri_${apt.patientName.split(' ')[0]}_${apt.date}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestSuccess(true);
    setTimeout(() => {
      setRequestSuccess(false);
      setIsRequestModalOpen(false);
      setRequestReason('');
    }, 2000);
  };

  function getTypeLabel(type: AppointmentType) {
    switch (type) {
      case 'rotina':
        return 'Puericultura de Rotina';
      case 'retorno':
        return 'Retorno Clínico';
      case 'urgencia':
        return 'Urgência / Queixa Aguda';
      case 'desenvolvimento':
        return 'Avaliação do Desenvolvimento';
    }
  }

  function getTypeStyle(type: AppointmentType) {
    switch (type) {
      case 'rotina':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      case 'retorno':
        return 'bg-cyan-100 text-cyan-900 border-cyan-300';
      case 'urgencia':
        return 'bg-blue-100 text-blue-950 border-blue-300 font-extrabold';
      case 'desenvolvimento':
        return 'bg-sky-200/80 text-sky-950 border-sky-400';
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner de Agendamento */}
      <div className="bg-white/80 backdrop-blur-md border border-sky-200/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-100 text-sky-800 rounded-2xl shadow-xs">
            <Calendar className="w-6 h-6 text-sky-700" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-sky-950">
              Agenda & Histórico de Consultas Pediátricas
            </h2>
            <p className="text-xs font-semibold text-sky-800/80">
              Acompanhe as próximas consultas agendadas, lembretes de preparo e histórico de atendimentos
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0 active:scale-95"
        >
          <CalendarDays className="w-4 h-4" />
          <span>Solicitar Novo Horário</span>
        </button>
      </div>

      {/* SEÇÃO 1: PRÓXIMAS CONSULTAS AGENDADAS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-sky-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-700" />
            <span>Próximas Consultas Agendadas ({upcomingAppointments.length})</span>
          </h3>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="bg-white/80 border border-sky-200 rounded-2xl p-6 text-center space-y-2">
            <p className="text-xs text-sky-800 font-semibold">
              Nenhuma consulta agendada para os próximos dias.
            </p>
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="text-xs font-extrabold text-sky-600 hover:text-sky-800 underline"
            >
              Clique aqui para solicitar um agendamento com a pediatra
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white/90 backdrop-blur-md border border-sky-300 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden"
              >
                {/* Accent Top Border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-cyan-400" />

                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="space-y-1">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${getTypeStyle(apt.type)}`}>
                      {getTypeLabel(apt.type)}
                    </span>
                    <h4 className="text-base font-extrabold text-sky-950 mt-1">
                      {new Date(apt.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </h4>
                  </div>

                  <div className="text-right">
                    <div className="bg-sky-100 text-sky-950 font-mono font-extrabold text-sm px-3 py-1 rounded-xl border border-sky-300 inline-flex items-center gap-1 shadow-2xs">
                      <Clock className="w-3.5 h-3.5 text-sky-700" />
                      <span>{apt.time}</span>
                    </div>
                  </div>
                </div>

                {/* Professional Info */}
                <div className="bg-sky-50/80 border border-sky-200/80 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sky-800 font-medium">Médica Responsável:</span>
                    <span className="font-extrabold text-sky-950">{apt.doctorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sky-800 font-medium">Registro:</span>
                    <span className="text-sky-900 font-semibold">{apt.doctorCrm}</span>
                  </div>
                  {apt.notes && (
                    <div className="pt-1.5 border-t border-sky-200/60 text-sky-950">
                      <strong>Motivo:</strong> {apt.notes}
                    </div>
                  )}
                </div>

                {/* Checklist "O que levar na consulta" */}
                {apt.preparationChecklist && apt.preparationChecklist.length > 0 && (
                  <div className="bg-sky-100/70 border border-sky-300/80 rounded-xl p-3.5 text-xs space-y-2">
                    <span className="font-extrabold text-sky-950 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <FileText className="w-3.5 h-3.5 text-sky-700" />
                      Lembrete: O que levar no dia da consulta:
                    </span>
                    <ul className="space-y-1.5 text-sky-950 font-semibold text-[11px]">
                      {apt.preparationChecklist.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-sky-700 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions: Salvar no Calendário */}
                <div className="pt-2 border-t border-sky-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-sky-800">
                    Chegar com 10 minutos de antecedência
                  </span>
                  <button
                    onClick={() => handleDownloadICS(apt)}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-xs"
                    title="Adicionar ao Google Calendar / Apple Calendar"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Lembrete (.ics)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEÇÃO 2: HISTÓRICO DE CONSULTAS REALIZADAS */}
      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-extrabold text-sky-900 uppercase tracking-wider flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-sky-700" />
          <span>Histórico de Consultas Realizadas ({patientConsultations.length})</span>
        </h3>

        {patientConsultations.length === 0 ? (
          <div className="bg-white/80 border border-sky-200 rounded-2xl p-6 text-center text-xs text-sky-800 font-semibold">
            Nenhuma consulta anterior registrada.
          </div>
        ) : (
          <div className="space-y-3">
            {patientConsultations.map((cons) => {
              const isExpanded = expandedConsultationId === cons.id;

              return (
                <div
                  key={cons.id}
                  className="bg-white/85 backdrop-blur-md border border-sky-200/90 rounded-2xl p-5 shadow-sm space-y-3 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sky-950 text-sm">
                          Consulta de {new Date(cons.date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="bg-sky-100 text-sky-900 border border-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Realizada
                        </span>
                      </div>
                      <p className="text-xs text-sky-800 font-medium mt-0.5">
                        {cons.doctorName} • {cons.doctorCrm}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold text-sky-900">
                      <span>Peso: {cons.antropometry.weightKg} kg</span>
                      <span>•</span>
                      <span>Estatura: {cons.antropometry.heightCm} cm</span>
                      <button
                        onClick={() => setExpandedConsultationId(isExpanded ? null : cons.id)}
                        className="flex items-center gap-1 text-sky-600 hover:text-sky-900 ml-2 py-1 px-2 rounded-lg bg-sky-50 border border-sky-200"
                      >
                        <span>{isExpanded ? 'Recolher' : 'Ver Detalhes'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Summary Parecer */}
                  <div className="text-xs text-sky-950">
                    <strong>Parecer Médico:</strong> {cons.carePlan.diagnosisText}
                  </div>

                  {/* Detalhes Expansíveis: Prescrições e Cuidados */}
                  {isExpanded && (
                    <div className="space-y-3 pt-3 border-t border-sky-100 animate-in fade-in duration-200 text-xs">
                      {cons.carePlan.prescriptions.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="font-extrabold text-sky-900 uppercase tracking-wider text-[11px]">
                            Prescrições Emitidas:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {cons.carePlan.prescriptions.map((rx) => (
                              <div key={rx.id} className="bg-sky-50 p-2.5 rounded-xl border border-sky-200">
                                <div className="font-bold text-sky-950">{rx.medication}</div>
                                <div className="text-sky-800 text-[11px]">{rx.dosage} - {rx.frequency}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-200">
                          <span className="font-bold text-sky-950 block mb-1">Alimentação:</span>
                          <p className="text-sky-900">{cons.carePlan.feedingInstructions}</p>
                        </div>
                        <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-200">
                          <span className="font-bold text-sky-950 block mb-1">Cuidados Gerais:</span>
                          <p className="text-sky-900">{cons.carePlan.generalCareInstructions}</p>
                        </div>
                      </div>

                      {cons.carePlan.nextAppointmentRecommended && (
                        <div className="bg-sky-100/90 border border-sky-300 p-2.5 rounded-xl text-sky-950 font-bold flex items-center gap-2">
                          <Clock className="w-4 h-4 text-sky-700" />
                          <span>Recomendação de Próxima Consulta: {cons.carePlan.nextAppointmentRecommended}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Solicitar Novo Horário de Consulta */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-sky-200 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-sky-100 text-sky-800 rounded-xl">
                  <CalendarDays className="w-5 h-5 text-sky-700" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-sky-950">Solicitar Agendamento</h2>
                  <p className="text-xs text-sky-800">Envie um pedido de consulta à secretária médica</p>
                </div>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            {requestSuccess ? (
              <div className="p-4 bg-sky-100 border border-sky-300 rounded-2xl text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-sky-700 mx-auto" />
                <h3 className="text-sm font-extrabold text-sky-950">Solicitação Enviada com Sucesso!</h3>
                <p className="text-xs text-sky-800">
                  O consultório entrará em contato via WhatsApp / Telefone para confirmar o dia e horário.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendRequest} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-sky-950 mb-1">Paciente</label>
                  <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-200 font-extrabold text-sky-950">
                    {patient.name} (Mãe: {patient.motherName})
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-sky-950 mb-1">Turno de Preferência</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRequestPreferredShift('manha')}
                      className={`py-2 rounded-xl border font-bold transition-all ${
                        requestPreferredShift === 'manha'
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-sky-50 text-sky-900 border-sky-200'
                      }`}
                    >
                      Manhã (08h - 12h)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestPreferredShift('tarde')}
                      className={`py-2 rounded-xl border font-bold transition-all ${
                        requestPreferredShift === 'tarde'
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-sky-50 text-sky-900 border-sky-200'
                      }`}
                    >
                      Tarde (13h - 18h)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-sky-950 mb-1">Motivo / Observação *</label>
                  <textarea
                    rows={3}
                    required
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="Ex: Consulta de rotina de 9 meses, introdução alimentar ou retorno de exame..."
                    className="w-full bg-sky-50 border border-sky-200 rounded-xl p-2.5 text-sky-950 font-medium placeholder-sky-800/50 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-sky-100">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-4 py-2 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold px-5 py-2 rounded-xl shadow-sm"
                  >
                    Enviar Solicitação
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
