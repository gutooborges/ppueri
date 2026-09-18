import React, { useState } from 'react';
import { X, MessageCircle, Mail, Copy, CheckCheck, Send } from 'lucide-react';

interface AccessCodeShareModalProps {
  isOpen: boolean;
  patientName: string;
  accessCode: string;
  initialPhone?: string;
  onClose: () => void;
}

export const AccessCodeShareModal: React.FC<AccessCodeShareModalProps> = ({
  isOpen,
  patientName,
  accessCode,
  initialPhone = '',
  onClose,
}) => {
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  if (!isOpen) return null;

  const portalUrl = window.location.origin;
  const whatsappMessage =
    `Ola! O prontuario do(a) ${patientName} foi criado na plataforma Ppueri. ` +
    `Para acompanhar o historico de consultas, vacinas e orientacoes medicas, acesse: ${portalUrl} ` +
    `e utilize o Codigo de Acesso: ${accessCode}.`;

  const handleWhatsApp = () => {
    const cleaned = phone.replace(/\D/g, '');
    const url = `https://wa.me/55${cleaned}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = async () => {
    const text =
      `Codigo de Acesso — ${patientName}\n\nPortal Ppueri: ${portalUrl}\nCodigo: ${accessCode}\n\n${whatsappMessage}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleSendEmail = async () => {
    if (!email.trim()) return;
    setEmailSending(true);
    setEmailError(null);
    try {
      const res = await fetch('/api/send-access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), patientName, accessCode, portalUrl }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setEmailError(
          (data as { error?: string }).error ||
          'Falha ao enviar o e-mail. Tente novamente.'
        );
      } else {
        setEmailSent(true);
      }
    } catch {
      setEmailError('Erro de rede. Verifique sua conexao e tente novamente.');
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white/85 backdrop-blur-sm border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-sm font-extrabold text-slate-900">Prontuario Criado com Sucesso</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Compartilhe o codigo de acesso com os responsaveis
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X strokeWidth={1.75} className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Access Code display */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-xl text-center">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">Paciente</p>
            <p className="text-base font-extrabold text-slate-900 mb-3">{patientName}</p>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Codigo de Acesso
            </p>
            <p className="text-2xl font-extrabold text-blue-600 font-mono tracking-widest">
              {accessCode}
            </p>
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-700">Enviar via WhatsApp</p>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="(11) 99999-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 placeholder-slate-400 transition-colors"
              />
              <button
                onClick={handleWhatsApp}
                disabled={!phone.replace(/\D/g, '')}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#1ebe59] disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-all active:scale-95"
              >
                <MessageCircle strokeWidth={1.75} className="w-4 h-4" />
                Enviar
              </button>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-700">Enviar por E-mail</p>
            {emailSent ? (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium flex items-center gap-2">
                <CheckCheck strokeWidth={1.75} className="w-4 h-4 text-blue-600 shrink-0" />
                E-mail enviado com sucesso.
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="email@responsavel.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 placeholder-slate-400 transition-colors"
                  />
                  <button
                    onClick={handleSendEmail}
                    disabled={!email.trim() || emailSending}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
                  >
                    <Send strokeWidth={1.75} className="w-4 h-4" />
                    {emailSending ? '...' : 'Enviar'}
                  </button>
                </div>
                {emailError && (
                  <p className="text-[11px] text-red-700 font-medium">{emailError}</p>
                )}
              </>
            )}
          </div>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-98 ${
              copied
                ? 'bg-slate-50 border-blue-400 text-blue-600'
                : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400 hover:text-blue-600'
            }`}
          >
            {copied ? <CheckCheck strokeWidth={1.75} className="w-4 h-4" /> : <Copy strokeWidth={1.75} className="w-4 h-4" />}
            {copied ? 'Copiado!' : 'Copiar Codigo e Link'}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors border-t border-slate-100 pt-3"
          >
            Fechar e ir para o Prontuario
          </button>
        </div>
      </div>
    </div>
  );
};
