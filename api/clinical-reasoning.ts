import Anthropic from '@anthropic-ai/sdk';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
};

// ── Age helpers (server-side, no dependency on src/lib) ────────────────────────

function calcAgeMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
}

function formatAge(months: number): string {
  if (months < 1) return 'recém-nascido';
  if (months < 24) return `${months} meses`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years} anos e ${rem} meses` : `${years} anos`;
}

// ── Handler ────────────────────────────────────────────────────────────────────

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'ANTHROPIC_API_KEY não configurada. Adicione a variável de ambiente no painel da Vercel.',
      fallback: true,
    });
  }

  try {
    const {
      patient,
      anamnesis,
      antropometry,
      vitals,
      vitalsEvaluations,
      exams,
      consultationHistory,
    } = req.body;

    if (!patient || !anamnesis || !antropometry || !vitals) {
      return res.status(400).json({ error: 'Dados clínicos incompletos.', fallback: true });
    }

    // ── Build context strings ────────────────────────────────────────────────

    const ageMonths = calcAgeMonths(patient.birthDate);
    const ageDisplay = formatAge(ageMonths);

    const wZ = antropometry.weightZScore ?? null;
    const hZ = antropometry.heightZScore ?? null;
    const hcZ = antropometry.headCircumferenceZScore ?? null;

    const alteredVitals = Array.isArray(vitalsEvaluations)
      ? vitalsEvaluations
          .filter((v: any) => v.status === 'alterado')
          .map((v: any) => `${v.parameterName}: ${v.value} ${v.unit} — ${v.explanation}`)
          .join('; ')
      : '';

    const examsSummary = Array.isArray(exams) && exams.length > 0
      ? exams.map((e: any) => {
          const altered = (e.items || []).filter((i: any) => i.status !== 'normal');
          const alteredStr = altered.length > 0
            ? altered.map((i: any) => `${i.parameter} ${i.value}${i.unit ? ' ' + i.unit : ''} [${i.status}]`).join(', ')
            : 'todos normais';
          return `• ${e.title} (${e.date || 'sem data'}): ${(e.items || []).length} parâmetros — alterados: ${alteredStr}`;
        }).join('\n')
      : 'Nenhum exame complementar vinculado a esta consulta.';

    const historySummary = Array.isArray(consultationHistory) && consultationHistory.length > 0
      ? consultationHistory
          .slice(0, 3)
          .map((c: any) =>
            `• ${c.date || 'data N/A'}: Queixa "${c.anamnesis?.chiefComplaint || 'N/A'}" | Diagnóstico: "${c.carePlan?.diagnosisText || 'N/A'}"`
          )
          .join('\n')
      : 'Primeira consulta ou histórico não disponível.';

    // ── Prompts ──────────────────────────────────────────────────────────────

    const systemPrompt = `Você é um médico pediatra com especialização em raciocínio diagnóstico diferencial e medicina baseada em evidências, seguindo protocolos da Sociedade Brasileira de Pediatria (SBP) e do Ministério da Saúde do Brasil.

Sua única tarefa é analisar dados clínicos pediátricos e retornar EXCLUSIVAMENTE um objeto JSON válido. Não escreva texto antes nem depois do JSON. Não use markdown, blocos de código ou explicações.

O JSON deve seguir EXATAMENTE esta estrutura (sem campos extras):
{
  "diagnosticHypotheses": [
    {
      "condition": "nome da condição ou hipótese diagnóstica",
      "likelihood": "Alta" | "Moderada" | "Acompanhar",
      "reason": "justificativa clínica baseada nos dados",
      "icd10": "código CID-10"
    }
  ],
  "clinicalAlerts": [
    {
      "type": "danger" | "warning" | "info",
      "title": "título curto do alerta",
      "detail": "orientação clínica detalhada para o pediatra"
    }
  ],
  "recommendedExams": ["nome do exame sugerido"],
  "carePlanSuggestions": {
    "prescriptionsText": "sugestão de prescrição em linguagem de receituário médico",
    "feedingAdvice": "orientações nutricionais e de aleitamento",
    "returnDays": 30,
    "warningSigns": ["sinal de alarme para retorno imediato"]
  },
  "growthSummary": "resumo do estado antropométrico em 1-2 frases",
  "disclaimer": "Aviso legal: As sugestões deste módulo são geradas por IA como apoio ao raciocínio clínico, baseadas em diretrizes da SBP e Ministério da Saúde. O diagnóstico e a conduta terapêutica são de responsabilidade exclusiva do médico pediatra assistente."
}`;

    const userMessage = `DADOS DO PACIENTE:
