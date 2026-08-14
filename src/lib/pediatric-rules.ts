import { AgeBracket, ClinicalVitals, VitalsEvaluation, Gender, AntropometricParams, VaccineRecord } from '../types/ppueri';

// Helper para calcular idade em meses a partir da data de nascimento
export function getAgeInMonths(birthDateStr: string, refDateStr: string = new Date().toISOString()): number {
  const birth = new Date(birthDateStr);
  const ref = new Date(refDateStr);
  if (isNaN(birth.getTime())) return 0;
  
  let months = (ref.getFullYear() - birth.getFullYear()) * 12;
  months += ref.getMonth() - birth.getMonth();
  if (ref.getDate() < birth.getDate()) {
    months--;
  }
  return Math.max(0, months);
}

// Formata idade para texto legível em português (dias, meses ou anos)
export function formatPediatricAge(birthDateStr: string): string {
  const birth = new Date(birthDateStr);
  const now = new Date();
  if (isNaN(birth.getTime())) return 'Idade desconhecida';

  const diffTime = Math.abs(now.getTime() - birth.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 30) {
    return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
  }
  
  const months = getAgeInMonths(birthDateStr);
  if (months < 24) {
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }

  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (remMonths === 0) {
    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  }
  return `${years} ${years === 1 ? 'ano' : 'anos'} e ${remMonths} ${remMonths === 1 ? 'mês' : 'meses'}`;
}

// Classifica a faixa etária pediátrica oficial
export function getAgeBracket(ageInMonths: number, ageInDays?: number): AgeBracket {
  if (ageInDays !== undefined && ageInDays <= 28) {
    return 'recem_nascido';
  }
  if (ageInMonths <= 0) return 'recem_nascido';
  if (ageInMonths <= 12) return 'lactente';
  if (ageInMonths <= 60) return 'pre_escolar';
  if (ageInMonths <= 144) return 'escolar';
  return 'adolescente';
}

export function getAgeBracketLabel(bracket: AgeBracket): string {
  switch (bracket) {
    case 'recem_nascido': return 'Recém-Nascido (0 - 28 dias)';
    case 'lactente': return 'Lactente (1 - 12 meses)';
    case 'pre_escolar': return 'Pré-Escolar (1 - 5 anos)';
    case 'escolar': return 'Escolar (6 - 12 anos)';
    case 'adolescente': return 'Adolescente (13 - 16 anos)';
  }
}

// Tabela de Parâmetros de Sinais Vitais Normais por Faixa Etária (SBP / PALS)
interface VitalsReference {
  hr: { min: number; max: number }; // Frequência Cardíaca (bpm)
  rr: { min: number; max: number }; // Frequência Respiratória (rpm)
  sbp: { min: number; max: number }; // Pressão Sistólica (mmHg)
  dbp: { min: number; max: number }; // Pressão Diastólica (mmHg)
  temp: { min: number; max: number }; // Temperatura (°C)
  spo2: { min: number; max: number }; // SatO2 (%)
}

const VITALS_REF: Record<AgeBracket, VitalsReference> = {
  recem_nascido: {
    hr: { min: 100, max: 160 },
    rr: { min: 30, max: 60 },
    sbp: { min: 60, max: 90 },
    dbp: { min: 30, max: 60 },
    temp: { min: 36.5, max: 37.5 },
    spo2: { min: 95, max: 100 },
  },
  lactente: {
    hr: { min: 100, max: 150 },
    rr: { min: 30, max: 50 },
    sbp: { min: 80, max: 100 },
    dbp: { min: 50, max: 65 },
    temp: { min: 36.5, max: 37.5 },
    spo2: { min: 95, max: 100 },
  },
  pre_escolar: {
    hr: { min: 80, max: 130 },
    rr: { min: 20, max: 30 },
    sbp: { min: 85, max: 105 },
    dbp: { min: 55, max: 70 },
    temp: { min: 36.5, max: 37.5 },
    spo2: { min: 95, max: 100 },
  },
  escolar: {
    hr: { min: 70, max: 110 },
    rr: { min: 15, max: 25 },
    sbp: { min: 95, max: 115 },
    dbp: { min: 60, max: 75 },
    temp: { min: 36.5, max: 37.5 },
    spo2: { min: 95, max: 100 },
  },
  adolescente: {
    hr: { min: 60, max: 100 },
    rr: { min: 12, max: 20 },
    sbp: { min: 100, max: 120 },
    dbp: { min: 65, max: 80 },
    temp: { min: 36.5, max: 37.5 },
    spo2: { min: 95, max: 100 },
  },
};

