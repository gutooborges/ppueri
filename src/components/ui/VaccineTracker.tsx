import React, { useState } from 'react';
import { VaccineRecord } from '../../types/ppueri';
import { Syringe, CheckCircle, Clock, AlertTriangle, Search, Filter, Calendar, Building, Tag } from 'lucide-react';

interface VaccineTrackerProps {
  vaccines: VaccineRecord[];
  onUpdateVaccineStatus: (vaccineId: string, status: VaccineRecord['status'], date?: string, batch?: string) => void;
  isDoctorView?: boolean;
}

export const VaccineTracker: React.FC<VaccineTrackerProps> = ({
  vaccines,
  onUpdateVaccineStatus,
  isDoctorView = true,
}) => {
  const [filter, setFilter] = useState<'todas' | 'aplicadas' | 'atrasadas' | 'proximas' | 'pendentes'>('todas');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputBatch, setInputBatch] = useState('');

  const filteredVaccines = vaccines.filter((v) => {
    const matchesSearch =
      v.vaccineName.toLowerCase().includes(search.toLowerCase()) ||
      v.targetDisease.toLowerCase().includes(search.toLowerCase()) ||
      v.targetAgeBracket.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'todas') return true;
    return v.status === filter;
  });

  const appliedCount = vaccines.filter((v) => v.status === 'aplicada').length;
  const overdueCount = vaccines.filter((v) => v.status === 'atrasada').length;
  const upcomingCount = vaccines.filter((v) => v.status === 'proxima').length;

  const handleApply = (id: string) => {
    onUpdateVaccineStatus(id, 'aplicada', inputDate, inputBatch || 'LOTE-PNI-2026');
    setEditingId(null);
    setInputBatch('');
  };

  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-sky-100 text-sky-700 rounded-xl">
            <Syringe className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Calendário Vacinal Interativo (PNI / SBP)
            </h3>
            <p className="text-xs text-slate-500">
              Acompanhamento de imunização do recém-nascido aos 16 anos
            </p>
          </div>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <div className="bg-sky-50 text-sky-900 border border-sky-200 px-3 py-1 rounded-lg flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-sky-600" />
            <span>{appliedCount} Aplicadas</span>
          </div>
          {overdueCount > 0 && (
            <div className="bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1 rounded-lg flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{overdueCount} Atrasadas</span>
            </div>
          )}
          <div className="bg-cyan-50 text-cyan-900 border border-cyan-200 px-3 py-1 rounded-lg flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-600" />
            <span>{upcomingCount} Próximas Doses</span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar vacina ou doença..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setFilter('todas')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap transition-all ${
              filter === 'todas' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({vaccines.length})
          </button>
          <button
            onClick={() => setFilter('aplicadas')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap transition-all ${
              filter === 'aplicadas' ? 'bg-white text-sky-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Aplicadas
          </button>
          <button
            onClick={() => setFilter('atrasadas')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap transition-all ${
              filter === 'atrasadas' ? 'bg-amber-50 text-amber-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Atrasadas
          </button>
          <button
            onClick={() => setFilter('proximas')}
            className={`px-3 py-1 rounded-lg whitespace-nowrap transition-all ${
              filter === 'proximas' ? 'bg-cyan-50 text-cyan-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Próximas
          </button>
        </div>
      </div>

      {/* Vaccine List / Table */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {filteredVaccines.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Nenhuma vacina encontrada para os filtros selecionados.
          </div>
        ) : (
          filteredVaccines.map((v) => {
            const isApplied = v.status === 'aplicada';
            const isOverdue = v.status === 'atrasada';
            const isUpcoming = v.status === 'proxima';

            return (
              <div
                key={v.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isApplied
                    ? 'bg-slate-50/80 border-slate-200'
                    : isOverdue
                    ? 'bg-amber-50/80 border-amber-300 shadow-sm'
                    : isUpcoming
                    ? 'bg-cyan-50/50 border-cyan-200'
                    : 'bg-white border-slate-200 hover:border-sky-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{v.vaccineName}</span>
                      <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {v.targetAgeBracket}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Prevenção: <strong className="text-slate-800">{v.targetDisease}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span>Dose {v.doseNumber} de {v.totalDoses}</span>
                    </div>

                    {isApplied && (
                      <div className="flex items-center gap-3 text-[11px] text-sky-800 pt-1 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-sky-600" />
                          Aplicada em: {v.applicationDate ? new Date(v.applicationDate).toLocaleDateString('pt-BR') : 'Data informada'}
                        </span>
                        {v.batchNumber && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-sky-600" />
                            Lote: {v.batchNumber}
                          </span>
                        )}
                        {v.clinicName && (
                          <span className="flex items-center gap-1 hidden md:flex">
                            <Building className="w-3 h-3 text-sky-600" />
                            {v.clinicName}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        isApplied
                          ? 'bg-sky-100 text-sky-800 border border-sky-300'
                          : isOverdue
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isUpcoming
                          ? 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-sky-600" />
                          Aplicada
                        </>
                      ) : isOverdue ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Atrasada
                        </>
                      ) : isUpcoming ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-cyan-600" />
                          Próxima Dose
                        </>
                      ) : (
                        <>Pendente</>
                      )}
                    </span>

                    {/* Registration Trigger for Doctor / Parent */}
                    {isDoctorView && !isApplied && editingId !== v.id && (
                      <button
                        onClick={() => setEditingId(v.id)}
                        className="text-xs bg-slate-900 hover:bg-sky-700 text-white font-semibold px-3 py-1 rounded-lg transition-colors"
                      >
                        Registrar
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Registration Form */}
                {editingId === v.id && (
                  <div className="mt-3 pt-3 border-t border-slate-200 bg-slate-50 p-3 rounded-xl flex flex-wrap items-center gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Data de Aplicação:</label>
                      <input
                        type="date"
                        value={inputDate}
                        onChange={(e) => setInputDate(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Número do Lote:</label>
                      <input
                        type="text"
                        placeholder="Ex: Lote-2026-X"
                        value={inputBatch}
                        onChange={(e) => setInputBatch(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs w-32"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-4 ml-auto">
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-slate-500 font-semibold px-2 py-1 hover:text-slate-800"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleApply(v.id)}
                        className="bg-sky-600 text-white font-bold px-3 py-1 rounded-lg hover:bg-sky-500 shadow-sm"
                      >
                        Confirmar Aplicação
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
