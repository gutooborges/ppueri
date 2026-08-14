import React from 'react';
import { VitalsEvaluation } from '../../types/ppueri';
import { CheckCircle, AlertTriangle, ShieldAlert, Activity } from 'lucide-react';

interface ClinicalFlagProps {
  evaluation: VitalsEvaluation;
  compact?: boolean;
}

export const ClinicalFlag: React.FC<ClinicalFlagProps> = ({ evaluation, compact = false }) => {
  const isNormal = evaluation.status === 'normal';
  const isAlert = evaluation.severity === 'alert';

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
          isNormal
            ? 'bg-sky-50 text-sky-900 border-sky-200'
            : isAlert
            ? 'bg-amber-50 text-amber-900 border-amber-300'
            : 'bg-sky-50 text-sky-900 border-amber-300'
        }`}
      >
        {isNormal ? (
          <CheckCircle className="w-3.5 h-3.5 text-sky-600" />
        ) : isAlert ? (
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        )}
        <span>{evaluation.parameterName}: {evaluation.value} {evaluation.unit}</span>
      </div>
    );
  }

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all ${
        isNormal
          ? 'bg-slate-50/70 border-slate-200 hover:border-sky-300'
          : 'bg-sky-50/90 border-amber-400 shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-lg ${
              isNormal
                ? 'bg-sky-100 text-sky-700'
                : isAlert
                ? 'bg-amber-100 text-amber-700'
                : 'bg-sky-100 text-sky-800'
            }`}
          >
            {isNormal ? (
              <Activity className="w-4 h-4 text-sky-700" />
            ) : isAlert ? (
              <ShieldAlert className="w-4 h-4 text-amber-700" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-sky-800" />
            )}
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {evaluation.parameterName}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-slate-900">
                {evaluation.value}
              </span>
              <span className="text-xs text-slate-600 font-medium">{evaluation.unit}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isNormal
                ? 'bg-sky-100 text-sky-800 border border-sky-200'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}
          >
            {isNormal ? (
              <>
                <CheckCircle className="w-3 h-3 text-sky-600" />
                Normal
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Alterado
              </>
            )}
          </span>
          <div className="text-[11px] text-slate-500 mt-1">
            Ref: {evaluation.referenceRange}
          </div>
        </div>
      </div>

      <p
        className={`text-xs mt-2.5 pt-2 border-t font-medium ${
          isNormal
            ? 'text-slate-600 border-slate-200/60'
            : 'text-amber-900 border-amber-200'
        }`}
      >
        {evaluation.explanation}
      </p>
    </div>
  );
};
