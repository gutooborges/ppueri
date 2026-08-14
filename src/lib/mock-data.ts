import { Patient, Consultation, LabExam, VaccineRecord, Appointment } from '../types/ppueri';
import { OFFICIAL_VACCS_SCHEDULE, calculateZScores } from './pediatric-rules';
import { DEMO_DOCTOR_ID } from './auth';

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat_1',
    doctorId: DEMO_DOCTOR_ID,
    name: 'Gabriel Santos Ferreira',
    birthDate: '2024-02-15', // ~18 meses
    gender: 'masculino',
    motherName: 'Mariana Santos Ferreira',
    fatherName: 'Lucas Ferreira',
    cpf: '482.109.381-02',
    susNumber: '898 2901 8839 0012',
    accessCode: 'PPUERI-7821-GAB',
    accessCodeCreatedAt: '2025-01-10T10:00:00Z',
    bloodType: 'O+',
    allergies: ['Aprovado sem alergias conhecidas até o momento'],
    chronicConditions: [],
    photoUrl: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'pat_2',
    doctorId: DEMO_DOCTOR_ID,
    name: 'Sofia Lima Ribeiro',
    birthDate: '2025-11-20', // ~9 meses
    gender: 'feminino',
    motherName: 'Camila Lima Ribeiro',
    fatherName: 'Rodrigo Ribeiro',
    cpf: '512.983.102-44',
    susNumber: '702 4492 1102 9981',
    accessCode: 'PPUERI-4912-SOF',
    accessCodeCreatedAt: '2026-02-01T14:30:00Z',
    bloodType: 'A+',
    allergies: ['Proteína do Leite de Vaca (APLV Suspeita)'],
    chronicConditions: ['Dermatite Atópica Leve'],
    photoUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'pat_3',
    doctorId: DEMO_DOCTOR_ID,
    name: 'Enzo Gabriel Oliveira',
    birthDate: '2021-06-10', // ~5 anos
    gender: 'masculino',
    motherName: 'Beatriz Oliveira',
    fatherName: 'Marcelo Oliveira',
    cpf: '601.229.049-88',
    susNumber: '811 0029 3341 5592',
    accessCode: 'PPUERI-9031-ENZ',
    accessCodeCreatedAt: '2025-08-15T09:15:00Z',
    bloodType: 'B+',
    allergies: ['Dipirona'],
    chronicConditions: ['Asma Leve Intermitente'],
    photoUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'pat_4',
    doctorId: DEMO_DOCTOR_ID,
    name: 'Helena Martins Costa',
    birthDate: '2026-07-12', // ~1 mês (Recém-nascida / Lactente jovem)
    gender: 'feminino',
    motherName: 'Juliana Martins Costa',
    fatherName: 'Felipe Costa',
    cpf: '710.982.331-50',
    susNumber: '901 2288 3391 1002',
    accessCode: 'PPUERI-1120-HEL',
    accessCodeCreatedAt: '2026-07-20T11:00:00Z',
    bloodType: 'O+',
    allergies: [],
    chronicConditions: [],
    photoUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=300&q=80',
  }
];

