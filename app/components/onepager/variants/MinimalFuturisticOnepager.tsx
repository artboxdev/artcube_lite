'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiVolume2, FiVolumeX, FiCheck, FiCopy } from 'react-icons/fi';
import { translations } from '../translations';
import { SakuraverseDualSlider } from '../SakuraverseDualSlider';
import { VariantOnepagerProps, useOnepagerExperience } from './useOnepagerExperience';

export type FuturisticVariantKey = 'aether' | 'kinetik' | 'lumen' | 'm3-blue' | 'm3-sakura';

interface VariantTheme {
  bodyFont: string;
  displayFont: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  surface: string;
  surfaceSubtle: string;
  border: string;
  accentText: string;
  accentGradient: string;
  dotColor: string;
  primaryBtn: string;
  secondaryBtn: string;
  sumieBtn: string;
  plexusBtn: string;
  radiusCard: string;
  radiusControl: string;
  radiusButton?: string;
  heroLayout: 'left-split' | 'frame-split' | 'centered';
  storyLayout: 'grid' | 'alternating';
}

const THEMES: Record<FuturisticVariantKey, VariantTheme> = {
  aether: {
    bodyFont: 'var(--font-jakarta), sans-serif',
    displayFont: 'var(--font-space), sans-serif',
    textPrimary: 'text-[#F8FAFC]',
    textSecondary: 'text-[#E2E8F0]',
    textMuted: 'text-[#94A3B8]',
    surface: 'bg-[#0F141C]/90',
    surfaceSubtle: 'bg-[#07090D]/75',
    border: 'border-[#F8FAFC]/14',
    accentText: 'text-[#38BDF8]',
    accentGradient: 'bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#F472B6] bg-clip-text text-transparent',
    dotColor: 'text-[#38BDF8]',
    primaryBtn: 'bg-[#38BDF8] text-[#07090D] hover:bg-[#F8FAFC]',
    secondaryBtn: 'border border-[#F8FAFC]/25 text-[#F8FAFC] hover:border-[#38BDF8] hover:text-[#38BDF8]',
    sumieBtn: 'bg-[#F8FAFC] text-[#07090D] hover:bg-[#38BDF8]',
    plexusBtn: 'bg-[#38BDF8] text-[#07090D] hover:bg-[#F8FAFC]',
    radiusCard: 'rounded-2xl',
    radiusControl: 'rounded-xl',
    heroLayout: 'left-split',
    storyLayout: 'grid',
  },
  kinetik: {
    bodyFont: 'var(--font-space), sans-serif',
    displayFont: 'var(--font-space), sans-serif',
    textPrimary: 'text-white',
    textSecondary: 'text-[#E2E8F0]',
    textMuted: 'text-[#9CA3AF]',
    surface: 'bg-[#0D1017]/92',
    surfaceSubtle: 'bg-[#050608]/80',
    border: 'border-white/16',
    accentText: 'text-[#22D3EE]',
    accentGradient: 'bg-gradient-to-r from-[#22D3EE] via-[#6366F1] to-[#EC4899] bg-clip-text text-transparent',
    dotColor: 'text-[#22D3EE]',
    primaryBtn: 'bg-white text-[#050608] hover:bg-[#22D3EE]',
    secondaryBtn: 'border border-white/25 text-white hover:border-[#22D3EE] hover:text-[#22D3EE]',
    sumieBtn: 'bg-[#6366F1] text-white hover:bg-[#818CF8]',
    plexusBtn: 'bg-[#22D3EE] text-[#050608] hover:bg-white',
    radiusCard: 'rounded-md',
    radiusControl: 'rounded-sm',
    heroLayout: 'frame-split',
    storyLayout: 'alternating',
  },
  lumen: {
    bodyFont: 'var(--font-jakarta), sans-serif',
    displayFont: 'var(--font-jakarta), sans-serif',
    textPrimary: 'text-[#FAFAFA]',
    textSecondary: 'text-[#E4E4E7]',
    textMuted: 'text-[#A1A1AA]',
    surface: 'bg-[#16181D]/92',
    surfaceSubtle: 'bg-[#0B0C0E]/80',
    border: 'border-white/12',
    accentText: 'text-[#F472B6]',
    accentGradient: 'bg-gradient-to-r from-[#F472B6] via-[#C084FC] to-[#38BDF8] bg-clip-text text-transparent',
    dotColor: 'text-[#F472B6]',
    primaryBtn: 'bg-[#FAFAFA] text-[#0B0C0E] hover:bg-[#F472B6] hover:text-[#0B0C0E]',
    secondaryBtn: 'border border-white/20 text-[#FAFAFA] hover:border-[#F472B6] hover:text-[#F472B6]',
    sumieBtn: 'bg-gradient-to-r from-[#F472B6] to-[#A78BFA] text-[#0B0C0E] hover:opacity-95',
    plexusBtn: 'bg-[#FAFAFA] text-[#0B0C0E] hover:bg-[#E4E4E7]',
    radiusCard: 'rounded-3xl',
    radiusControl: 'rounded-2xl',
    heroLayout: 'centered',
    storyLayout: 'grid',
  },
  'm3-blue': {
    bodyFont: 'var(--font-jakarta), sans-serif',
    displayFont: 'var(--font-jakarta), sans-serif',
    textPrimary: 'text-[#E2E2E9]',
    textSecondary: 'text-[#C4C6D0]',
    textMuted: 'text-[#8E9099]',
    surface: 'bg-[#1D2026]/95',
    surfaceSubtle: 'bg-[#282A30]/90',
    border: 'border-white/[0.08]',
    accentText: 'text-[#A8C7FA]',
    accentGradient: 'bg-gradient-to-r from-[#A8C7FA] via-[#C2E7FF] to-[#D7C3FA] bg-clip-text text-transparent',
    dotColor: 'text-[#A8C7FA]',
    primaryBtn: 'bg-[#A8C7FA] text-[#062E6F] hover:bg-[#D3E3FD]',
    secondaryBtn: 'border border-[#8E9099]/50 text-[#A8C7FA] hover:bg-[#A8C7FA]/10',
    sumieBtn: 'bg-[#A8C7FA] text-[#062E6F] hover:bg-[#D3E3FD]',
    plexusBtn: 'bg-[#C2E7FF] text-[#001D35] hover:bg-[#E1F3FF]',
    radiusCard: 'rounded-[28px]',
    radiusControl: 'rounded-2xl',
    radiusButton: 'rounded-full',
    heroLayout: 'centered',
    storyLayout: 'grid',
  },
  'm3-sakura': {
    bodyFont: 'var(--font-jakarta), sans-serif',
    displayFont: 'var(--font-jakarta), sans-serif',
    textPrimary: 'text-[#EDE0E4]',
    textSecondary: 'text-[#D6C2C8]',
    textMuted: 'text-[#9F8C92]',
    surface: 'bg-[#211E24]/95',
    surfaceSubtle: 'bg-[#2B2830]/90',
    border: 'border-[#FFB1C8]/[0.12]',
    accentText: 'text-[#FFB1C8]',
    accentGradient: 'bg-gradient-to-r from-[#FFB1C8] via-[#D0BCFF] to-[#A8C7FA] bg-clip-text text-transparent',
    dotColor: 'text-[#FFB1C8]',
    primaryBtn: 'bg-[#FFB1C8] text-[#4A152B] hover:bg-[#FFD9E2]',
    secondaryBtn: 'border border-[#9F8C92]/50 text-[#FFB1C8] hover:bg-[#FFB1C8]/10',
    sumieBtn: 'bg-[#FFB1C8] text-[#4A152B] hover:bg-[#FFD9E2]',
    plexusBtn: 'bg-[#D0BCFF] text-[#381E72] hover:bg-[#EADDFF]',
    radiusCard: 'rounded-[28px]',
    radiusControl: 'rounded-2xl',
    radiusButton: 'rounded-full',
    heroLayout: 'left-split',
    storyLayout: 'alternating',
  },
};

