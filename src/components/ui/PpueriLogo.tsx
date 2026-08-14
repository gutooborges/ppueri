import React from 'react';

interface PpueriSymbolProps {
  className?: string;
  size?: number | string;
}

/**
 * Símbolo gráfico oficial Ppueri:
 * A figura abstrata de duas pessoas em tons de azul (adulto/cuidador apoiando e abraçando a criança no colo).
 * Paleta de cores oficial:
 * - Adulto / Cuidador: Azul Marinho Intenso (#173A70 / #0F172A)
 * - Criança: Azul Claro Sereno (#94C1F6 / #7DB4ED)
 */
export const PpueriSymbol: React.FC<PpueriSymbolProps> = ({ className = 'w-full h-full' }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 1. Cabeça do Adulto / Cuidador (Azul Marinho) */}
      <circle cx="33" cy="22" r="12" fill="#173A70" />

      {/* 2. Cabeça da Criança no Colo (Azul Claro Sereno) */}
      <circle cx="65" cy="42" r="9.5" fill="#94C1F6" />

      {/* 3. Corpo e Abraço do Adulto (Azul Marinho) */}
      <path
        d="M 28 35
           C 16 42, 8 56, 8 72
           C 8 86, 15 97, 18 108
           C 20 114, 27 114, 28 108
           C 30 98, 26 88, 22 78
           C 18 68, 19 57, 28 50
           C 36 43, 47 44, 54 53
           C 58 58, 54 64, 46 65
           C 38 66, 30 60, 26 53
           C 24 50, 18 54, 20 60
           C 24 71, 35 76, 46 74
           C 57 72, 64 63, 61 52
           C 57 39, 42 33, 28 35 Z"
        fill="#173A70"
        transform="scale(0.85) translate(4, 2)"
      />

      {/* 4. Corpo e Acolhimento da Criança (Azul Claro Sereno) */}
      <path
        d="M 64 52
           C 60 54, 54 57, 50 62
           C 44 69, 36 73, 28 76
           C 25 77, 24 81, 28 82
           C 38 84, 52 81, 62 72
           C 72 63, 76 53, 72 47
           C 69 44, 66 49, 64 52 Z"
        fill="#94C1F6"
        transform="scale(0.85) translate(4, 2)"
      />
    </svg>
  );
};

interface PpueriAppIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'white' | 'dark';
  className?: string;
}

/**
 * Contêiner quadrado ("quadradinho do app") simulando o ícone de aplicativo nativo.
 */
export const PpueriAppIcon: React.FC<PpueriAppIconProps> = ({
  size = 'md',
  variant = 'white',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 p-1 rounded-lg',
    md: 'w-10 h-10 p-1.5 rounded-xl',
    lg: 'w-14 h-14 p-2.5 rounded-2xl',
    xl: 'w-20 h-20 p-3.5 rounded-3xl',
  };

  const variantClasses = {
    white: 'bg-white border border-sky-100 shadow-sm ring-1 ring-sky-200/50',
    light: 'bg-gradient-to-b from-sky-50 to-sky-100/90 border border-sky-200 shadow-sm',
    dark: 'bg-slate-900 border border-sky-900/80 shadow-md',
  };

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 transition-transform select-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      <PpueriSymbol />
    </div>
  );
};

interface PpueriBrandProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  textColor?: 'dark' | 'white' | 'adaptive';
  iconVariant?: 'light' | 'white' | 'dark';
  showSubtitle?: boolean;
  className?: string;
}

/**
 * Composição completa da marca:
 * - Ícone emoldurado no contêiner quadrado ("quadradinho do app")
 * - Texto "Ppueri" posicionado LOGO AO LADO (à direita) com fonte serifada premium e o pingo do "i" em azul claro.
 */
export const PpueriBrand: React.FC<PpueriBrandProps> = ({
  size = 'md',
  textColor = 'white',
  iconVariant = 'white',
  showSubtitle = false,
  className = '',
}) => {
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl',
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-2.5',
    lg: 'gap-3.5',
    xl: 'gap-4',
  };

  const textColorClasses = {
    white: 'text-white',
    dark: 'text-[#173A70]',
    adaptive: 'text-slate-900 dark:text-white',
  };

  return (
    <div className={`inline-flex items-center ${gapClasses[size]} ${className}`}>
      {/* 1. Quadradinho do App com o Símbolo Gráfico */}
      <PpueriAppIcon size={size} variant={iconVariant} />

      {/* 2. Tipografia "Ppueri" ao lado (Fonte Serifada Elegante com Pingo Azul Claro no 'i') */}
      <div className="flex flex-col">
        <div
          className={`font-serif font-bold tracking-tight select-none leading-none flex items-baseline ${textSizes[size]} ${textColorClasses[textColor]}`}
          style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
        >
          <span>Ppuer</span>
          {/* Letra 'i' com o pingo em azul claro sereno (#94C1F6) */}
          <span className="relative inline-flex items-baseline">
            <span>ı</span>
            <span
              className="absolute -top-[0.24em] left-1/2 -translate-x-1/2 w-[0.26em] h-[0.26em] rounded-full bg-[#94C1F6]"
              aria-hidden="true"
            />
          </span>
        </div>

        {showSubtitle && (
          <span className="text-[10px] uppercase font-sans font-extrabold tracking-wider text-sky-700 mt-1">
            Prontuário Pediátrico
          </span>
        )}
      </div>
    </div>
  );
};
