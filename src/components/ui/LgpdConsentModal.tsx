import React, { useState } from 'react';
import { Shield, Lock, FileText, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';

interface LgpdConsentModalProps {
  patientName: string;
  onAccept: (guardianName: string, guardianCpf: string) => Promise<void>;
}

const TCLE_VERSION = '1.0';

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3}\.\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3}\.\d{3}\.\d{3})(\d)/, '$1-$2');
}

export const LgpdConsentModal: React.FC<LgpdConsentModalProps> = ({ patientName, onAccept }) => {
  const [activeSection, setActiveSection] = useState<'tcle' | 'privacy'>('tcle');
  const [guardianName, setGuardianName] = useState('');
  const [guardianCpf, setGuardianCpf] = useState('');
  const [tcleAccepted, setTcleAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const cpfDigits = guardianCpf.replace(/\D/g, '');
  const isFormValid =
    guardianName.trim().length >= 5 &&
    cpfDigits.length === 11 &&
    tcleAccepted &&
    privacyAccepted;

  const handleSubmit = async () => {
    if (!isFormValid || submitting) return;
    setSubmitting(true);
    await onAccept(guardianName.trim(), guardianCpf);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-start justify-center overflow-y-auto p-4 py-8">
      <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-sky-900/60 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 to-[#0F172A] p-6 border-b border-sky-900/40">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-sky-500/15 rounded-2xl border border-sky-500/25 shrink-0">
              <Shield className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Consentimento Formal Obrigatorio — LGPD
              </h2>
              <p className="text-xs text-sky-400 font-semibold mt-0.5">
                Portal do Responsavel Legal · Ppueri Prontuario Pediatrico
              </p>
              <p className="text-xs text-sky-200/75 mt-2.5 leading-relaxed">
                Para acessar os dados de saude de{' '}
                <strong className="text-white">{patientName}</strong>, e necessario o
                consentimento formal do responsavel legal, conforme a{' '}
                <strong className="text-sky-300">Lei n. 13.709/2018 (LGPD)</strong> e a{' '}
                <strong className="text-sky-300">Resolucao CFM n. 1.821/07</strong>.
                Este aceite e registrado com carimbo de data, hora e identificacao do
                responsavel na trilha de auditoria do sistema.
              </p>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-sky-900/40 bg-slate-900/60">
          <button
            onClick={() => setActiveSection('tcle')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors border-b-2 ${
              activeSection === 'tcle'
                ? 'text-sky-300 border-sky-400 bg-sky-950/30'
                : 'text-sky-600 border-transparent hover:text-sky-400 hover:bg-sky-950/10'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            TCLE Pediatrico
            {tcleAccepted && <CheckCircle2 className="w-3 h-3 text-sky-400" />}
          </button>
          <button
            onClick={() => setActiveSection('privacy')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors border-b-2 ${
              activeSection === 'privacy'
                ? 'text-sky-300 border-sky-400 bg-sky-950/30'
                : 'text-sky-600 border-transparent hover:text-sky-400 hover:bg-sky-950/10'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Politica de Privacidade
            {privacyAccepted && <CheckCircle2 className="w-3 h-3 text-sky-400" />}
          </button>
        </div>

        {/* TCLE Content */}
        {activeSection === 'tcle' && (
          <div className="p-5 max-h-64 overflow-y-auto space-y-3.5 text-xs text-sky-100/80 leading-relaxed">
            <h3 className="text-sm font-extrabold text-white leading-tight">
              Termo de Consentimento Livre e Esclarecido —{' '}
              Tratamento de Dados Sensiveis de Saude Pediatrica
            </h3>
            <p className="text-[10px] text-sky-500 font-semibold uppercase tracking-wider">
              Versao {TCLE_VERSION} · Lei n. 13.709/2018 (LGPD) · CFM n. 1.821/07
            </p>

            <div className="space-y-3">
              <div>
                <p className="font-bold text-sky-300 mb-0.5">1. Controlador de Dados</p>
                <p>
                  Este servico e operado pela clinica responsavel pelo prontuario eletronico
                  Ppueri, na condicao de controlador de dados pessoais sensiveis, nos termos do
                  Art. 5°, X, da LGPD.
                </p>
              </div>
              <div>
                <p className="font-bold text-sky-300 mb-0.5">2. Dados Coletados e Finalidade</p>
                <p>
                  Sao tratados dados de saude do menor de idade, incluindo: anamnese, dados
                  antropometricos (peso, estatura, perimetro cefalico), sinais vitais, historico
                  vacinal, prescricoes medicas, laudos de exames complementares e imagens
                  diagnosticas. O tratamento tem finalidade exclusivamente terapeutica, de
                  prevencao de doencas e de continuidade assistencial (Art. 11, II, "f", LGPD).
                </p>
              </div>
              <div>
                <p className="font-bold text-sky-300 mb-0.5">3. Base Legal</p>
                <p>
                  O tratamento de dados sensiveis de saude de menores e realizado com fundamento
                  no Art. 11, II, "f", da LGPD (prestacao de servicos de saude) e no Art. 14
                  (protecao de dados de criancas e adolescentes), com consentimento especifico e
                  destacado do responsavel legal.
                </p>
              </div>
              <div>
                <p className="font-bold text-sky-300 mb-0.5">4. Direitos do Titular</p>
                <p>
                  O responsavel legal pode exercer os direitos de confirmacao de tratamento,
                  acesso, correcao, portabilidade, revogacao do consentimento e eliminacao dos
                  dados, mediante solicitacao formal ao medico responsavel, conforme Art. 18 da LGPD.
                </p>
              </div>
              <div>
                <p className="font-bold text-sky-300 mb-0.5">5. Seguranca e Sigilo</p>
                <p>
                  Os dados sao armazenados com criptografia em repouso e em transito, acesso
                  restrito por autenticacao e controle de permissoes por perfil, em conformidade
                  com os principios do Art. 6° da LGPD e com a Resolucao CFM n. 1.821/07
                  (sigilo e imutabilidade do prontuario eletronico). Todos os acessos sao
                  registrados automaticamente na trilha de auditoria.
                </p>
              </div>
              <div>
                <p className="font-bold text-sky-300 mb-0.5">6. Prazo de Retencao</p>
                <p>
                  Os dados do prontuario serao mantidos pelo prazo minimo de 20 anos a contar
                  do ultimo atendimento, conforme Art. 8° da Resolucao CFM n. 1.821/07, podendo
                  ser estendido por determinacao legal ou regulatoria.
                </p>
              </div>
            </div>

            {/* Checkbox TCLE */}
            <div className="mt-4 flex items-start gap-2.5 p-3 bg-sky-950/40 border border-sky-800/50 rounded-xl">
              <input
                type="checkbox"
                id="tcle-check"
                checked={tcleAccepted}
                onChange={(e) => setTcleAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-sky-600 accent-sky-500 cursor-pointer shrink-0"
              />
              <label htmlFor="tcle-check" className="text-xs text-sky-200 font-semibold cursor-pointer leading-relaxed">
                Li e compreendi o TCLE e autorizo o tratamento dos dados de saude do menor
                sob minha responsabilidade legal para fins exclusivamente assistenciais.
              </label>
            </div>

            {!tcleAccepted && (
              <button
                onClick={() => { setTcleAccepted(true); setActiveSection('privacy'); }}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 py-2 transition-colors"
              >
                Aceitar e ir para Politica de Privacidade
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Privacy Policy Content */}
        {activeSection === 'privacy' && (
          <div className="p-5 max-h-64 overflow-y-auto space-y-3.5 text-xs text-sky-100/80 leading-relaxed">
            <h3 className="text-sm font-extrabold text-white leading-tight">
              Politica de Privacidade e Tratamento de Dados — Ppueri Prontuario Pediatrico
            </h3>
            <p className="text-[10px] text-sky-500 font-semibold uppercase tracking-wider">
              Versao {TCLE_VERSION} · Lei n. 13.709/2018 (LGPD)
            </p>

            <div className="space-y-3">
              <div>
                <p className="font-bold text-sky-300 mb-0.5">1. Coleta de Dados</p>
                <p>
                  Coletamos apenas os dados estritamente necessarios para a prestacao do servico
                  de prontuario eletronico pediatrico, incluindo dados de identificacao do
                  paciente e do responsavel legal, e dados clinicos de saude (principio da
                  minimizacao de dados, Art. 6°, III, LGPD).
                </p>
              </div>
              <div>
                <p className="font-bold text-sky-300 mb-0.5">2. Compartilhamento</p>
                <p>
                  Os dados nao sao compartilhados com terceiros sem consentimento expresso, exceto
                  quando exigido por lei (autoridades de saude publica, determinacoes judiciais).
                  O compartilhamento entre profissionais de saude e permitido exclusivamente no
                  ambito da equipe assistencial responsavel pelo cuidado do paciente.
                </p>
              </div>
              <div>
                <p className="font-bold text-sky-300 mb-0.5">3. Autenticacao e Auditoria</p>
                <p>
                  Utilizamos tokens de sessao seguros para autenticacao. Todos os acessos ao
                  prontuario sao registrados automaticamente na trilha de auditoria do sistema
                  (usuario, paciente, acao, data e hora exata), conforme exigido pela Resolucao
                  CFM n. 1.821/07.
                </p>
              </div>
              <div>
                <p className="font-bold text-sky-300 mb-0.5">4. Acesso do Responsavel Legal</p>
                <p>
                  O responsavel legal tem acesso ao prontuario do menor por meio de codigo de
                  acesso exclusivo fornecido pelo medico. Este acesso e individual, intransferivel
                  e cada utilizacao e registrada na trilha de auditoria.
                </p>
              </div>
              <div>
                <p className="font-bold text-sky-300 mb-0.5">5. Imutabilidade do Prontuario</p>
                <p>
                  Em conformidade com a Resolucao CFM n. 1.821/07, os registros clinicos
                  finalizados nao podem ser alterados. Correcoes sao feitas exclusivamente por
                  meio de adendos clinicos datados e assinados, preservando o historico original.
                </p>
              </div>
              <div>
                <p className="font-bold text-sky-300 mb-0.5">6. Alteracoes nesta Politica</p>
                <p>
                  Alteracoes significativas serao comunicadas ao responsavel legal, sendo
                  necessario novo consentimento para continuidade do acesso ao portal.
                </p>
              </div>
            </div>

            {/* Checkbox Privacy */}
            <div className="mt-4 flex items-start gap-2.5 p-3 bg-sky-950/40 border border-sky-800/50 rounded-xl">
              <input
                type="checkbox"
                id="privacy-check"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-sky-600 accent-sky-500 cursor-pointer shrink-0"
              />
              <label htmlFor="privacy-check" className="text-xs text-sky-200 font-semibold cursor-pointer leading-relaxed">
                Li e aceito a Politica de Privacidade e Tratamento de Dados do Ppueri.
              </label>
            </div>
          </div>
        )}

        {/* Form Fields & Submit */}
        <div className="p-5 border-t border-sky-900/40 space-y-4 bg-slate-950/40">
          {/* Status indicators */}
          <div className="grid grid-cols-2 gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-colors ${
                tcleAccepted
                  ? 'bg-sky-900/50 text-sky-300 border border-sky-700/50'
                  : 'bg-slate-800 text-sky-600 border border-slate-700'
              }`}
            >
              {tcleAccepted
                ? <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
              TCLE Pediatrico
            </div>
            <div
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-colors ${
                privacyAccepted
                  ? 'bg-sky-900/50 text-sky-300 border border-sky-700/50'
                  : 'bg-slate-800 text-sky-600 border border-slate-700'
              }`}
            >
              {privacyAccepted
                ? <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
              Politica de Privacidade
            </div>
          </div>

          {/* Guardian identification */}
          <div>
            <p className="text-[10px] text-sky-500 uppercase tracking-wider font-bold mb-2">
              Identificacao do Responsavel Legal *
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-sky-300 font-semibold mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="Nome conforme documento oficial"
                  autoComplete="name"
                  className="w-full bg-slate-800 border border-sky-800/50 text-white text-xs px-3 py-2.5 rounded-xl placeholder-sky-700/70 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-sky-300 font-semibold mb-1">
                  CPF do Responsavel
                </label>
                <input
                  type="text"
                  value={guardianCpf}
                  onChange={(e) => setGuardianCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  inputMode="numeric"
                  autoComplete="off"
                  className="w-full bg-slate-800 border border-sky-800/50 text-white text-xs px-3 py-2.5 rounded-xl placeholder-sky-700/70 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-colors font-mono tracking-wide"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isFormValid || submitting}
            className="w-full bg-[#1E3A8A] hover:bg-sky-700 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-extrabold py-3.5 rounded-xl transition-all shadow-sm disabled:cursor-not-allowed border border-sky-600/30 disabled:border-slate-600/30"
          >
            {submitting
              ? 'Registrando Consentimento...'
              : 'Confirmar Aceite Formal e Acessar Portal'}
          </button>

          <p className="text-[10px] text-sky-700 text-center leading-relaxed">
            Este aceite e registrado com data, hora exata e identificacao do responsavel legal,
            constituindo prova de consentimento conforme a Lei n. 13.709/2018 (LGPD) e a
            Resolucao CFM n. 1.821/07. O acesso ao prontuario sem consentimento e vedado.
          </p>
        </div>
      </div>
    </div>
  );
};
