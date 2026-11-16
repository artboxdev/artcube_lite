'use client';

import { Language, translations } from './translations';

interface HeroSectionProps {
  lang: Language;
  onNavigateTo: (id: string) => void;
}

export function HeroSection({ lang, onNavigateTo }: HeroSectionProps) {
  const t = translations[lang].hero;

  return (
    <section id="top" className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-6 sm:px-8 lg:px-12 py-20 sm:py-28 text-center">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-7 sm:gap-9">
        {/* Main Headline */}
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] uppercase tracking-[0.04em] text-white leading-[1.02] drop-shadow-[0_8px_30px_rgba(0,0,0,0.75)]">
          art<span className="text-[#ff2a9d]">.</span>cube
        </h1>

        {/* Lead Text */}
        <p className="max-w-[54ch] text-base sm:text-xl text-white/90 font-normal leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] whitespace-pre-line">
          {t.lead}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 mt-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onNavigateTo('erleben')}
            className="w-full sm:w-auto px-8 py-4 rounded-none font-bold text-xs tracking-[0.14em] uppercase text-white bg-gradient-to-r from-[#ff2a9d] via-[#d946ef] to-[#4ee2ec] hover:opacity-90 transition-opacity flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>{t.btnPrimary}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTo('vision')}
            className="w-full sm:w-auto px-8 py-4 rounded-none font-semibold text-xs tracking-[0.14em] uppercase text-white/95 bg-white/[0.07] backdrop-blur-md hover:bg-white/[0.14] hover:text-[#ff80df] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t.btnSecondary}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
