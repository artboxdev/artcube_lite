'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiVolume2, FiVolumeX, FiCheck, FiCopy } from 'react-icons/fi';
import { translations } from '../translations';
import { SakuraverseDualSlider } from '../SakuraverseDualSlider';
import { VariantOnepagerProps, useOnepagerExperience } from './useOnepagerExperience';

export function AtelierOnepager({
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
      className="text-[#F5F2EB] antialiased"
      style={{ fontFamily: 'var(--font-jakarta), sans-serif' }}
    >
      {/* 1. Asymmetric Editorial Hero */}
      <section
        id="top"
        className="relative min-h-[calc(100vh-4rem)] flex items-end pb-16 sm:pb-24 pt-20 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-[#F5F2EB]/12"
      >
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-end">
          <div className="lg:col-span-8">
            <h1
              className="text-[4.25rem] sm:text-[6.5rem] lg:text-[8.5rem] font-normal tracking-[-0.03em] leading-[0.9] text-[#F5F2EB]"
              style={{ fontFamily: 'var(--font-cormorant), serif' }}
            >
              art<span className="italic text-[#E8C5B0]">.</span>cube
            </h1>
            <p className="mt-8 max-w-[62ch] text-base sm:text-xl text-[#F5F2EB]/85 font-light leading-[1.7] whitespace-pre-line">
              {tHero.lead}
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col items-start lg:items-end justify-end gap-4 border-t lg:border-t-0 lg:border-l border-[#F5F2EB]/15 pt-8 lg:pt-0 lg:pl-10">
            <p className="text-xs text-[#A8A298] leading-relaxed lg:text-right max-w-xs">
              Sakuraverse — Sumi-e &amp; Plexus
            </p>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto lg:w-full">
              <button
                type="button"
                onClick={() => onNavigateTo('erleben')}
                className="w-full px-6 py-3.5 bg-[#F5F2EB] text-[#0C0B0A] text-xs font-semibold tracking-[0.12em] uppercase hover:bg-[#E8C5B0] transition-colors cursor-pointer text-center"
              >
                {tHero.btnPrimary}
              </button>
              <button
                type="button"
                onClick={() => onNavigateTo('vision')}
                className="w-full px-6 py-3.5 border border-[#F5F2EB]/25 text-[#F5F2EB] text-xs font-medium tracking-[0.12em] uppercase hover:border-[#E8C5B0] hover:text-[#E8C5B0] transition-colors cursor-pointer text-center"
              >
                {tHero.btnSecondary}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Experience Station — Curated Exhibition Catalog */}
      <section
        id="erleben"
        className="py-20 sm:py-28 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-[#F5F2EB]/12"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mb-14">
          <div className="lg:col-span-5">
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-0.02em] leading-[1.05] text-[#F5F2EB]"
              style={{ fontFamily: 'var(--font-cormorant), serif' }}
            >
              {tExp.titlePrefix}{' '}
              <span className="italic text-[#E8C5B0]">{tExp.titleHighlight}</span>
            </h2>
          </div>
          <div className="lg:col-span-7 flex flex-col justify-between gap-4">
            <p className="max-w-[65ch] text-sm sm:text-base text-[#F5F2EB]/80 font-light leading-[1.75]">
              {tExp.subline}
            </p>
            <div>
              <button
                type="button"
                onClick={openArtworksModal}
                className="text-xs font-medium text-[#E8C5B0] border-b border-[#E8C5B0]/50 pb-0.5 hover:text-[#F5F2EB] hover:border-[#F5F2EB] transition-colors cursor-pointer"
              >
                {tExp.sublineModalLink}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left: Interactive Preview & Launch */}
          <div className="lg:col-span-7 bg-[#161513]/85 border border-[#F5F2EB]/12 p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4 pb-4 mb-5 border-b border-[#F5F2EB]/10">
              <span className="text-xs text-[#A8A298]">{tExp.sliderPrompt}</span>
              {onToggleAudioMuted && (
                <button
                  type="button"
                  onClick={onToggleAudioMuted}
                  className="inline-flex items-center gap-2 text-xs text-[#F5F2EB]/75 hover:text-[#E8C5B0] transition-colors cursor-pointer"
                >
                  {isAudioMuted ? <FiVolumeX className="w-4 h-4" /> : <FiVolume2 className="w-4 h-4" />}
                  <span>{isAudioMuted ? 'Muted' : 'Audio'}</span>
                </button>
              )}
            </div>

            <SakuraverseDualSlider lang={lang} />

            {/* Launch Controls */}
            <div className="mt-7 pt-6 border-t border-[#F5F2EB]/12">
              {isHost ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleStartArtwork(activeMode, 'bluten')}
                      className="px-5 py-3.5 bg-[#F5F2EB] text-[#0C0B0A] text-xs font-semibold tracking-[0.1em] uppercase hover:bg-[#E8C5B0] transition-colors cursor-pointer"
                    >
                      {activeMode === 'test' ? tExp.startTestSumieBtn : tExp.startSouvenirSumieBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartArtwork(activeMode, 'plexus')}
                      className="px-5 py-3.5 border border-[#F5F2EB]/30 text-[#F5F2EB] text-xs font-semibold tracking-[0.1em] uppercase hover:border-[#E8C5B0] hover:text-[#E8C5B0] transition-colors cursor-pointer"
                    >
                      {activeMode === 'test' ? tExp.startTestPlexusBtn : tExp.startSouvenirPlexusBtn}
                    </button>
                  </div>
                  <p className="text-xs text-[#A8A298] leading-relaxed">
                    {activeMode === 'souvenir' ? tExp.souvenirNotice : tExp.interactionHint}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {isJoined ? (
                    <p className="text-sm text-[#E8C5B0] py-2">{tExp.guestWaitingNotice}</p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGuestJoin}
                      className="w-full px-6 py-3.5 bg-[#F5F2EB] text-[#0C0B0A] text-xs font-semibold tracking-[0.12em] uppercase hover:bg-[#E8C5B0] transition-colors cursor-pointer"
                    >
                      {tExp.joinBtn}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Session & Mode Configuration */}
          <div className="lg:col-span-5 space-y-8 bg-[#161513]/75 border border-[#F5F2EB]/12 p-6 sm:p-8">
            {/* Name */}
            <div className="pb-6 border-b border-[#F5F2EB]/10">
              <label className="block text-xs font-medium text-[#A8A298] mb-2">
                {tExp.nameLabel}
              </label>
              <input
                type="text"
                value={myName}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder={isHost ? tExp.namePlaceholderHost : tExp.namePlaceholderGuest}
                className="w-full bg-transparent border-b border-[#F5F2EB]/25 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#A8A298]/50 focus:outline-none focus:border-[#E8C5B0] transition-colors"
              />
            </div>

            {/* Mode Selection */}
            {isHost && (
              <div className="pb-6 border-b border-[#F5F2EB]/10">
                <span className="block text-xs font-medium text-[#A8A298] mb-3">
                  {tExp.modeLabel}
                </span>
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveMode('test')}
                    className={`w-full text-left p-4 border transition-colors cursor-pointer ${
                      activeMode === 'test'
                        ? 'border-[#E8C5B0] bg-[#E8C5B0]/10'
                        : 'border-[#F5F2EB]/12 hover:border-[#F5F2EB]/30'
                    }`}
                  >
                    <div className="text-sm font-semibold text-[#F5F2EB]">{tExp.testModeTitle}</div>
                    <p className="text-xs text-[#A8A298] mt-1 leading-relaxed">{tExp.testModeDesc}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMode('souvenir')}
                    className={`w-full text-left p-4 border transition-colors cursor-pointer ${
                      activeMode === 'souvenir'
                        ? 'border-[#E8C5B0] bg-[#E8C5B0]/10'
                        : 'border-[#F5F2EB]/12 hover:border-[#F5F2EB]/30'
                    }`}
                  >
                    <div className="text-sm font-semibold text-[#F5F2EB]">{tExp.souvenirModeTitle}</div>
                    <p className="text-xs text-[#A8A298] mt-1 leading-relaxed">{tExp.souvenirModeDesc}</p>
                  </button>
                </div>
              </div>
            )}

            {/* Invite / Status */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A8A298]">{tExp.inviteLabel}</span>
                <span className="text-[#E8C5B0]">{tExp.inviteTag}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-y border-[#F5F2EB]/10 text-xs">
                <div>
                  <span className="text-[#A8A298] block">{tExp.hostStatus}</span>
                  <span className="text-[#F5F2EB] font-medium mt-0.5 block">
                    {isHost ? `${myName || tExp.you}` : tExp.connected}
                  </span>
                </div>
                <div>
                  <span className="text-[#A8A298] block">{tExp.guestStatus}</span>
                  <span className="text-[#F5F2EB] font-medium mt-0.5 block">
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
                  className="w-full py-3 px-4 border border-[#F5F2EB]/25 text-xs font-medium text-[#F5F2EB] hover:border-[#E8C5B0] hover:text-[#E8C5B0] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copied ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
                  <span>{copied ? tExp.copiedBtn : tExp.copyBtn}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Story Section — Museum Essay */}
      <section
        id="vision"
        className="py-20 sm:py-28 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto border-b border-[#F5F2EB]/12"
      >
        <div className="max-w-3xl mb-16">
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-0.02em] leading-[1.06] text-[#F5F2EB]"
            style={{ fontFamily: 'var(--font-cormorant), serif' }}
          >
            {tStory.headlineMain}{' '}
            <span className="italic text-[#E8C5B0]">{tStory.headlineHighlight}</span>
          </h2>
          <p className="mt-6 max-w-[65ch] text-sm sm:text-base text-[#F5F2EB]/80 font-light leading-[1.8]">
            {tStory.lead}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Phase 1 */}
          <article className="space-y-6">
            <div className="relative aspect-video overflow-hidden bg-[#161513] border border-[#F5F2EB]/12">
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
            </div>
            <div className="flex items-baseline justify-between border-b border-[#F5F2EB]/12 pb-3">
              <h3
                className="text-2xl sm:text-3xl font-normal text-[#F5F2EB]"
                style={{ fontFamily: 'var(--font-cormorant), serif' }}
              >
                {tStory.card1Title}
              </h3>
              <span className="text-xs text-[#E8C5B0]">{tStory.card1Badge}</span>
            </div>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-[#F5F2EB]">{tStory.card1Item1Title}</dt>
                <dd className="text-xs sm:text-sm text-[#A8A298] mt-1 leading-relaxed">{tStory.card1Item1Desc}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-[#F5F2EB]">{tStory.card1Item2Title}</dt>
                <dd className="text-xs sm:text-sm text-[#A8A298] mt-1 leading-relaxed">{tStory.card1Item2Desc}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-[#F5F2EB]">{tStory.card1Item3Title}</dt>
                <dd className="text-xs sm:text-sm text-[#A8A298] mt-1 leading-relaxed">
                  {tStory.card1Item3DescPrefix}{' '}
                  <span className="text-[#E8C5B0] font-medium">{tStory.card1Item3Forever}</span>{' '}
                  {tStory.card1Item3DescSuffix}{' '}
                  <button
                    type="button"
                    onClick={openNftModal}
                    className="text-[#E8C5B0] underline underline-offset-4 hover:text-[#F5F2EB] transition-colors cursor-pointer"
                  >
                    {tStory.card1Item3ModalLink}
                  </button>
                </dd>
              </div>
            </dl>
          </article>

          {/* Phase 2 */}
          <article className="space-y-6">
            <div className="relative aspect-video overflow-hidden bg-[#161513] border border-[#F5F2EB]/12">
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
            </div>
            <div className="flex items-baseline justify-between border-b border-[#F5F2EB]/12 pb-3">
              <h3
                className="text-2xl sm:text-3xl font-normal text-[#F5F2EB]"
                style={{ fontFamily: 'var(--font-cormorant), serif' }}
              >
                {tStory.card2Title}
              </h3>
              <span className="text-xs text-[#A8A298]">{tStory.card2Badge}</span>
            </div>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-[#F5F2EB]">{tStory.card2Item1Title}</dt>
                <dd className="text-xs sm:text-sm text-[#A8A298] mt-1 leading-relaxed">{tStory.card2Item1Desc}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-[#F5F2EB]">{tStory.card2Item2Title}</dt>
                <dd className="text-xs sm:text-sm text-[#A8A298] mt-1 leading-relaxed">{tStory.card2Item2Desc}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-[#F5F2EB]">{tStory.card2Item3Title}</dt>
                <dd className="text-xs sm:text-sm text-[#A8A298] mt-1 leading-relaxed">{tStory.card2Item3Desc}</dd>
              </div>
            </dl>
          </article>
        </div>
      </section>

      {/* 4. Minimalist Newsletter Bar */}
      <section id="newsletter" className="py-20 sm:py-24 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-[#161513]/85 border border-[#F5F2EB]/12 p-8 sm:p-12">
          <div className="lg:col-span-6">
            <h2
              className="text-3xl sm:text-4xl font-normal text-[#F5F2EB] leading-tight"
              style={{ fontFamily: 'var(--font-cormorant), serif' }}
            >
              {tNews.headline}
            </h2>
            <p className="mt-3 text-sm text-[#A8A298] leading-relaxed max-w-[55ch]">
              {tNews.subline}
            </p>
          </div>

          <div className="lg:col-span-6">
            {submitted ? (
              <div className="p-4 border border-[#E8C5B0]/50 text-[#E8C5B0] text-sm">
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
                  className="flex-1 bg-transparent border-b border-[#F5F2EB]/30 py-3 px-1 text-sm text-[#F5F2EB] placeholder:text-[#A8A298]/60 focus:outline-none focus:border-[#E8C5B0]"
                />
                <button
                  type="submit"
                  className="px-7 py-3 bg-[#F5F2EB] text-[#0C0B0A] text-xs font-semibold tracking-[0.12em] uppercase hover:bg-[#E8C5B0] transition-colors cursor-pointer shrink-0"
                >
                  {tNews.btn}
                </button>
              </form>
            )}
            {emailError && <p className="mt-2 text-xs text-red-400">{tNews.errorMsg}</p>}
            <p className="mt-3 text-xs text-[#A8A298]/70">{tNews.privacyNote}</p>
          </div>
        </div>
      </section>

      {/* Artworks Modal */}
      {mounted && isArtworksModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={closeArtworksModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#161513] border border-[#F5F2EB]/20 p-6 sm:p-10 text-[#F5F2EB]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeArtworksModal}
              className="absolute top-6 right-6 p-2 text-[#A8A298] hover:text-[#F5F2EB] cursor-pointer"
              aria-label={tExp.artworksModal.closeBtn}
            >
              <FiX className="w-5 h-5" />
            </button>
            <h3
              className="text-3xl font-normal mb-2"
              style={{ fontFamily: 'var(--font-cormorant), serif' }}
            >
              {tExp.artworksModal.title}
            </h3>
            <p className="text-sm text-[#A8A298] mb-8">{tExp.artworksModal.subtitle}</p>
            <div className="space-y-8">
              <div className="border-t border-[#F5F2EB]/12 pt-6 space-y-4">
                <div className="w-full max-h-[280px] overflow-hidden border border-[#F5F2EB]/15 bg-[#f7f5f0]">
                  <img
                    src={`${basePath}/sumie_about.jpg`}
                    alt={tExp.artworksModal.sumieImageAlt}
                    className="w-full h-auto max-h-[280px] object-cover block"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.src.includes('/artcube_lite')) {
                        img.src = '/artcube_lite/sumie_about.jpg';
                      }
                    }}
                  />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-[#E8C5B0] mb-2">{tExp.artworksModal.sumieTitle}</h4>
                  <p className="text-sm text-[#F5F2EB]/80 leading-relaxed">{tExp.artworksModal.sumieText}</p>
                </div>
              </div>
              <div className="border-t border-[#F5F2EB]/12 pt-6 space-y-4">
                <div className="w-full max-h-[280px] overflow-hidden border border-[#F5F2EB]/15 bg-[#0d0914]">
                  <img
                    src={`${basePath}/plexus_about.jpg`}
                    alt={tExp.artworksModal.plexusTitle}
                    className="w-full h-auto max-h-[280px] object-cover block"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.src.includes('/artcube_lite')) {
                        img.src = '/artcube_lite/plexus_about.jpg';
                      }
                    }}
                  />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-[#E8C5B0] mb-2">{tExp.artworksModal.plexusTitle}</h4>
                  <p className="text-sm text-[#F5F2EB]/80 leading-relaxed">{tExp.artworksModal.plexusText}</p>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-[#F5F2EB]/12 flex justify-end">
              <button
                type="button"
                onClick={closeArtworksModal}
                className="px-6 py-2.5 bg-[#F5F2EB] text-[#0C0B0A] text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                {tExp.artworksModal.closeBtn}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* NFT / Souvenir Modal */}
      {mounted && isNftModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={closeNftModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#161513] border border-[#F5F2EB]/20 p-6 sm:p-10 text-[#F5F2EB]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeNftModal}
              className="absolute top-6 right-6 p-2 text-[#A8A298] hover:text-[#F5F2EB] cursor-pointer"
              aria-label={tStory.modal.closeBtn}
            >
              <FiX className="w-5 h-5" />
            </button>
            <h3
              className="text-3xl font-normal mb-4"
              style={{ fontFamily: 'var(--font-cormorant), serif' }}
            >
              {tStory.modal.title}
            </h3>
            <div className="space-y-4 text-sm text-[#F5F2EB]/80 leading-relaxed">
              <p className="text-[#A8A298]">{tStory.modal.subtitle}</p>
              <div className="border-t border-[#F5F2EB]/12 pt-4">
                <h4 className="font-medium text-[#E8C5B0] mb-1">{tStory.modal.item1Title}</h4>
                <p>{tStory.modal.item1Desc}</p>
              </div>
              <div className="border-t border-[#F5F2EB]/12 pt-4">
                <h4 className="font-medium text-[#E8C5B0] mb-1">{tStory.modal.item2Title}</h4>
                <p>{tStory.modal.item2Desc}</p>
              </div>
              <div className="border-t border-[#F5F2EB]/12 pt-4">
                <h4 className="font-medium text-[#E8C5B0] mb-1">{tStory.modal.item3Title}</h4>
                <p>{tStory.modal.item3Desc}</p>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-[#F5F2EB]/12 flex justify-end">
              <button
                type="button"
                onClick={closeNftModal}
                className="px-6 py-2.5 bg-[#F5F2EB] text-[#0C0B0A] text-xs font-semibold uppercase tracking-wider cursor-pointer"
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