// Validador Dinâmico de Parâmetros Clínicos Pediátricos
export function evaluateClinicalVitals(vitals: ClinicalVitals, ageInMonths: number): VitalsEvaluation[] {
  const bracket = getAgeBracket(ageInMonths);
  const ref = VITALS_REF[bracket];
  const bracketName = getAgeBracketLabel(bracket);
  const evaluations: VitalsEvaluation[] = [];

  // Frequência Cardíaca
  if (vitals.heartRateBpm > 0) {
    const val = vitals.heartRateBpm;
    if (val < ref.hr.min) {
      evaluations.push({
        parameterKey: 'heartRateBpm',
        parameterName: 'Frequência Cardíaca',
        value: val,
        unit: 'bpm',
        referenceRange: `${ref.hr.min} - ${ref.hr.max} bpm`,
        status: 'alterado',
        severity: 'alert',
        explanation: `Bradicardia para ${bracketName} (esperado ${ref.hr.min}-${ref.hr.max} bpm). Avaliar perfusão e estado de consciência.`,
      });
    } else if (val > ref.hr.max) {
      evaluations.push({
        parameterKey: 'heartRateBpm',
        parameterName: 'Frequência Cardíaca',
        value: val,
        unit: 'bpm',
        referenceRange: `${ref.hr.min} - ${ref.hr.max} bpm`,
        status: 'alterado',
        severity: 'warning',
        explanation: `Taquicardia para ${bracketName} (esperado ${ref.hr.min}-${ref.hr.max} bpm). Considerar febre, dor, desidratação ou ansiedade.`,
      });
    } else {
      evaluations.push({
        parameterKey: 'heartRateBpm',
        parameterName: 'Frequência Cardíaca',
        value: val,
        unit: 'bpm',
        referenceRange: `${ref.hr.min} - ${ref.hr.max} bpm`,
        status: 'normal',
        explanation: `Frequência cardíaca dentro da faixa de referência para ${bracketName}.`,
      });
    }
  }

  // Frequência Respiratória
  if (vitals.respiratoryRateRpm > 0) {
    const val = vitals.respiratoryRateRpm;
    if (val < ref.rr.min) {
      evaluations.push({
        parameterKey: 'respiratoryRateRpm',
        parameterName: 'Frequência Respiratória',
        value: val,
        unit: 'rpm',
        referenceRange: `${ref.rr.min} - ${ref.rr.max} rpm`,
        status: 'alterado',
        severity: 'alert',
        explanation: `Bradipneia para ${bracketName} (esperado ${ref.rr.min}-${ref.rr.max} rpm). Atenção para depressão respiratória.`,
      });
    } else if (val > ref.rr.max) {
      evaluations.push({
        parameterKey: 'respiratoryRateRpm',
        parameterName: 'Frequência Respiratória',
        value: val,
        unit: 'rpm',
        referenceRange: `${ref.rr.min} - ${ref.rr.max} rpm`,
        status: 'alterado',
        severity: 'warning',
        explanation: `Taquipneia para ${bracketName} (esperado ${ref.rr.min}-${ref.rr.max} rpm). Avaliar esforço respiratório e ausculta.`,
      });
    } else {
      evaluations.push({
        parameterKey: 'respiratoryRateRpm',
        parameterName: 'Frequência Respiratória',
        value: val,
        unit: 'rpm',
        referenceRange: `${ref.rr.min} - ${ref.rr.max} rpm`,
        status: 'normal',
        explanation: `Padrão respiratório dentro da normalidade para ${bracketName}.`,
      });
    }
  }

  // Pressão Arterial Sistólica
  if (vitals.systolicBP > 0) {
    const val = vitals.systolicBP;
    if (val < ref.sbp.min) {
      evaluations.push({
        parameterKey: 'systolicBP',
        parameterName: 'Pressão Sistólica',
        value: val,
        unit: 'mmHg',
        referenceRange: `${ref.sbp.min} - ${ref.sbp.max} mmHg`,
        status: 'alterado',
        severity: 'alert',
        explanation: `Hipotensão sistólica para ${bracketName} (mínimo ${ref.sbp.min} mmHg). Avaliar volemia.`,
      });
    } else if (val > ref.sbp.max) {
      evaluations.push({
        parameterKey: 'systolicBP',
        parameterName: 'Pressão Sistólica',
        value: val,
        unit: 'mmHg',
        referenceRange: `${ref.sbp.min} - ${ref.sbp.max} mmHg`,
        status: 'alterado',
        severity: 'warning',
        explanation: `Pressão sistólica elevada para ${bracketName} (esperado até ${ref.sbp.max} mmHg). Reavaliar em repouso.`,
      });
    } else {
      evaluations.push({
        parameterKey: 'systolicBP',
        parameterName: 'Pressão Sistólica',
        value: val,
        unit: 'mmHg',
        referenceRange: `${ref.sbp.min} - ${ref.sbp.max} mmHg`,
        status: 'normal',
        explanation: `Nível pressórico sistólico normal para ${bracketName}.`,
      });
    }
  }

  // Pressão Arterial Diastólica
  if (vitals.diastolicBP > 0) {
    const val = vitals.diastolicBP;
    if (val < ref.dbp.min || val > ref.dbp.max) {
      evaluations.push({
        parameterKey: 'diastolicBP',
        parameterName: 'Pressão Diastólica',
        value: val,
        unit: 'mmHg',
        referenceRange: `${ref.dbp.min} - ${ref.dbp.max} mmHg`,
        status: 'alterado',
        severity: 'warning',
        explanation: `Pressão diastólica fora da faixa esperada (${ref.dbp.min}-${ref.dbp.max} mmHg).`,
      });
    } else {
      evaluations.push({
        parameterKey: 'diastolicBP',
        parameterName: 'Pressão Diastólica',
        value: val,
        unit: 'mmHg',
        referenceRange: `${ref.dbp.min} - ${ref.dbp.max} mmHg`,
        status: 'normal',
        explanation: `Pressão diastólica normal.`,
      });
    }
  }

  // Temperatura
  if (vitals.temperatureC > 0) {
    const val = vitals.temperatureC;
    if (val < 36.0) {
      evaluations.push({
        parameterKey: 'temperatureC',
        parameterName: 'Temperatura Axilar',
        value: val,
        unit: '°C',
        referenceRange: '36.5 - 37.5 °C',
        status: 'alterado',
        severity: 'alert',
        explanation: `Hipotermia (${val}°C). Necessita de reaquecimento gradual e controle ambiental.`,
      });
    } else if (val >= 37.8) {
      evaluations.push({
        parameterKey: 'temperatureC',
        parameterName: 'Temperatura Axilar',
        value: val,
        unit: '°C',
        referenceRange: '36.5 - 37.5 °C',
        status: 'alterado',
        severity: 'warning',
        explanation: `Estado febril registrado (${val}°C). Monitorar hidratação e curva térmica.`,
      });
    } else if (val >= 37.3) {
      evaluations.push({
        parameterKey: 'temperatureC',
        parameterName: 'Temperatura Axilar',
        value: val,
        unit: '°C',
        referenceRange: '36.5 - 37.5 °C',
        status: 'alterado',
        severity: 'warning',
        explanation: `Subfebril / Febrícula (${val}°C).`,
      });
    } else {
      evaluations.push({
        parameterKey: 'temperatureC',
        parameterName: 'Temperatura Axilar',
        value: val,
        unit: '°C',
        referenceRange: '36.5 - 37.5 °C',
        status: 'normal',
        explanation: `Afebril e normotérmico.`,
      });
    }
  }

  // O2 Saturation
  if (vitals.oxygenSaturationPct > 0) {
    const val = vitals.oxygenSaturationPct;
    if (val < 95) {
      evaluations.push({
        parameterKey: 'oxygenSaturationPct',
        parameterName: 'Saturação de O2',
        value: val,
        unit: '%',
        referenceRange: '95 - 100 %',
        status: 'alterado',
        severity: 'alert',
        explanation: `Dessaturação leve a moderada (${val}% em ar ambiente). Necessita avaliação clínica urgente.`,
      });
    } else {
      evaluations.push({
        parameterKey: 'oxygenSaturationPct',
        parameterName: 'Saturação de O2',
        value: val,
        unit: '%',
        referenceRange: '95 - 100 %',
        status: 'normal',
        explanation: `Saturação de oxigênio em ar ambiente adequada.`,
      });
    }
  }

  return evaluations;
}

