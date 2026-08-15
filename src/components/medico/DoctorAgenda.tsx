import React, { useState } from 'react';
import { Appointment, Patient, AppointmentType, AppointmentStatus } from '../../types/ppueri';
import { formatPediatricAge } from '../../lib/pediatric-rules';
import {
  Calendar,
  Clock,
  CalendarCheck,
  CalendarPlus,
  CalendarDays,
  CheckCircle,
  XCircle,
  Stethoscope,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  ListChecks,
  AlertCircle,
  FileText,
  RotateCcw,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface DoctorAgendaProps {
  patients: Patient[];
  appointments: Appointment[];
  onAddAppointment: (appointment: Appointment) => void;
  onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onRescheduleAppointment: (appointmentId: string, newDate: string, newTime: string) => void;
  onSelectPatient: (patientId: string) => void;
  onStartNewConsultation: (patientId: string) => void;
  doctorId: string;
  doctorName: string;
  doctorCrm: string;
}

export const DoctorAgenda: React.FC<DoctorAgendaProps> = ({
  patients,
  appointments,
  onAddAppointment,
  onUpdateStatus,
  onRescheduleAppointment,
  onSelectPatient,
  onStartNewConsultation,
  doctorId,
  doctorName,
  doctorCrm,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDayString, setSelectedDayString] = useState<string | null>(() => new Date().toISOString().split('T')[0]);
  const [activeFilter, setActiveFilter] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('mes');
  const [statusFilter, setStatusFilter] = useState<'todos' | AppointmentStatus>('todos');
  const [typeFilter, setTypeFilter] = useState<'todos' | AppointmentType>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);

  // Form State para Novo Agendamento
  const [formPatientId, setFormPatientId] = useState(patients[0]?.id || '');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('09:00');
  const [formType, setFormType] = useState<AppointmentType>('rotina');
  const [formNotes, setFormNotes] = useState('');
  const [formChecklist, setFormChecklist] = useState<string[]>([]);
  const [customChecklistItem, setCustomChecklistItem] = useState('');

  // Reschedule Form State
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Mês e Ano exibidos
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth(); // 0 a 11
  const monthName = currentMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Calendário - Cálculo de dias
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Domingo

  // Estatísticas rápidas
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.date === todayStr);
  const scheduledCount = appointments.filter((a) => a.status === 'agendada').length;
  const completedCount = appointments.filter((a) => a.status === 'concluida').length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelada').length;

  // Navegação de Mês
  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  // Filtragem de Agendamentos
  const filteredAppointments = appointments.filter((apt) => {
    // Busca por termo
    if (
      searchTerm &&
      !apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !apt.motherName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !(apt.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Filtro por Status
    if (statusFilter !== 'todos' && apt.status !== statusFilter) {
      return false;
    }

    // Filtro por Tipo
    if (typeFilter !== 'todos' && apt.type !== typeFilter) {
      return false;
    }

    // Filtro por Data / Período
    if (activeFilter === 'hoje') {
      return apt.date === todayStr;
    }

    if (activeFilter === 'semana') {
      const aptDate = new Date(apt.date + 'T00:00:00');
      const today = new Date(todayStr + 'T00:00:00');
      const diffTime = aptDate.getTime() - today.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      return diffDays >= -2 && diffDays <= 7;
    }

    if (activeFilter === 'mes') {
      const [aptYear, aptMonth] = apt.date.split('-').map(Number);
      return aptYear === year && aptMonth - 1 === month;
    }

    return true;
  });

  // Se houver um dia selecionado no calendário mensal
  const displayAppointments = selectedDayString
    ? filteredAppointments.filter((a) => a.date === selectedDayString)
    : filteredAppointments;

  // Handler para criar agendamento
  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPatient = patients.find((p) => p.id === formPatientId);
    if (!targetPatient) return;

    const newApt: Appointment = {
      id: `apt_${Date.now()}`,
      doctorId,
      patientId: targetPatient.id,
      patientName: targetPatient.name,
      motherName: targetPatient.motherName,
      doctorName,
      doctorCrm,
      date: formDate,
      time: formTime,
      durationMinutes: formType === 'rotina' ? 45 : 30,
      type: formType,
      status: 'agendada',
      notes: formNotes || `Consulta de ${getTypeLabel(formType)}`,
      preparationChecklist: formChecklist,
      createdAt: new Date().toISOString(),
    };

    onAddAppointment(newApt);
    setIsNewAppointmentModalOpen(false);
    setFormNotes('');
    setSelectedDayString(formDate);
  };

  // Handler para checklist customizado
  const handleAddChecklistItem = () => {
    if (customChecklistItem.trim()) {
      setFormChecklist([...formChecklist, customChecklistItem.trim()]);
      setCustomChecklistItem('');
    }
  };

  const handleRemoveChecklistItem = (index: number) => {
    setFormChecklist(formChecklist.filter((_, i) => i !== index));
  };

  // Helper Labels & Styles
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

  function getStatusBadge(status: AppointmentStatus) {
    switch (status) {
      case 'agendada':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-900 border border-sky-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            <Clock className="w-3 h-3 text-sky-700" />
            <span>Agendada</span>
          </span>
        );
      case 'concluida':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-950 text-white border border-sky-900 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            <CheckCircle className="w-3 h-3 text-sky-400" />
            <span>Concluída</span>
          </span>
        );
      case 'cancelada':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 border border-slate-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            <XCircle className="w-3 h-3 text-slate-500" />
            <span>Cancelada</span>
          </span>
        );
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner da Agenda */}
      <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl p-6 shadow-xl border border-sky-900/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-sky-500/20 text-sky-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-sky-500/30">
                Agenda Pediátrica
              </span>
              <span className="text-sky-300/80 text-xs font-semibold">
                • {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Gestão de Consultas e Atendimentos
            </h1>
            <p className="text-xs text-sky-200/80 max-w-2xl">
              Organize os horários de puericultura, consultas de rotina, retornos clínicos e urgências com controle integrado ao prontuário médico.
            </p>
          </div>

          <button
            onClick={() => {
              setFormDate(selectedDayString || todayStr);
              setIsNewAppointmentModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 text-xs font-extrabold px-5 py-3 rounded-xl transition-all shadow-md active:scale-95 shrink-0 border border-cyan-300/40"
          >
            <CalendarPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Agendar Nova Consulta</span>
          </button>
        </div>
      </div>

      {/* Quick Status Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/80 backdrop-blur-md border border-sky-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-sky-100 text-sky-800 rounded-xl">
            <CalendarDays className="w-5 h-5 text-sky-700" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wide">Hoje</span>
            <div className="text-xl font-extrabold text-sky-950">{todayAppointments.length}</div>
            <span className="text-[10px] text-sky-700 font-semibold">atendimentos</span>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-sky-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-cyan-100 text-cyan-800 rounded-xl">
            <Clock className="w-5 h-5 text-cyan-700" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wide">Agendadas</span>
            <div className="text-xl font-extrabold text-sky-950">{scheduledCount}</div>
            <span className="text-[10px] text-sky-700 font-semibold">em aberto</span>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-sky-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-sky-100 text-sky-900 rounded-xl">
            <CalendarCheck className="w-5 h-5 text-sky-800" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wide">Realizadas</span>
            <div className="text-xl font-extrabold text-sky-950">{completedCount}</div>
            <span className="text-[10px] text-sky-700 font-semibold">concluídas</span>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-sky-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <XCircle className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wide">Canceladas</span>
            <div className="text-xl font-extrabold text-sky-950">{cancelledCount}</div>
            <span className="text-[10px] text-sky-700 font-semibold">desmarcadas</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendário Mensal à Esquerda + Lista de Consultas à Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calendário Mensal Interativo (5 colunas no desktop) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white/80 backdrop-blur-md border border-sky-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            {/* Header do Mês com navegação */}
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-700" />
                <h2 className="text-base font-extrabold text-sky-950 capitalize">{monthName}</h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg text-sky-800 hover:bg-sky-100 border border-sky-200 transition-all"
                  title="Mês Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { const now = new Date(); setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1)); }}
                  className="px-2.5 py-1 text-xs font-bold text-sky-900 hover:bg-sky-100 rounded-lg border border-sky-200"
                >
                  Mês Atual
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg text-sky-800 hover:bg-sky-100 border border-sky-200 transition-all"
                  title="Próximo Mês"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid dos Dias da Semana */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-extrabold text-sky-900 mb-1">
              <span className="text-sky-700">Dom</span>
              <span>Seg</span>
              <span>Ter</span>
              <span>Qua</span>
              <span>Qui</span>
              <span>Sex</span>
              <span className="text-sky-700">Sáb</span>
            </div>

            {/* Grid dos Dias do Mês */}
            <div className="grid grid-cols-7 gap-1 text-xs select-none">
              {/* Espaços vazios do início do mês */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-12 rounded-xl p-1 bg-transparent opacity-0 pointer-events-none" />
              ))}

              {/* Dias reais */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const formattedDay = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = selectedDayString === formattedDay;
                const isToday = formattedDay === todayStr;

                const dayApts = appointments.filter((a) => a.date === formattedDay);
                const hasApts = dayApts.length > 0;
                const hasScheduled = dayApts.some((a) => a.status === 'agendada');

                return (
                  <button
                    key={formattedDay}
                    onClick={() => setSelectedDayString(isSelected ? null : formattedDay)}
                    className={`h-12 rounded-xl p-1 flex flex-col items-center justify-between transition-all relative border ${
                      isSelected
                        ? 'bg-slate-900 text-white font-extrabold border-slate-900 shadow-md ring-2 ring-sky-500/40'
                        : isToday
                        ? 'bg-sky-100 text-sky-950 font-bold border-sky-400'
                        : 'bg-sky-50/50 text-sky-900 hover:bg-sky-100/80 border-sky-100 font-semibold'
                    }`}
                  >
                    <span className="text-xs">{dayNum}</span>

                    {/* Indicador de Consultas no Dia */}
                    {hasApts && (
                      <div className="flex items-center gap-0.5 pb-0.5">
                        {dayApts.slice(0, 3).map((apt, i) => (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? 'bg-cyan-300'
                                : apt.status === 'agendada'
                                ? 'bg-sky-600'
                                : apt.status === 'concluida'
                                ? 'bg-sky-950'
                                : 'bg-slate-400'
                            }`}
                          />
                        ))}
                        {dayApts.length > 3 && (
                          <span className={`text-[8px] font-extrabold ${isSelected ? 'text-cyan-300' : 'text-sky-700'}`}>
                            +{dayApts.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legenda do Calendário */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-sky-100 text-[11px] text-sky-900 font-bold">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-600 inline-block" /> Agendada
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-950 inline-block" /> Concluída
                </span>
              </div>
              {selectedDayString && (
                <button
                  onClick={() => setSelectedDayString(null)}
                  className="text-sky-700 hover:text-sky-950 font-extrabold hover:underline"
                >
                  Limpar filtro de dia
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Lista de Consultas com Filtros (7 colunas no desktop) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Controls Bar: Busca e Filtros Rápidos */}
          <div className="bg-white/80 backdrop-blur-md border border-sky-200/80 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sky-600" />
                <input
                  type="text"
                  placeholder="Buscar por paciente ou responsável..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-sky-50/70 border border-sky-200 rounded-xl font-medium text-sky-950 placeholder-sky-800/50 focus:outline-none focus:border-sky-500 focus:bg-white shadow-inner transition-all"
                />
              </div>

              {/* Período Tabs */}
              <div className="flex items-center bg-sky-100/70 p-1 rounded-xl border border-sky-200 text-xs font-bold w-full sm:w-auto overflow-x-auto">
                <button
                  onClick={() => {
                    setActiveFilter('hoje');
                    setSelectedDayString(todayStr);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                    activeFilter === 'hoje' ? 'bg-sky-600 text-white shadow-sm' : 'text-sky-900 hover:bg-sky-200/50'
                  }`}
                >
                  Hoje
                </button>
                <button
                  onClick={() => {
                    setActiveFilter('semana');
                    setSelectedDayString(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                    activeFilter === 'semana' ? 'bg-sky-600 text-white shadow-sm' : 'text-sky-900 hover:bg-sky-200/50'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => {
                    setActiveFilter('mes');
                    setSelectedDayString(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                    activeFilter === 'mes' ? 'bg-sky-600 text-white shadow-sm' : 'text-sky-900 hover:bg-sky-200/50'
                  }`}
                >
                  Mês
                </button>
                <button
                  onClick={() => {
                    setActiveFilter('todos');
                    setSelectedDayString(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                    activeFilter === 'todos' ? 'bg-sky-600 text-white shadow-sm' : 'text-sky-900 hover:bg-sky-200/50'
                  }`}
                >
                  Todos
                </button>
              </div>
            </div>

            {/* Secondary Filter Dropdowns */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sky-100 text-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-sky-600" />
                <span className="font-bold text-sky-900">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1 text-sky-950 font-bold focus:outline-none"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="agendada">Agendadas</option>
                  <option value="concluida">Concluídas</option>
                  <option value="cancelada">Canceladas</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-sky-900">Tipo:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1 text-sky-950 font-bold focus:outline-none"
                >
                  <option value="todos">Todos os Tipos</option>
                  <option value="rotina">Puericultura de Rotina</option>
                  <option value="retorno">Retorno Clínico</option>
                  <option value="urgencia">Urgência / Aguda</option>
                  <option value="desenvolvimento">Desenvolvimento</option>
                </select>
              </div>

              <div className="text-xs font-extrabold text-sky-900 bg-sky-100/80 px-2.5 py-1 rounded-lg border border-sky-200">
                {displayAppointments.length} {displayAppointments.length === 1 ? 'consulta' : 'consultas'}
              </div>
            </div>
          </div>

          {/* Appointment Cards List */}
          <div className="space-y-3">
            {selectedDayString && (
              <div className="bg-sky-100/90 border border-sky-300/80 px-4 py-2 rounded-xl flex items-center justify-between text-xs text-sky-950 font-bold">
                <span>
                  Exibindo consultas para:{' '}
                  <strong>
                    {new Date(selectedDayString + 'T00:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </strong>
                </span>
                <button
                  onClick={() => setSelectedDayString(null)}
                  className="text-sky-700 hover:text-sky-950 underline"
                >
                  Ver todas
                </button>
              </div>
            )}

            {displayAppointments.length === 0 ? (
              <div className="bg-white/80 border border-sky-200 rounded-2xl p-8 text-center space-y-3">
                <Calendar className="w-10 h-10 text-sky-400 mx-auto" />
                <h3 className="text-sm font-bold text-sky-950">Nenhuma consulta encontrada</h3>
                <p className="text-xs text-sky-800 max-w-sm mx-auto">
                  Não há atendimentos correspondentes aos filtros selecionados. Clique em "Agendar Nova Consulta" para marcar um horário.
                </p>
                <button
                  onClick={() => {
                    setFormDate(selectedDayString || todayStr);
                    setIsNewAppointmentModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>Novo Agendamento</span>
                </button>
              </div>
            ) : (
              displayAppointments.map((apt) => {
                const targetPatient = patients.find((p) => p.id === apt.patientId);

                return (
                  <div
                    key={apt.id}
                    className="bg-white/85 backdrop-blur-md border border-sky-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    {/* Top Row: Date/Time + Status + Type */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-sky-100 text-sky-950 border border-sky-300 px-3 py-1.5 rounded-xl font-mono font-extrabold text-xs flex items-center gap-1.5 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-sky-700" />
                          <span>{apt.time}</span>
                        </div>
                        <div className="text-xs font-extrabold text-sky-950">
                          {new Date(apt.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${getTypeStyle(apt.type)}`}>
                          {getTypeLabel(apt.type)}
                        </span>
                        {getStatusBadge(apt.status)}
                      </div>
                    </div>

                    {/* Middle Row: Patient Info & Notes */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-sky-100 border border-sky-300 flex items-center justify-center font-extrabold text-sky-900 shrink-0">
                          {targetPatient?.photoUrl ? (
                            <img
                              src={targetPatient.photoUrl}
                              alt={apt.patientName}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <User className="w-5 h-5 text-sky-700" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-sky-950 text-sm">{apt.patientName}</h3>
                            {targetPatient && (
                              <span className="text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                                {formatPediatricAge(targetPatient.birthDate)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-sky-800 font-medium mt-0.5">
                            Mãe: <strong>{apt.motherName}</strong>
                            {targetPatient && (
                              <span className="ml-2">| Código: <span className="font-mono font-bold text-sky-900">{targetPatient.accessCode}</span></span>
                            )}
                          </p>

                          {apt.notes && (
                            <p className="text-xs text-sky-950 bg-sky-50/90 border border-sky-200 p-2.5 rounded-xl mt-2 font-medium">
                              <strong>Motivo/Queixa:</strong> {apt.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Preparation Checklist */}
                    {apt.preparationChecklist && apt.preparationChecklist.length > 0 && (
                      <div className="bg-sky-50/60 border border-sky-200/80 rounded-xl p-3 text-xs space-y-1.5">
                        <span className="font-extrabold text-sky-950 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                          <FileText className="w-3.5 h-3.5 text-sky-700" />
                          Orientações e Documentos Solicitados para a Consulta:
                        </span>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sky-900 font-semibold text-[11px]">
                          {apt.preparationChecklist.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Bottom Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sky-100">
                      <div className="flex items-center gap-2">
                        {apt.status === 'agendada' && (
                          <>
                            <button
                              onClick={() => onUpdateStatus(apt.id, 'concluida')}
                              className="flex items-center gap-1 text-xs font-bold text-sky-950 bg-sky-100 hover:bg-sky-200 border border-sky-300 px-3 py-1.5 rounded-xl transition-all"
                              title="Marcar consulta como realizada"
                            >
                              <Check className="w-3.5 h-3.5 text-sky-700" />
                              <span>Concluir</span>
                            </button>

                            <button
                              onClick={() => {
                                setReschedulingAppointment(apt);
                                setRescheduleDate(apt.date);
                                setRescheduleTime(apt.time);
                              }}
                              className="flex items-center gap-1 text-xs font-bold text-sky-900 hover:text-sky-950 bg-white hover:bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl transition-all"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
                              <span>Reagendar</span>
                            </button>

                            <button
                              onClick={() => onUpdateStatus(apt.id, 'cancelada')}
                              className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-xl transition-all"
                              title="Cancelar agendamento"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Desmarcar</span>
                            </button>
                          </>
                        )}

                        {apt.status !== 'agendada' && (
                          <button
                            onClick={() => onUpdateStatus(apt.id, 'agendada')}
                            className="text-xs font-bold text-sky-800 hover:text-sky-950 underline"
                          >
                            Reativar Agendamento
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          onSelectPatient(apt.patientId);
                          onStartNewConsultation(apt.patientId);
                        }}
                        className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm ml-auto"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Abrir Atendimento / Prontuário</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal 1: Agendar Nova Consulta */}
      {isNewAppointmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-sky-200 max-w-lg w-full space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-sky-100 text-sky-800 rounded-xl">
                  <CalendarPlus className="w-5 h-5 text-sky-700" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-sky-950">Agendar Consulta Pediátrica</h2>
                  <p className="text-xs text-sky-800">Preencha os dados da consulta no prontuário</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewAppointmentModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
              {/* Paciente */}
              <div>
                <label className="block font-bold text-sky-950 mb-1">Selecionar Paciente *</label>
                <select
                  value={formPatientId}
                  onChange={(e) => setFormPatientId(e.target.value)}
                  required
                  className="w-full bg-sky-50/80 border border-sky-200 rounded-xl px-3 py-2.5 text-sky-950 font-bold focus:outline-none focus:border-sky-500 focus:bg-white"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatPediatricAge(p.birthDate)}) — Mãe: {p.motherName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data e Horário */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-sky-950 mb-1">Data da Consulta *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full bg-sky-50/80 border border-sky-200 rounded-xl px-3 py-2 text-sky-950 font-bold focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-sky-950 mb-1">Horário *</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    required
                    className="w-full bg-sky-50/80 border border-sky-200 rounded-xl px-3 py-2 text-sky-950 font-bold focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Tipo de Consulta */}
              <div>
                <label className="block font-bold text-sky-950 mb-1">Tipo de Consulta *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('rotina')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      formType === 'rotina'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100'
                    }`}
                  >
                    Rotina / Puericultura
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('retorno')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      formType === 'retorno'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100'
                    }`}
                  >
                    Retorno Clínico
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('urgencia')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      formType === 'urgencia'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100'
                    }`}
                  >
                    Urgência / Queixa Aguda
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('desenvolvimento')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      formType === 'desenvolvimento'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100'
                    }`}
                  >
                    Desenvolvimento Motor/Fala
                  </button>
                </div>
              </div>

              {/* Observações / Motivo */}
              <div>
                <label className="block font-bold text-sky-950 mb-1">Motivo do Agendamento / Observações</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Acompanhamento de introdução alimentar e ganho de peso..."
                  className="w-full bg-sky-50/80 border border-sky-200 rounded-xl p-2.5 text-sky-950 font-medium placeholder-sky-800/50 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              {/* Checklist do que levar */}
              <div className="space-y-2">
                <label className="block font-bold text-sky-950">Lembrete para a Família (O que levar)</label>
                <div className="space-y-1.5 bg-sky-50/70 p-3 rounded-xl border border-sky-200">
                  {formChecklist.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-lg border border-sky-200">
                      <span className="text-sky-950 font-semibold">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistItem(idx)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Adicionar item ao lembrete..."
                      value={customChecklistItem}
                      onChange={(e) => setCustomChecklistItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddChecklistItem();
                        }
                      }}
                      className="flex-1 bg-white border border-sky-200 rounded-lg px-2.5 py-1 text-xs text-sky-950"
                    />
                    <button
                      type="button"
                      onClick={handleAddChecklistItem}
                      className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-1 rounded-lg text-xs"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>

              {/* Botoes de Acao */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => setIsNewAppointmentModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-md"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Reagendar Consulta */}
      {reschedulingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-sky-200 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-sky-700" />
                <h2 className="text-base font-extrabold text-sky-950">Reagendar Consulta</h2>
              </div>
              <button
                onClick={() => setReschedulingAppointment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-sky-50 p-3 rounded-xl border border-sky-200 text-xs">
              <p className="font-extrabold text-sky-950">{reschedulingAppointment.patientName}</p>
              <p className="text-sky-800">
                Horário anterior: {reschedulingAppointment.date} às {reschedulingAppointment.time}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-sky-950 mb-1">Nova Data</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 text-sky-950 font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-sky-950 mb-1">Novo Horário</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 text-sky-950 font-bold focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-sky-100 text-xs">
              <button
                onClick={() => setReschedulingAppointment(null)}
                className="px-4 py-2 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (rescheduleDate && rescheduleTime) {
                    onRescheduleAppointment(reschedulingAppointment.id, rescheduleDate, rescheduleTime);
                    setReschedulingAppointment(null);
                  }
                }}
                className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold px-5 py-2 rounded-xl shadow-sm"
              >
                Salvar Novo Horário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
