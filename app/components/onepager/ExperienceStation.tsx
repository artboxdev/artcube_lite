'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { Language, translations } from './translations';
import { SakuraverseDualSlider } from './SakuraverseDualSlider';

interface ExperienceStationProps {
  lang: Language;
  myName: string;
  onNameChange: (name: string) => void;
  isHost: boolean;
  sessionId: string;
  isJoined: boolean;
  onJoin: () => void;
  onStart: (artwork: 'bluten' | 'plexus', mode: 'test' | 'souvenir') => void;
  showToast: (msg: string) => void;
  onModalToggle?: (open: boolean) => void;
}

export function ExperienceStation({
  lang,
  myName,
  onNameChange,
  isHost,
  sessionId,
  isJoined,
  onJoin,
  onStart,
  showToast,
  onModalToggle,
}: ExperienceStationProps) {
  const [activeMode, setActiveMode] = useState<'test' | 'souvenir'>('test');
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isArtworksModalOpen, setIsArtworksModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sumieImgSrc, setSumieImgSrc] = useState('/sumie-lightbox.jpg');
  const t = translations[lang].experience;

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/artcube_lite')) {
      setSumieImgSrc('/artcube_lite/sumie-lightbox.jpg');
    }
  }, []);

  const openArtworksModal = useCallback(() => {
    setIsArtworksModalOpen(true);
    onModalToggle?.(true);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }, [onModalToggle]);

  const closeArtworksModal = useCallback(() => {
    setIsArtworksModalOpen(false);
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
      if (e.key === 'Escape' && isArtworksModalOpen) {
        closeArtworksModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isArtworksModalOpen, closeArtworksModal]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.href.split('?')[0];
      setShareUrl(`${baseUrl}?sid=${sessionId}`);
    }
  }, [sessionId]);

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      showToast(t.toastCopied);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      prompt(t.copyBtn + ':', shareUrl);
    }
  }, [shareUrl, showToast, t.toastCopied, t.copyBtn]);

  const handleStartArtwork = (modeToStart: 'test' | 'souvenir', artworkToStart: 'bluten' | 'plexus' = 'bluten') => {
    setActiveMode(modeToStart);
    const fallbackName = isHost ? t.hostStatus : t.guestStatus;
    const finalName = myName.trim() || fallbackName;
    if (!myName.trim()) {
      onNameChange(finalName);
    }
    onStart(artworkToStart, modeToStart);
  };

  const handleGuestJoin = () => {
    const finalName = myName.trim() || t.guestStatus;
    if (!myName.trim()) {
      onNameChange(finalName);
    }
    onJoin();
    showToast(t.toastJoined);
  };

  return (
    <section id="erleben" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      
      {/* Glow Center Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[700px] h-[350px] sm:h-[700px] bg-gradient-to-tr from-[#ff2a9d]/20 via-[#7928ca]/20 to-[#4ee2ec]/20 blur-[110px] pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-300 text-[11px] font-bold tracking-[0.2em] uppercase mb-4">
          {t.pill}
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          {t.titlePrefix}{' '}
          <span className="bg-gradient-to-r from-[#ff80df] via-[#ff2a9d] to-[#4ee2ec] bg-clip-text text-transparent">
            {t.titleHighlight}
          </span>
        </h2>
        <p className="mt-4 text-sm sm:text-base text-white/85 font-light leading-relaxed text-left sm:text-center">
          {t.subline}{' '}
          <button
            type="button"
            onClick={openArtworksModal}
            className="inline-flex items-center font-semibold text-[#4ee2ec] hover:text-[#ff80df] underline underline-offset-4 decoration-[#4ee2ec]/60 hover:decoration-[#ff80df] transition-colors cursor-pointer"
          >
            <span>{t.sublineModalLink}</span>
          </button>
        </p>
      </div>

      {/* Freestanding Interactive Dual-Artwork Slider (Sumi-e & Plexus) */}
      <SakuraverseDualSlider lang={lang} />

      {/* Consolidated Start Console */}
      <div className="relative rounded-[32px] sm:rounded-[38px] p-6 sm:p-10 bg-[rgba(16,10,26,0.94)] border border-pink-500/40 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_50px_rgba(255,42,157,0.25)] flex flex-col gap-7">
        
        {/* Name Input */}
        <div className="flex flex-col gap-2.5">
          <label htmlFor="stationNameInput" className="flex items-center gap-2 text-xs font-bold tracking-[2px] uppercase text-pink-200/90">
            <span>{t.nameLabel}</span>
          </label>
          <input
            id="stationNameInput"
            type="text"
            value={myName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={isHost ? t.namePlaceholderHost : t.namePlaceholderGuest}
            maxLength={20}
            className="w-full px-5 py-4 rounded-2xl bg-white/[0.06] border border-pink-500/30 focus:border-[#ff2a9d] focus:bg-white/[0.1] focus:shadow-[0_0_20px_rgba(255,42,157,0.4)] text-white text-base font-semibold tracking-wide placeholder:text-white/30 outline-none transition-all duration-300"
          />
        </div>

        {/* Mode Selection (Testmodus vs. Souvenirmodus) */}
        <div className="flex flex-col gap-2.5">
          <label className="flex items-center gap-2 text-xs font-bold tracking-[2px] uppercase text-pink-200/90">
            <span>{t.modeLabel}</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Testmodus Card */}
            <div
              onClick={() => setActiveMode('test')}
              className={`p-5 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between gap-3 cursor-pointer ${
                activeMode === 'test'
                  ? 'bg-cyan-500/15 border-[#4ee2ec] shadow-[0_0_25px_rgba(78,226,236,0.3)] ring-1 ring-[#4ee2ec]/40'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/30 hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold tracking-wider uppercase text-[#4ee2ec] flex items-center gap-2">
                  {t.testModeTitle}
                </span>
                {activeMode === 'test' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4ee2ec] shadow-[0_0_10px_#4ee2ec]" />
                )}
              </div>
              <p className="text-xs text-white/75 leading-relaxed font-light">
                {t.testModeDesc}
              </p>
            </div>

            {/* Souvenirmodus Card */}
            <div
              onClick={() => setActiveMode('souvenir')}
              className={`p-5 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between gap-3 cursor-pointer ${
                activeMode === 'souvenir'
                  ? 'bg-pink-500/15 border-[#ff2a9d] shadow-[0_0_25px_rgba(255,42,157,0.3)] ring-1 ring-[#ff2a9d]/40'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/30 hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold tracking-wider uppercase text-[#ff80df] flex items-center gap-2">
                  {t.souvenirModeTitle}
                </span>
                {activeMode === 'souvenir' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff2a9d] shadow-[0_0_10px_#ff2a9d]" />
                )}
              </div>
              <p className="text-xs text-white/75 leading-relaxed font-light">
                {t.souvenirModeDesc}
              </p>
            </div>

          </div>
        </div>

        {/* Collaboration Invite (Host & Testmodus only) */}
        {isHost && activeMode === 'test' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold tracking-wider uppercase text-white/80 flex items-center gap-1.5">
                {t.inviteLabel}
              </span>
              <span className="text-[10px] text-white/50 tracking-wider">{t.inviteTag}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleCopy}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase cursor-pointer border transition-all duration-300 flex items-center justify-center gap-2 ${
                  copied
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                    : 'bg-white/[0.06] border-white/15 text-white hover:bg-white/[0.12] hover:border-pink-500/40'
                }`}
              >
                <span>{copied ? t.copiedBtn : t.copyBtn}</span>
              </button>
            </div>

            <div className="text-[10px] font-mono text-cyan-200/50 truncate bg-black/50 px-3 py-1.5 rounded-lg border border-white/5 select-all">
              {shareUrl}
            </div>

            {/* Status Indicators */}
            <div className="grid grid-cols-2 gap-2 mt-1 pt-2 border-t border-white/5 text-[11px]">
              <div className="flex items-center gap-2 text-white/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t.hostStatus}: {myName || t.you}</span>
              </div>
              <div className="flex items-center gap-2 text-white/50">
                <span className={`w-2 h-2 rounded-full ${isJoined ? 'bg-emerald-400' : 'bg-white/20'}`} />
                <span>{t.guestStatus}: {isJoined ? t.connected : t.waiting}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notice on Souvenir mode if active */}
        {activeMode === 'souvenir' && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
            <span>{t.souvenirNotice}</span>
          </div>
        )}

        {/* Main Action Start Button (Adapts to Testmodus vs. Souvenirmodus) */}
        <div>
          {activeMode === 'souvenir' ? (
            <div className="flex flex-col gap-3">
              <p className="text-center text-[11px] sm:text-xs text-white/60 tracking-wide font-light">
                {t.interactionHint}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleStartArtwork('souvenir', 'bluten')}
                  className="w-full py-5 px-6 rounded-2xl font-extrabold text-sm sm:text-base tracking-[2px] uppercase text-white transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-[1.01] hover:-translate-y-0.5 bg-gradient-to-r from-[#ff2a9d] via-[#d946ef] to-[#7928ca] shadow-[0_10px_35px_rgba(255,42,157,0.45)] hover:shadow-[0_15px_45px_rgba(255,42,157,0.7)]"
                >
                  <span>{t.startSouvenirSumieBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartArtwork('souvenir', 'plexus')}
                  className="w-full py-5 px-6 rounded-2xl font-extrabold text-sm sm:text-base tracking-[2px] uppercase text-white transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-[1.01] hover:-translate-y-0.5 bg-gradient-to-r from-[#06b6d4] via-[#0284c7] to-[#4ee2ec] shadow-[0_10px_35px_rgba(78,226,236,0.45)] hover:shadow-[0_15px_45px_rgba(78,226,236,0.7)]"
                >
                  <span>{t.startSouvenirPlexusBtn}</span>
                </button>
              </div>
            </div>
          ) : isHost ? (
            <div className="flex flex-col gap-3">
              <p className="text-center text-[11px] sm:text-xs text-white/60 tracking-wide font-light">
                {t.interactionHint}
              </p>
              <button
                type="button"
                onClick={() => handleStartArtwork('test', 'bluten')}
                className="w-full py-5 px-8 rounded-2xl font-extrabold text-sm sm:text-base tracking-[2px] uppercase text-white transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.01] hover:-translate-y-0.5 bg-gradient-to-r from-[#06b6d4] via-[#0284c7] to-[#4ee2ec] shadow-[0_10px_35px_rgba(78,226,236,0.45)] hover:shadow-[0_15px_45px_rgba(78,226,236,0.7)]"
              >
                <span>{t.startTestBtn}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-center text-[11px] sm:text-xs text-white/60 tracking-wide font-light">
                {t.interactionHint}
              </p>
              {!isJoined ? (
                <button
                  type="button"
                  onClick={handleGuestJoin}
                  className="w-full py-5 px-8 rounded-2xl font-extrabold text-sm sm:text-base tracking-[2px] uppercase text-white bg-gradient-to-r from-[#4ee2ec] to-[#0284c7] shadow-[0_10px_35px_rgba(78,226,236,0.4)] hover:shadow-[0_15px_45px_rgba(78,226,236,0.6)] hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t.joinBtn}</span>
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/15 text-center text-xs tracking-wider text-white/80 animate-pulse">
                  {t.guestWaitingNotice}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Lightbox Modal: Lerne mehr über die beiden Kunstwerke (Sumi-e & Plexus) */}
      {mounted && isArtworksModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={closeArtworksModal}
          style={{ touchAction: 'none' }}
          role="dialog"
          aria-modal="true"
          aria-label={t.artworksModal.title}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 bg-[rgba(18,12,28,0.98)] border border-pink-500/50 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(255,42,157,0.35)] text-left flex flex-col gap-6 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg sm:text-2xl font-extrabold text-white tracking-wide">
                  {t.artworksModal.title}
                </h3>
                <span className="text-[11px] font-mono tracking-wider text-pink-300/70 uppercase">
                  {t.artworksModal.subtitle}
                </span>
              </div>

              <button
                type="button"
                onClick={closeArtworksModal}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
                aria-label={t.artworksModal.closeBtn}
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Section 1: Sumi-e (History + Generated Crane & Cherry Blossom Image) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.04] border border-pink-500/30 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
              <div className="w-full sm:w-44 md:w-48 shrink-0 overflow-hidden rounded-xl border border-pink-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(255,42,157,0.2)] bg-[#f7f5f0]">
                <img
                  src={sumieImgSrc}
                  alt={t.artworksModal.sumieImageAlt}
                  className="w-full h-auto object-cover block"
                />
              </div>

              <div className="flex flex-col gap-2.5 flex-1">
                <span className="inline-flex items-center self-start px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/40 text-pink-200 text-[10px] font-bold tracking-widest uppercase">
                  {t.artworksModal.sumieBadge}
                </span>
                <h4 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
                  {t.artworksModal.sumieTitle}
                </h4>
                <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed">
                  {t.artworksModal.sumieText}
                </p>
              </div>
            </div>

            {/* Section 2: Plexus (Visual Impact in Artworks) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.04] border border-cyan-500/30 flex flex-col gap-2.5">
              <span className="inline-flex items-center self-start px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-200 text-[10px] font-bold tracking-widest uppercase">
                {t.artworksModal.plexusBadge}
              </span>
              <h4 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
                {t.artworksModal.plexusTitle}
              </h4>
              <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed">
                {t.artworksModal.plexusText}
              </p>
            </div>

            {/* Close Action Button */}
            <button
              type="button"
              onClick={closeArtworksModal}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-[#ff2a9d] via-[#d946ef] to-[#06b6d4] shadow-[0_10px_25px_rgba(255,42,157,0.4)] hover:shadow-[0_12px_30px_rgba(78,226,236,0.6)] hover:scale-[1.01] transition-all duration-300 cursor-pointer"
            >
              {t.artworksModal.closeBtn}
            </button>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
