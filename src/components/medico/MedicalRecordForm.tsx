import React, { useState, useEffect } from 'react';
import { Patient, Consultation, ClinicalVitals, PrescriptionItem, LabExam, VaccineRecord } from '../../types/ppueri';
import { getAgeInMonths, getAgeBracket, evaluateClinicalVitals, calculateZScores, formatPediatricAge, getZScoreClassification } from '../../lib/pediatric-rules';
import { ClinicalFlag } from '../ui/ClinicalFlag';
import { PdfOcrUploader } from '../ui/PdfOcrUploader';
import { VaccineTracker } from '../ui/VaccineTracker';
import { AccessCodeGenerator } from '../ui/AccessCodeGenerator';
import { GrowthChart } from '../ui/GrowthChart';
import { ClinicalAiAssistant } from './ClinicalAiAssistant';
import { Stethoscope, Activity, FileText, Syringe, ClipboardList, CheckCircle, Plus, Trash2, ShieldAlert, ArrowLeft, Key, Brain, Sparkles } from 'lucide-react';


interface MedicalRecordFormProps {
  patient: Patient;
  consultations?: Consultation[];
  vaccines: VaccineRecord[];
  onSaveConsultation: (consultation: Consultation) => void;
  onUpdateVaccineStatus: (vaccineId: string, status: VaccineRecord['status'], date?: string, batch?: string) => void;
  onRegenerateAccessCode: (patientId: string) => void;
  onBack: () => void;
  doctorId: string;
  doctorName: string;
  doctorCrm: string;
}