// Cálculo aproximado de Z-Score e Percentil OMS/SBP
// Baseado nas curvas oficiais OMS 0-5 anos e SBP/CDC 5-16 anos
export function calculateZScores(
  ageInMonths: number,
  gender: Gender,
  weightKg: number,
  heightCm: number,
  headCm?: number
): AntropometricParams {
  // Médias e desvios padrão estipulados para meninos/meninas conforme OMS
  const isBoy = gender === 'masculino';
  
  // Fórmula média de peso esperada (OMS aproximada): Wd = 3.3 + 0.6 * age (até 1 ano), depois Wd = 8 + 2 * ageYears
  let expectedWeightMean = 0;
  let expectedWeightSD = 1.0;

  if (ageInMonths <= 12) {
    expectedWeightMean = (isBoy ? 3.4 : 3.2) + ageInMonths * 0.55;
    expectedWeightSD = 0.5 + ageInMonths * 0.08;
  } else if (ageInMonths <= 60) {
    const years = ageInMonths / 12;
    expectedWeightMean = (isBoy ? 9.2 : 8.8) + (years - 1) * 2.2;
    expectedWeightSD = 1.2 + (years - 1) * 0.4;
  } else {
    const years = ageInMonths / 12;
    expectedWeightMean = (isBoy ? 18 : 17.5) + (years - 5) * 3.2;
    expectedWeightSD = 3.0 + (years - 5) * 0.8;
  }

  // Estatura
  let expectedHeightMean = 0;
  let expectedHeightSD = 2.5;

  if (ageInMonths <= 12) {
    expectedHeightMean = (isBoy ? 50 : 49) + ageInMonths * 2.0;
    expectedHeightSD = 2.0 + ageInMonths * 0.1;
  } else if (ageInMonths <= 60) {
    const years = ageInMonths / 12;
    expectedHeightMean = (isBoy ? 75 : 74) + (years - 1) * 7.5;
    expectedHeightSD = 3.0 + (years - 1) * 0.5;
  } else {
    const years = ageInMonths / 12;
    expectedHeightMean = (isBoy ? 110 : 109) + (years - 5) * 6.0;
    expectedHeightSD = 5.0 + (years - 5) * 0.5;
  }

  // Perímetro Cefálico (0 - 36 meses)
  let expectedHeadMean = 0;
  let expectedHeadSD = 1.2;
  if (headCm && headCm > 0 && ageInMonths <= 36) {
    expectedHeadMean = (isBoy ? 35 : 34.5) + Math.min(ageInMonths, 12) * 0.9 + Math.max(0, ageInMonths - 12) * 0.15;
    expectedHeadSD = 1.2;
  }

  const weightZScore = weightKg > 0 ? Number(((weightKg - expectedWeightMean) / expectedWeightSD).toFixed(2)) : 0;
  const heightZScore = heightCm > 0 ? Number(((heightCm - expectedHeightMean) / expectedHeightSD).toFixed(2)) : 0;
  const headZScore = (headCm && headCm > 0) ? Number(((headCm - expectedHeadMean) / expectedHeadSD).toFixed(2)) : undefined;

  // Converte Z-Score em Percentil aproximado
  const zToPercentile = (z: number) => {
    // Aproximação polinomial da curva normal cumulativa
    const p = 0.5 * (1 + Math.tanh(z * 0.7978845608 * (1 + 0.044715 * z * z)));
    return Math.round(Math.max(1, Math.min(99, p * 100)));
  };

  return {
    weightKg,
    heightCm,
    headCircumferenceCm: headCm,
    weightZScore,
    heightZScore,
    headCircumferenceZScore: headZScore,
    weightPercentile: weightKg > 0 ? zToPercentile(weightZScore) : undefined,
    heightPercentile: heightCm > 0 ? zToPercentile(heightZScore) : undefined,
    headCircumferencePercentile: headZScore !== undefined ? zToPercentile(headZScore) : undefined,
  };
}