export const INITIAL_CONSULTATIONS: Consultation[] = [
  {
    id: 'cons_1',
    doctorId: DEMO_DOCTOR_ID,
    patientId: 'pat_1',
    doctorName: 'Dra. Beatriz Albuquerque',
    doctorCrm: 'CRM/SP 184.920 - Pediatria SBP',
    date: '2026-07-25T14:30:00Z',
    anamnesis: {
      gestationalHistory: 'Gestação sem intercorrências, pré-natal completo com 10 consultas. Sorologias negativas.',
      birthType: 'vaginal',
      birthWeightKg: 3.35,
      birthLengthCm: 49.5,
      headCircumferenceAtBirthCm: 35.0,
      apgar1Min: 9,
      apgar5Min: 10,
      breastfeedingStatus: 'desmamado',
      familyHistory: 'Pai com rinite alérgica. Avó materna com hipotireoidismo.',
      chiefComplaint: 'Rotina de puericultura de 18 meses e acompanhamento de ganho ponderal.',
      historyOfPresentIllness: 'Criança ativa, sem queixas agudas no momento. Apetite preservado, aceitando dieta da família enriquecida em proteínas e vegetais. Sono de 11h por noite com 1 sesta diurna.',
      currentMedications: ['Suplementação profilática de Ferro Quelato 1mg/kg/dia', 'Vitamina D 400 UI/dia'],
      allergies: ['Sem alergias relatadas'],
    },
    antropometry: calculateZScores(18, 'masculino', 11.8, 83.5, 47.5),
    vitals: {
      systolicBP: 92,
      diastolicBP: 58,
      heartRateBpm: 112,
      respiratoryRateRpm: 26,
      temperatureC: 36.6,
      oxygenSaturationPct: 99,
    },
    vitalsEvaluations: [
      {
        parameterKey: 'heartRateBpm',
        parameterName: 'Frequência Cardíaca',
        value: 112,
        unit: 'bpm',
        referenceRange: '80 - 130 bpm',
        status: 'normal',
        explanation: 'Frequência cardíaca dentro da normalidade para pré-escolares/lactentes.',
      },
      {
        parameterKey: 'respiratoryRateRpm',
        parameterName: 'Frequência Respiratória',
        value: 26,
        unit: 'rpm',
        referenceRange: '20 - 30 rpm',
        status: 'normal',
        explanation: 'Eupneico em ar ambiente.',
      },
      {
        parameterKey: 'systolicBP',
        parameterName: 'Pressão Sistólica',
        value: 92,
        unit: 'mmHg',
        referenceRange: '85 - 105 mmHg',
        status: 'normal',
        explanation: 'Pressão arterial infantil normal.',
      },
      {
        parameterKey: 'temperatureC',
        parameterName: 'Temperatura Axilar',
        value: 36.6,
        unit: '°C',
        referenceRange: '36.5 - 37.5 °C',
        status: 'normal',
        explanation: 'Normotérmico.',
      },
      {
        parameterKey: 'oxygenSaturationPct',
        parameterName: 'Saturação de O2',
        value: 99,
        unit: '%',
        referenceRange: '95 - 100 %',
        status: 'normal',
        explanation: 'Saturação de oxigênio excelente.',
      }
    ],
    exams: [
      {
        id: 'exam_1',
        patientId: 'pat_1',
        title: 'Hemograma Completo e Ferritina',
        category: 'Hemograma',
        date: '2026-07-20',
        fileName: 'Hemograma_Gabriel_Jul2026.pdf',
        isOcrParsed: true,
        items: [
          { parameter: 'Hemoglobina', value: '12.4', numericValue: 12.4, unit: 'g/dL', referenceRange: '11.0 - 14.0 g/dL', status: 'normal' },
          { parameter: 'Hematócrito', value: '37.1', numericValue: 37.1, unit: '%', referenceRange: '33.0 - 41.0 %', status: 'normal' },
          { parameter: 'Leucócitos Totais', value: '8.400', numericValue: 8400, unit: '/mm³', referenceRange: '6.000 - 14.000 /mm³', status: 'normal' },
          { parameter: 'Plaquetas', value: '295.000', numericValue: 295000, unit: '/mm³', referenceRange: '150.000 - 450.000 /mm³', status: 'normal' },
          { parameter: 'Ferritina Sérica', value: '38.5', numericValue: 38.5, unit: 'ng/mL', referenceRange: '20.0 - 150.0 ng/mL', status: 'normal' },
        ],
        doctorInterpretation: 'Exames dentro dos limites da normalidade para a idade. Sem evidências de anemia ferropriva.',
      }
    ],
    carePlan: {
      diagnosisText: 'Criança hígida em acompanhamento de puericultura. Crescimento e desenvolvimento neuropsicomotor adequados para 18 meses.',
      prescriptions: [
        {
          id: 'rx_1',
          medication: 'Vitamina D3 (Colecalciferol 200 UI/gota)',
          dosage: '2 gotas (400 UI)',
          frequency: '1x ao dia pela manhã',
          duration: 'Uso contínuo até os 2 anos',
          instructions: 'Administrar diretamente na boca ou diluído em pequena quantidade de água/suco.'
        },
        {
          id: 'rx_2',
          medication: 'Sulfato Ferroso / Ferro Quelato (50mg/mL)',
          dosage: '0,5 mL (10mg de ferro elementar)',
          frequency: '1x ao dia antes do almoço',
          duration: 'Manter até 24 meses',
          instructions: 'Manter higienização oral após a administração.'
        }
      ],
      feedingInstructions: 'Incentivar mastigação de pedaços sólidos. Manter oferta variada de frutas frescas, hortaliças e legumes. Evitar açúcares adicionados e ultraprocessados.',
      generalCareInstructions: 'Manter estímulo à autonomia na alimentação e linguagem verbal. Proteger tomadas e quinas baixas em casa.',
      warningSignsToReturn: [
        'Febre acima de 38,5°C persistente por mais de 48 horas',
        'Vômitos incoercíveis ou recusa alimentar total',
        'Sinais de desconforto respiratório (tiragem intercostal, batedeira no peito)',
        'Prostração excessiva ou irritabilidade ininterrupta'
      ],
      nextAppointmentRecommended: 'Retorno em 3 meses (puericultura de 21 meses)',
    }
  },
  {
    id: 'cons_2',
    doctorId: DEMO_DOCTOR_ID,
    patientId: 'pat_2',
    doctorName: 'Dra. Beatriz Albuquerque',
    doctorCrm: 'CRM/SP 184.920 - Pediatria SBP',
    date: '2026-08-02T10:15:00Z',
    anamnesis: {
      gestationalHistory: 'G2P2, cesárea por sofrimento fetal agudo com 38 semanas.',
      birthType: 'cesarea',
      birthWeightKg: 2.98,
      birthLengthCm: 48.0,
      headCircumferenceAtBirthCm: 34.0,
      apgar1Min: 8,
      apgar5Min: 9,
      breastfeedingStatus: 'formula',
      familyHistory: 'Mãe com rinite alérgica e eczema atópico.',
      chiefComplaint: 'Lesões eritematosas em dobras e episódios de regurgitação após mamadas.',
      historyOfPresentIllness: 'Lactente de 8 meses apresentando placas eritemato-desquamativas em fossa cubital e dobras do pescoço há 2 semanas, acompanhadas de prurido moderado. Suspeita clínica de dermatite atópica associada à sensibilidade alimentar.',
      currentMedications: ['Fórmula Infantil Extensamente Hidrolisada', 'Hidratante cerâmico infantil 3x/dia'],
      allergies: ['Proteína do Leite de Vaca (APLV Suspeita)'],
    },
    antropometry: calculateZScores(8, 'feminino', 7.9, 68.2, 43.0),
    vitals: {
      systolicBP: 88,
      diastolicBP: 54,
      heartRateBpm: 128,
      respiratoryRateRpm: 34,
      temperatureC: 37.9, // Alterado: subfebril
      oxygenSaturationPct: 98,
    },
    vitalsEvaluations: [
      {
        parameterKey: 'temperatureC',
        parameterName: 'Temperatura Axilar',
        value: 37.9,
        unit: '°C',
        referenceRange: '36.5 - 37.5 °C',
        status: 'alterado',
        severity: 'warning',
        explanation: 'Estado subfebril / febrícula (37,9°C). Associado à erupção cutânea ou vacinação recente.',
      },
      {
        parameterKey: 'heartRateBpm',
        parameterName: 'Frequência Cardíaca',
        value: 128,
        unit: 'bpm',
        referenceRange: '100 - 150 bpm',
        status: 'normal',
        explanation: 'Frequência cardíaca dentro do limite para lactentes.',
      },
      {
        parameterKey: 'respiratoryRateRpm',
        parameterName: 'Frequência Respiratória',
        value: 34,
        unit: 'rpm',
        referenceRange: '30 - 50 rpm',
        status: 'normal',
        explanation: 'Padrão respiratório preservado.',
      }
    ],
    exams: [
      {
        id: 'exam_2',
        patientId: 'pat_2',
        title: 'IgE Específica para Proteínas do Leite e Hemograma',
        category: 'Bioquímica',
        date: '2026-07-28',
        fileName: 'IgE_Sofia_Julho2026.pdf',
        isOcrParsed: true,
        items: [
          { parameter: 'IgE Total', value: '142.0', numericValue: 142.0, unit: 'UI/mL', referenceRange: '< 30.0 UI/mL', status: 'alterado_alto', notes: 'Elevado para a faixa etária' },
          { parameter: 'Eosinófilos', value: '7.2', numericValue: 7.2, unit: '%', referenceRange: '1.0 - 5.0 %', status: 'alterado_alto', notes: 'Eosinofilia moderada' },
          { parameter: 'IgE Específica Alfa-lactoalbumina', value: '2.1', numericValue: 2.1, unit: 'kU/L', referenceRange: '< 0.35 kU/L', status: 'alterado_alto', notes: 'Classe 2 - Moderado' },
          { parameter: 'IgE Específica Beta-lactoglobulina', value: '3.8', numericValue: 3.8, unit: 'kU/L', referenceRange: '< 0.35 kU/L', status: 'alterado_alto', notes: 'Classe 3 - Alto' },
        ],
        doctorInterpretation: 'Confirmação de sensibilização a proteínas do leite de vaca com eosinofilia periférica.',
      }
    ],
    carePlan: {
      diagnosisText: 'Alergia à Proteína do Leite de Vaca (APLV) IgE-mediada com manifestação cutânea (Dermatite Atópica).',
      prescriptions: [
        {
          id: 'rx_3',
          medication: 'Fórmula Extensamente Hidrolisada com Aminoácidos',
          dosage: 'Conforme demanda habitual da lactente',
          frequency: 'Oferecer a cada 3 a 4 horas',
          duration: 'Manter exclusividade de fórmula especial por 6 meses',
          instructions: 'Dieta de exclusão rigorosa de derivados lácteos.'
        },
        {
          id: 'rx_4',
          medication: 'Creme Barreira Cerâmico Hipoalergênico',
          dosage: 'Camada fina sobre lesões cutâneas',
          frequency: '3x ao dia após banho morno rápido',
          duration: '30 dias',
          instructions: 'Banho rápido com água morna e sabonete neutro sem perfume.'
        }
      ],
      feedingInstructions: 'Introdução alimentar com frutas puras (maçã, pera, mamão) e vegetais cozidos. Isenção total de leite, queijos, iogurtes e manteiga.',
      generalCareInstructions: 'Usar roupas de algodão 100%. Evitar sabão em pó com fragrância e amaciantes na lavagem das roupas do bebê.',
      warningSignsToReturn: [
        'Erupção cutânea com vesículas ou secreção amarelada (infecção secundária)',
        'Dificuldade para respirar ou chiado no peito',
        'Fezes com sangue vivo ou muco em abundância'
      ],
      nextAppointmentRecommended: 'Retorno em 15 dias para reavaliação das lesões cutâneas',
    }
  }
];