export const MedicalRecordForm: React.FC<MedicalRecordFormProps> = ({
  patient,
  consultations = [],
  vaccines,
  onSaveConsultation,
  onUpdateVaccineStatus,
  onRegenerateAccessCode,
  onBack,
  doctorId,
  doctorName,
  doctorCrm,
}) => {
  const ageInMonths = getAgeInMonths(patient.birthDate);
  const ageBracket = getAgeBracket(ageInMonths);

  // 1. Anamnese State
  const [gestationalHistory, setGestationalHistory] = useState('');
  const [birthType, setBirthType] = useState<'vaginal' | 'cesarea' | 'forcipe' | ''>('');
  const [birthWeightKg, setBirthWeightKg] = useState(0);
  const [birthLengthCm, setBirthLengthCm] = useState(0);
  const [headCircumferenceAtBirthCm, setHeadCircumferenceAtBirthCm] = useState(0);
  const [apgar1Min, setApgar1Min] = useState(0);
  const [apgar5Min, setApgar5Min] = useState(0);
  const [breastfeedingStatus, setBreastfeedingStatus] = useState<'exclusivo' | 'misto' | 'formula' | 'desmamado' | ''>('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');
  const [allergiesInput, setAllergiesInput] = useState(patient.allergies.join(', '));
  const [medicationsInput, setMedicationsInput] = useState('');

  // 2. Antropometria State
  const [weightKg, setWeightKg] = useState(0);
  const [heightCm, setHeightCm] = useState(0);
  const [headCircumferenceCm, setHeadCircumferenceCm] = useState(0);

  // Auto-cálculo dos Z-Scores
  const antropometry = calculateZScores(
    ageInMonths,
    patient.gender,
    Number(weightKg) || 0,
    Number(heightCm) || 0,
    ageInMonths <= 36 ? Number(headCircumferenceCm) : undefined
  );

  // 3. Sinais Vitais State
  const [vitals, setVitals] = useState<ClinicalVitals>({
    systolicBP: 0,
    diastolicBP: 0,
    heartRateBpm: 0,
    respiratoryRateRpm: 0,
    temperatureC: 0,
    oxygenSaturationPct: 0,
  });

  // Validação dinâmica em tempo real
  const vitalsEvaluations = evaluateClinicalVitals(vitals, ageInMonths);

  // 4. Exames Vinculados (OCR)
  const [linkedExams, setLinkedExams] = useState<LabExam[]>([]);

  // 5. Plano de Cuidado e Prescrição State
  const [diagnosisText, setDiagnosisText] = useState('');
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [feedingInstructions, setFeedingInstructions] = useState('');
  const [generalCareInstructions, setGeneralCareInstructions] = useState('');
  const [warningSignsText, setWarningSignsText] = useState('');
  const [nextAppointment, setNextAppointment] = useState('');

  const [activeTab, setActiveTab] = useState<'anamnese' | 'antropometria' | 'exames' | 'vacinas' | 'prescricao' | 'cdss_ia'>('anamnese');


  // Adiciona nova linha de prescrição
  const handleAddPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      {
        id: `rx_${Date.now()}`,
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      },
    ]);
  };

  const handleRemovePrescription = (id: string) => {
    setPrescriptions(prescriptions.filter((p) => p.id !== id));
  };

  const handleUpdatePrescription = (id: string, field: keyof PrescriptionItem, val: string) => {
    setPrescriptions(
      prescriptions.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  const handleSaveAll = () => {
    const consultation: Consultation = {
      id: `cons_${Date.now()}`,
      doctorId,
      patientId: patient.id,
      doctorName,
      doctorCrm,
      date: new Date().toISOString(),
      anamnesis: {
        gestationalHistory,
        birthType,
        birthWeightKg: Number(birthWeightKg),
        birthLengthCm: Number(birthLengthCm),
        headCircumferenceAtBirthCm: Number(headCircumferenceAtBirthCm),
        apgar1Min: Number(apgar1Min),
        apgar5Min: Number(apgar5Min),
        breastfeedingStatus,
        familyHistory,
        chiefComplaint,
        historyOfPresentIllness,
        currentMedications: medicationsInput.split(',').map((s) => s.trim()).filter(Boolean),
        allergies: allergiesInput.split(',').map((s) => s.trim()).filter(Boolean),
      },
      antropometry,
      vitals,
      vitalsEvaluations,
      exams: linkedExams,
      carePlan: {
        diagnosisText,
        prescriptions,
        feedingInstructions,
        generalCareInstructions,
        warningSignsToReturn: warningSignsText.split(';').map((s) => s.trim()).filter(Boolean),
        nextAppointmentRecommended: nextAppointment,
      },
    };

    onSaveConsultation(consultation);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Patient Identity */}
      <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-white/80 hover:bg-white rounded-xl text-slate-700 transition-colors border border-slate-200/60 shadow-sm"
            title="Voltar ao Painel"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-slate-900">{patient.name}</span>
              <span className="bg-sky-100/80 text-sky-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-sky-200/80">
                {formatPediatricAge(patient.birthDate)}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Mãe: {patient.motherName} | CPF: {patient.cpf || 'Não informado'} | Código: <span className="font-mono font-bold text-sky-800">{patient.accessCode}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Finalizar Atendimento e Salvar Prontuário</span>
        </button>
      </div>

      {/* Access Code Token Bar for Doctor */}
      <AccessCodeGenerator patient={patient} onRegenerateCode={onRegenerateAccessCode} />

      {/* Navigation Tabs for PEP Modules */}
      <div className="flex items-center gap-1 bg-white/40 backdrop-blur-md p-1.5 rounded-2xl overflow-x-auto text-xs font-bold border border-white/50 shadow-sm">
        <button
          onClick={() => setActiveTab('anamnese')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'anamnese'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>1. Anamnese Pediátrica</span>
        </button>
        <button
          onClick={() => setActiveTab('antropometria')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'antropometria'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>2. Antropometria & Sinais Vitais</span>
        </button>
        <button
          onClick={() => setActiveTab('exames')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'exames'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>3. Leitor OCR de Exames</span>
        </button>
        <button
          onClick={() => setActiveTab('vacinas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'vacinas'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Syringe className="w-4 h-4" />
          <span>4. Vacinação PNI</span>
        </button>
        <button
          onClick={() => setActiveTab('prescricao')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'prescricao'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>5. Plano de Cuidado & Prescrição</span>
        </button>
        <button
          onClick={() => setActiveTab('cdss_ia')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'cdss_ia'
              ? 'bg-sky-600 text-white shadow-md font-bold'
              : 'text-sky-900 hover:text-sky-950 bg-sky-100/70 hover:bg-sky-100 font-extrabold border border-sky-300/80'
          }`}
        >
          <Brain className="w-4 h-4 text-sky-600" />
          <span>Suporte IA (CDSS)</span>
          <span className="bg-sky-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">IA</span>
        </button>
      </div>


      {/* TAB 1: ANAMNESE */}
      {activeTab === 'anamnese' && (
        <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Anamnese Pediátrica Completa</h2>
            <p className="text-xs text-slate-500">Histórico gestacional, nascimento, desenvolvimento e queixa principal</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Queixa Principal (QP):</label>
              <textarea
                rows={2}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">História da Moléstia Atual (HDA):</label>
              <textarea
                rows={2}
                value={historyOfPresentIllness}
                onChange={(e) => setHistoryOfPresentIllness(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Histórico Perinatal e Neonatal</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Tipo de Parto:</label>
                <select
                  value={birthType}
                  onChange={(e) => setBirthType(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold"
                >
                  <option value="" disabled>Selecione</option>
                  <option value="vaginal">Vaginal</option>
                  <option value="cesarea">Cesárea</option>
                  <option value="forcipe">Fórceps</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Peso ao Nascer (kg):</label>
                <input
                  type="number"
                  step="0.01"
                  value={birthWeightKg || ''}
                  onChange={(e) => setBirthWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Comprimento (cm):</label>
                <input
                  type="number"
                  step="0.1"
                  value={birthLengthCm || ''}
                  onChange={(e) => setBirthLengthCm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Perímetro Cefálico (cm):</label>
                <input
                  type="number"
                  step="0.1"
                  value={headCircumferenceAtBirthCm || ''}
                  onChange={(e) => setHeadCircumferenceAtBirthCm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-slate-600 font-medium mb-1">APGAR (1º e 5º min):</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="1 min"
                    value={apgar1Min || ''}
                    onChange={(e) => setApgar1Min(parseInt(e.target.value) || 0)}
                    className="w-1/2 bg-white border border-slate-300 rounded-lg p-2 font-semibold text-center"
                  />
                  <input
                    type="number"
                    placeholder="5 min"
                    value={apgar5Min || ''}
                    onChange={(e) => setApgar5Min(parseInt(e.target.value) || 0)}
                    className="w-1/2 bg-white border border-slate-300 rounded-lg p-2 font-semibold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Alimentação / Aleitamento:</label>
                <select
                  value={breastfeedingStatus}
                  onChange={(e) => setBreastfeedingStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold"
                >
                  <option value="" disabled>Selecione</option>
                  <option value="exclusivo">Aleitamento Materno Exclusivo</option>
                  <option value="misto">Aleitamento Misto / Complementado</option>
                  <option value="formula">Fórmula Infantil Exclusiva</option>
                  <option value="desmamado">Dieta da Família / Desmamado</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Histórico Gestacional:</label>
                <input
                  type="text"
                  value={gestationalHistory}
                  onChange={(e) => setGestationalHistory(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Alergias Conhecidas:</label>
              <input
                type="text"
                value={allergiesInput}
                onChange={(e) => setAllergiesInput(e.target.value)}
                placeholder="Ex: Leite de vaca, Dipirona, Nenhuma"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Medicações em Uso:</label>
              <input
                type="text"
                value={medicationsInput}
                onChange={(e) => setMedicationsInput(e.target.value)}
                placeholder="Ex: Vitamina D 400 UI/dia, Ferro Quelato"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Histórico Familiar:</label>
              <input
                type="text"
                value={familyHistory}
                onChange={(e) => setFamilyHistory(e.target.value)}
                placeholder="Ex: Pai asmático, Mãe com rinite"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANTROPOMETRIA & SINAIS VITAIS */}
      {activeTab === 'antropometria' && (
        <div className="space-y-6">
          {/* Antropometria Dinâmica com Z-Score */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Antropometria Dinâmica (Tabelas OMS / SBP)</h2>
              <p className="text-xs text-slate-500">Cálculo automático em tempo real de Z-Scores e Percentis</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-800">Peso Atual (kg):</label>
                <input
                  type="number"
                  step="0.05"
                  value={weightKg || ''}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-base text-slate-900"
                />
                <div className="text-[11px] font-semibold text-sky-800 bg-sky-100 p-2 rounded-lg">
                  Percentil: P{antropometry.weightPercentile} | Z-Score: {antropometry.weightZScore}
                  <div className="text-[10px] text-slate-700 mt-0.5">
                    {getZScoreClassification('peso', antropometry.weightZScore || 0).label}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-800">Estatura / Altura (cm):</label>
                <input
                  type="number"
                  step="0.5"
                  value={heightCm || ''}
                  onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-base text-slate-900"
                />
                <div className="text-[11px] font-semibold text-sky-800 bg-sky-100 p-2 rounded-lg">
                  Percentil: P{antropometry.heightPercentile} | Z-Score: {antropometry.heightZScore}
                  <div className="text-[10px] text-slate-700 mt-0.5">
                    {getZScoreClassification('estatura', antropometry.heightZScore || 0).label}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-800">Perímetro Cefálico (cm):</label>
                <input
                  type="number"
                  step="0.1"
                  value={headCircumferenceCm || ''}
                  onChange={(e) => setHeadCircumferenceCm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-base text-slate-900"
                />
                <div className="text-[11px] font-semibold text-sky-800 bg-sky-100 p-2 rounded-lg">
                  {antropometry.headCircumferencePercentile !== undefined ? (
                    <>
                      Percentil: P{antropometry.headCircumferencePercentile} | Z-Score: {antropometry.headCircumferenceZScore}
                      <div className="text-[10px] text-slate-700 mt-0.5">
                        {getZScoreClassification('perimetro', antropometry.headCircumferenceZScore || 0).label}
                      </div>
                    </>
                  ) : (
                    <span className="text-slate-500">Relevante até 36 meses</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Validador Dinâmico de Parâmetros Clínicos / Sinais Vitais */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Validador Dinâmico de Sinais Vitais Pediátricos
                </h2>
                <p className="text-xs text-slate-500">
                  Validação automática conforme faixa etária de <strong>{formatPediatricAge(patient.birthDate)}</strong>
                </p>
              </div>

              <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-lg">
                PALS / SBP
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">FC (bpm):</label>
                <input
                  type="number"
                  value={vitals.heartRateBpm || ''}
                  onChange={(e) => setVitals({ ...vitals, heartRateBpm: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">FR (rpm):</label>
                <input
                  type="number"
                  value={vitals.respiratoryRateRpm || ''}
                  onChange={(e) => setVitals({ ...vitals, respiratoryRateRpm: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">PA Sistólica (mmHg):</label>
                <input
                  type="number"
                  value={vitals.systolicBP || ''}
                  onChange={(e) => setVitals({ ...vitals, systolicBP: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">PA Diastólica (mmHg):</label>
                <input
                  type="number"
                  value={vitals.diastolicBP || ''}
                  onChange={(e) => setVitals({ ...vitals, diastolicBP: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Temp Axilar (°C):</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitals.temperatureC || ''}
                  onChange={(e) => setVitals({ ...vitals, temperatureC: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SatO2 (%):</label>
                <input
                  type="number"
                  value={vitals.oxygenSaturationPct || ''}
                  onChange={(e) => setVitals({ ...vitals, oxygenSaturationPct: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Render Clinical Flags for each vital sign */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Resultado do Parecer Fisiológico:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vitalsEvaluations.map((ev, idx) => (
                  <ClinicalFlag key={idx} evaluation={ev} />
                ))}
              </div>
            </div>
          </div>

          {/* Curvas Visuais de Acompanhamento Antropométrico Pediátrico */}
          <div className="pt-2">
            <GrowthChart
              patient={patient}
              consultations={[
                ...consultations.filter((c) => c.patientId === patient.id),
                {
                  id: 'current_live_form',
                  patientId: patient.id,
                  doctorName: 'Atendimento Atual',
                  doctorCrm: '',
                  date: new Date().toISOString(),
                  anamnesis: {
                    gestationalHistory,
                    birthType,
                    birthWeightKg,
                    birthLengthCm,
                    headCircumferenceAtBirthCm,
                    apgar1Min,
                    apgar5Min,
                    breastfeedingStatus,
                    familyHistory,
                    chiefComplaint,
                    historyOfPresentIllness,
                    currentMedications: [],
                    allergies: [],
                  },
                  antropometry,
                  vitals,
                  vitalsEvaluations,
                  exams: linkedExams,
                  carePlan: {
                    diagnosisText,
                    prescriptions,
                    feedingInstructions,
                    generalCareInstructions,
                    warningSignsToReturn: [],
                    nextAppointmentRecommended: nextAppointment,
                  },
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* TAB 3: EXAMES (OCR) */}
      {activeTab === 'exames' && (
        <div className="space-y-4">
          <PdfOcrUploader
            patientId={patient.id}
            onExamParsed={(exam) => setLinkedExams([...linkedExams, exam])}
          />

          {linkedExams.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                Exames Vinculados a este Atendimento ({linkedExams.length})
              </h3>
              {linkedExams.map((ex) => (
                <div key={ex.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{ex.title}</span>
                    <span className="text-sky-700">{ex.category}</span>
                  </div>
                  <p className="text-slate-600">{ex.items.length} itens extraídos via OCR. Parecer: {ex.doctorInterpretation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VACINAS */}
      {activeTab === 'vacinas' && (
        <VaccineTracker
          vaccines={vaccines}
          onUpdateVaccineStatus={onUpdateVaccineStatus}
          isDoctorView={true}
        />
      )}

      {/* TAB 5: PRESCRIÇÃO E ORIENTAÇÕES */}
      {activeTab === 'prescricao' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Plano de Cuidado & Prescrição Pediátrica</h2>
            <p className="text-xs text-slate-500">
              Prescrição de medicamentos, recomendações de alimentação, orientações gerais e sinais de alerta
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Hipótese Diagnóstica / Impressão Clínica:
            </label>
            <input
              type="text"
              value={diagnosisText}
              onChange={(e) => setDiagnosisText(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Dynamic Prescription Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Prescrição de Medicamentos:
              </h3>
              <button
                onClick={handleAddPrescription}
                className="flex items-center gap-1 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Medicamento</span>
              </button>
            </div>

            <div className="space-y-3">
              {prescriptions.map((rx, index) => (
                <div key={rx.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-700">Item #{index + 1}</span>
                    <button
                      onClick={() => handleRemovePrescription(rx.id)}
                      className="text-slate-400 hover:text-red-600"
                      title="Remover medicamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Medicamento e Concentração"
                      value={rx.medication}
                      onChange={(e) => handleUpdatePrescription(rx.id, 'medication', e.target.value)}
                      className="p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="Dose (ex: 2 gotas, 5mL)"
                      value={rx.dosage}
                      onChange={(e) => handleUpdatePrescription(rx.id, 'dosage', e.target.value)}
                      className="p-2 bg-white border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Frequência (ex: 1x ao dia)"
                      value={rx.frequency}
                      onChange={(e) => handleUpdatePrescription(rx.id, 'frequency', e.target.value)}
                      className="p-2 bg-white border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Duração (ex: 7 dias)"
                      value={rx.duration}
                      onChange={(e) => handleUpdatePrescription(rx.id, 'duration', e.target.value)}
                      className="p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Instruções de administração para os pais..."
                    value={rx.instructions || ''}
                    onChange={(e) => handleUpdatePrescription(rx.id, 'instructions', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-600"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Orientações de Alimentação:</label>
              <textarea
                rows={3}
                value={feedingInstructions}
                onChange={(e) => setFeedingInstructions(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Cuidados Gerais e Estimulação:</label>
              <textarea
                rows={3}
                value={generalCareInstructions}
                onChange={(e) => setGeneralCareInstructions(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-bold text-amber-900 mb-1 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Sinais de Alerta para Retorno Imediato (separados por ponto e vírgula):
              </label>
              <input
                type="text"
                value={warningSignsText}
                onChange={(e) => setWarningSignsText(e.target.value)}
                className="w-full p-2.5 border border-amber-300 bg-amber-50/50 rounded-xl focus:outline-none focus:border-amber-500 font-medium text-amber-950"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Recomendação de Retorno:</label>
              <input
                type="text"
                value={nextAppointment}
                onChange={(e) => setNextAppointment(e.target.value)}
                placeholder="Ex: 30 dias"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-sky-500 font-bold"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Finalizar Atendimento e Salvar Prontuário</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: CDSS IA (SUPORTE À DECISÃO CLÍNICA) */}
      {activeTab === 'cdss_ia' && (
        <ClinicalAiAssistant
          patient={patient}
          anamnesis={{
            gestationalHistory,
            birthType,
            birthWeightKg: Number(birthWeightKg),
            birthLengthCm: Number(birthLengthCm),
            headCircumferenceAtBirthCm: Number(headCircumferenceAtBirthCm),
            apgar1Min: Number(apgar1Min),
            apgar5Min: Number(apgar5Min),
            breastfeedingStatus,
            familyHistory,
            chiefComplaint,
            historyOfPresentIllness,
            currentMedications: medicationsInput.split(',').map((s) => s.trim()).filter(Boolean),
            allergies: allergiesInput.split(',').map((s) => s.trim()).filter(Boolean),
          }}
          antropometry={antropometry}
          vitals={vitals}
          vitalsEvaluations={vitalsEvaluations}
          exams={linkedExams}
          onApplyDiagnosis={(hypText) => {
            setDiagnosisText((prev) => (prev ? `${prev}\n- ${hypText}` : hypText));
            setActiveTab('prescricao');
          }}
          onApplyPrescriptionSuggestion={(medText) => {
            setPrescriptions((prev) => [
              ...prev,
              {
                id: `rx_ai_${Date.now()}`,
                medication: medText,
                dosage: 'Conforme cálculo ponderal / idade',
                frequency: 'Conforme prescrito',
                duration: 'Avaliação em retorno',
                instructions: 'Acompanhar reações adversas e evolução clínica',
              },
            ]);
            setActiveTab('prescricao');
          }}
        />
      )}
    </div>
  );
};

