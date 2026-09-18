import React, { useState } from 'react';
import {
  Stethoscope,
  Activity,
  FileText,
  Users,
  Shield,
  ArrowRight,
  Brain,
  Calendar,
  ChevronRight,
  Check,
  BarChart2,
  Syringe,
  ClipboardList,
  Zap,
  Lock,
  Building2,
  Star,
  Menu,
  X,
} from 'lucide-react';
import { PpueriBrand } from '../ui/PpueriLogo';

interface LandingPageProps {
  onLogin: () => void;
}

const DOT_GRID_STYLE: React.CSSProperties = {
  backgroundImage: 'radial-gradient(#0284C7 1px, transparent 1px)',
  backgroundSize: '28px 28px',
  opacity: 0.04,
  pointerEvents: 'none',
};

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const primaryBtn =
    'inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 rounded-2xl hover:from-blue-800 hover:via-blue-700 hover:to-sky-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200';
  const secondaryBtn =
    'inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200';

  const navLinks = [
    { label: 'Recursos', href: '#recursos' },
    { label: 'Como Funciona', href: '#como-funciona' },
    { label: 'Planos', href: '#planos' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden font-sans">

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_1px_12px_rgb(0,0,0,0.04)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <PpueriBrand size="md" textColor="dark" iconVariant="light" />

          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onLogin}
              className="px-4 py-2 text-sm font-semibold text-slate-700 rounded-xl hover:bg-slate-100 hover:text-blue-700 transition-all"
            >
              Entrar
            </button>
            <button onClick={onLogin} className={primaryBtn}>
              Começar grátis
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" strokeWidth={1.75} />
            ) : (
              <Menu className="w-5 h-5" strokeWidth={1.75} />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-slate-700 hover:text-blue-600 py-1"
              >
                {l.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <button onClick={onLogin} className="w-full text-sm font-semibold text-slate-700 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
                Entrar
              </button>
              <button onClick={onLogin} className="w-full text-sm font-bold text-white py-2.5 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 hover:from-blue-800 hover:via-blue-700 hover:to-sky-700 shadow-md shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                Começar grátis
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-64px)] flex items-center overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,_var(--tw-gradient-stops))] from-blue-100/60 via-slate-50/70 to-white pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/2 h-3/4 bg-[radial-gradient(ellipse_at_85%_10%,_var(--tw-gradient-stops))] from-sky-100/50 via-transparent to-transparent pointer-events-none" />
        {/* Dot grid */}
        <div className="absolute inset-0" style={DOT_GRID_STYLE} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center w-full">
          {/* Left column */}
          <div className="space-y-8">
            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                Prontuário Pediátrico
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-sky-500 mt-1">
                  Inteligente
                </span>
                para o Pediatra Moderno.
              </h1>
              <p className="text-lg text-slate-500 max-w-lg leading-relaxed">
                Acompanhamento completo do desenvolvimento infantil, curvas OMS/SBP, carteira vacinal digital e portal privativo para os pais — tudo integrado, seguro e em conformidade com CFM e LGPD.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={onLogin} className={primaryBtn}>
                Começar agora
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </button>
              <button onClick={onLogin} className={secondaryBtn}>
                Acesso Demo
                <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-5 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Shield className="w-3.5 h-3.5 text-blue-500" strokeWidth={1.75} />
                Conformidade LGPD
              </div>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Stethoscope className="w-3.5 h-3.5 text-blue-500" strokeWidth={1.75} />
                CFM 1.821/07
              </div>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Zap className="w-3.5 h-3.5 text-blue-500" strokeWidth={1.75} />
                CDSS Pediátrico com IA
              </div>
            </div>
          </div>

          {/* Right column — floating preview cards */}
          <div className="hidden lg:block relative h-[500px]">
            {/* Main dashboard card */}
            <div className="absolute top-6 left-2 right-2 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-5 shadow-[0_20px_60px_rgb(0,0,0,0.09)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Activity className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Lucas Gabriel, 2a 4m</div>
                  <div className="text-[11px] text-slate-500">Puericultura de Rotina · Hoje, 14:30</div>
                </div>
                <span className="ml-auto text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  Eutrófico
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Peso', value: '12,4 kg', z: 'Z +0.3' },
                  { label: 'Estatura', value: '87,2 cm', z: 'Z +0.1' },
                  { label: 'Perímetro', value: '48,1 cm', z: 'Z 0.0' },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 text-center">
                    <div className="text-[10px] text-slate-500 font-medium">{s.label}</div>
                    <div className="text-xs font-extrabold text-slate-900 mt-1">{s.value}</div>
                    <div className="text-[10px] font-bold text-blue-600 mt-0.5">{s.z}</div>
                  </div>
                ))}
              </div>
              {/* Mini chart placeholder */}
              <div className="mt-3 h-14 bg-slate-50/70 border border-slate-100 rounded-xl flex items-end px-3 py-2 gap-1 overflow-hidden">
                {[60, 72, 68, 80, 76, 88, 84, 92, 88, 95, 91, 100].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-blue-400/60 transition-all"
                    style={{ height: `${h * 0.4}px` }}
                  />
                ))}
              </div>
            </div>

            {/* CDSS AI card (dark, bottom-right) */}
            <div className="absolute bottom-4 right-0 w-60 bg-slate-900/97 backdrop-blur-xl text-white rounded-2xl p-4 shadow-2xl border border-blue-500/25">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-blue-400" strokeWidth={1.75} />
                <span className="text-[11px] font-bold text-blue-300 tracking-wide">CDSS Pediátrico</span>
                <span className="ml-auto text-[9px] font-extrabold px-1.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">IA</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Z-score adequado para idade. Sem alertas nutricionais. Próxima consulta: 3 meses.
              </p>
            </div>

            {/* Vaccine card (bottom-left) */}
            <div className="absolute bottom-4 left-0 w-52 bg-white/95 border border-blue-100 rounded-2xl p-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.07)]">
              <div className="flex items-center gap-2 mb-2.5">
                <Syringe className="w-3.5 h-3.5 text-blue-600" strokeWidth={1.75} />
                <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wide">Carteira Vacinal</span>
              </div>
              <div className="space-y-1.5">
                {['BCG', 'Pentavalente D3', 'Pneumocócica 10V', 'Rotavírus G1P8'].map((v) => (
                  <div key={v} className="flex items-center gap-2 text-[10px]">
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" strokeWidth={2.5} />
                    <span className="text-slate-700 font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Como Funciona ─────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 bg-slate-50/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-sm">
              Fluxo Clínico
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Como o Ppueri funciona
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
              Do cadastro do paciente ao relatório dos pais, em três etapas integradas e sem redundância.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: <ClipboardList className="w-6 h-6 text-blue-600" strokeWidth={1.75} />,
                title: 'Cadastro do Paciente',
                desc: 'Crie o prontuário do paciente com dados clínicos, histórico familiar, alergias e gere automaticamente o Código de Acesso para os pais.',
              },
              {
                step: '02',
                icon: <BarChart2 className="w-6 h-6 text-blue-600" strokeWidth={1.75} />,
                title: 'Consulta e Curvas OMS',
                desc: 'Registre a evolução clínica, calcule Z-scores em tempo real, anexe exames com leitura IA e emita prescrições em PDF.',
              },
              {
                step: '03',
                icon: <Users className="w-6 h-6 text-blue-600" strokeWidth={1.75} />,
                title: 'Portal Privativo dos Pais',
                desc: 'Os responsáveis acessam consultas, receitas, gráfico de crescimento e carteira vacinal com consentimento LGPD completo.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl group-hover:bg-blue-100 transition-colors">
                    {item.icon}
                  </div>
                  <span className="text-3xl font-extrabold text-slate-100 select-none">{item.step}</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recursos Bento Grid ───────────────────────────────────────── */}
      <section id="recursos" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0" style={DOT_GRID_STYLE} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-sm">
              Tudo em um só lugar
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Recursos projetados para a Pediatria
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
              Cada módulo foi construído especificamente para o fluxo do pediatra, sem funcionalidades genéricas que atrapalham o atendimento.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
            {/* Large card — spans 2 rows on lg */}
            <div className="lg:row-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="p-3 bg-blue-600 rounded-2xl w-fit mb-5 group-hover:scale-105 transition-transform duration-300">
                  <FileText className="w-6 h-6 text-white" strokeWidth={1.75} />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-3 tracking-tight">Prontuário Eletrônico Pediátrico</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                  Evolução clínica estruturada, imutabilidade CFM 1.821/07 com sistema de adendos, histórico completo de consultas e diagnósticos. Registro de queixa, hipótese diagnóstica, prescrição e orientações em um formulário clínico fluido.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 border-t border-slate-100 pt-4 mt-auto">
                <Lock className="w-3.5 h-3.5" strokeWidth={1.75} />
                Registro imutável conforme CFM
              </div>
            </div>

            {/* Curvas de Crescimento */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 group">
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl w-fit mb-4 group-hover:bg-emerald-100 transition-colors">
                <BarChart2 className="w-5 h-5 text-emerald-600" strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Curvas de Crescimento OMS/SBP</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Gráficos interativos de peso, estatura e perímetro cefálico com Z-scores calculados em tempo real e alertas automáticos de desvio.
              </p>
            </div>

            {/* Leitura IA */}
            <div className="bg-slate-900/97 border border-blue-500/20 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.10)] hover:border-blue-500/40 hover:shadow-blue-500/15 transition-all duration-300 group">
              <div className="p-2.5 bg-blue-500/20 border border-blue-500/30 rounded-xl w-fit mb-4">
                <Brain className="w-5 h-5 text-blue-400" strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-extrabold text-white mb-2">CDSS com IA Pediátrica</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Suporte à decisão clínica: cruzamento de Z-scores, vitais, anamnese e exames para gerar hipóteses diagnósticas e alertas de risco.
              </p>
            </div>

            {/* Carteira Vacinal */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 group">
              <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl w-fit mb-4 group-hover:bg-amber-100 transition-colors">
                <Syringe className="w-5 h-5 text-amber-600" strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Carteira Vacinal Digital</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Calendário vacinal completo (PNI + SBIm), controle de lotes e datas, alertas de vacinas em atraso e acesso pelo portal dos pais.
              </p>
            </div>

            {/* Agenda */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 group">
              <div className="p-2.5 bg-sky-50 border border-sky-100 rounded-xl w-fit mb-4 group-hover:bg-sky-100 transition-colors">
                <Calendar className="w-5 h-5 text-sky-600" strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Agenda Pediátrica</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Gestão de consultas de rotina, retornos, urgências e avaliações de desenvolvimento com calendário mensal interativo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Planos ────────────────────────────────────────────────────── */}
      <section id="planos" className="py-24 bg-slate-50/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-sm">
              Planos e Preços
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Simples, transparente, sem surpresas
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
              Comece gratuitamente. Escale quando precisar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

            {/* Plano Essencial — Gratuito */}
            <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full">
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-slate-500" strokeWidth={1.75} />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Consultório Essencial</span>
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">R$&nbsp;0</span>
                  <span className="text-sm text-slate-500 pb-1.5">/mês</span>
                </div>
                <p className="text-sm text-slate-500">Ideal para testar a plataforma.</p>
              </div>

              <div className="mb-5 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-xs font-bold text-slate-600">Até 10 pacientes cadastrados</span>
              </div>

              <ul className="space-y-3 flex-1 mb-7">
                {[
                  'Prontuário pediátrico básico',
                  'Curvas de crescimento OMS',
                  'Carteira vacinal digital',
                  'Portal básico para os pais',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={onLogin}
                className="w-full py-3 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-slate-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md transition-all duration-200"
              >
                Começar Grátis
              </button>
            </div>

            {/* Plano Pró — R$99 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full">
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Stethoscope className="w-5 h-5 text-blue-500" strokeWidth={1.75} />
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Consultório Pró</span>
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-sm text-slate-500 pb-1.5">R$</span>
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">99</span>
                  <span className="text-sm text-slate-500 pb-1.5">/mês</span>
                </div>
                <p className="text-sm text-slate-500">Para pediatras em fase de expansão.</p>
              </div>

              <div className="mb-5 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                <span className="text-xs font-bold text-blue-700">Até 35 pacientes cadastrados</span>
              </div>

              <ul className="space-y-3 flex-1 mb-7">
                {[
                  'Tudo do Essencial',
                  'CDSS com IA Pediátrica',
                  'Suporte prioritário',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-blue-500 shrink-0" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={onLogin}
                className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 rounded-2xl hover:from-blue-800 hover:via-blue-700 hover:to-sky-700 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Assinar Pró
              </button>
            </div>

            {/* Plano Avançada — Destaque principal */}
            <div className="relative bg-white border-2 border-blue-500/80 rounded-2xl p-7 shadow-[0_8px_40px_rgb(37,99,235,0.12)] flex flex-col h-full overflow-hidden">
              {/* Top accent stripe */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-sky-400 rounded-t-2xl" />

              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold bg-blue-600 text-white uppercase tracking-wider">
                  <Star className="w-3 h-3 fill-white" strokeWidth={0} />
                  Popular
                </span>
              </div>

              <div className="mb-5 mt-1">
                <div className="flex items-center gap-2 mb-3">
                  <Stethoscope className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Clínica Avançada</span>
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-sm text-slate-500 pb-1.5">R$</span>
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">189</span>
                  <span className="text-sm text-slate-500 pb-1.5">/mês</span>
                </div>
                <p className="text-sm text-slate-500">Para alta demanda. Sem limites.</p>
              </div>

              <div className="mb-5 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                <span className="text-xs font-bold text-blue-700">Pacientes ilimitados</span>
              </div>

              <ul className="space-y-3 flex-1 mb-7">
                {[
                  'Tudo do Pró',
                  'Leitura de exames com IA multimodal',
                  'Histórico completo sem restrições',
                  'Backup e exportação completos',
                  'Conformidade CFM 1.821/07',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-700 font-medium">
                    <Check className="w-4 h-4 text-blue-500 shrink-0" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={onLogin}
                className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 rounded-2xl hover:from-blue-800 hover:via-blue-700 hover:to-sky-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Assinar Ilimitado
                <span className="ml-1.5 opacity-70">→</span>
              </button>
            </div>

          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Sem cobrança automática no plano gratuito. Cancele quando quiser.
          </p>
        </div>
      </section>

      {/* ── CTA Final ─────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(#3B82F6 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            opacity: 0.05,
          }}
        />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_80%_30%,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Junte-se a pediatras de todo o Brasil
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Comece a transformar
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300 mt-1">
              sua prática pediátrica hoje.
            </span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">
            Crie sua conta gratuitamente, importe seus pacientes e experimente a plataforma completa. Nenhum dado de cartão necessário para começar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onLogin}
              className="flex items-center gap-2 px-7 py-4 text-sm font-bold text-slate-900 bg-white rounded-2xl hover:bg-slate-100 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
            >
              Criar conta grátis
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </button>
            <button
              onClick={onLogin}
              className="flex items-center gap-2 px-7 py-4 text-sm font-semibold text-white border border-white/20 rounded-2xl hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-200"
            >
              Acesso Demo
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <PpueriBrand size="sm" textColor="white" iconVariant="white" />
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              Plataforma de prontuário eletrônico pediátrico, curvas de crescimento OMS/SBP e portal para responsáveis.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {['CFM 1.821/07', 'LGPD', 'SBP'].map((badge) => (
                <span key={badge} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-4">Plataforma</h4>
            <ul className="space-y-2.5 text-sm">
              {['Prontuário Eletrônico', 'Curvas de Crescimento', 'Carteira Vacinal', 'Portal dos Pais', 'Agenda Pediátrica', 'CDSS com IA'].map((l) => (
                <li key={l}>
                  <button onClick={onLogin} className="hover:text-blue-400 transition-colors text-left">
                    {l}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-4">Legal e Conformidade</h4>
            <ul className="space-y-2.5 text-sm">
              {['Política de Privacidade', 'Termos de Uso', 'TCLE Pediátrico', 'CFM 1.821/07', 'LGPD — Lei 13.709/18'].map((l) => (
                <li key={l}>
                  <span className="hover:text-blue-400 transition-colors cursor-default">{l}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-4">Suporte</h4>
            <ul className="space-y-2.5 text-sm">
              {['Central de Ajuda', 'Fale Conosco', 'Solicitar Demo', 'Novidades'].map((l) => (
                <li key={l}>
                  <span className="hover:text-blue-400 transition-colors cursor-default">{l}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={onLogin}
                className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Stethoscope className="w-3.5 h-3.5" strokeWidth={1.75} />
                Acesso Médico
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 px-4 sm:px-6 lg:px-8 py-5">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <span>© 2025 Ppueri — Prontuário Pediátrico Digital. Todos os direitos reservados.</span>
            <div className="flex items-center gap-3">
              <Shield className="w-3.5 h-3.5 text-slate-600" strokeWidth={1.75} />
              <span>Dados protegidos por criptografia AES-256 e RLS no Supabase</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