// Função para gerar histórico vacinal completo de um paciente
export function getInitialVaccinesForPatient(patientId: string, ageInMonths: number): VaccineRecord[] {
  return OFFICIAL_VACCS_SCHEDULE.map((vacc, idx) => {
    let status: VaccineRecord['status'] = 'pendente';
    let applicationDate: string | undefined = undefined;
    let batchNumber: string | undefined = undefined;

    if (ageInMonths >= vacc.ageMonthsRecommended) {
      // Se a vacina deveria ter sido tomada no passado
      if (idx % 7 === 0 && ageInMonths > vacc.ageMonthsRecommended + 3) {
        // Exemplo hipotético de atrasada para demonstração visual
        status = 'atrasada';
      } else {
        status = 'aplicada';
        // Data estimada retroativa
        const appDate = new Date();
        appDate.setMonth(appDate.getMonth() - (ageInMonths - vacc.ageMonthsRecommended));
        applicationDate = appDate.toISOString().split('T')[0];
        batchNumber = `Lote-${2025 + (idx % 3)}-${100 + idx}`;
      }
    } else if (vacc.ageMonthsRecommended - ageInMonths <= 2) {
      status = 'proxima';
    } else {
      status = 'pendente';
    }

    return {
      ...vacc,
      id: `vac_${patientId}_${vacc.vaccineId}`,
      patientId,
      status,
      applicationDate,
      batchNumber,
      clinicName: status === 'aplicada' ? 'UBS Central - Sala de Vacinas' : undefined,
    };
  });
}

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt_1',
    doctorId: DEMO_DOCTOR_ID,
    patientId: 'pat_1',
    patientName: 'Gabriel Santos Ferreira',
    motherName: 'Mariana Santos Ferreira',
    doctorName: 'Dra. Beatriz Albuquerque',
    doctorCrm: 'CRM/SP 184.920',
    date: '2026-08-14', // Hoje
    time: '14:30',
    durationMinutes: 45,
    type: 'rotina',
    status: 'agendada',
    notes: 'Puericultura de rotina 18 meses. Avaliação de linguagem verbal, marcha e checagem de introdução de novos grupos alimentares.',
    preparationChecklist: [
      'Caderneta de Saúde da Criança (Vacinação atualizada)',
      'Últimos exames de sangue (Hemograma e Ferritina)',
      'Lista de alimentos aceitos na última semana',
      'Documento com foto do responsável e da criança'
    ],
    createdAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 'apt_2',
    doctorId: DEMO_DOCTOR_ID,
    patientId: 'pat_2',
    patientName: 'Sofia Lima Ribeiro',
    motherName: 'Camila Lima Ribeiro',
    doctorName: 'Dra. Beatriz Albuquerque',
    doctorCrm: 'CRM/SP 184.920',
    date: '2026-08-17', // Próxima segunda
    time: '10:00',
    durationMinutes: 30,
    type: 'retorno',
    status: 'agendada',
    notes: 'Retorno para reavaliação de lesões de dermatite atópica após 15 dias de fórmula hidrolisada.',
    preparationChecklist: [
      'Caderneta de Vacinação',
      'Relato de episódios de prurido ou novas lesões em dobras',
      'Marca do hidratante e fórmula utilizados'
    ],
    createdAt: '2026-08-02T11:00:00Z',
  },
  {
    id: 'apt_3',
    doctorId: DEMO_DOCTOR_ID,
    patientId: 'pat_4',
    patientName: 'Helena Martins Costa',
    motherName: 'Juliana Martins Costa',
    doctorName: 'Dra. Beatriz Albuquerque',
    doctorCrm: 'CRM/SP 184.920',
    date: '2026-08-14', // Hoje mais tarde
    time: '16:00',
    durationMinutes: 50,
    type: 'rotina',
    status: 'agendada',
    notes: 'Primeira consulta de puericultura pós-alta maternidade (1º mês de vida). Triagem neonatal, teste do pezinho e amamentação.',
    preparationChecklist: [
      'Resumo de alta da maternidade (Declaração de Nascido Vivo)',
      'Resultado do Teste do Pezinho, Orelhinha, Olhinho e Coraçãozinho',
      'Caderneta de Vacinas com BCG e Hepatite B aplicadas na maternidade'
    ],
    createdAt: '2026-08-05T14:20:00Z',
  },
  {
    id: 'apt_4',
    doctorId: DEMO_DOCTOR_ID,
    patientId: 'pat_3',
    patientName: 'Enzo Gabriel Oliveira',
    motherName: 'Beatriz Oliveira',
    doctorName: 'Dra. Beatriz Albuquerque',
    doctorCrm: 'CRM/SP 184.920',
    date: '2026-08-20',
    time: '11:15',
    durationMinutes: 40,
    type: 'desenvolvimento',
    status: 'agendada',
    notes: 'Avaliação de pré-escola (5 anos), acuidade visual preliminar e controle de crises de asma induzidas por tempo frio.',
    preparationChecklist: [
      'Caderneta de Vacinas (DTP e Poliomielite de 4-5 anos)',
      'Relatório escolar recente',
      'Histórico de uso de medicação inalatória'
    ],
    createdAt: '2026-08-08T16:00:00Z',
  },
  {
    id: 'apt_5',
    doctorId: DEMO_DOCTOR_ID,
    patientId: 'pat_2',
    patientName: 'Sofia Lima Ribeiro',
    motherName: 'Camila Lima Ribeiro',
    doctorName: 'Dra. Beatriz Albuquerque',
    doctorCrm: 'CRM/SP 184.920',
    date: '2026-08-02', // Passada
    time: '10:15',
    durationMinutes: 45,
    type: 'urgencia',
    status: 'concluida',
    notes: 'Atendimento por erupções cutâneas e refluxo. Confirmada hipótese de sensibilidade alimentar (APLV).',
    preparationChecklist: [
      'Caderneta de Vacinas',
      'Exames de IgE e Hemograma'
    ],
    createdAt: '2026-08-01T15:00:00Z',
  },
  {
    id: 'apt_6',
    doctorId: DEMO_DOCTOR_ID,
    patientId: 'pat_1',
    patientName: 'Gabriel Santos Ferreira',
    motherName: 'Mariana Santos Ferreira',
    doctorName: 'Dra. Beatriz Albuquerque',
    doctorCrm: 'CRM/SP 184.920',
    date: '2026-07-25', // Passada
    time: '14:30',
    durationMinutes: 45,
    type: 'rotina',
    status: 'concluida',
    notes: 'Puericultura de 18 meses realizada. Curva de crescimento e percentis atualizados.',
    preparationChecklist: [
      'Caderneta de Saúde da Criança'
    ],
    createdAt: '2026-07-10T10:00:00Z',
  }
];

