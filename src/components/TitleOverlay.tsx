import React from 'react';
import {
  SURVEY_METHODS_GUIDE,
  SurveyMethodType,
} from '../game/rules';

interface TitleOverlayProps {
  onStartGame: () => void;
  onOpenLogbook: (initialTab?: 'METODE_PRA_SELAM' | 'JENIS_KARANG' | 'IKAN_UVC' | 'LEMBAR_DATA' | 'MISI_CUACA') => void;
  selectedMethod: SurveyMethodType;
  onSelectMethod: (method: SurveyMethodType) => void;
  discoveredCount: number;
  totalSpecies: number;
  bestScore: number;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  onStartGame,
  onOpenLogbook,
  selectedMethod,
  onSelectMethod,
  discoveredCount,
  totalSpecies,
  bestScore,
}) => {
  const activeGuide = SURVEY_METHODS_GUIDE[selectedMethod];

  return (
    <div
      className="fixed inset-0 z-20 flex flex-col justify-between p-6 md:p-12 pointer-events-none"
      style={{
        background:
          'linear-gradient(90deg, rgba(2,14,24,0.95) 0%, rgba(3,18,31,0.86) 46%, rgba(4,20,33,0.22) 78%, rgba(4,20,33,0) 100%)',
      }}
    >
      {/* Main Asymmetric Left-Third Composition over deep-water negative space */}
      <div className="my-auto max-w-xl pointer-events-auto">
        {/* Bespoke Inline SVG Title Emblem & Lockup */}
        <div className="mb-4">
          <svg
            viewBox="0 0 560 160"
            className="w-full max-w-[510px] h-auto drop-shadow-[0_6px_16px_rgba(2,10,18,0.95)]"
            role="img"
            aria-label="Karang Nusantara: Simulasi Pengambilan Data Karang PIT LIT UPT dan Ikan Karang UVC"
          >
            {/* Scientific Quadrat & Coral Crest Emblem on the Left */}
            <g transform="translate(8, 12)">
              <circle cx="56" cy="56" r="50" fill="#062236" stroke="#00E5B8" strokeWidth="2.5" />
              {/* Quadrat Frame Grid Lines */}
              <rect x="24" y="24" width="64" height="64" rx="4" fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="5 3" />
              <line x1="56" y1="24" x2="56" y2="88" stroke="#38BDF8" strokeWidth="1" opacity="0.5" />
              <line x1="24" y1="56" x2="88" y2="56" stroke="#38BDF8" strokeWidth="1" opacity="0.5" />
              {/* Stylized Acropora & Brain Coral inside Quadrat */}
              <path
                d="M36 84 C36 68, 28 58, 30 44 C31 37, 36 37, 37 44 C38 50, 42 54, 45 48 C48 40, 46 28, 52 26 C57 25, 59 34, 57 44 C62 38, 69 32, 73 35 C77 38, 72 48, 65 55 C72 52, 80 49, 82 54 C84 59, 74 66, 65 72 L65 84 Z"
                fill="#FF6B4A"
                stroke="#03101A"
                strokeWidth="2"
              />
              <path
                d="M18 76 Q38 68, 56 76 T94 76 L90 92 Q56 102, 22 92 Z"
                fill="#00E5B8"
                opacity="0.88"
              />
              <circle cx="56" cy="56" r="4" fill="#FACC15" stroke="#03101A" strokeWidth="1.5" />
            </g>

            {/* Main Display Title Lockup */}
            <g transform="translate(130, 42)">
              <text
                x="0"
                y="0"
                fill="#00E5B8"
                fontFamily="Outfit, sans-serif"
                fontSize="13.5"
                fontWeight="700"
                letterSpacing="3"
              >
                SIMULASI MONITORING EKOSISTEM LAUT
              </text>
              <text
                x="0"
                y="42"
                fill="#F0FDFA"
                stroke="#03101A"
                strokeWidth="5"
                style={{ paintOrder: 'stroke fill' }}
                fontFamily="Outfit, sans-serif"
                fontSize="43"
                fontWeight="800"
                letterSpacing="1"
              >
                KARANG
              </text>
              <text
                x="0"
                y="82"
                fill="#38BDF8"
                stroke="#03101A"
                strokeWidth="5"
                style={{ paintOrder: 'stroke fill' }}
                fontFamily="Outfit, sans-serif"
                fontSize="39"
                fontWeight="800"
                letterSpacing="1.5"
              >
                NUSANTARA
              </text>
              <text
                x="2"
                y="108"
                fill="#94A3B8"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="13"
                fontWeight="600"
              >
                Metode Transek PIT · LIT · UPT · Sensus Ikan Karang UVC
              </text>
            </g>
          </svg>
        </div>

        {/* Pre-Dive Method Selector Card */}
        <div className="bg-[#051B2C]/95 border border-[#1B4968] rounded-xl p-4 mb-5 shadow-[0_8px_28px_rgba(0,0,0,0.65)]">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-display font-bold text-[#00E5B8]">
              Pilih Metode Pengambilan Data Pra-Penyelaman:
            </span>
            <span className="text-[11px] font-mono-num text-[#7DD3FC]">
              Transek Pita 50m
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            {(['PIT', 'LIT', 'UPT', 'UVC'] as SurveyMethodType[]).map((mCode) => {
              const isSelected = selectedMethod === mCode;
              return (
                <button
                  key={mCode}
                  type="button"
                  onClick={() => onSelectMethod(mCode)}
                  className={`py-2 px-2.5 rounded-lg text-center font-display font-bold text-xs transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-[#00E5B8] text-[#03141F] border-[#00E5B8]'
                      : 'bg-[#08263C] text-[#CBD5E1] border-[#194361] hover:border-[#38BDF8]'
                  }`}
                >
                  {mCode}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-[#E2F1F8] leading-relaxed">
            <div className="font-display font-bold text-[#38BDF8]">
              {activeGuide.indonesianTitle} ({activeGuide.fullName})
            </div>
            <p className="text-[#CBD5E1] mt-1 text-[12px]">
              {activeGuide.transectSpec}
            </p>
            <div className="mt-2 pt-2 border-t border-[#143750] font-mono-num text-[11px] text-[#FACC15]">
              Rumus: {activeGuide.formulaText}
            </div>
          </div>
        </div>

        {/* Primary & Secondary CTAs (<= 3 menu actions) */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onStartGame();
            }}
            className="px-6 py-3.5 bg-[#00E5B8] hover:bg-[#14F1C6] active:scale-[0.98] text-[#03141F] font-display font-bold text-sm md:text-base rounded-lg shadow-[0_4px_20px_rgba(0,229,184,0.35)] transition-transform cursor-pointer whitespace-nowrap shrink-0"
          >
            Mulai Simulasi Penyelaman
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenLogbook('METODE_PRA_SELAM');
            }}
            className="px-4 py-3.5 bg-[#0A2940] hover:bg-[#103857] text-[#E2F1F8] border border-[#38BDF8]/50 font-display font-semibold text-xs md:text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Briefing Pra-Selam & Jenis Karang / Ikan
          </button>
        </div>

        {bestScore > 0 && (
          <div className="mt-3 text-xs text-[#7DD3FC] font-mono-num hud-stroke-sm">
            Skor Survei Terbaik: {Math.round(bestScore)} PTS · Spesies Ikan UVC Terdata: {discoveredCount}/{totalSpecies}
          </div>
        )}
      </div>

      {/* Bottom Safe Margin Single Flat Control-Hint Line */}
      <div className="w-full flex items-center justify-between text-xs text-[#94A3B8] hud-stroke-sm">
        <span>
          WASD / Panah Berenang · Spasi Ambil Data Transek / Sensus UVC · 1-4 Pilih Metode (PIT/LIT/UPT/UVC) · B Panduan & Lembar Data · Esc Jeda
        </span>
        <span className="hidden sm:inline font-mono-num text-[#38BDF8]">
          Tekan Enter atau Spasi untuk Mulai
        </span>
      </div>
    </div>
  );
};
