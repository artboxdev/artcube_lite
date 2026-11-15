'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiVolume2, FiVolumeX, FiCheck, FiCopy } from 'react-icons/fi';
import { translations } from '../translations';
import { SakuraverseDualSlider } from '../SakuraverseDualSlider';
import { VariantOnepagerProps, useOnepagerExperience } from './useOnepagerExperience';

export function PrismOnepager({
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
}: VariantOnepagerProps) {
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
    <div
      className="text-[#F0F6FC] antialiased"
      style={{ fontFamily: 'var(--font-space), sans-serif' }}
    >
      {/* 1. Spatial Light Hero */}
      <section
        id="top"
        className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between px-6 sm:px-10 lg:px-16 py-16 sm:py-24 max-w-7xl mx-auto"
      >
        <div className="pt-8 sm:pt-14">
          <h1
            className="text-6xl sm:text-8xl lg:text-[9rem] font-extrabold tracking-[-0.04em] leading-[0.88] text-[#F0F6FC]"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            art<span className="text-[#38BDF8]">.</span>cube
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pt-12 border-t border-[#F0F6FC]/12">
          <div className="lg:col-span-7">
            <p className="max-w-[58ch] text-base sm:text-xl text-[#F0F6FC]/85 font-light leading-relaxed whitespace-pre-line">
              {tHero.lead}
            </p>
          </div>
          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigateTo('erleben')}
              className="px-7 py-4 rounded-xl bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#F472B6] text-[#040912] font-bold text-xs tracking-[0.12em] uppercase hover:opacity-95 transition-opacity cursor-pointer"
            >
              {tHero.btnPrimary}
            </button>
            <button
              type="button"
              onClick={() => onNavigateTo('vision')}
              className="px-7 py-4 rounded-xl border border-[#F0F6FC]/20 bg-[#0B1424]/60 text-[#F0F6FC] font-semibold text-xs tracking-[0.12em] uppercase hover:border-[#38BDF8] hover:text-[#38BDF8] transition-colors cursor-pointer"
            >
              {tHero.btnSecondary}
            </button>
          </div>
        </div>
      </section>

      {/* 2. Experience Station — Spatial Stage */}
      <section id="erleben" className="py-20 sm:py-28 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12">
          <div className="lg:col-span-6">
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.03em] leading-[1.02]"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              {tExp.titlePrefix}{' '}
              <span className="bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#F472B6] bg-clip-text text-transparent">
                {tExp.titleHighlight}
              </span>
            </h2>
          </div>
          <div className="lg:col-span-6 space-y-3">
            <p className="text-sm sm:text-base text-[#8FA4C4] leading-relaxed max-w-[65ch]">
              {tExp.subline}
            </p>
            <button
              type="button"
              onClick={openArtworksModal}
              className="text-xs font-semibold text-[#38BDF8] hover:text-[#F472B6] underline underline-offset-4 transition-colors cursor-pointer"
            >
              {tExp.sublineModalLink}
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-[#0B1424]/80 border border-[#F0F6FC]/12 backdrop-blur-xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Left: Dual Slider + Launch */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8FA4C4]">{tExp.sliderPrompt}</span>
              {onToggleAudioMuted && (
                <button
                  type="button"
                  onClick={onToggleAudioMuted}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#040912]/60 border border-[#F0F6FC]/12 text-xs text-[#F0F6FC]/80 hover:border-[#38BDF8] hover:text-[#38BDF8] transition-colors cursor-pointer"
                >
                  {isAudioMuted ? <FiVolumeX className="w-4 h-4" /> : <FiVolume2 className="w-4 h-4" />}
                  <span>{isAudioMuted ? 'Muted' : 'Audio'}</span>
                </button>
              )}
            </div>

            <SakuraverseDualSlider lang={lang} />

            {isHost ? (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleStartArtwork(activeMode, 'bluten')}
                    className="py-4 px-5 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#040912] font-bold text-xs tracking-[0.1em] uppercase hover:opacity-95 transition-opacity cursor-pointer"
                  >
                    {activeMode === 'test' ? tExp.startTestSumieBtn : tExp.startSouvenirSumieBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartArtwork(activeMode, 'plexus')}
                    className="py-4 px-5 rounded-xl border border-[#818CF8]/45 bg-[#040912]/60 text-[#F0F6FC] font-bold text-xs tracking-[0.1em] uppercase hover:border-[#38BDF8] hover:text-[#38BDF8] transition-colors cursor-pointer"
                  >
                    {activeMode === 'test' ? tExp.startTestPlexusBtn : tExp.startSouvenirPlexusBtn}
                  </button>
                </div>
                <p className="text-xs text-[#8FA4C4]">
                  {activeMode === 'souvenir' ? tExp.souvenirNotice : tExp.interactionHint}
                </p>
              </div>
            ) : isJoined ? (
              <div className="p-4 rounded-xl border border-[#38BDF8]/40 bg-[#38BDF8]/10 text-sm text-[#38BDF8]">
                {tExp.guestWaitingNotice}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGuestJoin}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#040912] font-bold text-xs tracking-[0.12em] uppercase hover:opacity-95 transition-opacity cursor-pointer"
              >
                {tExp.joinBtn}
              </button>
            )}
          </div>

          {/* Right: Session & Mode */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-[#8FA4C4] mb-2">
                  {tExp.nameLabel}
                </label>
                <input
                  type="text"
                  value={myName}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder={isHost ? tExp.namePlaceholderHost : tExp.namePlaceholderGuest}
                  className="w-full px-4 py-3 rounded-xl bg-[#040912]/70 border border-[#F0F6FC]/15 text-sm text-[#F0F6FC] placeholder:text-[#8FA4C4]/50 focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              {isHost && (
                <div>
                  <span className="block text-xs font-medium text-[#8FA4C4] mb-2">
                    {tExp.modeLabel}
                  </span>
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveMode('test')}
                      className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                        activeMode === 'test'
                          ? 'border-[#38BDF8] bg-[#38BDF8]/10'
                          : 'border-[#F0F6FC]/12 bg-[#040912]/40 hover:border-[#F0F6FC]/30'
                      }`}
                    >
                      <div className="text-sm font-semibold text-[#F0F6FC]">{tExp.testModeTitle}</div>
                      <p className="text-xs text-[#8FA4C4] mt-1 leading-relaxed">{tExp.testModeDesc}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMode('souvenir')}
                      className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                        activeMode === 'souvenir'
                          ? 'border-[#F472B6] bg-[#F472B6]/10'
                          : 'border-[#F0F6FC]/12 bg-[#040912]/40 hover:border-[#F0F6FC]/30'
                      }`}
                    >
                      <div className="text-sm font-semibold text-[#F0F6FC]">{tExp.souvenirModeTitle}</div>
                      <p className="text-xs text-[#8FA4C4] mt-1 leading-relaxed">{tExp.souvenirModeDesc}</p>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[#040912]/65 border border-[#F0F6FC]/12 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8FA4C4]">{tExp.inviteLabel}</span>
                <span className="text-[#38BDF8] font-medium">{tExp.inviteTag}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-[#F0F6FC]/10">
                <div>
                  <span className="text-[#8FA4C4] block">{tExp.hostStatus}</span>
                  <span className="text-[#F0F6FC] font-medium">
                    {isHost ? myName || tExp.you : tExp.connected}
                  </span>
                </div>
                <div>
                  <span className="text-[#8FA4C4] block">{tExp.guestStatus}</span>
                  <span className="text-[#F0F6FC] font-medium">
                    {isHost
                      ? guestName || tExp.waiting
                      : isJoined
                        ? myName || tExp.you
                        : tExp.waiting}
                  </span>
                </div>
              </div>
              {isHost && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full py-2.5 px-4 rounded-lg border border-[#F0F6FC]/20 text-xs font-medium text-[#F0F6FC] hover:border-[#38BDF8] hover:text-[#38BDF8] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copied ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
                  <span>{copied ? tExp.copiedBtn : tExp.copyBtn}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Story Section — Asymmetric Alternating Rows */}
      <section id="vision" className="py-20 sm:py-28 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto space-y-16">
        <div className="max-w-3xl">
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.03em] leading-[1.04]"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            {tStory.headlineMain}{' '}
            <span className="bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#F472B6] bg-clip-text text-transparent">
              {tStory.headlineHighlight}
            </span>
          </h2>
          <p className="mt-5 text-sm sm:text-base text-[#8FA4C4] leading-relaxed max-w-[65ch]">
            {tStory.lead}
          </p>
        </div>

        {/* Phase 1: Image Left, Content Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-[#0B1424]/75 border border-[#F0F6FC]/12 rounded-3xl p-6 sm:p-10">
          <div className="lg:col-span-6 relative aspect-video rounded-2xl overflow-hidden bg-[#040912] border border-[#F0F6FC]/12">
            <img
              src={`${basePath}/artcube_version1_2.jpg`}
              alt={tStory.card1Title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.includes('/artcube_lite')) {
                  img.src = '/artcube_lite/artcube_version1_2.jpg';
                }
              }}
            />
            <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#040912]/80 border border-[#38BDF8]/40 text-[#38BDF8] text-[10px] font-bold tracking-widest uppercase">
              {tStory.card1Badge}
            </span>
          </div>
          <div className="lg:col-span-6 space-y-5">
            <h3
              className="text-2xl sm:text-3xl font-bold text-[#F0F6FC]"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              {tStory.card1Title}
            </h3>
            <ul className="space-y-4">
              <li>
                <h4 className="text-sm font-semibold text-[#F0F6FC]">{tStory.card1Item1Title}</h4>
                <p className="text-xs sm:text-sm text-[#8FA4C4] mt-1 leading-relaxed">{tStory.card1Item1Desc}</p>
              </li>
              <li>
                <h4 className="text-sm font-semibold text-[#F0F6FC]">{tStory.card1Item2Title}</h4>
                <p className="text-xs sm:text-sm text-[#8FA4C4] mt-1 leading-relaxed">{tStory.card1Item2Desc}</p>
              </li>
              <li>
                <h4 className="text-sm font-semibold text-[#F0F6FC]">{tStory.card1Item3Title}</h4>
                <p className="text-xs sm:text-sm text-[#8FA4C4] mt-1 leading-relaxed">
                  {tStory.card1Item3DescPrefix}{' '}
                  <span className="font-bold bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#F472B6] bg-clip-text text-transparent">
                    {tStory.card1Item3Forever}
                  </span>{' '}
                  {tStory.card1Item3DescSuffix}{' '}
                  <button
                    type="button"
                    onClick={openNftModal}
                    className="text-[#38BDF8] hover:text-[#F472B6] underline underline-offset-4 transition-colors cursor-pointer font-semibold"
                  >
                    {tStory.card1Item3ModalLink}
                  </button>
                </p>
              </li>
            </ul>
          </div>
        </div>

        {/* Phase 2: Content Left, Image Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-[#0B1424]/75 border border-[#F0F6FC]/12 rounded-3xl p-6 sm:p-10">
          <div className="lg:col-span-6 order-2 lg:order-1 space-y-5">
            <div className="flex items-baseline justify-between gap-2">
              <h3
                className="text-2xl sm:text-3xl font-bold text-[#F0F6FC]"
                style={{ fontFamily: 'var(--font-syne), sans-serif' }}
              >
                {tStory.card2Title}
              </h3>
              <span className="text-xs text-[#818CF8] font-medium">{tStory.card2Loading}</span>
            </div>
            <ul className="space-y-4">
              <li>
                <h4 className="text-sm font-semibold text-[#F0F6FC]">{tStory.card2Item1Title}</h4>
                <p className="text-xs sm:text-sm text-[#8FA4C4] mt-1 leading-relaxed">{tStory.card2Item1Desc}</p>
              </li>
              <li>
                <h4 className="text-sm font-semibold text-[#F0F6FC]">{tStory.card2Item2Title}</h4>
                <p className="text-xs sm:text-sm text-[#8FA4C4] mt-1 leading-relaxed">{tStory.card2Item2Desc}</p>
              </li>
              <li>
                <h4 className="text-sm font-semibold text-[#F0F6FC]">{tStory.card2Item3Title}</h4>
                <p className="text-xs sm:text-sm text-[#8FA4C4] mt-1 leading-relaxed">{tStory.card2Item3Desc}</p>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2 relative aspect-video rounded-2xl overflow-hidden bg-[#040912] border border-[#F0F6FC]/12">
            <img
              src={`${basePath}/artcube_version2.jpg`}
              alt={tStory.card2Title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.includes('/artcube_lite')) {
                  img.src = '/artcube_lite/artcube_version2.jpg';
                }
              }}
            />
            <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#040912]/80 border border-[#818CF8]/40 text-[#818CF8] text-[10px] font-bold tracking-widest uppercase">
              {tStory.card2Badge}
            </span>
          </div>
        </div>
      </section>

      {/* 4. Newsletter */}
      <section id="newsletter" className="py-16 sm:py-24 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-[#0B1424]/85 border border-[#F0F6FC]/12 p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6">
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#F0F6FC]"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              {tNews.headline}
            </h2>
            <p className="mt-2 text-sm text-[#8FA4C4] max-w-[54ch]">{tNews.subline}</p>
          </div>
          <div className="lg:col-span-6">
            {submitted ? (
              <div className="p-4 rounded-xl border border-[#38BDF8]/50 bg-[#38BDF8]/10 text-[#38BDF8] text-sm">
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
                  className="flex-1 px-4 py-3.5 rounded-xl bg-[#040912]/70 border border-[#F0F6FC]/15 text-sm text-[#F0F6FC] placeholder:text-[#8FA4C4]/50 focus:outline-none focus:border-[#38BDF8]"
                />
                <button
                  type="submit"
                  className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#040912] text-xs font-bold tracking-[0.12em] uppercase hover:opacity-95 transition-opacity cursor-pointer shrink-0"
                >
                  {tNews.btn}
                </button>
              </form>
            )}
            {emailError && <p className="mt-2 text-xs text-red-400">{tNews.errorMsg}</p>}
            <p className="mt-2.5 text-xs text-[#8FA4C4]/75">{tNews.privacyNote}</p>
          </div>
        </div>
      </section>

      {/* Lightbox Modal: Artworks (mit beiden Bildern!) */}
      {mounted && isArtworksModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={closeArtworksModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0B1424] border border-[#38BDF8]/30 p-6 sm:p-8 text-[#F0F6FC]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeArtworksModal}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-[#8FA4C4] hover:text-[#F0F6FC] cursor-pointer"
              aria-label={tExp.artworksModal.closeBtn}
            >
              <FiX className="w-5 h-5" />
            </button>
            <h3
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              {tExp.artworksModal.title}
            </h3>
            <p className="text-xs text-[#38BDF8] mb-6">{tExp.artworksModal.subtitle}</p>

            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#040912]/70 border border-[#F0F6FC]/12 space-y-4">
                <div className="w-full max-h-[300px] overflow-hidden rounded-xl border border-[#F0F6FC]/15 bg-[#f7f5f0]">
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
                  <h4 className="text-lg font-bold text-[#F472B6] mb-1">{tExp.artworksModal.sumieTitle}</h4>
                  <p className="text-sm text-[#F0F6FC]/80 leading-relaxed">{tExp.artworksModal.sumieText}</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#040912]/70 border border-[#F0F6FC]/12 space-y-4">
                <div className="w-full max-h-[300px] overflow-hidden rounded-xl border border-[#F0F6FC]/15 bg-[#0d0914]">
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
                  <h4 className="text-lg font-bold text-[#38BDF8] mb-1">{tExp.artworksModal.plexusTitle}</h4>
                  <p className="text-sm text-[#F0F6FC]/80 leading-relaxed">{tExp.artworksModal.plexusText}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closeArtworksModal}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#040912] text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                {tExp.artworksModal.closeBtn}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Lightbox Modal: NFT / Souvenir */}
      {mounted && isNftModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={closeNftModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0B1424] border border-[#38BDF8]/30 p-6 sm:p-8 text-[#F0F6FC]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeNftModal}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-[#8FA4C4] hover:text-[#F0F6FC] cursor-pointer"
              aria-label={tStory.modal.closeBtn}
            >
              <FiX className="w-5 h-5" />
            </button>
            <h3
              className="text-xl font-bold mb-1"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              {tStory.modal.title}
            </h3>
            <p className="text-xs text-[#38BDF8] mb-5">{tStory.modal.subtitle}</p>
            <div className="space-y-4 text-sm text-[#F0F6FC]/80 leading-relaxed">
              <div className="p-4 rounded-xl bg-[#040912]/70 border border-[#F0F6FC]/12">
                <h4 className="font-semibold text-[#38BDF8] mb-1">{tStory.modal.item1Title}</h4>
                <p>{tStory.modal.item1Desc}</p>
              </div>
              <div className="p-4 rounded-xl bg-[#040912]/70 border border-[#F0F6FC]/12">
                <h4 className="font-semibold text-[#818CF8] mb-1">{tStory.modal.item2Title}</h4>
                <p>{tStory.modal.item2Desc}</p>
              </div>
              <div className="p-4 rounded-xl bg-[#040912]/70 border border-[#F0F6FC]/12">
                <h4 className="font-semibold text-[#F472B6] mb-1">{tStory.modal.item3Title}</h4>
                <p>{tStory.modal.item3Desc}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closeNftModal}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#040912] text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                {tStory.modal.closeBtn}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

