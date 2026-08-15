import React, { useState, useMemo } from 'react';
import {
  Patient,
  Consultation,
  VaccineRecord,
  PrescriptionItem,
  ClinicalVitals,
  AntropometricParams,
} from '../../types/ppueri';
import {
  calculateZScores,
  evaluateClinicalVitals,
  getAgeInMonths,
  formatPediatricAge,
  getZScoreClassification,
} from '../../lib/pediatric-rules';
import { ClinicalFlag } from '../ui/ClinicalFlag';
import { ArrowLeft, Plus, Trash2, CheckCircle } from 'lucide-react';

interface ConsultationFormProps {
  patient: Patient;
  consultations: Consultation[];
  vaccines: VaccineRecord[];
  onSaveConsultation: (consultation: Consultation) => void;
  onUpdateVaccineStatus: (
    vaccineId: string,
    status: VaccineRecord['status'],
    date?: string,
    batch?: string
  ) => void;
  onBack: () => void;
  doctorId: string;
  doctorName: string;
  doctorCrm: string;
}

const todayStr = new Date().toISOString().split('T')[0];

const inputCls =
  'w-full px-3 py-2 text-xs bg-sky-50/70 border border-sky-200 rounded-xl font-medium text-sky-950 placeholder-sky-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all';
const textareaCls =
  'w-full px-3 py-2 text-xs bg-sky-50/70 border border-sky-200 rounded-xl font-medium text-sky-950 placeholder-sky-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all resize-none';
const sectionHeadCls =
  'text-xs font-extrabold text-sky-950 uppercase tracking-wider mb-3 pb-2 border-b border-sky-200';
const labelCls = 'block text-xs font-bold text-sky-800 mb-1';
const sectionCardCls =
  'bg-white/80 border border-sky-200 rounded-2xl p-5 shadow-sm space-y-4';
const zBadgeCls = (status: 'normal' | 'alerta' | 'critico') => {
  if (status === 'normal') return 'bg-sky-100 text-sky-800 border-sky-300';
  if (status === 'alerta') return 'bg-amber-100 text-amber-900 border-amber-300';
  return 'bg-red-100 text-red-900 border-red-300';
};

