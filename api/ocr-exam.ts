import { GoogleGenAI } from '@google/genai';

// Allow up to 20MB base64 payloads (PDF/image files)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { base64Data, mimeType } = req.body;

    if (!base64Data) {
      return res.status(400).json({ error: 'Dados base64 do arquivo são obrigatórios.' });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const promptText = `
Você é um especialista em laudos laboratoriais e Prontuário Eletrônico Pediátrico.
Analise a imagem/documento anexado do exame e extraia os resultados estruturados.

Retorne EXCLUSIVAMENTE um objeto JSON válido seguindo a estrutura:
{
  "title": "Nome do Exame (ex: Hemograma Completo)",
  "category": "Hemograma" | "Bioquímica" | "Urina" | "Sorologia" | "Outro",
  "doctorInterpretation": "Breve parecer da análise do laudo",
  "items": [
    {
      "parameter": "Nome do Parâmetro",
      "value": "Valor medido (string)",
      "numericValue": 12.5,
      "unit": "Unidade (ex: g/dL)",
      "referenceRange": "Faixa de referência pediátrica",
      "status": "normal" | "alterado_alto" | "alterado_baixo",
      "notes": "Observação opcional"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType || 'application/pdf', data: base64Data } },
          { text: promptText },
        ],
      },
      config: { responseMimeType: 'application/json' },
    });

    const parsedData = JSON.parse(response.text || '{}');
    return res.json(parsedData);
  } catch (err: any) {
    console.error('Erro no processamento OCR via Gemini Vision:', err);
    return res.status(500).json({
      error: 'Falha na análise inteligente do exame.',
      details: err.message || String(err),
    });
  }
}
