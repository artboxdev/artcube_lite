'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { Language, translations } from './translations';

interface StorySectionProps {
  lang: Language;
  onModalToggle?: (open: boolean) => void;
}

export function StorySection({ lang, onModalToggle }: StorySectionProps) {
  const [isNftModalOpen, setIsNftModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [basePath, setBasePath] = useState('');
  const t = translations[lang].story;

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/artcube_lite')) {
      setBasePath('/artcube_lite');
    }
  }, []);

  const openModal = useCallback(() => {
    setIsNftModalOpen(true);
    onModalToggle?.(true);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }, [onModalToggle]);

  const closeModal = useCallback(() => {
    setIsNftModalOpen(false);
    onModalToggle?.(false);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }, [onModalToggle]);

  // Clean up overflow on unmount
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNftModalOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNftModalOpen, closeModal]);

  return (
    <section id="vision" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
        <div className="text-cyan-300 text-[11px] font-bold tracking-[0.22em] uppercase mb-4">
          {t.pill}
        </div>
        <h2 className="font-display text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
          {t.headlineMain} <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#ff80df] via-[#d946ef] to-[#4ee2ec] bg-clip-text text-transparent">
            {t.headlineHighlight}
          </span>
        </h2>
        <p className="mt-5 text-sm sm:text-base text-white/85 font-normal leading-relaxed text-left sm:text-center whitespace-pre-line">
          {t.lead}
        </p>
      </div>

      {/* 2-Columns Side-by-side — offen, ohne Boxen-Umrandung, scharfe Ecken */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-14 items-start">
        
        {/* Phase 1: Der digitale Prototyp (Now Live) */}
        <article className="flex flex-col gap-6 group">
          <div className="relative w-full aspect-video rounded-none overflow-hidden bg-[#0d0714]">
            <img
              src={`${basePath}/artcube_version1_2.jpg`}
              alt={t.card1Title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 block"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.includes('/artcube_lite')) {
                  img.src = '/artcube_lite/artcube_version1_2.jpg';
                }
              }}
            />

            {/* Floating Badges */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-black/75 backdrop-blur-md text-emerald-300 text-[10px] font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 animate-pulse" />
                {t.card1Badge}
              </span>
            </div>
            <div className="absolute top-3 right-3 z-10">
              <span className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-none text-xs font-mono text-pink-300 tracking-wider">
                {t.card1Phase}
              </span>
            </div>
          </div>

          <h3 className="font-display text-xl sm:text-2xl text-white tracking-wide">
            {t.card1Title}
          </h3>

          <ul className="space-y-5">
            <li>
              <h4 className="text-sm sm:text-base font-semibold text-white">{t.card1Item1Title}</h4>
              <p className="text-xs sm:text-sm text-white/75 mt-1 leading-relaxed">
                {t.card1Item1Desc}
              </p>
            </li>

            <li>
              <h4 className="text-sm sm:text-base font-semibold text-white">{t.card1Item2Title}</h4>
              <p className="text-xs sm:text-sm text-white/75 mt-1 leading-relaxed">
                {t.card1Item2Desc}
              </p>
            </li>

            <li>
              <h4 className="text-sm sm:text-base font-semibold text-white">{t.card1Item3Title}</h4>
              <p className="text-xs sm:text-sm text-white/75 mt-1 leading-relaxed">
                {t.card1Item3DescPrefix}{' '}
                <span className="font-extrabold bg-gradient-to-r from-[#ff2a9d] via-[#d946ef] to-[#4ee2ec] bg-clip-text text-transparent">
                  {t.card1Item3Forever}
                </span>{' '}
                {t.card1Item3DescSuffix}{' '}
                <button
                  type="button"
                  onClick={openModal}
                  className="inline-flex items-center font-semibold text-[#4ee2ec] hover:text-[#ff80df] underline underline-offset-4 decoration-[#4ee2ec]/60 hover:decoration-[#ff80df] transition-colors cursor-pointer"
                >
                  <span>{t.card1Item3ModalLink}</span>
                </button>
              </p>
            </li>
          </ul>
        </article>

        {/* Phase 2: Der art.cube */}
        <article className="flex flex-col gap-6 group">
          <div className="relative w-full aspect-video rounded-none overflow-hidden bg-[#06121a]">
            <img
              src={`${basePath}/artcube_version2.jpg`}
              alt={t.card2Title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 block"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.includes('/artcube_lite')) {
                  img.src = '/artcube_lite/artcube_version2.jpg';
                }
              }}
            />

            {/* Floating Badges */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-black/75 backdrop-blur-md text-cyan-300 text-[10px] font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-none bg-cyan-400 animate-ping" />
                {t.card2Badge}
              </span>
            </div>
            <div className="absolute top-3 right-3 z-10">
              <span className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-none text-xs font-mono text-cyan-300 tracking-wider">
                {t.card2Phase}
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display text-xl sm:text-2xl text-white tracking-wide">
              {t.card2Title}
            </h3>
            <span className="text-xs sm:text-sm font-semibold text-cyan-300 tracking-wider">
              {t.card2Loading}
            </span>
          </div>

          {/* Animated Loading Progress Bar */}
          <div className="relative w-full h-1.5 rounded-none bg-white/10 overflow-hidden -mt-2">
            <div className="animate-loading-bar h-full rounded-none bg-gradient-to-r from-pink-500 via-[#ff2a9d] to-[#4ee2ec]" />
          </div>

          <ul className="space-y-5">
            <li>
              <h4 className="text-sm sm:text-base font-semibold text-white">{t.card2Item1Title}</h4>
              <p className="text-xs sm:text-sm text-white/75 mt-1 leading-relaxed">
                {t.card2Item1Desc}
              </p>
            </li>

            <li>
              <h4 className="text-sm sm:text-base font-semibold text-white">{t.card2Item2Title}</h4>
              <p className="text-xs sm:text-sm text-white/75 mt-1 leading-relaxed">
                {t.card2Item2Desc}
              </p>
            </li>

            <li>
              <h4 className="text-sm sm:text-base font-semibold text-white">{t.card2Item3Title}</h4>
              <p className="text-xs sm:text-sm text-white/75 mt-1 leading-relaxed">
                {t.card2Item3Desc}
              </p>
            </li>
          </ul>
        </article>

      </div>

      {/* Lightbox Modal: Wie funktioniert das? (NFT & Blockchain Permanenz) */}
      {mounted && isNftModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/88 backdrop-blur-md animate-in fade-in duration-200"
          onClick={closeModal}
          style={{ touchAction: 'none' }}
          role="dialog"
          aria-modal="true"
          aria-label={t.modal.title}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-none p-7 sm:p-9 bg-[rgba(14,8,22,0.98)] text-left flex flex-col gap-5 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg sm:text-xl text-white tracking-wide">
                  {t.modal.title}
                </h3>
                <span className="text-xs font-mono tracking-wider text-pink-300/80 uppercase block mt-1">
                  {t.modal.subtitle}
                </span>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="w-9 h-9 rounded-none bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
                aria-label={t.modal.closeBtn}
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-white/85 font-normal leading-relaxed">
              <div className="p-4 rounded-none bg-white/[0.04]">
                <strong className="font-semibold text-[#ff80df] block mb-1">{t.modal.item1Title}</strong>
                {t.modal.item1Desc}
              </div>

              <div className="p-4 rounded-none bg-white/[0.04]">
                <strong className="font-semibold text-[#4ee2ec] block mb-1">{t.modal.item2Title}</strong>
                {t.modal.item2Desc}
              </div>

              <div className="p-4 rounded-none bg-white/[0.04]">
                <strong className="font-semibold text-white block mb-1">{t.modal.item3Title}</strong>
                {t.modal.item3Desc}
              </div>
            </div>

            <button
              type="button"
              onClick={closeModal}
              className="w-full py-4 px-6 rounded-none font-bold text-xs tracking-[0.14em] uppercase text-white bg-gradient-to-r from-[#ff2a9d] via-[#d946ef] to-[#4ee2ec] hover:opacity-90 transition-opacity cursor-pointer"
            >
              {t.modal.closeBtn}
            </button>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
