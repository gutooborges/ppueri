import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// 1. Security Headers Middleware (Production Hardened)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  next();
});

// Body parser com suporte a payloads JSON e imagens Base64
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Inicialização do cliente Gemini AI no servidor
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// In-Memory Cloud Database Mock (Sincronizado com LocalStorage do Front-end)
let memoryStore = {
  patients: [] as any[],
  consultations: [] as any[],
  appointments: [] as any[],
  vaccinesMap: {} as Record<string, any[]>,
  notifications: [] as any[],
};

// ==========================================
// ROTAS DE API ESSENCIAIS PARA PRODUÇÃO
// ==========================================

// 1. Status & Healthcheck
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "Ppueri PEP Pediátrico",
    version: "2.5.0-production",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// 2. Leitor Inteligente de Exames (PDF OCR & Vision Parsing via Gemini)
app.post("/api/ocr-exam", async (req, res) => {
  try {
    const { base64Data, mimeType, fileName } = req.body;

    if (!base64Data) {
      return res.status(400).json({ error: "Dados base64 do arquivo são obrigatórios." });
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "application/pdf",
        data: base64Data,
      },
    };

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
      model: "gemini-2.5-flash",
      contents: {
        parts: [imagePart, { text: promptText }],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    const parsedData = JSON.parse(responseText);

    return res.json(parsedData);
  } catch (err: any) {
    console.error("Erro no processamento OCR via Gemini Vision:", err);
    return res.status(500).json({
      error: "Falha na análise inteligente do exame.",
      details: err.message || String(err),
    });
  }
});

// 3. API de Sincronização & Backup Completo
app.get("/api/backup", (_req, res) => {
  res.json({
    version: "2.5.0",
    data: memoryStore,
    exportedAt: new Date().toISOString(),
  });
});

app.post("/api/restore", (req, res) => {
  try {
    const { patients, consultations, appointments, vaccinesMap, notifications } = req.body;
    if (patients && Array.isArray(patients)) memoryStore.patients = patients;
    if (consultations && Array.isArray(consultations)) memoryStore.consultations = consultations;
    if (appointments && Array.isArray(appointments)) memoryStore.appointments = appointments;
    if (vaccinesMap) memoryStore.vaccinesMap = vaccinesMap;
    if (notifications && Array.isArray(notifications)) memoryStore.notifications = notifications;

    return res.json({ success: true, message: "Dados sincronizados com o servidor." });
  } catch (err: any) {
    return res.status(500).json({ error: "Falha ao restaurar dados no servidor." });
  }
});

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR & MIDDLEWARE VITE
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // Serve assets estáticos com cache agressivo
    app.use(
      express.static(distPath, {
        maxAge: "7d",
        setHeaders: (res, filePath) => {
          if (filePath.endsWith("index.html") || filePath.endsWith("sw.js") || filePath.endsWith("manifest.json")) {
            res.setHeader("Cache-Control", "no-cache");
          }
        },
      })
    );
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Ppueri] Servidor Pediátrico rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