export const ConsultationForm: React.FC<ConsultationFormProps> = ({
  patient,
  consultations,
  onSaveConsultation,
  onBack,
  doctorId,
  doctorName,
  doctorCrm,
}) => {
  // Last saved consultation to pull perinatal data from
  const prevConsultation = useMemo(
    () =>
      [...consultations]
        .filter((c) => c.patientId === patient.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0],
    [consultations, patient.id]
  );
  const prevAnamnesis = prevConsultation?.anamnesis;

  // ── Section A: Anamnese ──────────────────────────────────────
  const [consultationDate, setConsultationDate] = useState(todayStr);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [hda, setHda] = useState('');
  const [currentHabits, setCurrentHabits] = useState('');

  // ── Section B: Antropometria & Vitais ────────────────────────
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [headCm, setHeadCm] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [systolicBP, setSystolicBP] = useState('');
  const [diastolicBP, setDiastolicBP] = useState('');
  const [tempC, setTempC] = useState('');
  const [spo2, setSpo2] = useState('');

  // ── Section C: Exame Físico ───────────────────────────────────
  const [physicalExam, setPhysicalExam] = useState('');

  // ── Section D: Conduta ────────────────────────────────────────
  const [diagnosisText, setDiagnosisText] = useState('');
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [feedingInstructions, setFeedingInstructions] = useState('');
  const [generalCareInstructions, setGeneralCareInstructions] = useState('');
  const [warningSignsText, setWarningSignsText] = useState('');
  const [nextAppointmentRecommended, setNextAppointmentRecommended] = useState('');

  // ── Live computations ─────────────────────────────────────────
  const ageMonths = getAgeInMonths(patient.birthDate, consultationDate || todayStr);

  const zScores = useMemo<AntropometricParams | null>(() => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    if (w > 0 && h > 0) {
      const hc = parseFloat(headCm) || undefined;
      return calculateZScores(ageMonths, patient.gender, w, h, hc);
    }
    return null;
  }, [weightKg, heightCm, headCm, ageMonths, patient.gender]);

  const vitalsEvaluations = useMemo(() => {
    const hr = parseFloat(heartRate) || 0;
    const rr = parseFloat(respiratoryRate) || 0;
    const sbp = parseFloat(systolicBP) || 0;
    const dbp = parseFloat(diastolicBP) || 0;
    const temp = parseFloat(tempC) || 0;
    const o2 = parseFloat(spo2) || 0;
    if (!hr && !rr && !sbp && !dbp && !temp && !o2) return [];
    const vitals: ClinicalVitals = {
      heartRateBpm: hr,
      respiratoryRateRpm: rr,
      systolicBP: sbp,
      diastolicBP: dbp,
      temperatureC: temp,
      oxygenSaturationPct: o2,
    };
    return evaluateClinicalVitals(vitals, ageMonths);
  }, [heartRate, respiratoryRate, systolicBP, diastolicBP, tempC, spo2, ageMonths]);

  // ── Prescription helpers ──────────────────────────────────────
  const addPrescription = () => {
    setPrescriptions((prev) => [
      ...prev,
      { id: `rx_${Date.now()}`, medication: '', dosage: '', frequency: '', duration: '', instructions: '' },
    ]);
  };

  const updatePrescription = (id: string, field: keyof PrescriptionItem, value: string) => {
    setPrescriptions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const removePrescription = (id: string) => {
    setPrescriptions((prev) => prev.filter((p) => p.id !== id));
  };

  // ── Save ──────────────────────────────────────────────────────
  const handleSaveAll = () => {
    const w = parseFloat(weightKg) || 0;
    const h = parseFloat(heightCm) || 0;
    const hc = parseFloat(headCm) || undefined;
    const hr = parseFloat(heartRate) || 0;
    const rr = parseFloat(respiratoryRate) || 0;
    const sbp = parseFloat(systolicBP) || 0;
    const dbp = parseFloat(diastolicBP) || 0;
    const temp = parseFloat(tempC) || 0;
    const o2 = parseFloat(spo2) || 0;

    const vitals: ClinicalVitals = {
      heartRateBpm: hr,
      respiratoryRateRpm: rr,
      systolicBP: sbp,
      diastolicBP: dbp,
      temperatureC: temp,
      oxygenSaturationPct: o2,
    };

    const antropometry: AntropometricParams =
      w > 0 && h > 0
        ? calculateZScores(ageMonths, patient.gender, w, h, hc)
        : { weightKg: w, heightCm: h, headCircumferenceCm: hc };

    const evs =
      hr > 0 || rr > 0 || sbp > 0 || dbp > 0 || temp > 0 || o2 > 0
        ? evaluateClinicalVitals(vitals, ageMonths)
        : [];

    const consultation: Consultation = {
      id: `cons_${Date.now()}`,
      doctorId,
      patientId: patient.id,
      doctorName,
      doctorCrm,
      date: consultationDate || todayStr,
      anamnesis: {
        gestationalHistory: prevAnamnesis?.gestationalHistory ?? '',
        birthType: prevAnamnesis?.birthType ?? 'vaginal',
        birthWeightKg: prevAnamnesis?.birthWeightKg ?? 0,
        birthLengthCm: prevAnamnesis?.birthLengthCm ?? 0,
        headCircumferenceAtBirthCm: prevAnamnesis?.headCircumferenceAtBirthCm ?? 0,
        apgar1Min: prevAnamnesis?.apgar1Min ?? 0,
        apgar5Min: prevAnamnesis?.apgar5Min ?? 0,
        breastfeedingStatus: prevAnamnesis?.breastfeedingStatus ?? 'exclusivo',
        familyHistory: prevAnamnesis?.familyHistory ?? '',
        chiefComplaint,
        historyOfPresentIllness: hda,
        currentMedications: prevAnamnesis?.currentMedications ?? [],
        allergies: patient.allergies,
        currentHabits,
        physicalExam,
      },
      antropometry,
      vitals,
      vitalsEvaluations: evs,
      exams: [],
      carePlan: {
        diagnosisText,
        prescriptions,
        feedingInstructions,
        generalCareInstructions,
        warningSignsToReturn: warningSignsText
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean),
        nextAppointmentRecommended,
      },
    };

    onSaveConsultation(consultation);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-sky-900/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-sky-950/80 hover:bg-sky-900 text-sky-300 hover:text-white transition-all border border-sky-800"
              title="Voltar ao prontuário"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg font-bold text-white">Nova Consulta — {patient.name}</h1>
                <span className="bg-sky-500/20 text-sky-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-sky-500/30">
                  {formatPediatricAge(patient.birthDate)}
                </span>
              </div>
              <p className="text-xs text-sky-400 mt-0.5">
                {patient.gender === 'masculino' ? 'Menino' : 'Menina'} ·{' '}
                {ageMonths} meses de vida
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex flex-col items-end gap-1">
              <label className="text-xs text-sky-400 font-medium">Data da Consulta</label>
              <input
                type="date"
                value={consultationDate}
                onChange={(e) => setConsultationDate(e.target.value)}
                className="bg-sky-950/80 border border-sky-800 text-sky-200 text-xs font-bold px-3 py-1.5 rounded-xl focus:outline-none focus:border-sky-500"
              />
            </div>
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md border border-sky-500/40"
            >
              <CheckCircle className="w-4 h-4" />
              Finalizar Consulta
            </button>
          </div>
        </div>
      </div>

      {/* Section A — Anamnese */}
      <div className={sectionCardCls}>
        <h2 className={sectionHeadCls}>A — Anamnese</h2>

        <div>
          <label className={labelCls}>Queixa Principal (QP)</label>
          <textarea
            rows={2}
            className={textareaCls}
            placeholder="Descreva a queixa principal do paciente..."
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>História da Moléstia Atual (HDA)</label>
          <textarea
            rows={3}
            className={textareaCls}
            placeholder="Descreva a história da moléstia atual..."
            value={hda}
            onChange={(e) => setHda(e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>Hábitos Atuais — alimentação, sono, atividade física</label>
          <textarea
            rows={2}
            className={textareaCls}
            placeholder="Ex.: dieta variada, 10h de sono/noite, brincadeiras ao ar livre..."
            value={currentHabits}
            onChange={(e) => setCurrentHabits(e.target.value)}
          />
        </div>
      </div>

      {/* Section B — Antropometria & Sinais Vitais */}
      <div className={sectionCardCls}>
        <h2 className={sectionHeadCls}>B — Antropometria & Sinais Vitais</h2>

        {/* Anthropometry inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Peso (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              className={inputCls}
              placeholder="Ex.: 8.5"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Estatura / Comprimento (cm)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              className={inputCls}
              placeholder="Ex.: 72.0"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Perímetro Cefálico (cm)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              className={inputCls}
              placeholder="Ex.: 44.5"
              value={headCm}
              onChange={(e) => setHeadCm(e.target.value)}
            />
          </div>
        </div>

        {/* Live Z-Scores */}
        {zScores && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {zScores.weightZScore !== undefined && zScores.weightKg > 0 && (() => {
              const cls = getZScoreClassification('peso', zScores.weightZScore!);
              return (
                <div className={`text-xs font-bold px-3 py-2 rounded-xl border ${zBadgeCls(cls.status)}`}>
                  <div className="text-[10px] uppercase tracking-wide opacity-70 mb-0.5">Peso Z-Score</div>
                  <div>Z: {zScores.weightZScore! > 0 ? '+' : ''}{zScores.weightZScore} · P{zScores.weightPercentile}</div>
                  <div className="text-[10px] mt-0.5 font-medium">{cls.label}</div>
                </div>
              );
            })()}
            {zScores.heightZScore !== undefined && zScores.heightCm > 0 && (() => {
              const cls = getZScoreClassification('estatura', zScores.heightZScore!);
              return (
                <div className={`text-xs font-bold px-3 py-2 rounded-xl border ${zBadgeCls(cls.status)}`}>
                  <div className="text-[10px] uppercase tracking-wide opacity-70 mb-0.5">Estatura Z-Score</div>
                  <div>Z: {zScores.heightZScore! > 0 ? '+' : ''}{zScores.heightZScore} · P{zScores.heightPercentile}</div>
                  <div className="text-[10px] mt-0.5 font-medium">{cls.label}</div>
                </div>
              );
            })()}
            {zScores.headCircumferenceZScore !== undefined && (() => {
              const cls = getZScoreClassification('perimetro', zScores.headCircumferenceZScore!);
              return (
                <div className={`text-xs font-bold px-3 py-2 rounded-xl border ${zBadgeCls(cls.status)}`}>
                  <div className="text-[10px] uppercase tracking-wide opacity-70 mb-0.5">PC Z-Score</div>
                  <div>Z: {zScores.headCircumferenceZScore! > 0 ? '+' : ''}{zScores.headCircumferenceZScore} · P{zScores.headCircumferencePercentile}</div>
                  <div className="text-[10px] mt-0.5 font-medium">{cls.label}</div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Vitals inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className={labelCls}>FC (bpm)</label>
            <input
              type="number"
              min="0"
              className={inputCls}
              placeholder="Ex.: 110"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>FR (rpm)</label>
            <input
              type="number"
              min="0"
              className={inputCls}
              placeholder="Ex.: 28"
              value={respiratoryRate}
              onChange={(e) => setRespiratoryRate(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>PA Sistólica (mmHg)</label>
            <input
              type="number"
              min="0"
              className={inputCls}
              placeholder="Ex.: 90"
              value={systolicBP}
              onChange={(e) => setSystolicBP(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>PA Diastólica (mmHg)</label>
            <input
              type="number"
              min="0"
              className={inputCls}
              placeholder="Ex.: 60"
              value={diastolicBP}
              onChange={(e) => setDiastolicBP(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Temperatura (°C)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              className={inputCls}
              placeholder="Ex.: 36.8"
              value={tempC}
              onChange={(e) => setTempC(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>SpO2 (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              className={inputCls}
              placeholder="Ex.: 98"
              value={spo2}
              onChange={(e) => setSpo2(e.target.value)}
            />
          </div>
        </div>

        {/* Clinical Flags */}
        {vitalsEvaluations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {vitalsEvaluations.map((ev) => (
              <ClinicalFlag key={ev.parameterKey} evaluation={ev} />
            ))}
          </div>
        )}
      </div>

      {/* Section C — Exame Físico Pediátrico */}
      <div className={sectionCardCls}>
        <h2 className={sectionHeadCls}>C — Exame Físico Pediátrico</h2>
        <div>
          <label className={labelCls}>Achados do Exame Físico</label>
          <textarea
            rows={4}
            className={textareaCls}
            placeholder="Descreva os achados do exame físico: estado geral, pele, mucosas, ausculta cardíaca, pulmonar, abdome, neurológico..."
            value={physicalExam}
            onChange={(e) => setPhysicalExam(e.target.value)}
          />
        </div>
      </div>

      {/* Section D — Conduta, Prescrição & Orientações */}
      <div className={sectionCardCls}>
        <h2 className={sectionHeadCls}>D — Conduta, Prescrição & Orientações</h2>

        <div>
          <label className={labelCls}>Hipótese Diagnóstica</label>
          <input
            type="text"
            className={inputCls}
            placeholder="Ex.: IVAS viral, otite média aguda..."
            value={diagnosisText}
            onChange={(e) => setDiagnosisText(e.target.value)}
          />
        </div>

        {/* Prescription Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelCls + ' mb-0'}>Prescrições</label>
            <button
              type="button"
              onClick={addPrescription}
              className="flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-100 hover:bg-sky-200 border border-sky-300 px-3 py-1.5 rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Medicamento
            </button>
          </div>

          {prescriptions.length === 0 ? (
            <p className="text-xs text-sky-600 italic py-2 text-center border border-dashed border-sky-200 rounded-xl bg-sky-50/50">
              Nenhuma prescrição adicionada
            </p>
          ) : (
            <div className="space-y-3">
              {prescriptions.map((rx, idx) => (
                <div
                  key={rx.id}
                  className="border border-sky-200 rounded-xl p-3 bg-sky-50/60 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-extrabold text-sky-800">
                      Medicamento {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePrescription(rx.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      className={inputCls}
                      placeholder="Medicamento"
                      value={rx.medication}
                      onChange={(e) => updatePrescription(rx.id, 'medication', e.target.value)}
                    />
                    <input
                      type="text"
                      className={inputCls}
                      placeholder="Dosagem (Ex.: 250 mg/5 mL)"
                      value={rx.dosage}
                      onChange={(e) => updatePrescription(rx.id, 'dosage', e.target.value)}
                    />
                    <input
                      type="text"
                      className={inputCls}
                      placeholder="Frequência (Ex.: 8/8h)"
                      value={rx.frequency}
                      onChange={(e) => updatePrescription(rx.id, 'frequency', e.target.value)}
                    />
                    <input
                      type="text"
                      className={inputCls}
                      placeholder="Duração (Ex.: 7 dias)"
                      value={rx.duration}
                      onChange={(e) => updatePrescription(rx.id, 'duration', e.target.value)}
                    />
                    <input
                      type="text"
                      className={inputCls + ' sm:col-span-2'}
                      placeholder="Instruções adicionais (opcional)"
                      value={rx.instructions ?? ''}
                      onChange={(e) => updatePrescription(rx.id, 'instructions', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className={labelCls}>Orientações de Alimentação</label>
          <textarea
            rows={2}
            className={textareaCls}
            placeholder="Descreva recomendações alimentares específicas..."
            value={feedingInstructions}
            onChange={(e) => setFeedingInstructions(e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>Cuidados Gerais</label>
          <textarea
            rows={2}
            className={textareaCls}
            placeholder="Orientações gerais de cuidado em casa..."
            value={generalCareInstructions}
            onChange={(e) => setGeneralCareInstructions(e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>
            Sinais de Alerta para Retorno{' '}
            <span className="font-medium text-sky-600">(separados por ponto e vírgula)</span>
          </label>
          <input
            type="text"
            className={inputCls}
            placeholder="Ex.: Febre acima de 39°C; Dificuldade para respirar; Recusa alimentar"
            value={warningSignsText}
            onChange={(e) => setWarningSignsText(e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls}>Recomendação de Retorno</label>
          <input
            type="text"
            className={inputCls}
            placeholder="Ex.: Retorno em 30 dias ou conforme necessidade"
            value={nextAppointmentRecommended}
            onChange={(e) => setNextAppointmentRecommended(e.target.value)}
          />
        </div>

        {/* Bottom save button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSaveAll}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-md border border-sky-500/40"
          >
            <CheckCircle className="w-4 h-4" />
            Finalizar e Salvar Consulta
          </button>
        </div>
      </div>
    </div>
  );
};
