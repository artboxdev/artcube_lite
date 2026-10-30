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
  const t = translations[lang].story;

  useEffect(() => {
    setMounted(true);
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
    <section id="vision" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-[11px] font-bold tracking-[0.2em] uppercase mb-4">
          {t.pill}
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
          {t.headlineMain} <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
            {t.headlineHighlight}
          </span>
        </h2>
        <p className="mt-4 text-sm sm:text-base text-white/80 font-light leading-relaxed">
          {t.lead}
        </p>
      </div>

      {/* 2-Columns Side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        
        {/* Card 1: Der digitale Prototyp (Now Live) */}
        <div className="relative rounded-[32px] p-7 sm:p-10 bg-[rgba(18,12,28,0.85)] border border-pink-500/30 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(255,42,157,0.15)] flex flex-col justify-between overflow-hidden group hover:border-pink-500/60 transition-all duration-300">
          <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-3 mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t.card1Badge}
              </span>
              <span className="text-xs font-mono text-pink-300/60 tracking-wider">{t.card1Phase}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide mb-6">
              {t.card1Title}
            </h3>

            <ul className="space-y-5">
              <li>
                <div>
                  <h4 className="text-sm font-semibold text-white">{t.card1Item1Title}</h4>
                  <p className="text-xs text-white/70 mt-1 leading-relaxed">
                    {t.card1Item1Desc}
                  </p>
                </div>
              </li>

              <li>
                <div>
                  <h4 className="text-sm font-semibold text-white">{t.card1Item2Title}</h4>
                  <p className="text-xs text-white/70 mt-1 leading-relaxed">
                    {t.card1Item2Desc}
                  </p>
                </div>
              </li>

              <li>
                <div>
                  <h4 className="text-sm font-semibold text-white">{t.card1Item3Title}</h4>
                  <p className="text-xs text-white/70 mt-1 leading-relaxed">
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
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Card 2: Der art.cube. Loading... */}
        <div className="relative rounded-[32px] p-7 sm:p-10 bg-[rgba(18,12,28,0.85)] border border-cyan-500/30 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(78,226,236,0.15)] flex flex-col justify-between overflow-hidden group hover:border-cyan-500/60 transition-all duration-300">
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-3 mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                {t.card2Badge}
              </span>
              <span className="text-xs font-mono text-cyan-300/60 tracking-wider">{t.card2Phase}</span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                {t.card2Title}
              </h3>
              <span className="text-sm sm:text-base font-semibold text-cyan-300 tracking-wider">
                {t.card2Loading}
              </span>
            </div>

            {/* Animated Loading Progress Bar */}
            <div className="relative w-full h-2 rounded-full bg-white/10 overflow-hidden mb-6">
              <div className="animate-loading-bar h-full rounded-full bg-gradient-to-r from-pink-500 via-[#ff2a9d] to-[#4ee2ec] shadow-[0_0_12px_rgba(78,226,236,0.8)]" />
            </div>

            <ul className="space-y-5">
              <li>
                <div>
                  <h4 className="text-sm font-semibold text-white">{t.card2Item1Title}</h4>
                  <p className="text-xs text-white/70 mt-1 leading-relaxed">
                    {t.card2Item1Desc}
                  </p>
                </div>
              </li>

              <li>
                <div>
                  <h4 className="text-sm font-semibold text-white">{t.card2Item2Title}</h4>
                  <p className="text-xs text-white/70 mt-1 leading-relaxed">
                    {t.card2Item2Desc}
                  </p>
                </div>
              </li>

              <li>
                <div>
                  <h4 className="text-sm font-semibold text-white">{t.card2Item3Title}</h4>
                  <p className="text-xs text-white/70 mt-1 leading-relaxed">
                    {t.card2Item3Desc}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* Lightbox Modal: Wie funktioniert das? (NFT & Blockchain Permanenz)
          Rendered via React Portal directly into document.body to guarantee viewport positioning and prevent scroll leaking */}
      {mounted && isNftModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={closeModal}
          style={{ touchAction: 'none' }}
          role="dialog"
          aria-modal="true"
          aria-label={t.modal.title}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 bg-[rgba(18,12,28,0.98)] border border-pink-500/50 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(255,42,157,0.35)] text-left flex flex-col gap-5 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-wide">
                  {t.modal.title}
                </h3>
                <span className="text-[11px] font-mono tracking-wider text-pink-300/70 uppercase">
                  {t.modal.subtitle}
                </span>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                aria-label={t.modal.closeBtn}
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-white/80 font-light leading-relaxed">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                <strong className="font-semibold text-white block mb-0.5">{t.modal.item1Title}</strong>
                {t.modal.item1Desc}
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                <strong className="font-semibold text-white block mb-0.5">{t.modal.item2Title}</strong>
                {t.modal.item2Desc}
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                <strong className="font-semibold text-white block mb-0.5">{t.modal.item3Title}</strong>
                {t.modal.item3Desc}
              </div>
            </div>

            <button
              type="button"
              onClick={closeModal}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-[#ff2a9d] via-[#d946ef] to-[#06b6d4] shadow-[0_10px_25px_rgba(255,42,157,0.4)] hover:shadow-[0_12px_30px_rgba(78,226,236,0.6)] hover:scale-[1.01] transition-all duration-300 cursor-pointer"
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
