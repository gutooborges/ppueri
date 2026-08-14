import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share2, PlusSquare, X, Check, Laptop, ShieldCheck } from 'lucide-react';
import { PpueriAppIcon } from './PpueriLogo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPwaBannerProps {
  variant?: 'banner' | 'button' | 'modal';
  onDismiss?: () => void;
}

export const InstallPwaBanner: React.FC<InstallPwaBannerProps> = ({ variant = 'banner' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Verifica se já está rodando como App instalado (Standalone Mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Verifica se o banner já foi dispensado nesta sessão
    const dismissed = sessionStorage.getItem('ppueri_pwa_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    // 3. Detecta iOS / iPadOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Captura o evento nativo de instalação do Chrome / Edge / Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback amigável se o browser não emitiu o prompt nativo
      setShowIOSModal(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setInstalledSuccess(true);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('[Ppueri PWA] Erro ao invocar prompt de instalação:', err);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('ppueri_pwa_banner_dismissed', 'true');
  };

  if (isInstalled && !installedSuccess) {
    return null;
  }

  // Variante: Botão compacto para cabeçalho
  if (variant === 'button') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 border border-cyan-300/40 shrink-0"
          title="Instalar aplicativo Ppueri no seu dispositivo"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Instalar App</span>
        </button>

        {/* Modal de Instruções iOS / Desktop */}
        {showIOSModal && (
          <InstallInstructionsModal onClose={() => setShowIOSModal(false)} isIOS={isIOS} />
        )}
      </>
    );
  }

  if (isDismissed && !showIOSModal) {
    return null;
  }

  return (
    <>
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-sky-800/80 rounded-2xl p-4 shadow-xl mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <PpueriAppIcon size="md" variant="white" className="ring-2 ring-sky-400/40 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white">Instale o Aplicativo Ppueri</h3>
              <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-cyan-400/30">
                PWA
              </span>
            </div>
            <p className="text-xs text-sky-200/80 mt-0.5">
              Acesso instantâneo com suporte offline para médicos no consultório e pais em casa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto">
          <button
            onClick={handleInstallClick}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 border border-cyan-300/40"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Instalar Agora</span>
          </button>

          <button
            onClick={handleDismiss}
            className="p-2 text-sky-300 hover:text-white hover:bg-sky-950 rounded-xl transition-all border border-transparent hover:border-sky-800"
            title="Lembrar mais tarde"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showIOSModal && (
        <InstallInstructionsModal onClose={() => setShowIOSModal(false)} isIOS={isIOS} />
      )}
    </>
  );
};

interface InstallInstructionsModalProps {
  onClose: () => void;
  isIOS: boolean;
}

export const InstallInstructionsModal: React.FC<InstallInstructionsModalProps> = ({ onClose, isIOS }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-sky-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <PpueriAppIcon size="md" variant="white" className="ring-1 ring-sky-200" />
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Instalar Ppueri no Dispositivo</h2>
              <p className="text-xs text-slate-500">Acesso rápido em tela cheia com ícone próprio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center gap-2.5 font-bold text-sky-950">
              <Smartphone className="w-4 h-4 text-sky-700 shrink-0" />
              <span>Instruções para iPhone & iPad (Safari):</span>
            </div>

            <ol className="space-y-2.5 pl-1 text-slate-600 font-medium">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  No navegador <strong>Safari</strong>, toque no botão <strong>Compartilhar</strong> (<Share2 className="w-3.5 h-3.5 inline text-sky-700 mx-0.5" />) na barra inferior.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-sky-700 mx-0.5" />).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Toque em <strong>"Adicionar"</strong> no canto superior direito. O app Ppueri estará disponível na sua tela inicial.
                </span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center gap-2.5 font-bold text-sky-950">
              <Laptop className="w-4 h-4 text-sky-700 shrink-0" />
              <span>Instruções para Android, Windows, Mac ou Linux:</span>
            </div>

            <ol className="space-y-2.5 pl-1 text-slate-600 font-medium">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  No Chrome ou Edge, clique no ícone de <strong>Instalar</strong> (<Download className="w-3.5 h-3.5 inline text-sky-700 mx-0.5" />) na barra de endereços (lado direito).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Confirme em <strong>"Instalar"</strong> para abrir o Ppueri em janela nativa dedicada sem barras do navegador.
                </span>
              </li>
            </ol>
          </div>
        )}

        <div className="pt-2 border-t border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-700" />
            <span>Sem necessidade de loja de aplicativos</span>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};