- Nome: ${patient.name}
- Idade: ${ageDisplay} (${ageMonths} meses)
- Sexo: ${patient.gender === 'feminino' ? 'Feminino' : 'Masculino'}
- Alergias conhecidas: ${patient.allergies?.join(', ') || 'Nenhuma referida'}
- Condições crônicas: ${patient.chronicConditions?.join(', ') || 'Nenhuma referida'}
- Tipo sanguíneo: ${patient.bloodType || 'Não informado'}

CONSULTA ATUAL:
- Queixa principal: ${anamnesis.chiefComplaint || 'Não informada'}
- História da doença atual: ${anamnesis.historyOfPresentIllness || 'Não informada'}
- Medicações em uso: ${anamnesis.currentMedications?.join(', ') || 'Nenhuma'}
- Alergias relatadas: ${anamnesis.allergies?.join(', ') || 'Nenhuma'}
- Hábitos: ${anamnesis.currentHabits || 'Não informado'}
- Exame físico: ${anamnesis.physicalExam || 'Não detalhado'}
- Amamentação: ${anamnesis.breastfeedingStatus || 'Não informado'}

ANTROPOMETRIA (Curvas OMS):
- Peso: ${antropometry.weightKg} kg${wZ !== null ? ` | Z-score: ${Number(wZ).toFixed(2)} DP${antropometry.weightPercentile ? ` (P${antropometry.weightPercentile})` : ''}` : ''}
- Comprimento/Altura: ${antropometry.heightCm} cm${hZ !== null ? ` | Z-score: ${Number(hZ).toFixed(2)} DP` : ''}
${ageMonths <= 36 && antropometry.headCircumferenceCm ? `- Perímetro Cefálico: ${antropometry.headCircumferenceCm} cm${hcZ !== null ? ` | Z-score: ${Number(hcZ).toFixed(2)} DP` : ''}` : ''}

SINAIS VITAIS:
- Temperatura: ${vitals.temperatureC}°C
- Frequência Cardíaca: ${vitals.heartRateBpm} bpm
- Frequência Respiratória: ${vitals.respiratoryRateRpm} rpm
- SpO2: ${vitals.oxygenSaturationPct}%
- Pressão Arterial: ${vitals.systolicBP}/${vitals.diastolicBP} mmHg
${alteredVitals ? `- Parâmetros alterados: ${alteredVitals}` : '- Todos os parâmetros vitais avaliados como normais para a faixa etária'}

EXAMES COMPLEMENTARES DESTA CONSULTA:
${examsSummary}

HISTÓRICO DE CONSULTAS ANTERIORES:
${historySummary}

Analise todos esses dados e retorne o JSON de raciocínio clínico pediátrico estruturado.`;

    // ── Call Claude Sonnet ───────────────────────────────────────────────────

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const rawText = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '';

    // Strip accidental markdown fences if present
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Claude não retornou um JSON estruturado válido.');
    }

    const analysisResult = JSON.parse(jsonMatch[0]);
    return res.json(analysisResult);

  } catch (err: any) {
    console.error('[Ppueri CDSS] Erro na análise com Claude:', err);
    return res.status(500).json({
      error: 'Falha na análise clínica com IA.',
      details: err.message || String(err),
      fallback: true,
    });
  }
}