interface MinimalFuturisticOnepagerProps extends VariantOnepagerProps {
  variant: FuturisticVariantKey;
}

export function MinimalFuturisticOnepager({
  variant,
  lang,
  myName,
  onNameChange,
  isHost,
  sessionId,
  isJoined,
  guestName,
  onJoin,
  onStart,
  onModalToggle,
  isAudioMuted = false,
  onToggleAudioMuted,
  onNavigateTo,
}: MinimalFuturisticOnepagerProps) {
  const theme = THEMES[variant];
  const btnRadius = theme.radiusButton ?? theme.radiusControl;
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState(false);

  const tHero = translations[lang].hero;
  const tExp = translations[lang].experience;
  const tStory = translations[lang].story;
  const tNews = translations[lang].newsletter;

  const {
    activeMode,
    setActiveMode,
    copied,
    shareUrl,
    mounted,
    basePath,
    isArtworksModalOpen,
    openArtworksModal,
    closeArtworksModal,
    isNftModalOpen,
    openNftModal,
    closeNftModal,
    handleCopy,
    handleStartArtwork,
    handleGuestJoin,
  } = useOnepagerExperience({
    lang,
    myName,
    onNameChange,
    sessionId,
    onJoin,
    onStart,
    onModalToggle,
  });

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    setSubmitted(true);
  };

  return (
    <div className={`${theme.textPrimary} antialiased`} style={{ fontFamily: theme.bodyFont }}>
      {/* 1. HERO SECTION */}
      {theme.heroLayout === 'left-split' && (
        <section
          id="top"
          className="min-h-[calc(100vh-4rem)] flex items-center px-6 sm:px-10 lg:px-16 py-16 max-w-6xl mx-auto"
        >
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-end border-b border-white/12 pb-16">
            <div className="lg:col-span-8">
              <h1
                className="text-6xl sm:text-8xl font-bold tracking-[-0.03em] leading-[0.95]"
                style={{ fontFamily: theme.displayFont }}
              >
                art<span className={theme.dotColor}>.</span>cube
              </h1>
              <p className={`mt-7 max-w-[60ch] text-base sm:text-xl ${theme.textSecondary} leading-relaxed whitespace-pre-line`}>
                {tHero.lead}
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-3 lg:border-l lg:border-white/12 lg:pl-8">
              <button
                type="button"
                onClick={() => onNavigateTo('erleben')}
                className={`w-full py-4 px-6 ${btnRadius} text-xs font-bold tracking-[0.12em] uppercase transition-colors cursor-pointer ${theme.primaryBtn}`}
              >
                {tHero.btnPrimary}
              </button>
              <button
                type="button"
                onClick={() => onNavigateTo('vision')}
                className={`w-full py-4 px-6 ${btnRadius} text-xs font-semibold tracking-[0.12em] uppercase transition-colors cursor-pointer ${theme.secondaryBtn}`}
              >
                {tHero.btnSecondary}
              </button>
            </div>
          </div>
        </section>
      )}

      {theme.heroLayout === 'frame-split' && (
        <section
          id="top"
          className="min-h-[calc(100vh-4rem)] flex items-center px-4 sm:px-8 lg:px-12 py-14 max-w-6xl mx-auto"
        >
          <div className={`w-full border ${theme.border} ${theme.surface} ${theme.radiusCard} overflow-hidden`}>
            <div className={`p-8 sm:p-14 border-b ${theme.border}`}>
              <h1
                className="text-6xl sm:text-8xl font-bold tracking-[-0.04em] leading-[0.92]"
                style={{ fontFamily: theme.displayFont }}
              >
                art<span className={theme.dotColor}>.</span>cube
              </h1>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className={`lg:col-span-7 p-8 sm:p-10 border-b lg:border-b-0 lg:border-r ${theme.border}`}>
                <p className={`max-w-[58ch] text-base sm:text-lg ${theme.textSecondary} leading-relaxed whitespace-pre-line`}>
                  {tHero.lead}
                </p>
              </div>
              <div className={`lg:col-span-5 p-8 sm:p-10 flex flex-col justify-center gap-3 ${theme.surfaceSubtle}`}>
                <button
                  type="button"
                  onClick={() => onNavigateTo('erleben')}
                  className={`w-full py-4 px-6 ${theme.radiusControl} text-xs font-bold tracking-[0.12em] uppercase transition-colors cursor-pointer ${theme.primaryBtn}`}
                >
                  {tHero.btnPrimary}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTo('vision')}
                  className={`w-full py-4 px-6 ${theme.radiusControl} text-xs font-semibold tracking-[0.12em] uppercase transition-colors cursor-pointer ${theme.secondaryBtn}`}
                >
                  {tHero.btnSecondary}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {theme.heroLayout === 'centered' && (
        <section
          id="top"
          className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-6 sm:px-10 py-20 text-center max-w-4xl mx-auto"
        >
          <h1
            className="text-6xl sm:text-8xl font-bold tracking-[-0.03em] leading-[0.98]"
            style={{ fontFamily: theme.displayFont }}
          >
            art<span className={theme.dotColor}>.</span>cube
          </h1>
          <p className={`mt-7 max-w-[58ch] text-base sm:text-xl ${theme.textSecondary} leading-relaxed whitespace-pre-line`}>
            {tHero.lead}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onNavigateTo('erleben')}
              className={`w-full sm:w-auto px-8 py-4 ${btnRadius} text-xs font-bold tracking-[0.12em] uppercase transition-colors cursor-pointer ${theme.primaryBtn}`}
            >
              {tHero.btnPrimary}
            </button>
            <button
              type="button"
              onClick={() => onNavigateTo('vision')}
              className={`w-full sm:w-auto px-8 py-4 ${btnRadius} text-xs font-semibold tracking-[0.12em] uppercase transition-colors cursor-pointer ${theme.secondaryBtn}`}
            >
              {tHero.btnSecondary}
            </button>
          </div>
        </section>
      )}

      {/* 2. EXPERIENCE STATION — EXAKT URSPRÜNGLICHE ANORDNUNG */}
      <section id="erleben" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <h2
            className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight"
            style={{ fontFamily: theme.displayFont }}
          >
            {tExp.titlePrefix}{' '}
            <span className={theme.accentGradient}>{tExp.titleHighlight}</span>
          </h2>
          <p className={`mt-4 text-sm sm:text-base ${theme.textSecondary} leading-relaxed text-left sm:text-center`}>
            {tExp.subline}{' '}
            <button
              type="button"
              onClick={openArtworksModal}
              className={`inline-flex items-center font-semibold ${theme.accentText} hover:opacity-80 underline underline-offset-4 transition-opacity cursor-pointer`}
            >
              <span>{tExp.sublineModalLink}</span>
            </button>
          </p>
        </div>

        {/* Test Prompt above Dual Slider */}
        <div className="text-center -mt-4 mb-4 sm:-mt-6 sm:mb-6">
          <p className={`text-sm sm:text-base font-semibold ${theme.textSecondary} tracking-wide`}>
            {tExp.sliderPrompt}
          </p>
        </div>

        {/* Freestanding Interactive Dual-Artwork Slider (Sumi-e & Plexus) */}
        <SakuraverseDualSlider lang={lang} />

        {/* Consolidated Start Console (ursprüngliche Reihenfolge) */}
        <div
          className={`relative ${theme.radiusCard} p-6 sm:p-10 ${theme.surface} border ${theme.border} backdrop-blur-xl flex flex-col gap-7`}
        >
          {/* 1. Name Input */}
          <div className="flex flex-col gap-2.5">
            <label
              htmlFor={`stationNameInput-${variant}`}
              className={`text-xs font-semibold tracking-wider uppercase ${theme.textMuted}`}
            >
              {tExp.nameLabel}
            </label>
            <input
              id={`stationNameInput-${variant}`}
              type="text"
              value={myName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={isHost ? tExp.namePlaceholderHost : tExp.namePlaceholderGuest}
              maxLength={20}
              className={`w-full px-5 py-4 ${theme.radiusControl} ${theme.surfaceSubtle} border ${theme.border} focus:border-white/50 text-white text-base font-medium placeholder:text-white/40 outline-none transition-colors`}
            />
          </div>

          {/* 2. Mode Selection (Testmodus vs. Souvenirmodus) */}
          <div className="flex flex-col gap-2.5">
            <span className={`text-xs font-semibold tracking-wider uppercase ${theme.textMuted}`}>
              {tExp.modeLabel}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setActiveMode('test')}
                className={`p-5 ${theme.radiusControl} border text-left transition-colors flex flex-col justify-between gap-2.5 cursor-pointer ${
                  activeMode === 'test'
                    ? 'bg-white/[0.08] border-white/60'
                    : `${theme.surfaceSubtle} ${theme.border} hover:border-white/35`
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-sm font-bold tracking-wider uppercase ${theme.accentText}`}>
                    {tExp.testModeTitle}
                  </span>
                  {activeMode === 'test' && <span className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <p className={`text-sm ${theme.textSecondary} leading-relaxed`}>{tExp.testModeDesc}</p>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('souvenir')}
                className={`p-5 ${theme.radiusControl} border text-left transition-colors flex flex-col justify-between gap-2.5 cursor-pointer ${
                  activeMode === 'souvenir'
                    ? 'bg-white/[0.08] border-white/60'
                    : `${theme.surfaceSubtle} ${theme.border} hover:border-white/35`
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-sm font-bold tracking-wider uppercase ${theme.accentText}`}>
                    {tExp.souvenirModeTitle}
                  </span>
                  {activeMode === 'souvenir' && <span className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <p className={`text-sm ${theme.textSecondary} leading-relaxed`}>{tExp.souvenirModeDesc}</p>
              </button>
            </div>
          </div>

          {/* 3. Collaboration Invite (Host & Testmodus only) */}
          {isHost && activeMode === 'test' && (
            <div className={`p-4 sm:p-5 ${theme.radiusControl} ${theme.surfaceSubtle} border ${theme.border} flex flex-col gap-3`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold tracking-wider uppercase ${theme.textSecondary}`}>
                  {tExp.inviteLabel}
                </span>
                <span className={`text-xs ${theme.textMuted}`}>{tExp.inviteTag}</span>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className={`w-full py-3 px-4 ${theme.radiusControl} font-semibold text-xs tracking-wider uppercase cursor-pointer border transition-colors flex items-center justify-center gap-2 ${
                  copied
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                    : `bg-white/[0.05] ${theme.border} text-white hover:border-white/45`
                }`}
              >
                {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                <span>{copied ? tExp.copiedBtn : tExp.copyBtn}</span>
              </button>

              <div className={`text-xs font-mono ${theme.textMuted} truncate bg-black/40 px-3 py-2 ${theme.radiusControl} border border-white/10 select-all`}>
                {shareUrl}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
                <div className={`flex items-center gap-2 ${theme.textSecondary}`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span>{tExp.hostStatus}: {myName || tExp.you}</span>
                </div>
                <div className={`flex items-center gap-2 ${isJoined ? 'text-emerald-300 font-semibold' : theme.textMuted}`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isJoined ? 'bg-emerald-400' : 'bg-white/25'}`} />
                  <span>{tExp.guestStatus}: {isJoined ? `${tExp.connected} (${guestName || 'Gast'})` : tExp.waiting}</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. Notice on Souvenir mode */}
          {activeMode === 'souvenir' && (
            <div className={`p-4 ${theme.radiusControl} bg-amber-500/10 border border-amber-400/35 text-amber-100 text-sm leading-relaxed`}>
              {tExp.souvenirNotice}
            </div>
          )}

          {/* 5. Pre-Session Sound Toggle Button */}
          {onToggleAudioMuted && (
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={onToggleAudioMuted}
                className={`inline-flex items-center gap-2.5 px-5 py-2.5 ${theme.radiusControl} bg-white/[0.05] hover:bg-white/[0.1] border ${theme.border} ${theme.textSecondary} hover:text-white transition-colors text-xs font-medium cursor-pointer`}
                aria-label={isAudioMuted ? 'Sound anschalten' : 'Sound ausschalten'}
              >
                {isAudioMuted ? (
                  <FiVolumeX className="w-4 h-4 shrink-0" />
                ) : (
                  <FiVolume2 className={`w-4 h-4 shrink-0 ${theme.accentText}`} />
                )}
                <span>
                  {lang === 'de'
                    ? isAudioMuted
                      ? 'Klicke, um den Sound in der Session wieder anzuschalten'
                      : 'Klicke, um den Sound in der Session erst einmal auszuschalten'
                    : isAudioMuted
                      ? 'Click to turn sound back on in the session'
                      : 'Click to turn off sound in the session for now'}
                </span>
              </button>
            </div>
          )}

          {/* 6. Main Action Start Buttons */}
          <div>
            {activeMode === 'souvenir' ? (
              <div className="flex flex-col gap-3">
                <p className={`text-center text-xs ${theme.textMuted}`}>{tExp.interactionHint}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleStartArtwork('souvenir', 'bluten')}
                    className={`w-full py-4 px-6 ${btnRadius} font-bold text-sm tracking-wider uppercase transition-opacity cursor-pointer ${theme.sumieBtn}`}
                  >
                    {tExp.startSouvenirSumieBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartArtwork('souvenir', 'plexus')}
                    className={`w-full py-4 px-6 ${btnRadius} font-bold text-sm tracking-wider uppercase transition-opacity cursor-pointer ${theme.plexusBtn}`}
                  >
                    {tExp.startSouvenirPlexusBtn}
                  </button>
                </div>
              </div>
            ) : isHost ? (
              <div className="flex flex-col gap-3">
                <p className={`text-center text-xs ${theme.textMuted}`}>{tExp.interactionHint}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleStartArtwork('test', 'bluten')}
                    className={`w-full py-4 px-6 ${btnRadius} font-bold text-sm tracking-wider uppercase transition-opacity cursor-pointer ${theme.sumieBtn}`}
                  >
                    {tExp.startTestSumieBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartArtwork('test', 'plexus')}
                    className={`w-full py-4 px-6 ${btnRadius} font-bold text-sm tracking-wider uppercase transition-opacity cursor-pointer ${theme.plexusBtn}`}
                  >
                    {tExp.startTestPlexusBtn}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className={`text-center text-xs ${theme.textMuted}`}>{tExp.interactionHint}</p>
                {!isJoined ? (
                  <button
                    type="button"
                    onClick={handleGuestJoin}
                    className={`w-full py-4 px-6 ${btnRadius} font-bold text-sm tracking-wider uppercase transition-opacity cursor-pointer ${theme.primaryBtn}`}
                  >
                    {tExp.joinBtn}
                  </button>
                ) : (
                  <div className={`p-4 ${theme.radiusControl} bg-white/[0.06] border ${theme.border} text-center text-sm ${theme.textSecondary}`}>
                    {tExp.guestWaitingNotice}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. STORY SECTION */}
      <section id="vision" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-14 sm:mb-16">
          <h2
            className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight"
            style={{ fontFamily: theme.displayFont }}
          >
            {tStory.headlineMain}{' '}
            <span className={theme.accentGradient}>{tStory.headlineHighlight}</span>
          </h2>
          <p className={`mt-5 text-sm sm:text-base ${theme.textSecondary} leading-relaxed text-left sm:text-center`}>
            {tStory.lead}
          </p>
        </div>

        {theme.storyLayout === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Card 1 */}
            <article className={`${theme.radiusCard} p-6 sm:p-9 ${theme.surface} border ${theme.border} flex flex-col gap-6`}>
              <div className={`relative aspect-video overflow-hidden ${theme.radiusControl} border ${theme.border} bg-[#0d0714]`}>
                <img
                  src={`${basePath}/artcube_version1_2.jpg`}
                  alt={tStory.card1Title}
                  className="w-full h-full object-cover block"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.src.includes('/artcube_lite')) {
                      img.src = '/artcube_lite/artcube_version1_2.jpg';
                    }
                  }}
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/75 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold tracking-wider uppercase">
                  {tStory.card1Badge}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: theme.displayFont }}>
                {tStory.card1Title}
              </h3>
              <ul className="space-y-4">
                <li>
                  <h4 className="text-sm font-semibold text-white">{tStory.card1Item1Title}</h4>
                  <p className={`text-sm ${theme.textMuted} mt-1 leading-relaxed`}>{tStory.card1Item1Desc}</p>
                </li>
                <li>
                  <h4 className="text-sm font-semibold text-white">{tStory.card1Item2Title}</h4>
                  <p className={`text-sm ${theme.textMuted} mt-1 leading-relaxed`}>{tStory.card1Item2Desc}</p>
                </li>
                <li>
                  <h4 className="text-sm font-semibold text-white">{tStory.card1Item3Title}</h4>
                  <p className={`text-sm ${theme.textMuted} mt-1 leading-relaxed`}>
                    {tStory.card1Item3DescPrefix}{' '}
                    <span className={`font-bold ${theme.accentGradient}`}>{tStory.card1Item3Forever}</span>{' '}
                    {tStory.card1Item3DescSuffix}{' '}
                    <button
                      type="button"
                      onClick={openNftModal}
                      className={`font-semibold ${theme.accentText} underline underline-offset-4 hover:opacity-80 cursor-pointer`}
                    >
                      {tStory.card1Item3ModalLink}
                    </button>
                  </p>
                </li>
              </ul>
            </article>

            {/* Card 2 */}
            <article className={`${theme.radiusCard} p-6 sm:p-9 ${theme.surface} border ${theme.border} flex flex-col gap-6`}>
              <div className={`relative aspect-video overflow-hidden ${theme.radiusControl} border ${theme.border} bg-[#06121a]`}>
                <img
                  src={`${basePath}/artcube_version2.jpg`}
                  alt={tStory.card2Title}
                  className="w-full h-full object-cover block"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.src.includes('/artcube_lite')) {
                      img.src = '/artcube_lite/artcube_version2.jpg';
                    }
                  }}
                />
                <span className={`absolute top-3 left-3 px-3 py-1 rounded-full bg-black/75 border ${theme.border} ${theme.accentText} text-[11px] font-bold tracking-wider uppercase`}>
                  {tStory.card2Badge}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: theme.displayFont }}>
                  {tStory.card2Title}
                </h3>
                <span className={`text-sm font-medium ${theme.accentText}`}>{tStory.card2Loading}</span>
              </div>
              <ul className="space-y-4">
                <li>
                  <h4 className="text-sm font-semibold text-white">{tStory.card2Item1Title}</h4>
                  <p className={`text-sm ${theme.textMuted} mt-1 leading-relaxed`}>{tStory.card2Item1Desc}</p>
                </li>
                <li>
                  <h4 className="text-sm font-semibold text-white">{tStory.card2Item2Title}</h4>
                  <p className={`text-sm ${theme.textMuted} mt-1 leading-relaxed`}>{tStory.card2Item2Desc}</p>
                </li>
                <li>
                  <h4 className="text-sm font-semibold text-white">{tStory.card2Item3Title}</h4>
                  <p className={`text-sm ${theme.textMuted} mt-1 leading-relaxed`}>{tStory.card2Item3Desc}</p>
                </li>
              </ul>
            </article>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Phase 1 Row */}
            <article className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${theme.radiusCard} p-6 sm:p-9 ${theme.surface} border ${theme.border}`}>
              <div className={`lg:col-span-6 relative aspect-video overflow-hidden ${theme.radiusControl} border ${theme.border}`}>
                <img
                  src={`${basePath}/artcube_version1_2.jpg`}
                  alt={tStory.card1Title}
                  className="w-full h-full object-cover block"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.src.includes('/artcube_lite')) {
                      img.src = '/artcube_lite/artcube_version1_2.jpg';
                    }
                  }}
                />
                <span className="absolute top-3 left-3 px-3 py-1 bg-black/75 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold tracking-wider uppercase">
                  {tStory.card1Badge}
                </span>
              </div>
              <div className="lg:col-span-6 space-y-5">
                <h3 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: theme.displayFont }}>
                  {tStory.card1Title}
                </h3>
                <ul className="space-y-4">
                  <li>
                    <h4 className="text-sm font-semibold text-white">{tStory.card1Item1Title}</h4>
                    <p className={`text-sm ${theme.textMuted} mt-1 leading-relaxed`}>{tStory.card1Item1Desc}</p>
                  </li>
                  <li>
                    <h4 className="text-sm font-semibold text-white">{tStory.card1Item2Title}</h4>
                    <p className={`text-sm ${theme.textMuted} mt-1 leading-relaxed`}>{tStory.card1Item2Desc}</p>
                  </li>
                  <li>
                    <h4 className="text-sm font-semibold text-white">{tStory.card1Item3Title}</h4>
                    <p className={`text-sm ${theme.textMuted} mt-1 leading-relaxed`}>
                      {tStory.card1Item3DescPrefix}{' '}
                      <span className={`font-bold ${theme.accentGradient}`}>{tStory.card1Item3Forever}</span>{' '}
                      {tStory.card1Item3DescSuffix}{' '}
                      <button
                        type="button"
                        onClick={openNftModal}
                        className={`font-semibold ${theme.accentText} underline underline-offset-4 hover:opacity-80 cursor-pointer`}
                      >
                        {tStory.card1Item3ModalLink}
                      </button>
                    </p>
                  </li>
                </ul>
              </div>
            </article>

            {/* Phase 2 Row */}
            <article className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${theme.radiusCard} p-6 sm:p-9 ${theme.surface} border ${theme.border}`}>
              <div className="lg:col-span-6 order-2 lg:order-1 space-y-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: theme.displayFont }}>
                    {tStory.card2Title}
                  </h3>
                  <span className={`text-sm font-medium ${theme.accentText}`}>{tStory.card2Loading}</span>
                </div>
                <ul className="space-y-4">
                  <li>
                    <h4 className="text-sm font-semibold text-white">{tStory.card2Item1Title}</h4>
                    <p className={`text-sm ${theme.textMuted} mt-1 leading-relaxed`}>{tStory.card2Item1Desc}</p>
                  </li>
                  <li>
                    <h4 className="text-sm font-semibold text-white">{tStory.card2Item2Title}</h4>
                    <p className={`text-sm ${theme.textMuted} mt-1 leading-relaxed`}>{tStory.card2Item2Desc}</p>
                  </li>
                  <li>
                    <h4 className="text-sm font-semibold text-white">{tStory.card2Item3Title}</h4>
                    <p className={`text-sm ${theme.textMuted} mt-1 leading-relaxed`}>{tStory.card2Item3Desc}</p>
                  </li>
                </ul>
              </div>
              <div className={`lg:col-span-6 order-1 lg:order-2 relative aspect-video overflow-hidden ${theme.radiusControl} border ${theme.border}`}>
                <img
                  src={`${basePath}/artcube_version2.jpg`}
                  alt={tStory.card2Title}
                  className="w-full h-full object-cover block"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.src.includes('/artcube_lite')) {
                      img.src = '/artcube_lite/artcube_version2.jpg';
                    }
                  }}
                />
                <span className={`absolute top-3 left-3 px-3 py-1 bg-black/75 border ${theme.border} ${theme.accentText} text-[11px] font-bold tracking-wider uppercase`}>
                  {tStory.card2Badge}
                </span>
              </div>
            </article>
          </div>
        )}
      </section>

      {/* 4. NEWSLETTER SECTION */}
      <section id="newsletter" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className={`${theme.radiusCard} p-8 sm:p-12 ${theme.surface} border ${theme.border} grid grid-cols-1 lg:grid-cols-12 gap-8 items-center`}>
          <div className="lg:col-span-6">
            <h2 className="text-2xl sm:text-4xl font-bold leading-tight" style={{ fontFamily: theme.displayFont }}>
              {tNews.headline}
            </h2>
            <p className={`mt-3 text-sm sm:text-base ${theme.textSecondary} leading-relaxed`}>
              {tNews.subline}
            </p>
          </div>
          <div className="lg:col-span-6">
            {submitted ? (
              <div className={`p-4 ${theme.radiusControl} bg-emerald-500/15 border border-emerald-400/50 text-emerald-200 text-sm font-medium`}>
                {tNews.success}
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(false);
                  }}
                  placeholder={tNews.placeholder}
                  className={`flex-1 px-4 py-3.5 ${theme.radiusControl} ${theme.surfaceSubtle} border ${theme.border} text-white text-sm placeholder:text-white/40 outline-none focus:border-white/50`}
                />
                <button
                  type="submit"
                  className={`px-7 py-3.5 ${theme.radiusControl} text-xs font-bold tracking-[0.12em] uppercase transition-colors cursor-pointer shrink-0 ${theme.primaryBtn}`}
                >
                  {tNews.btn}
                </button>
              </form>
            )}
            {emailError && <p className="mt-2 text-xs text-red-400">{tNews.errorMsg}</p>}
            <p className={`mt-3 text-xs ${theme.textMuted}`}>{tNews.privacyNote}</p>
          </div>
        </div>
      </section>

      {/* Lightbox Modal: Artworks (mit beiden Bildern!) */}
      {mounted && isArtworksModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md"
          onClick={closeArtworksModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto ${theme.radiusCard} p-6 sm:p-8 ${theme.surface} border ${theme.border} ${theme.textPrimary} flex flex-col gap-6`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: theme.displayFont }}>
                  {tExp.artworksModal.title}
                </h3>
                <p className={`text-xs ${theme.accentText} mt-0.5`}>{tExp.artworksModal.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={closeArtworksModal}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white cursor-pointer shrink-0"
                aria-label={tExp.artworksModal.closeBtn}
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className={`p-5 ${theme.radiusControl} ${theme.surfaceSubtle} border ${theme.border} space-y-4`}>
              <div className={`w-full max-h-[300px] overflow-hidden ${theme.radiusControl} border ${theme.border} bg-[#f7f5f0]`}>
                <img
                  src={`${basePath}/sumie_about.jpg`}
                  alt={tExp.artworksModal.sumieImageAlt}
                  className="w-full h-auto max-h-[300px] object-cover block"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.src.includes('/artcube_lite')) {
                      img.src = '/artcube_lite/sumie_about.jpg';
                    }
                  }}
                />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold text-white mb-1.5">{tExp.artworksModal.sumieTitle}</h4>
                <p className={`text-sm ${theme.textSecondary} leading-relaxed`}>{tExp.artworksModal.sumieText}</p>
              </div>
            </div>

            <div className={`p-5 ${theme.radiusControl} ${theme.surfaceSubtle} border ${theme.border} space-y-4`}>
              <div className={`w-full max-h-[300px] overflow-hidden ${theme.radiusControl} border ${theme.border} bg-[#0d0914]`}>
                <img
                  src={`${basePath}/plexus_about.jpg`}
                  alt={tExp.artworksModal.plexusTitle}
                  className="w-full h-auto max-h-[300px] object-cover block"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.src.includes('/artcube_lite')) {
                      img.src = '/artcube_lite/plexus_about.jpg';
                    }
                  }}
                />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold text-white mb-1.5">{tExp.artworksModal.plexusTitle}</h4>
                <p className={`text-sm ${theme.textSecondary} leading-relaxed`}>{tExp.artworksModal.plexusText}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeArtworksModal}
              className={`w-full py-3.5 px-6 ${theme.radiusControl} text-xs font-bold uppercase tracking-wider cursor-pointer ${theme.primaryBtn}`}
            >
              {tExp.artworksModal.closeBtn}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Lightbox Modal: NFT / Souvenir */}
      {mounted && isNftModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md"
          onClick={closeNftModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto ${theme.radiusCard} p-6 sm:p-8 ${theme.surface} border ${theme.border} ${theme.textPrimary} flex flex-col gap-5`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold" style={{ fontFamily: theme.displayFont }}>
                  {tStory.modal.title}
                </h3>
                <p className={`text-xs ${theme.accentText} mt-0.5`}>{tStory.modal.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={closeNftModal}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white cursor-pointer shrink-0"
                aria-label={tStory.modal.closeBtn}
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm leading-relaxed">
              <div className={`p-4 ${theme.radiusControl} ${theme.surfaceSubtle} border ${theme.border}`}>
                <strong className="font-semibold text-white block mb-1">{tStory.modal.item1Title}</strong>
                <p className={theme.textSecondary}>{tStory.modal.item1Desc}</p>
              </div>
              <div className={`p-4 ${theme.radiusControl} ${theme.surfaceSubtle} border ${theme.border}`}>
                <strong className="font-semibold text-white block mb-1">{tStory.modal.item2Title}</strong>
                <p className={theme.textSecondary}>{tStory.modal.item2Desc}</p>
              </div>
              <div className={`p-4 ${theme.radiusControl} ${theme.surfaceSubtle} border ${theme.border}`}>
                <strong className="font-semibold text-white block mb-1">{tStory.modal.item3Title}</strong>
                <p className={theme.textSecondary}>{tStory.modal.item3Desc}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeNftModal}
              className={`w-full py-3.5 px-6 ${theme.radiusControl} text-xs font-bold uppercase tracking-wider cursor-pointer ${theme.primaryBtn}`}
            >
              {tStory.modal.closeBtn}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