export function getZScoreClassification(metric: 'peso' | 'estatura' | 'perimetro', zScore: number): { label: string; status: 'normal' | 'alerta' | 'critico' } {
  if (metric === 'peso') {
    if (zScore < -3) return { label: 'Magreza Acentuada (Escore-Z < -3)', status: 'critico' };
    if (zScore < -2) return { label: 'Magreza / Baixo Peso (Escore-Z < -2)', status: 'alerta' };
    if (zScore <= 1) return { label: 'Eutrofia / Peso Adequado (P15-P85)', status: 'normal' };
    if (zScore <= 2) return { label: 'Risco de Sobrepeso (Escore-Z > +1)', status: 'alerta' };
    if (zScore <= 3) return { label: 'Sobrepeso (Escore-Z > +2)', status: 'alerta' };
    return { label: 'Obesidade (Escore-Z > +3)', status: 'critico' };
  }
  
  if (metric === 'estatura') {
    if (zScore < -3) return { label: 'Muito Baixa Estatura (Escore-Z < -3)', status: 'critico' };
    if (zScore < -2) return { label: 'Baixa Estatura para a Idade (Escore-Z < -2)', status: 'alerta' };
    if (zScore <= 2) return { label: 'Estatura Adequada para a Idade', status: 'normal' };
    return { label: 'Estatura Elevada para a Idade (Escore-Z > +2)', status: 'normal' };
  }

  // Perímetro Cefálico
  if (zScore < -2) return { label: 'Microcefalia / Abaixo do P3', status: 'critico' };
  if (zScore <= 2) return { label: 'Perímetro Cefálico Normal', status: 'normal' };
  return { label: 'Macrocefalia / Acima do P97', status: 'critico' };
}

