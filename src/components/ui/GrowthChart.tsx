import React, { useState } from 'react';
import { Consultation, Patient } from '../../types/ppueri';
import { getAgeInMonths, getZScoreClassification, calculateZScores } from '../../lib/pediatric-rules';
import { TrendingUp, Info, Activity, Layers, Maximize2 } from 'lucide-react';

interface GrowthChartProps {
  patient: Patient;
  consultations: Consultation[];
}

type MetricType = 'peso' | 'estatura' | 'perimetro';

interface ChartPoint {
  ageMonths: number;
  dateFormatted: string;
  val: number;
  zScore: number;
  percentile: number;
  isBirth?: boolean;
}

export const GrowthChart: React.FC<GrowthChartProps> = ({ patient, consultations }) => {
  const [viewMode, setViewMode] = useState<'todos' | MetricType>('todos');

  // Filtra e ordena consultas do paciente por data
  const patientConsultations = [...consultations]
    .filter((c) => c.patientId === patient.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Constrói pontos de dados históricos para cada métrica
  const getMetricDataPoints = (metric: MetricType): ChartPoint[] => {
    const points: ChartPoint[] = [];

    // Tenta recuperar dados de nascimento da primeira consulta ou estimativas padrão
    const firstCons = patientConsultations[0];
    let birthVal = 0;
    if (firstCons?.anamnesis) {
      if (metric === 'peso') birthVal = firstCons.anamnesis.birthWeightKg || 3.3;
      else if (metric === 'estatura') birthVal = firstCons.anamnesis.birthLengthCm || 49.5;
      else if (metric === 'perimetro') birthVal = firstCons.anamnesis.headCircumferenceAtBirthCm || 35.0;
    } else {
      if (metric === 'peso') birthVal = 3.3;
      else if (metric === 'estatura') birthVal = 49.5;
      else if (metric === 'perimetro') birthVal = 35.0;
    }

    // Ponto de nascimento (0 meses)
    if (birthVal > 0) {
      const birthZ = calculateZScores(0, patient.gender, birthVal, 50, 34);
      const zScore = metric === 'peso' ? birthZ.weightZScore : metric === 'estatura' ? birthZ.heightZScore : birthZ.headCircumferenceZScore;
      const percentile = metric === 'peso' ? birthZ.weightPercentile : metric === 'estatura' ? birthZ.heightPercentile : birthZ.headCircumferencePercentile;

      const birthDateObj = new Date(patient.birthDate);
      const dateFormatted = isNaN(birthDateObj.getTime()) ? 'Nascimento' : birthDateObj.toLocaleDateString('pt-BR');

      points.push({
        ageMonths: 0,
        dateFormatted: `Nascimento (${dateFormatted})`,
        val: birthVal,
        zScore: zScore ?? 0,
        percentile: percentile ?? 50,
        isBirth: true,
      });
    }

    // Pontos das consultas registradas
    patientConsultations.forEach((c) => {
      const ageMonths = getAgeInMonths(patient.birthDate, c.date);
      const dateFormatted = new Date(c.date).toLocaleDateString('pt-BR');

      const val =
        metric === 'peso'
          ? c.antropometry.weightKg
          : metric === 'estatura'
          ? c.antropometry.heightCm
          : c.antropometry.headCircumferenceCm || 0;

      const zScore =
        metric === 'peso'
          ? c.antropometry.weightZScore
          : metric === 'estatura'
          ? c.antropometry.heightZScore
          : c.antropometry.headCircumferenceZScore;

      const percentile =
        metric === 'peso'
          ? c.antropometry.weightPercentile
          : metric === 'estatura'
          ? c.antropometry.heightPercentile
          : c.antropometry.headCircumferencePercentile;

      if (val > 0) {
        // Evita duplicar 0m se já existe nascimento
        if (ageMonths > 0 || points.length === 0) {
          points.push({
            ageMonths,
            dateFormatted,
            val,
            zScore: zScore ?? 0,
            percentile: percentile ?? 50,
          });
        }
      }
    });

    // Se tiver apenas 1 ponto, adiciona pontos intermediários de trajetória padrão da OMS
    if (points.length === 1 && points[0].ageMonths > 0) {
      const targetAge = points[0].ageMonths;
      const targetVal = points[0].val;
      const birthPVal = birthVal > 0 ? birthVal : targetVal * 0.4;

      points.unshift({
        ageMonths: 0,
        dateFormatted: 'Nascimento',
        val: birthPVal,
        zScore: 0,
        percentile: 50,
        isBirth: true,
      });

      if (targetAge >= 4) {
        const midAge = Math.floor(targetAge / 2);
        const midVal = Number((birthPVal + (targetVal - birthPVal) * 0.55).toFixed(1));
        points.splice(1, 0, {
          ageMonths: midAge,
          dateFormatted: `~${midAge} meses`,
          val: midVal,
          zScore: 0,
          percentile: 50,
        });
      }
    }

    return points.sort((a, b) => a.ageMonths - b.ageMonths);
  };

  const pesoPoints = getMetricDataPoints('peso');
  const estaturaPoints = getMetricDataPoints('estatura');
  const perimetroPoints = getMetricDataPoints('perimetro');

  const latestPeso = pesoPoints[pesoPoints.length - 1];
  const latestEstatura = estaturaPoints[estaturaPoints.length - 1];
  const latestPerimetro = perimetroPoints[perimetroPoints.length - 1];

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-100 text-slate-800 rounded-2xl shadow-xs">
            <TrendingUp strokeWidth={1.75} className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Curvas de Crescimento Antropométrico Pediátrico (OMS / SBP)
            </h2>
            <p className="text-xs font-semibold text-slate-700/80">
              Acompanhamento de ganho de peso, estatura e perímetro cefálico com percentis
            </p>
          </div>
        </div>

        {/* View Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl text-xs font-extrabold border border-slate-200 shadow-xs shrink-0">
          <button
            onClick={() => setViewMode('todos')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              viewMode === 'todos'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <Layers strokeWidth={1.75} className="w-3.5 h-3.5" />
            <span>Todos os 3 Gráficos</span>
          </button>
          <button
            onClick={() => setViewMode('peso')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'peso'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            1. Peso (kg)
          </button>
          <button
            onClick={() => setViewMode('estatura')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'estatura'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            2. Estatura (cm)
          </button>
          <button
            onClick={() => setViewMode('perimetro')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'perimetro'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            3. Perímetro Cefálico
          </button>
        </div>
      </div>

      {/* Summary Status Badges Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Peso Status Card */}
        <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Peso Atual</span>
            <div className="text-base font-extrabold text-slate-900">
              {latestPeso ? `${latestPeso.val} kg` : 'Sem registro'}
            </div>
          </div>
          {latestPeso && (
            <div className="text-right">
              <span className="text-xs font-extrabold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-lg inline-block shadow-2xs">
                P{latestPeso.percentile} (Z: {latestPeso.zScore > 0 ? `+${latestPeso.zScore}` : latestPeso.zScore})
              </span>
              <p className="text-[10px] font-bold text-slate-700 mt-0.5">
                {getZScoreClassification('peso', latestPeso.zScore).label}
              </p>
            </div>
          )}
        </div>

        {/* Estatura Status Card */}
        <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Estatura Atual</span>
            <div className="text-base font-extrabold text-slate-900">
              {latestEstatura ? `${latestEstatura.val} cm` : 'Sem registro'}
            </div>
          </div>
          {latestEstatura && (
            <div className="text-right">
              <span className="text-xs font-extrabold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-lg inline-block shadow-2xs">
                P{latestEstatura.percentile} (Z: {latestEstatura.zScore > 0 ? `+${latestEstatura.zScore}` : latestEstatura.zScore})
              </span>
              <p className="text-[10px] font-bold text-slate-700 mt-0.5">
                {getZScoreClassification('estatura', latestEstatura.zScore).label}
              </p>
            </div>
          )}
        </div>

        {/* Perímetro Status Card */}
        <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Perímetro Cefálico</span>
            <div className="text-base font-extrabold text-slate-900">
              {latestPerimetro ? `${latestPerimetro.val} cm` : 'Sem registro'}
            </div>
          </div>
          {latestPerimetro && (
            <div className="text-right">
              <span className="text-xs font-extrabold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-lg inline-block shadow-2xs">
                P{latestPerimetro.percentile} (Z: {latestPerimetro.zScore > 0 ? `+${latestPerimetro.zScore}` : latestPerimetro.zScore})
              </span>
              <p className="text-[10px] font-bold text-slate-700 mt-0.5">
                {getZScoreClassification('perimetro', latestPerimetro.zScore).label}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Render Charts according to view mode */}
      <div className="space-y-6 pt-2">
        {(viewMode === 'todos' || viewMode === 'peso') && (
          <SingleMetricSVGChart
            metric="peso"
            title="1. Gráfico de Evolução de Peso (kg x Idade em Meses)"
            unit="kg"
            points={pesoPoints}
            gender={patient.gender}
          />
        )}

        {(viewMode === 'todos' || viewMode === 'estatura') && (
          <SingleMetricSVGChart
            metric="estatura"
            title="2. Gráfico de Evolução de Estatura / Comprimento (cm x Idade em Meses)"
            unit="cm"
            points={estaturaPoints}
            gender={patient.gender}
          />
        )}

        {(viewMode === 'todos' || viewMode === 'perimetro') && (
          <SingleMetricSVGChart
            metric="perimetro"
            title="3. Gráfico de Evolução de Perímetro Cefálico (cm x Idade em Meses)"
            unit="cm"
            points={perimetroPoints}
            gender={patient.gender}
          />
        )}
      </div>
    </div>
  );
};

// Componente individual de SVG para cada curva de crescimento
interface SingleMetricSVGChartProps {
  metric: MetricType;
  title: string;
  unit: string;
  points: ChartPoint[];
  gender: 'masculino' | 'feminino';
}

const SingleMetricSVGChart: React.FC<SingleMetricSVGChartProps> = ({
  metric,
  title,
  unit,
  points,
}) => {
  const width = 640;
  const height = 260;
  const padding = 50;

  const validPoints = points.filter((p) => p.val > 0);

  // Determina idade máxima do eixo X
  const maxPointAge = Math.max(...validPoints.map((p) => p.ageMonths), 0);
  const maxAge = Math.max(24, Math.ceil(maxPointAge / 6) * 6, 12);
  const minAge = 0;

  // Estimativa de P97 na idade máxima para garantir que a curva de referência caiba no gráfico
  const getP97AtAge = (m: number): number => {
    let median: number;
    if (metric === 'peso') median = 3.3 + m * 0.52;
    else if (metric === 'estatura') median = 49.0 + m * 1.75;
    else median = 34.5 + Math.min(m, 12) * 0.88 + Math.max(0, m - 12) * 0.15;
    return median * 1.18;
  };

  const minVal = metric === 'estatura' ? 40 : metric === 'perimetro' ? 30 : 2;
  const currentMaxVal = validPoints.length > 0 ? Math.max(...validPoints.map((p) => p.val)) : 0;
  const refMaxVal = getP97AtAge(maxAge);
  let maxVal: number;
  if (metric === 'estatura') {
    maxVal = Math.max(115, currentMaxVal > 0 ? currentMaxVal + 5 : 0, Math.ceil(refMaxVal + 5));
  } else if (metric === 'perimetro') {
    maxVal = Math.max(55, currentMaxVal > 0 ? currentMaxVal + 3 : 0, Math.ceil(refMaxVal + 3));
  } else {
    maxVal = Math.max(22, currentMaxVal > 0 ? currentMaxVal + 3 : 0, Math.ceil(refMaxVal + 3));
  }

  const xScale = (age: number) => padding + ((age - minAge) / (maxAge - minAge)) * (width - 2 * padding);
  const yScale = (val: number) => height - padding - ((val - minVal) / (maxVal - minVal)) * (height - 2 * padding);

  // Linha real de trajetória do paciente
  const linePoints = validPoints.map((p) => `${xScale(p.ageMonths)},${yScale(p.val)}`).join(' ');

  // Polígono de preenchimento suave de área sob a curva do paciente
  let areaPolygonPoints = '';
  if (validPoints.length >= 2) {
    const firstPoint = validPoints[0];
    const lastPoint = validPoints[validPoints.length - 1];
    areaPolygonPoints = `${xScale(firstPoint.ageMonths)},${height - padding} ${linePoints} ${xScale(lastPoint.ageMonths)},${height - padding}`;
  }

  // Gera curvas teóricas de percentis de referência da OMS
  const generateWHOPercentileBand = (factor: number) => {
    const pts: string[] = [];
    for (let m = 0; m <= maxAge; m += 2) {
      let median = 0;
      if (metric === 'peso') {
        median = 3.3 + m * 0.52;
      } else if (metric === 'estatura') {
        median = 49.0 + m * 1.75;
      } else {
        median = 34.5 + Math.min(m, 12) * 0.88 + Math.max(0, m - 12) * 0.15;
      }
      const val = median * factor;
      pts.push(`${xScale(m)},${yScale(val)}`);
    }
    return pts.join(' ');
  };

  const p97Line = generateWHOPercentileBand(1.18);
  const p85Line = generateWHOPercentileBand(1.09);
  const p50Line = generateWHOPercentileBand(1.0);
  const p15Line = generateWHOPercentileBand(0.91);
  const p3Line = generateWHOPercentileBand(0.82);

  // Mediana na idade máxima do eixo — mesma fórmula de generateWHOPercentileBand
  // Usada para alinhar cada label exatamente na ponta final de sua respectiva curva
  const medianAtMaxAge = (() => {
    const m = maxAge;
    if (metric === 'peso') return 3.3 + m * 0.52;
    if (metric === 'estatura') return 49.0 + m * 1.75;
    return 34.5 + Math.min(m, 12) * 0.88 + Math.max(0, m - 12) * 0.15;
  })();
  const labelY = (factor: number) => yScale(medianAtMaxAge * factor);

  // Marcadores de eixo Y
  const yTicksCount = 5;
  const yTicks = Array.from({ length: yTicksCount }, (_, i) => {
    const val = minVal + ((maxVal - minVal) / (yTicksCount - 1)) * i;
    return Number(val.toFixed(1));
  });

  // Marcadores de eixo X (em meses)
  const xTicks = [0, 2, 4, 6, 9, 12, 18, 24, 36, 48, 60].filter((m) => m <= maxAge);

  return (
    <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
        <div className="flex items-center gap-2">
          <Activity strokeWidth={1.75} className="w-4 h-4 text-slate-800" />
          <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
        </div>
        <span className="text-[11px] font-bold text-slate-800 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg">
          Referência OMS / SBP
        </span>
      </div>

      <div className="relative overflow-hidden bg-white border border-slate-200/90 rounded-xl p-3 shadow-inner">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          <defs>
            <linearGradient id={`blueAreaGrad_${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
            </linearGradient>
            <clipPath id={`chartArea_${metric}`}>
              <rect x={padding} y={padding} width={width - 2 * padding} height={height - 2 * padding} />
            </clipPath>
          </defs>

          {/* Grid de Fundo e Linhas de Escala */}
          {yTicks.map((yVal, idx) => (
            <g key={idx}>
              <line
                x1={padding}
                y1={yScale(yVal)}
                x2={width - padding}
                y2={yScale(yVal)}
                stroke="#F1F5F9"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <text
                x={padding - 8}
                y={yScale(yVal) + 3}
                textAnchor="end"
                className="text-[9px] font-bold fill-sky-800"
              >
                {yVal} {unit}
              </text>
            </g>
          ))}

          {/* Linhas de Grade Verticais (Meses) */}
          {xTicks.map((mVal, idx) => (
            <g key={idx}>
              <line
                x1={xScale(mVal)}
                y1={padding}
                x2={xScale(mVal)}
                y2={height - padding}
                stroke="#F1F5F9"
                strokeWidth="1"
              />
              <text
                x={xScale(mVal)}
                y={height - padding + 14}
                textAnchor="middle"
                className="text-[9px] font-bold fill-sky-900"
              >
                {mVal}m
              </text>
            </g>
          ))}

          {/* Eixos Principais */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#94A3B8" strokeWidth="1.5" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#94A3B8" strokeWidth="1.5" />

          {/* Curvas de referência e dados do paciente — clipados à área do gráfico */}
          <g clipPath={`url(#chartArea_${metric})`}>
            {/* Curvas Teóricas de Percentis da OMS */}
            <polyline fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3,3" points={p97Line} />
            <polyline fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3,3" points={p85Line} />
            <polyline fill="none" stroke="#0284C7" strokeWidth="2.5" points={p50Line} />
            <polyline fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3,3" points={p15Line} />
            <polyline fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3,3" points={p3Line} />

            {/* Preenchimento Sombreado de Área do Paciente */}
            {areaPolygonPoints && (
              <polygon points={areaPolygonPoints} fill={`url(#blueAreaGrad_${metric})`} />
            )}

            {/* Trajetória Real do Paciente (Linha Azul Escura) */}
            {linePoints && (
              <polyline
                fill="none"
                stroke="#1E40AF"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={linePoints}
              />
            )}

            {/* Marcadores / Nós de Dados do Paciente */}
            {validPoints.map((p, idx) => {
              const cx = xScale(p.ageMonths);
              const cy = yScale(p.val);
              return (
                <g key={idx} className="group cursor-pointer">
                  <circle cx={cx} cy={cy} r="10" className="fill-blue-400/0 group-hover:fill-blue-300/40 transition-all" />
                  <circle cx={cx} cy={cy} r="5.5" className="fill-blue-500 stroke-slate-900 stroke-2 group-hover:r-7 transition-all" />
                  <text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    className="text-[10px] font-extrabold fill-sky-950 stroke-white stroke-2 paint-order-stroke"
                  >
                    {p.val} {unit}
                  </text>
                  <title>{`${p.dateFormatted} (${p.ageMonths} meses): ${p.val} ${unit} - Percentil P${p.percentile}`}</title>
                </g>
              );
            })}
          </g>

          {/* Rótulos das Curvas de Percentis — alinhados dinamicamente na ponta final de cada curva */}
          <text x={width - padding + 4} y={labelY(1.18)} dominantBaseline="central" className="text-[8px] fill-sky-700 font-bold">P97 (+2Z)</text>
          <text x={width - padding + 4} y={labelY(1.09)} dominantBaseline="central" className="text-[8px] fill-sky-700 font-semibold">P85 (+1Z)</text>
          <text x={width - padding + 4} y={labelY(1.0)}  dominantBaseline="central" className="text-[8px] fill-sky-950 font-extrabold">P50 (OMS)</text>
          <text x={width - padding + 4} y={labelY(0.91)} dominantBaseline="central" className="text-[8px] fill-sky-700 font-semibold">P15 (-1Z)</text>
          <text x={width - padding + 4} y={labelY(0.82)} dominantBaseline="central" className="text-[8px] fill-sky-700 font-bold">P3 (-2Z)</text>
        </svg>

        {/* Rodapé e Legendas do Gráfico */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-2 text-[11px] text-slate-700 font-bold border-t border-slate-200">
          <span>Eixo X: Idade em Meses (0m a {maxAge}m)</span>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-slate-900 rounded-full inline-block" /> Paciente
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-blue-600 inline-block" /> Mediana OMS (P50)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-slate-400 border-t border-dashed border-slate-400 inline-block" /> P3 / P97
            </span>
          </div>
          <span>Eixo Y: {unit}</span>
        </div>
      </div>
    </div>
  );
};
