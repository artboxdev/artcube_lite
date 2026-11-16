'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { LuBox } from 'react-icons/lu';
import { PiX } from 'react-icons/pi';
import { Language, translations } from './translations';

interface OnepagerFooterProps {
  lang: Language;
  onScrollToTop: () => void;
  onModalToggle?: (open: boolean) => void;
}

export function OnepagerFooter({ lang, onScrollToTop, onModalToggle }: OnepagerFooterProps) {
  const [legalModal, setLegalModal] = useState<'impressum' | 'datenschutz' | null>(null);
  const [mounted, setMounted] = useState(false);
  const t = translations[lang].footer;

  useEffect(() => {
    setMounted(true);
  }, []);

  const openLegalModal = useCallback((type: 'impressum' | 'datenschutz') => {
    setLegalModal(type);
    onModalToggle?.(true);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }, [onModalToggle]);

  const closeLegalModal = useCallback(() => {
    setLegalModal(null);
    onModalToggle?.(false);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }, [onModalToggle]);

  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && legalModal !== null) {
        closeLegalModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [legalModal, closeLegalModal]);

  return (
    <footer className="relative bg-[rgba(10,5,16,0.86)] backdrop-blur-xl py-12 px-4 sm:px-6 lg:px-8 mt-12 text-white/75">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Brand & Claim */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-none bg-gradient-to-br from-[#ff2a9d] to-[#7928ca] flex items-center justify-center">
              <LuBox className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-sm tracking-[0.2em] text-white">
              ART<span className="text-[#ff2a9d]">.</span>CUBE
            </span>
          </div>
          <p className="text-xs text-white/55 tracking-wider">
            {t.claim}
          </p>
        </div>

        {/* Links & Contact */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium">
          <a
            href="mailto:contact@artcube.space"
            className="flex items-center gap-1.5 text-white/80 hover:text-[#ff80df] transition-colors"
          >
            <span>{t.contact}</span>
          </a>

          <button
            type="button"
            onClick={() => openLegalModal('impressum')}
            className="flex items-center gap-1.5 text-white/80 hover:text-[#ff80df] transition-colors cursor-pointer"
          >
            <span>{t.imprint}</span>
          </button>

          <button
            type="button"
            onClick={() => openLegalModal('datenschutz')}
            className="flex items-center gap-1.5 text-white/80 hover:text-[#ff80df] transition-colors cursor-pointer"
          >
            <span>{t.privacy}</span>
          </button>

          <button
            type="button"
            onClick={onScrollToTop}
            className="flex items-center gap-1.5 text-pink-300 hover:text-white px-3.5 py-1.5 rounded-none bg-white/[0.06] hover:bg-white/[0.12] transition-colors cursor-pointer"
          >
            <span>{t.backToTop}</span>
          </button>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 text-center text-[11px] text-white/45 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>{t.copyright}</span>
        <span>{t.tagline}</span>
      </div>

      {/* Lightweight Legal Notice Modal (Impressum & Datenschutz) via Portal */}
      {mounted && legalModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={closeLegalModal}
          style={{ touchAction: 'none' }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-none p-7 sm:p-9 bg-[rgba(14,8,22,0.98)] text-left my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeLegalModal}
              className="absolute top-5 right-5 p-2 rounded-none bg-white/10 text-white/75 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              aria-label={t.closeBtn}
            >
              <PiX className="w-5 h-5" />
            </button>

            {legalModal === 'impressum' ? (
              <div className="space-y-4">
                <h3 className="font-display text-lg sm:text-xl text-white tracking-wide uppercase pr-8">
                  {t.imprintModal.title}
                </h3>
                <div className="text-xs sm:text-sm text-white/80 space-y-3 leading-relaxed">
                  <p className="font-semibold text-white">{t.imprintModal.company}</p>
                  <p>
                    <span className="text-white/55">{t.imprintModal.repTitle}</span><br />
                    {t.imprintModal.repContent}
                  </p>
                  <p>
                    <span className="text-white/55">{t.imprintModal.contactTitle}</span><br />
                    {t.imprintModal.contactContent}
                  </p>
                  <div className="pt-2">
                    <span className="font-semibold text-white block mb-1">{t.imprintModal.disclaimerTitle}</span>
                    <p className="text-xs text-white/65">
                      {t.imprintModal.disclaimerContent}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-display text-lg sm:text-xl text-white tracking-wide uppercase pr-8">
                  {t.privacyModal.title}
                </h3>
                <div className="text-xs sm:text-sm text-white/80 space-y-3 leading-relaxed">
                  <div>
                    <h4 className="font-semibold text-white mb-1">{t.privacyModal.sec1Title}</h4>
                    <p className="text-xs text-white/65">
                      {t.privacyModal.sec1Content}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{t.privacyModal.sec2Title}</h4>
                    <p className="text-xs text-white/65">
                      {t.privacyModal.sec2Content}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{t.privacyModal.sec3Title}</h4>
                    <p className="text-xs text-white/65">
                      {t.privacyModal.sec3Content}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={closeLegalModal}
              className="w-full mt-7 py-3.5 rounded-none bg-white/10 hover:bg-white/15 text-xs font-semibold uppercase tracking-wider text-white transition-colors cursor-pointer"
            >
              {t.closeBtn}
            </button>
          </div>
        </div>,
        document.body
      )}
    </footer>
  );
}