// Calendário Oficial de Vacinação PNI/SBP (0 a 16 anos)
export const OFFICIAL_VACCS_SCHEDULE: Omit<VaccineRecord, 'id' | 'patientId' | 'status'>[] = [
  {
    vaccineId: 'bcg',
    vaccineName: 'BCG',
    targetDisease: 'Formas graves de Tuberculose',
    targetAgeBracket: 'Ao nascer',
    ageMonthsRecommended: 0,
    doseNumber: 1,
    totalDoses: 1,
  },
  {
    vaccineId: 'hepb_1',
    vaccineName: 'Hepatite B (Dose ao Nascer)',
    targetDisease: 'Hepatite B',
    targetAgeBracket: 'Ao nascer (primeiras 12h)',
    ageMonthsRecommended: 0,
    doseNumber: 1,
    totalDoses: 1,
  },
  {
    vaccineId: 'penta_1',
    vaccineName: 'Pentavalente (DTPb + Hib + HepB - 1ª Dose)',
    targetDisease: 'Difteria, Tétano, Coqueluche, Hepatite B, Meningite Hib',
    targetAgeBracket: '2 meses',
    ageMonthsRecommended: 2,
    doseNumber: 1,
    totalDoses: 3,
  },
  {
    vaccineId: 'vip_1',
    vaccineName: 'Poliomielite Inativada - VIP (1ª Dose)',
    targetDisease: 'Poliomielite / Paralisia Infantil',
    targetAgeBracket: '2 meses',
    ageMonthsRecommended: 2,
    doseNumber: 1,
    totalDoses: 3,
  },
  {
    vaccineId: 'pneu10_1',
    vaccineName: 'Pneumocócica 10-Valente (1ª Dose)',
    targetDisease: 'Pneumonia, Otite, Meningite Pneumocócica',
    targetAgeBracket: '2 meses',
    ageMonthsRecommended: 2,
    doseNumber: 1,
    totalDoses: 2,
  },
  {
    vaccineId: 'rotavirus_1',
    vaccineName: 'Rotavírus Humano VRH (1ª Dose)',
    targetDisease: 'Gastroenterite por Rotavírus',
    targetAgeBracket: '2 meses',
    ageMonthsRecommended: 2,
    doseNumber: 1,
    totalDoses: 2,
  },
  {
    vaccineId: 'meningoC_1',
    vaccineName: 'Meningocócica C Conjugada (1ª Dose)',
    targetDisease: 'Meningite por Meningococo C',
    targetAgeBracket: '3 meses',
    ageMonthsRecommended: 3,
    doseNumber: 1,
    totalDoses: 2,
  },
  {
    vaccineId: 'penta_2',
    vaccineName: 'Pentavalente (2ª Dose)',
    targetDisease: 'Difteria, Tétano, Coqueluche, Hepatite B, Hib',
    targetAgeBracket: '4 meses',
    ageMonthsRecommended: 4,
    doseNumber: 2,
    totalDoses: 3,
  },
  {
    vaccineId: 'vip_2',
    vaccineName: 'Poliomielite VIP (2ª Dose)',
    targetDisease: 'Poliomielite',
    targetAgeBracket: '4 meses',
    ageMonthsRecommended: 4,
    doseNumber: 2,
    totalDoses: 3,
  },
  {
    vaccineId: 'pneu10_2',
    vaccineName: 'Pneumocócica 10V (2ª Dose)',
    targetDisease: 'Pneumonia e Meningite Pneumocócica',
    targetAgeBracket: '4 meses',
    ageMonthsRecommended: 4,
    doseNumber: 2,
    totalDoses: 2,
  },
  {
    vaccineId: 'rotavirus_2',
    vaccineName: 'Rotavírus Humano VRH (2ª Dose)',
    targetDisease: 'Gastroenterite por Rotavírus',
    targetAgeBracket: '4 meses',
    ageMonthsRecommended: 4,
    doseNumber: 2,
    totalDoses: 2,
  },
  {
    vaccineId: 'meningoC_2',
    vaccineName: 'Meningocócica C (2ª Dose)',
    targetDisease: 'Meningite C',
    targetAgeBracket: '5 meses',
    ageMonthsRecommended: 5,
    doseNumber: 2,
    totalDoses: 2,
  },
  {
    vaccineId: 'penta_3',
    vaccineName: 'Pentavalente (3ª Dose)',
    targetDisease: 'Difteria, Tétano, Coqueluche, Hepatite B, Hib',
    targetAgeBracket: '6 meses',
    ageMonthsRecommended: 6,
    doseNumber: 3,
    totalDoses: 3,
  },
  {
    vaccineId: 'vip_3',
    vaccineName: 'Poliomielite VIP (3ª Dose)',
    targetDisease: 'Poliomielite',
    targetAgeBracket: '6 meses',
    ageMonthsRecommended: 6,
    doseNumber: 3,
    totalDoses: 3,
  },
  {
    vaccineId: 'febre_amarela_1',
    vaccineName: 'Febre Amarela (Dose Inicial)',
    targetDisease: 'Febre Amarela',
    targetAgeBracket: '9 meses',
    ageMonthsRecommended: 9,
    doseNumber: 1,
    totalDoses: 2,
  },
  {
    vaccineId: 'triplice_viral_1',
    vaccineName: 'Tríplice Viral - SCR (1ª Dose)',
    targetDisease: 'Sarampo, Caxumba, Rubéola',
    targetAgeBracket: '12 meses',
    ageMonthsRecommended: 12,
    doseNumber: 1,
    totalDoses: 2,
  },
  {
    vaccineId: 'pneu10_ref',
    vaccineName: 'Pneumocócica 10V (Reforço)',
    targetDisease: 'Pneumonia e Otite',
    targetAgeBracket: '12 meses',
    ageMonthsRecommended: 12,
    doseNumber: 3,
    totalDoses: 3,
  },
  {
    vaccineId: 'meningoC_ref',
    vaccineName: 'Meningocócica C / ACWY (Reforço)',
    targetDisease: 'Meningite Meningocócica',
    targetAgeBracket: '12 meses',
    ageMonthsRecommended: 12,
    doseNumber: 3,
    totalDoses: 3,
  },
  {
    vaccineId: 'dtp_ref1',
    vaccineName: 'DTP - Tríplice Bacteriana (1º Reforço)',
    targetDisease: 'Difteria, Tétano, Coqueluche',
    targetAgeBracket: '15 meses',
    ageMonthsRecommended: 15,
    doseNumber: 1,
    totalDoses: 2,
  },
  {
    vaccineId: 'vop_ref1',
    vaccineName: 'Poliomielite Oral / VIP (1º Reforço)',
    targetDisease: 'Poliomielite',
    targetAgeBracket: '15 meses',
    ageMonthsRecommended: 15,
    doseNumber: 1,
    totalDoses: 2,
  },
  {
    vaccineId: 'tetraviral',
    vaccineName: 'Tetra Viral ou SCR + Varicela',
    targetDisease: 'Sarampo, Caxumba, Rubéola e Varicela/Catapora',
    targetAgeBracket: '15 meses',
    ageMonthsRecommended: 15,
    doseNumber: 2,
    totalDoses: 2,
  },
  {
    vaccineId: 'hepA',
    vaccineName: 'Hepatite A',
    targetDisease: 'Hepatite A',
    targetAgeBracket: '15 meses',
    ageMonthsRecommended: 15,
    doseNumber: 1,
    totalDoses: 1,
  },
  {
    vaccineId: 'dtp_ref2',
    vaccineName: 'DTP (2º Reforço)',
    targetDisease: 'Difteria, Tétano, Coqueluche',
    targetAgeBracket: '4 anos',
    ageMonthsRecommended: 48,
    doseNumber: 2,
    totalDoses: 2,
  },
  {
    vaccineId: 'vop_ref2',
    vaccineName: 'Poliomielite (2º Reforço)',
    targetDisease: 'Poliomielite',
    targetAgeBracket: '4 anos',
    ageMonthsRecommended: 48,
    doseNumber: 2,
    totalDoses: 2,
  },
  {
    vaccineId: 'varicela_2',
    vaccineName: 'Varicela (2ª Dose)',
    targetDisease: 'Varicela / Catapora',
    targetAgeBracket: '4 anos',
    ageMonthsRecommended: 48,
    doseNumber: 2,
    totalDoses: 2,
  },
  {
    vaccineId: 'hpv',
    vaccineName: 'HPV Quadrivalente',
    targetDisease: 'Papilomavírus Humano e Cânceres Associados',
    targetAgeBracket: '9 a 14 anos',
    ageMonthsRecommended: 108,
    doseNumber: 1,
    totalDoses: 1,
  },
  {
    vaccineId: 'meningoACWY',
    vaccineName: 'Meningocócica ACWY (Reforço Adolescente)',
    targetDisease: 'Meningite Meningocócica Sorogrupos A, C, W, Y',
    targetAgeBracket: '11 a 14 anos',
    ageMonthsRecommended: 132,
    doseNumber: 1,
    totalDoses: 1,
  },
  {
    vaccineId: 'dT_adolescente',
    vaccineName: 'dT / dTpa - Dupla Adulto ou Tríplice Acelular',
    targetDisease: 'Difteria, Tétano e Coqueluche (Reforço Decenal)',
    targetAgeBracket: '10 anos (ou a cada 10a)',
    ageMonthsRecommended: 120,
    doseNumber: 1,
    totalDoses: 1,
  },
];
