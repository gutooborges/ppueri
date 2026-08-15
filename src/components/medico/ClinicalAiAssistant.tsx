import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  FileText,
  PlusCircle,
  Activity,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  PlayCircle,
} from 'lucide-react';
import {
  Patient,
  Anamnesis,
  AntropometricParams,
  ClinicalVitals,
  VitalsEvaluation,
  LabExam,
  DiagnosticHypothesis,
  ClinicalAlert,
  ClinicalAiAnalysis,
} from '../../types/ppueri';
import { runPediatricCdssAnalysis } from '../../lib/clinical-ai';

interface ClinicalAiAssistantProps {
  patient: Patient;
  anamnesis: Anamnesis;
  antropometry: AntropometricParams;
  vitals: ClinicalVitals;
  vitalsEvaluations: VitalsEvaluation[];
  exams: LabExam[];
  onApplyDiagnosis?: (diagnosisText: string) => void;
  onApplyPrescriptionSuggestion?: (medicationText: string) => void;
}

export const ClinicalAiAssistant: React.FC<ClinicalAiAssistantProps> = ({
  patient,
  anamnesis,
  antropometry,
  vitals,
  vitalsEvaluations,
  exams,
  onApplyDiagnosis,
  onApplyPrescriptionSuggestion,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Starts null — no pre-analysis on mount. User must trigger explicitly.
  const [analysis, setAnalysis] = useState<ClinicalAiAnalysis | null>(null);

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const result = runPediatricCdssAnalysis(
        patient,
        anamnesis,
        antropometry,
        vitals,
        vitalsEvaluations,
        exams
      );
      setAnalysis(result);
      setIsAnalyzing(false);
    }, 600);
  };

  const getLikelihoodBadge = (likelihood: DiagnosticHypothesis['likelihood']) => {
    switch (likelihood) {
      case 'Alta':
        return 'bg-sky-100 text-sky-900 border-sky-300 font-bold';
      case 'Moderada':
        return 'bg-slate-100 text-slate-800 border-slate-300 font-semibold';
      case 'Acompanhar':
        return 'bg-cyan-100 text-cyan-900 border-cyan-300 font-medium';
    }
  };

  const getAlertBadge = (type: ClinicalAlert['type']) => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-rose-50/90 border-rose-200 text-rose-950',
          icon: <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />,
          titleColor: 'text-rose-900',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50/90 border-amber-200 text-amber-950',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
          titleColor: 'text-amber-900',
        };
      case 'info':
        return {
          bg: 'bg-sky-50/90 border-sky-200 text-sky-950',
          icon: <Activity className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />,
          titleColor: 'text-sky-900',
        };
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-sky-500/30 rounded-2xl shadow-xl text-white overflow-hidden transition-all">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-700/60 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-850 to-sky-950">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30 shadow-inner">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                Suporte à Decisão Clínica (CDSS Pediátrico)
              </span>
              {analysis ? (
                <span className="bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3 fill-slate-950" /> IA Ativa
                </span>
              ) : (
                <span className="bg-slate-700 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Sob Demanda
                </span>
              )}
            </div>
            <p className="text-xs text-sky-200/80 mt-0.5">
              Análise cruzada de anamnese, Z-scores, sinais vitais e exames complementares
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {analysis && (
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-sky-300 rounded-xl transition-all border border-slate-700/80 active:scale-95 disabled:opacity-50"
              title="Reanalisar com os dados atuais"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700/80"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Empty state — no analysis yet */}
          {!analysis && (
            <div className="p-8 text-center space-y-5 bg-slate-950/60">
              <div className="p-4 bg-sky-500/10 rounded-2xl border border-sky-500/20 w-fit mx-auto">
                <Brain className="w-8 h-8 text-sky-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-sky-200">Análise sob demanda</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Preencha os dados da consulta — queixa principal, sinais vitais, antropometria e exames complementares — e clique em "Analisar com IA" para gerar hipóteses diagnósticas e alertas clínicos com base nos dados inseridos.
                </p>
              </div>
              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white font-bold text-sm px-7 py-3 rounded-xl transition-all shadow-md border border-sky-500/40 mx-auto active:scale-95"
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
                {isAnalyzing ? 'Analisando...' : 'Analisar com IA'}
              </button>
            </div>
          )}

          {/* Results — only shown after explicit trigger */}
          {analysis && (
            <div className="p-5 space-y-5 bg-slate-950/60 text-slate-200 text-xs">
              {/* Growth Summary Pill */}
              <div className="p-3 bg-sky-950/60 border border-sky-800/50 rounded-xl flex items-center gap-2.5 text-sky-200">
                <Activity className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="font-medium">{analysis.growthSummary}</span>
              </div>

              {/* Diagnostic Hypotheses */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-400" />
                  Hipóteses Diagnósticas Sugeridas ({analysis.diagnosticHypotheses.length})
                </span>

                <div className="grid grid-cols-1 gap-2.5">
                  {analysis.diagnosticHypotheses.map((item, index) => (
                    <div
                      key={index}
                      className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 p-3.5 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">{item.condition}</span>
                          {item.icd10 && (
                            <span className="bg-slate-800 text-slate-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-700">
                              CID-10: {item.icd10}
                            </span>
                          )}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md border ${getLikelihoodBadge(item.likelihood)}`}
                          >
                            Probabilidade {item.likelihood}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{item.reason}</p>
                      </div>

                      {onApplyDiagnosis && (
                        <button
                          onClick={() =>
                            onApplyDiagnosis(
                              `${item.condition}${item.icd10 ? ` (CID-10 ${item.icd10})` : ''} - ${item.reason}`
                            )
                          }
                          className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all shrink-0 active:scale-95 shadow-sm"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Inserir no Diagnóstico</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinical Risk Alerts */}
              {analysis.clinicalAlerts.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Alertas e Riscos Clínicos Identificados ({analysis.clinicalAlerts.length})
                  </span>

                  <div className="space-y-2">
                    {analysis.clinicalAlerts.map((alert, idx) => {
                      const style = getAlertBadge(alert.type);
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex items-start gap-3 ${style.bg}`}
                        >
                          {style.icon}
                          <div className="space-y-0.5">
                            <div className={`font-bold text-xs ${style.titleColor}`}>
                              {alert.title}
                            </div>
                            <div className="text-xs opacity-90">{alert.detail}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommended Exams */}
              {analysis.recommendedExams.length > 0 && (
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <span className="font-bold text-sky-300 text-xs block">
                    Exames Complementares Sugeridos para Investigação:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {analysis.recommendedExams.map((ex, i) => (
                      <span
                        key={i}
                        className="bg-sky-950/80 text-sky-200 border border-sky-800/80 text-[11px] font-medium px-2.5 py-1 rounded-lg"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Care Plan & Prescription Suggestions */}
              {analysis.carePlanSuggestions && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-xs text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-sky-400" />
                      Sugestões de Prescrição & Orientação Pediátrica
                    </span>
                    {onApplyPrescriptionSuggestion &&
                      analysis.carePlanSuggestions.prescriptionsText && (
                        <button
                          onClick={() =>
                            onApplyPrescriptionSuggestion(
                              analysis.carePlanSuggestions.prescriptionsText || ''
                            )
                          }
                          className="text-[11px] font-bold text-sky-400 hover:text-sky-300 bg-sky-950/80 hover:bg-sky-900 border border-sky-800 px-2.5 py-1 rounded-lg transition-all"
                        >
                          Copiar para Prescrição
                        </button>
                      )}
                  </div>

                  {analysis.carePlanSuggestions.prescriptionsText && (
                    <div>
                      <span className="text-[11px] text-slate-400 font-semibold block">
                        Prescrição Terapêutica Sugerida:
                      </span>
                      <p className="text-slate-200 font-mono text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 mt-1">
                        {analysis.carePlanSuggestions.prescriptionsText}
                      </p>
                    </div>
                  )}

                  {analysis.carePlanSuggestions.feedingAdvice && (
                    <div>
                      <span className="text-[11px] text-slate-400 font-semibold block">
                        Orientação Nutricional Recomendada:
                      </span>
                      <p className="text-slate-200 text-xs mt-0.5">
                        {analysis.carePlanSuggestions.feedingAdvice}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Legal Disclaimer */}
              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <p>{analysis.disclaimer}</p>
              </div>

              {/* Re-analyze button at bottom */}
              <div className="flex justify-center pt-1">
                <button
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 text-[11px] font-bold text-sky-400 hover:text-sky-300 bg-sky-950/60 hover:bg-sky-950 border border-sky-800 px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  {isAnalyzing ? 'Reanalisando...' : 'Reanalisar com dados atuais'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
