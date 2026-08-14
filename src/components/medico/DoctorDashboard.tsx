import React, { useState } from 'react';
import { Patient, Consultation, Appointment, AppointmentStatus } from '../../types/ppueri';
import { formatPediatricAge } from '../../lib/pediatric-rules';
import { DoctorAgenda } from './DoctorAgenda';
import {
  User,
  Plus,
  Search,
  Stethoscope,
  LayoutGrid,
  List,
  ArrowUpDown,
  Calendar,
  ShieldAlert,
  Clock,
  CalendarPlus,
  Users,
} from 'lucide-react';

interface DoctorDashboardProps {
  patients: Patient[];
  consultations: Consultation[];
  appointments: Appointment[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  onStartNewConsultation: (patientId: string) => void;
  onOpenNewPatientModal: () => void;
  onAddAppointment: (appointment: Appointment) => void;
  onUpdateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onRescheduleAppointment: (appointmentId: string, newDate: string, newTime: string) => void;
  doctorName: string;
  doctorCrm: string;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  patients,
  consultations,
  appointments,
  selectedPatientId,
  onSelectPatient,
  onStartNewConsultation,
  onOpenNewPatientModal,
  onAddAppointment,
  onUpdateAppointmentStatus,
  onRescheduleAppointment,
  doctorName,
  doctorCrm,
}) => {
  const [activeTab, setActiveTab] = useState<'pacientes' | 'agenda'>('pacientes');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [sortBy, setSortBy] = useState<'name' | 'consultation' | 'age'>('name');

  const todayStr = '2026-08-14';
  const todayAppointments = appointments.filter((a) => a.date === todayStr && a.status === 'agendada');

  // Filtragem
  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.motherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.accessCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ordenação
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name, 'pt-BR');
    }
    if (sortBy === 'age') {
      return new Date(b.birthDate).getTime() - new Date(a.birthDate).getTime();
    }
    if (sortBy === 'consultation') {
      const lastA = consultations.filter((c) => c.patientId === a.id).slice(-1)[0];
      const lastB = consultations.filter((c) => c.patientId === b.id).slice(-1)[0];
      const dateA = lastA ? new Date(lastA.date).getTime() : 0;
      const dateB = lastB ? new Date(lastB.date).getTime() : 0;
      return dateB - dateA;
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Top View Selector Tabs */}
      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-sky-200/80 shadow-sm text-xs font-extrabold">
        <button
          onClick={() => setActiveTab('pacientes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${
            activeTab === 'pacientes'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-sky-900 hover:text-sky-950 hover:bg-sky-100/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pacientes & Prontuários ({patients.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all relative ${
            activeTab === 'agenda'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-sky-900 hover:text-sky-950 hover:bg-sky-100/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Agenda de Consultas</span>
          {todayAppointments.length > 0 && (
            <span className="bg-cyan-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
              {todayAppointments.length} hoje
            </span>
          )}
        </button>
      </div>

      {activeTab === 'agenda' ? (
        <DoctorAgenda
          patients={patients}
          appointments={appointments}
          onAddAppointment={onAddAppointment}
          onUpdateStatus={onUpdateAppointmentStatus}
          onRescheduleAppointment={onRescheduleAppointment}
          onSelectPatient={onSelectPatient}
          onStartNewConsultation={onStartNewConsultation}
          doctorId={patients[0]?.doctorId ?? ''}
          doctorName={doctorName}
          doctorCrm={doctorCrm}
        />
      ) : (
        <div className="space-y-6">
          {/* Top Welcome Banner */}
          <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl p-6 shadow-xl border border-sky-900/80">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-sky-500/20 text-sky-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-sky-500/30">
                    Painel do Pediatra
                  </span>
                  <span className="text-sky-300/80 text-xs">
                    • {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Consultório e Prontuários dos Pacientes
                </h1>
                <p className="text-xs text-sky-200/80 max-w-2xl">
                  Selecione o paciente para registrar anamnese pediátrica, acompanhar curvas antropométricas de crescimento (OMS/SBP), analisar exames e prescrever o plano de cuidado.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => setActiveTab('agenda')}
                  className="flex items-center justify-center gap-2 bg-sky-950/80 hover:bg-sky-900 text-sky-200 hover:text-white text-xs font-bold px-4 py-3 rounded-xl transition-all border border-sky-800"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Ver Agenda</span>
                </button>

                <button
                  onClick={onOpenNewPatientModal}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 text-xs font-extrabold px-5 py-3 rounded-xl transition-all shadow-md active:scale-95 border border-cyan-300/40"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Cadastrar Paciente</span>
                </button>
              </div>
            </div>
          </div>

          {/* Patients Filter Controls Bar */}
          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-md border border-sky-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Single Main Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sky-600" />
                <input
                  type="text"
                  placeholder="Buscar paciente por nome, mãe ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-sky-50/70 border border-sky-200 rounded-xl font-medium text-sky-950 placeholder-sky-800/50 focus:outline-none focus:border-sky-500 focus:bg-white shadow-inner transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
                {/* Sort Selector */}
                <div className="flex items-center gap-2 bg-sky-50/80 border border-sky-200/80 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-900">
                  <ArrowUpDown className="w-3.5 h-3.5 text-sky-600" />
                  <span className="hidden md:inline">Ordem:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-sky-950 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="name">Nome (A-Z)</option>
                    <option value="consultation">Última Consulta</option>
                    <option value="age">Idade (Mais novo)</option>
                  </select>
                </div>

                {/* Toggle View Mode Buttons */}
                <div className="flex items-center bg-sky-100/70 p-1 rounded-xl border border-sky-200/80 text-xs font-bold">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                      viewMode === 'cards'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-sky-900 hover:text-sky-950 hover:bg-sky-200/50'
                    }`}
                    title="Visualização em Blocos/Grid"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Blocos</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                      viewMode === 'list'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-sky-900 hover:text-sky-950 hover:bg-sky-200/50'
                    }`}
                    title="Visualização em Tabela/Lista Compacta"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Lista</span>
                  </button>
                </div>

                <div className="text-xs font-bold text-sky-900 bg-sky-100/80 px-3 py-1.5 rounded-xl border border-sky-200">
                  {sortedPatients.length} {sortedPatients.length === 1 ? 'paciente' : 'pacientes'}
                </div>
              </div>
            </div>

            {/* View Mode 1: Cards / Grid View */}
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedPatients.map((p) => {
                  const isSelected = p.id === selectedPatientId;
                  const patientConsultations = consultations.filter((c) => c.patientId === p.id);
                  const lastConsultation = patientConsultations[patientConsultations.length - 1];
                  const nextApt = appointments.find((a) => a.patientId === p.id && a.status === 'agendada');

                  return (
                    <div
                      key={p.id}
                      className={`bg-white/80 backdrop-blur-md border rounded-2xl p-5 transition-all flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md ${
                        isSelected
                          ? 'border-sky-500 ring-2 ring-sky-500/30 bg-white'
                          : 'border-sky-200/80 hover:border-sky-400'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-sky-100 overflow-hidden shrink-0 border border-sky-300/60 flex items-center justify-center">
                              {p.photoUrl ? (
                                <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-6 h-6 text-sky-700" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-sky-950 text-sm leading-snug">{p.name}</h3>
                              <p className="text-xs font-extrabold text-sky-700 mt-0.5">
                                {formatPediatricAge(p.birthDate)} ({p.gender === 'masculino' ? 'Menino' : 'Menina'})
                              </p>
                            </div>
                          </div>

                          {p.bloodType && (
                            <span className="bg-sky-100 text-sky-900 border border-sky-300/80 text-[11px] font-extrabold px-2 py-0.5 rounded-md shrink-0">
                              {p.bloodType}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-sky-950 space-y-1 bg-sky-50/80 p-2.5 rounded-xl border border-sky-200/70">
                          <div className="flex justify-between">
                            <span className="text-sky-800/80 font-medium">Mãe:</span>
                            <span className="font-bold text-sky-950">{p.motherName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sky-800/80 font-medium">Código de Acesso:</span>
                            <span className="font-mono font-bold text-sky-900">{p.accessCode}</span>
                          </div>
                          {lastConsultation && (
                            <div className="flex justify-between pt-1 border-t border-sky-200/60">
                              <span className="text-sky-800/80 font-medium">Última Consulta:</span>
                              <span className="font-bold text-sky-950">
                                {new Date(lastConsultation.date).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Next Scheduled Appointment */}
                        {nextApt && (
                          <div className="text-[11px] bg-sky-100/90 border border-sky-300/80 p-2.5 rounded-xl font-bold text-sky-950 flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                              <span>
                                Agendada: {new Date(nextApt.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {nextApt.time}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Allergies Alert */}
                        {p.allergies.length > 0 && p.allergies[0] !== 'Aprovado sem alergias conhecidas até o momento' && (
                          <div className="text-[11px] text-sky-950 bg-sky-100/90 border border-sky-300/80 p-2 rounded-lg font-bold flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                            <span>Alergia: {p.allergies.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-sky-200/60">
                        <button
                          onClick={() => onSelectPatient(p.id)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-slate-900 text-white'
                              : 'bg-sky-100/70 text-sky-900 hover:bg-sky-200/80 border border-sky-300/60'
                          }`}
                        >
                          {isSelected ? 'Selecionado' : 'Prontuário'}
                        </button>

                        <button
                          onClick={() => {
                            onSelectPatient(p.id);
                            onStartNewConsultation(p.id);
                          }}
                          className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm"
                          title="Novo Atendimento"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Atender</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* View Mode 2: List / Table View */
              <div className="bg-white/80 backdrop-blur-md border border-sky-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-sky-100/80 text-sky-900 border-b border-sky-200 font-extrabold uppercase tracking-wider text-[11px]">
                        <th className="p-3.5">Paciente</th>
                        <th className="p-3.5">Idade</th>
                        <th className="p-3.5">Mãe / Acompanhante</th>
                        <th className="p-3.5">Código Acesso</th>
                        <th className="p-3.5">Última Consulta</th>
                        <th className="p-3.5">Próxima Consulta</th>
                        <th className="p-3.5 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-100 font-medium text-sky-950">
                      {sortedPatients.map((p) => {
                        const isSelected = p.id === selectedPatientId;
                        const patientConsultations = consultations.filter((c) => c.patientId === p.id);
                        const lastConsultation = patientConsultations[patientConsultations.length - 1];
                        const nextApt = appointments.find((a) => a.patientId === p.id && a.status === 'agendada');

                        return (
                          <tr
                            key={p.id}
                            className={`hover:bg-sky-50/80 transition-colors ${
                              isSelected ? 'bg-sky-100/50 font-bold' : ''
                            }`}
                          >
                            <td className="p-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-sky-200/80 overflow-hidden shrink-0 flex items-center justify-center font-bold text-sky-900">
                                  {p.photoUrl ? (
                                    <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                                  ) : (
                                    p.name.charAt(0)
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-sky-950">{p.name}</div>
                                  {p.bloodType && (
                                    <span className="text-[10px] text-sky-700 font-extrabold">{p.bloodType}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 font-bold text-sky-800">
                              {formatPediatricAge(p.birthDate)}
                            </td>
                            <td className="p-3.5 text-sky-900 font-semibold">{p.motherName}</td>
                            <td className="p-3.5 font-mono font-bold text-sky-900">{p.accessCode}</td>
                            <td className="p-3.5 text-sky-900 font-semibold">
                              {lastConsultation
                                ? new Date(lastConsultation.date).toLocaleDateString('pt-BR')
                                : 'Nenhuma'}
                            </td>
                            <td className="p-3.5 text-sky-900 font-semibold">
                              {nextApt ? (
                                <span className="bg-sky-100 text-sky-950 font-bold px-2 py-0.5 rounded-md border border-sky-300 text-[11px]">
                                  {new Date(nextApt.date + 'T00:00:00').toLocaleDateString('pt-BR')} {nextApt.time}
                                </span>
                              ) : (
                                <span className="text-slate-400">Não agendada</span>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => onSelectPatient(p.id)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    isSelected
                                      ? 'bg-slate-900 text-white'
                                      : 'bg-sky-100 text-sky-900 hover:bg-sky-200 border border-sky-300/80'
                                  }`}
                                >
                                  {isSelected ? 'Ativo' : 'Prontuário'}
                                </button>
                                <button
                                  onClick={() => {
                                    onSelectPatient(p.id);
                                    onStartNewConsultation(p.id);
                                  }}
                                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1"
                                >
                                  <Stethoscope className="w-3.5 h-3.5" />
                                  <span>Atender</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


