import { Patient, Anamnesis, AntropometricParams, ClinicalVitals, VitalsEvaluation, LabExam, ClinicalAiAnalysis, DiagnosticHypothesis, ClinicalAlert } from '../types/ppueri';
import { getAgeInMonths } from './pediatric-rules';

export function runPediatricCdssAnalysis(
  patient: Patient,
  anamnesis: Anamnesis,
  antropometry: AntropometricParams,
  vitals: ClinicalVitals,
  vitalsEvaluations: VitalsEvaluation[],
  exams: LabExam[]
): ClinicalAiAnalysis {
  const ageMonths = getAgeInMonths(patient.birthDate);
  const hypotheses: DiagnosticHypothesis[] = [];
  const alerts: ClinicalAlert[] = [];
  const recommendedExams: string[] = [];
  let growthSummary = 'Acompanhamento antropométrico padrão dentro dos limites esperados para a idade.';

  // 1. Análise de Crescimento & Z-Score
  const wZ = antropometry.weightZScore ?? 0;
  const hZ = antropometry.heightZScore ?? 0;
  const hcZ = antropometry.headCircumferenceZScore ?? 0;

  if (wZ < -2.0) {
    hypotheses.push({
      condition: 'Baixo Peso para a Idade / Risco de Desnutrição Aguda',
      likelihood: 'Alta',
      reason: `Escore-Z de Peso (${wZ.toFixed(2)}) abaixo de -2.0 DP na curva OMS.`,
      icd10: 'E44.1',
    });
    alerts.push({
      type: 'danger',
      title: 'Aviso de Ganho Ponderal Insuficiente',
      detail: 'Recomendada investigação nutricional minuciosa, inquérito alimentar de 24h e rastreio de síndrome disabsortiva.',
    });
    recommendedExams.push('Proteínas Totais e Frações', 'Parasitológico de Fezes', 'TSH e T4 Livre');
    growthSummary = `Atenção: Escore-Z de peso (${wZ.toFixed(2)}) indica déficit ponderal severo. Necessita vigilância nutricional.`;
  } else if (wZ > 2.0) {
    hypotheses.push({
      condition: 'Risco de Sobrepeso / Obesidade Infantil',
      likelihood: 'Moderada',
      reason: `Escore-Z de Peso (${wZ.toFixed(2)}) acima de +2.0 DP na curva OMS.`,
      icd10: 'E66.9',
    });
    alerts.push({
      type: 'warning',
      title: 'Alerta Antropométrico: Curva Ponderal Ascendente',
      detail: 'Avaliar introdução alimentar, oferta de bebidas açucaradas e padrão de atividade física familiar.',
    });
  } else {
    hypotheses.push({
      condition: 'Crescimento Pondero-Estatural Eutrófico',
      likelihood: 'Alta',
      reason: `Escore-Z de peso (${wZ.toFixed(2)}) e altura (${hZ.toFixed(2)}) perfeitamente alinhados entre -1 e +1 DP.`,
      icd10: 'Z00.1',
    });
  }

  if (hZ < -2.0) {
    hypotheses.push({
      condition: 'Baixa Estatura para a Idade (Escore-Z < -2.0 DP)',
      likelihood: 'Alta',
      reason: `Comprimento/Estatura Z-score (${hZ.toFixed(2)}) abaixo da faixa de normalidade OMS.`,
      icd10: 'R62.8',
    });
    recommendedExams.push('Idade Óssea (Rx de Mão e Punho Esquerdo)', 'Gasometria Venosa', 'Eletrólitos');
  }

  if (ageMonths <= 36 && (hcZ < -2.0 || hcZ > 2.0)) {
    alerts.push({
      type: 'warning',
      title: hcZ < -2.0 ? 'Aviso de Microcefalia Relativa' : 'Aviso de Macrocefalia Relativa',
      detail: `Perímetro Cefálico Z-Score em ${hcZ.toFixed(2)} DP. Avaliar fechamento de fontanelas e desenvolvimento neuropsicomotor.`,
    });
  }

  // 2. Análise de Exames Laboratoriais
  let lowHb = false;
  let highIge = false;
  let highEos = false;

  exams.forEach((exam) => {
    exam.items.forEach((item) => {
      const pLower = item.parameter.toLowerCase();

      if (pLower.includes('hemoglobina') && item.numericValue && item.numericValue < 11.0) {
        lowHb = true;
        hypotheses.push({
          condition: 'Anemia Ferropriva Suspeita',
          likelihood: 'Alta',
          reason: `Hemoglobina (${item.value} ${item.unit}) abaixo do valor de referência de 11.0 g/dL para pediatria.`,
          icd10: 'D50.9',
        });
        alerts.push({
          type: 'danger',
          title: 'Hemoglobina Abaixo do Parâmetro de Referência',
          detail: 'Ajustar dose terapêutica de sulfato ferroso (3 a 5 mg/kg/dia de ferro elementar) e orientar alimentos ricos em ferro heme.',
        });
      }

      if (pLower.includes('ige') && item.status === 'alterado_alto') {
        highIge = true;
      }
      if (pLower.includes('eosinófilo') && item.status === 'alterado_alto') {
        highEos = true;
      }
    });
  });

  if (highIge || highEos || patient.allergies.some((a) => a.toLowerCase().includes('aplv') || a.toLowerCase().includes('leite'))) {
    hypotheses.push({
      condition: 'Alergia Alimentar / Atopia Pediátrica (APLV ou Dermatite Atópica)',
      likelihood: 'Alta',
      reason: 'IgE específica elevada / Eosinofilia periférica combinada a queixas cutâneas e gastrointestinais.',
      icd10: 'K52.2',
    });
    alerts.push({
      type: 'info',
      title: 'Suporte Atópico Recomendado',
      detail: 'Manter dieta de exclusão de antígenos suspeitos e uso de emolientes cerâmicos em áreas de eczema.',
    });
  }

  // 3. Análise de Queixa Principal e Anamnese
  const complaint = (anamnesis.chiefComplaint || '').toLowerCase();
  const hda = (anamnesis.historyOfPresentIllness || '').toLowerCase();

  if (complaint.includes('febre') || hda.includes('febre') || vitals.temperatureC >= 37.8) {
    hypotheses.push({
      condition: 'Síndrome Febril Pediátrica a Esclarecer',
      likelihood: 'Moderada',
      reason: `Temperatura de ${vitals.temperatureC}°C ou relato de febre recente na queixa principal.`,
      icd10: 'R50.9',
    });
    alerts.push({
      type: vitals.temperatureC >= 38.5 ? 'danger' : 'warning',
      title: 'Monitoração Térmica & Sintomáticos',
      detail: 'Prescrever antitérmicos conforme peso e orientar sinais de alerta (prostração, recusa hídrica, estridor ou tiragem).',
    });
  }

  if (complaint.includes('tosse') || complaint.includes('chiado') || complaint.includes('cansaço') || vitals.respiratoryRateRpm > 40) {
    hypotheses.push({
      condition: 'Infecção das Vias Aéreas Superiores / Bronquiolite / Asma Pediátrica',
      likelihood: 'Moderada',
      reason: 'Queixas respiratórias ativas com alteração de padrão respiratório.',
      icd10: 'J20.9',
    });
  }

  // Se poucas hipóteses foram geradas, garantir hipótese preventiva
  if (hypotheses.length === 0) {
    hypotheses.push({
      condition: 'Acompanhamento de Puericultura de Rotina',
      likelihood: 'Alta',
      reason: 'Parâmetros clínicos e antropométricos sem desvios significativos detectados.',
      icd10: 'Z00.1',
    });
  }

  return {
    diagnosticHypotheses: hypotheses,
    clinicalAlerts: alerts,
    recommendedExams: Array.from(new Set(recommendedExams)),
    carePlanSuggestions: {
      prescriptionsText: lowHb
        ? 'Sulfato Ferroso 125mg/mL (25mg/mL de Fe Elementar) - Administrar dose terapêutica de 3mg/kg/dia 1 hora antes do almoço.'
        : 'Manter Vitamina D 400 UI/dia e suplementação profilática de ferro conforme protocolo PNI/SBP.',
      feedingAdvice: highIge
        ? 'Manter rigorosa exclusão de proteínas do leite de vaca, traços de soja e corantes artificiais.'
        : 'Alimentação saudável, variada, rica em ferro, fibras e vitaminas. Evitar ultraprocessados e açúcares.',
      returnDays: wZ < -2.0 || lowHb ? 15 : 30,
      warningSigns: [
        'Febre alta (> 38,5°C) persistente sem melhora após antitérmico',
        'Vômitos repetidos e recusa hídrica total',
        'Dificuldade para respirar (tiragem subcostal, gemidos)',
        'Sonolência excessiva ou dificuldade para despertar',
      ],
    },
    growthSummary,
    disclaimer:
      'Aviso legal: As sugestões deste módulo de IA são geradas algoritmicamente como suporte ao raciocínio clínico baseado em diretrizes da Sociedade Brasileira de Pediatria (SBP) e Ministério da Saúde. O julgamento, diagnóstico e conduta terapêutica são de responsabilidade exclusiva do médico pediatra.',
  };
}
