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
        return 'bg-slate-100 text-slate-900 border-slate-300';
      case 'retorno':
        return 'bg-cyan-100 text-cyan-900 border-cyan-300';
      case 'urgencia':
        return 'bg-blue-100 text-blue-950 border-blue-300 font-extrabold';
      case 'desenvolvimento':
        return 'bg-slate-200/80 text-slate-900 border-slate-400';
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner de Agendamento */}
      <div className="bg-white/85 backdrop-blur-sm border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl shadow-xs">
            <Calendar strokeWidth={1.75} className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Agenda & Histórico de Consultas Pediátricas
            </h2>
            <p className="text-xs font-semibold text-slate-700/80">
              Acompanhe as próximas consultas agendadas, lembretes de preparo e histórico de atendimentos
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 shadow-sm shrink-0 active:scale-95"
        >
          <CalendarDays strokeWidth={1.75} className="w-4 h-4" />
          <span>Solicitar Novo Horário</span>
        </button>
      </div>

      {/* SEÇÃO 1: PRÓXIMAS CONSULTAS AGENDADAS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock strokeWidth={1.75} className="w-4 h-4 text-slate-600" />
            <span>Próximas Consultas Agendadas ({upcomingAppointments.length})</span>
          </h3>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="bg-white/85 backdrop-blur-sm border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 text-center space-y-2">
            <p className="text-xs text-slate-700 font-semibold">
              Nenhuma consulta agendada para os próximos dias.
            </p>
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="text-xs font-extrabold text-blue-600 hover:text-blue-700 underline"
            >
              Clique aqui para solicitar um agendamento com a pediatra
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden"
              >
                {/* Accent Top Border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />

                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="space-y-1">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${getTypeStyle(apt.type)}`}>
                      {getTypeLabel(apt.type)}
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-1">
                      {new Date(apt.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </h4>
                  </div>

                  <div className="text-right">
                    <div className="bg-slate-100 text-slate-900 font-mono font-extrabold text-sm px-3 py-1 rounded-xl border border-slate-300 inline-flex items-center gap-1 shadow-2xs">
                      <Clock strokeWidth={1.75} className="w-3.5 h-3.5 text-slate-600" />
                      <span>{apt.time}</span>
                    </div>
                  </div>
                </div>

                {/* Professional Info */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">Médica Responsável:</span>
                    <span className="font-extrabold text-slate-900">{apt.doctorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700 font-medium">Registro:</span>
                    <span className="text-slate-900 font-semibold">{apt.doctorCrm}</span>
                  </div>
                  {apt.notes && (
                    <div className="pt-1.5 border-t border-slate-200/60 text-slate-900">
                      <strong>Motivo:</strong> {apt.notes}
                    </div>
                  )}
                </div>

                {/* Checklist "O que levar na consulta" */}
                {apt.preparationChecklist && apt.preparationChecklist.length > 0 && (
                  <div className="bg-slate-100/70 border border-slate-300/80 rounded-xl p-3.5 text-xs space-y-2">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <FileText strokeWidth={1.75} className="w-3.5 h-3.5 text-slate-600" />
                      Lembrete: O que levar no dia da consulta:
                    </span>
                    <ul className="space-y-1.5 text-slate-900 font-semibold text-[11px]">
                      {apt.preparationChecklist.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle strokeWidth={1.75} className="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions: Salvar no Calendário */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-700">
                    Chegar com 10 minutos de antecedência
                  </span>
                  <button
                    onClick={() => handleDownloadICS(apt)}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-xs"
                    title="Adicionar ao Google Calendar / Apple Calendar"
                  >
                    <Download strokeWidth={1.75} className="w-3.5 h-3.5" />
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
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <CalendarCheck strokeWidth={1.75} className="w-4 h-4 text-slate-600" />
          <span>Histórico de Consultas Realizadas ({patientConsultations.length})</span>
        </h3>

        {patientConsultations.length === 0 ? (
          <div className="bg-white/85 backdrop-blur-sm border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 text-center text-xs text-slate-700 font-semibold">
            Nenhuma consulta anterior registrada.
          </div>
        ) : (
          <div className="space-y-3">
            {patientConsultations.map((cons) => {
              const isExpanded = expandedConsultationId === cons.id;

              return (
                <div
                  key={cons.id}
                  className="bg-white/85 backdrop-blur-sm border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-5 shadow-sm space-y-3 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">
                          Consulta de {new Date(cons.date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="bg-slate-100 text-slate-900 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Realizada
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium mt-0.5">
                        {cons.doctorName} • {cons.doctorCrm}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold text-slate-900">
                      <span>Peso: {cons.antropometry.weightKg} kg</span>
                      <span>•</span>
                      <span>Estatura: {cons.antropometry.heightCm} cm</span>
                      <button
                        onClick={() => setExpandedConsultationId(isExpanded ? null : cons.id)}
                        className="flex items-center gap-1 text-blue-600 hover:text-slate-900 ml-2 py-1 px-2 rounded-lg bg-slate-50 border border-slate-200"
                      >
                        <span>{isExpanded ? 'Recolher' : 'Ver Detalhes'}</span>
                        {isExpanded ? <ChevronUp strokeWidth={1.75} className="w-3.5 h-3.5" /> : <ChevronDown strokeWidth={1.75} className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Summary Parecer */}
                  <div className="text-xs text-slate-900">
                    <strong>Parecer Médico:</strong> {cons.carePlan.diagnosisText}
                  </div>

                  {/* Detalhes Expansíveis: Prescrições e Cuidados */}
                  {isExpanded && (
                    <div className="space-y-3 pt-3 border-t border-slate-100 animate-in fade-in duration-200 text-xs">
                      {cons.carePlan.prescriptions.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                            Prescrições Emitidas:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {cons.carePlan.prescriptions.map((rx) => (
                              <div key={rx.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                <div className="font-bold text-slate-900">{rx.medication}</div>
                                <div className="text-slate-700 text-[11px]">{rx.dosage} - {rx.frequency}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                          <span className="font-bold text-slate-900 block mb-1">Alimentação:</span>
                          <p className="text-slate-900">{cons.carePlan.feedingInstructions}</p>
                        </div>
                        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                          <span className="font-bold text-slate-900 block mb-1">Cuidados Gerais:</span>
                          <p className="text-slate-900">{cons.carePlan.generalCareInstructions}</p>
                        </div>
                      </div>

                      {cons.carePlan.nextAppointmentRecommended && (
                        <div className="bg-slate-100/90 border border-slate-300 p-2.5 rounded-xl text-slate-900 font-bold flex items-center gap-2">
                          <Clock strokeWidth={1.75} className="w-4 h-4 text-slate-600" />
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
          <div className="bg-white/85 backdrop-blur-sm border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                  <CalendarDays strokeWidth={1.75} className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Solicitar Agendamento</h2>
                  <p className="text-xs text-slate-700">Envie um pedido de consulta à secretária médica</p>
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
              <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl text-center space-y-2">
                <CheckCircle strokeWidth={1.75} className="w-8 h-8 text-blue-600 mx-auto" />
                <h3 className="text-sm font-extrabold text-slate-900">Solicitação Enviada com Sucesso!</h3>
                <p className="text-xs text-slate-700">
                  O consultório entrará em contato via WhatsApp / Telefone para confirmar o dia e horário.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendRequest} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Paciente</label>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-extrabold text-slate-900">
                    {patient.name} (Mãe: {patient.motherName})
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Turno de Preferência</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRequestPreferredShift('manha')}
                      className={`py-2 rounded-xl border font-bold transition-all ${
                        requestPreferredShift === 'manha'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-900 border-slate-200'
                      }`}
                    >
                      Manhã (08h - 12h)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestPreferredShift('tarde')}
                      className={`py-2 rounded-xl border font-bold transition-all ${
                        requestPreferredShift === 'tarde'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-900 border-slate-200'
                      }`}
                    >
                      Tarde (13h - 18h)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">Motivo / Observação *</label>
                  <textarea
                    rows={3}
                    required
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="Ex: Consulta de rotina de 9 meses, introdução alimentar ou retorno de exame..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium placeholder-slate-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-4 py-2 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20"
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
