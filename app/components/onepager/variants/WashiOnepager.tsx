'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiVolume2, FiVolumeX, FiCheck, FiCopy } from 'react-icons/fi';
import { translations } from '../translations';
import { SakuraverseDualSlider } from '../SakuraverseDualSlider';
import { VariantOnepagerProps, useOnepagerExperience } from './useOnepagerExperience';

export function WashiOnepager({
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
      className="text-[#F7F4EE] antialiased"
      style={{ fontFamily: 'var(--font-jakarta), sans-serif' }}
    >
      {/* 1. Zen Gallery Hero */}
      <section
        id="top"
        className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-20 max-w-6xl mx-auto"
      >
        <div className="border-l-2 border-[#D4B483]/60 pl-6 sm:pl-12 py-4 max-w-4xl">
          <h1
            className="text-6xl sm:text-8xl md:text-[7.5rem] font-normal tracking-[-0.025em] leading-[0.95] text-[#F7F4EE]"
            style={{ fontFamily: 'var(--font-cormorant), serif' }}
          >
            art<span className="text-[#E07A8A]">.</span>cube
          </h1>

          <p className="mt-8 max-w-[58ch] text-base sm:text-xl text-[#F7F4EE]/85 font-light leading-[1.8] whitespace-pre-line">
            {tHero.lead}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigateTo('erleben')}
              className="px-7 py-3.5 rounded-sm bg-[#E07A8A] text-[#110F0E] text-xs font-bold tracking-[0.12em] uppercase hover:bg-[#F7F4EE] transition-colors cursor-pointer"
            >
              {tHero.btnPrimary}
            </button>
            <button
              type="button"
              onClick={() => onNavigateTo('vision')}
              className="px-7 py-3.5 rounded-sm border border-[#D4B483]/50 text-[#F7F4EE] text-xs font-medium tracking-[0.12em] uppercase hover:border-[#E07A8A] hover:text-[#E07A8A] transition-colors cursor-pointer"
            >
              {tHero.btnSecondary}
            </button>
          </div>
        </div>
      </section>

      {/* 2. Experience Station — Washi Paper & Sumi Ink Contrast */}
      <section id="erleben" className="py-20 sm:py-28 px-6 sm:px-10 lg:px-16 max-w-6xl mx-auto">
        <div className="max-w-3xl mb-12">
          <h2
            className="text-4xl sm:text-6xl font-normal tracking-tight leading-[1.06] text-[#F7F4EE]"
            style={{ fontFamily: 'var(--font-cormorant), serif' }}
          >
            {tExp.titlePrefix}{' '}
            <span className="italic bg-gradient-to-r from-[#E07A8A] to-[#D4B483] bg-clip-text text-transparent">
              {tExp.titleHighlight}
            </span>
          </h2>
          <p className="mt-5 text-sm sm:text-base text-[#F7F4EE]/80 font-light leading-[1.75] max-w-[65ch]">
            {tExp.subline}{' '}
            <button
              type="button"
              onClick={openArtworksModal}
              className="text-[#E07A8A] hover:text-[#D4B483] underline underline-offset-4 transition-colors cursor-pointer font-medium"
            >
              {tExp.sublineModalLink}
            </button>
          </p>
        </div>

        {/* Washi Paper Console */}
        <div className="bg-[#F7F4EE] text-[#1C1917] rounded-sm p-6 sm:p-10 shadow-[0_25px_70px_rgba(0,0,0,0.55)] border border-[#D4B483]/40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left: Interactive Slider + Launch */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between border-b border-[#1C1917]/15 pb-3">
                <span className="text-xs font-medium text-[#57534E]">{tExp.sliderPrompt}</span>
                {onToggleAudioMuted && (
                  <button
                    type="button"
                    onClick={onToggleAudioMuted}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1C1917]/75 hover:text-[#C24A5E] transition-colors cursor-pointer"
                  >
                    {isAudioMuted ? <FiVolumeX className="w-4 h-4" /> : <FiVolume2 className="w-4 h-4" />}
                    <span>{isAudioMuted ? 'Muted' : 'Audio'}</span>
                  </button>
                )}
              </div>

              <div className="rounded-sm overflow-hidden bg-[#110F0E] p-2">
                <SakuraverseDualSlider lang={lang} />
              </div>

              {isHost ? (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleStartArtwork(activeMode, 'bluten')}
                      className="py-3.5 px-5 rounded-sm bg-[#1C1917] text-[#F7F4EE] text-xs font-bold tracking-[0.1em] uppercase hover:bg-[#C24A5E] transition-colors cursor-pointer"
                    >
                      {activeMode === 'test' ? tExp.startTestSumieBtn : tExp.startSouvenirSumieBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartArtwork(activeMode, 'plexus')}
                      className="py-3.5 px-5 rounded-sm border border-[#1C1917]/30 text-[#1C1917] text-xs font-bold tracking-[0.1em] uppercase hover:border-[#C24A5E] hover:text-[#C24A5E] transition-colors cursor-pointer"
                    >
                      {activeMode === 'test' ? tExp.startTestPlexusBtn : tExp.startSouvenirPlexusBtn}
                    </button>
                  </div>
                  <p className="text-xs text-[#57534E]">
                    {activeMode === 'souvenir' ? tExp.souvenirNotice : tExp.interactionHint}
                  </p>
                </div>
              ) : isJoined ? (
                <div className="p-4 border border-[#C24A5E]/40 bg-[#C24A5E]/10 text-sm text-[#1C1917]">
                  {tExp.guestWaitingNotice}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGuestJoin}
                  className="w-full py-3.5 px-6 rounded-sm bg-[#1C1917] text-[#F7F4EE] text-xs font-bold tracking-[0.12em] uppercase hover:bg-[#C24A5E] transition-colors cursor-pointer"
                >
                  {tExp.joinBtn}
                </button>
              )}
            </div>

            {/* Right: Session Controls */}
            <div className="lg:col-span-5 space-y-6 lg:border-l lg:border-[#1C1917]/15 lg:pl-8">
              <div>
                <label className="block text-xs font-semibold text-[#57534E] mb-2">
                  {tExp.nameLabel}
                </label>
                <input
                  type="text"
                  value={myName}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder={isHost ? tExp.namePlaceholderHost : tExp.namePlaceholderGuest}
                  className="w-full bg-white/70 border border-[#1C1917]/20 px-4 py-3 rounded-sm text-sm text-[#1C1917] placeholder:text-[#57534E]/60 focus:outline-none focus:border-[#C24A5E]"
                />
              </div>

              {isHost && (
                <div>
                  <span className="block text-xs font-semibold text-[#57534E] mb-2">
                    {tExp.modeLabel}
                  </span>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setActiveMode('test')}
                      className={`w-full text-left p-3.5 rounded-sm border transition-colors cursor-pointer ${
                        activeMode === 'test'
                          ? 'border-[#C24A5E] bg-[#C24A5E]/8'
                          : 'border-[#1C1917]/15 hover:border-[#1C1917]/40'
                      }`}
                    >
                      <div className="text-sm font-bold text-[#1C1917]">{tExp.testModeTitle}</div>
                      <p className="text-xs text-[#57534E] mt-1 leading-relaxed">{tExp.testModeDesc}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMode('souvenir')}
                      className={`w-full text-left p-3.5 rounded-sm border transition-colors cursor-pointer ${
                        activeMode === 'souvenir'
                          ? 'border-[#C24A5E] bg-[#C24A5E]/8'
                          : 'border-[#1C1917]/15 hover:border-[#1C1917]/40'
                      }`}
                    >
                      <div className="text-sm font-bold text-[#1C1917]">{tExp.souvenirModeTitle}</div>
                      <p className="text-xs text-[#57534E] mt-1 leading-relaxed">{tExp.souvenirModeDesc}</p>
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[#1C1917]/15 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#57534E]">{tExp.inviteLabel}</span>
                  <span className="font-semibold text-[#C24A5E]">{tExp.inviteTag}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs py-2">
                  <div>
                    <span className="text-[#57534E] block">{tExp.hostStatus}</span>
                    <span className="font-semibold text-[#1C1917]">
                      {isHost ? myName || tExp.you : tExp.connected}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#57534E] block">{tExp.guestStatus}</span>
                    <span className="font-semibold text-[#1C1917]">
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
                    className="w-full py-2.5 px-4 rounded-sm border border-[#1C1917]/25 text-xs font-semibold text-[#1C1917] hover:border-[#C24A5E] hover:text-[#C24A5E] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copied ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
                    <span>{copied ? tExp.copiedBtn : tExp.copyBtn}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Story Section — Exhibition Plates */}
      <section id="vision" className="py-20 sm:py-28 px-6 sm:px-10 lg:px-16 max-w-6xl mx-auto">
        <div className="max-w-3xl mb-14">
          <h2
            className="text-4xl sm:text-6xl font-normal tracking-tight leading-[1.06] text-[#F7F4EE]"
            style={{ fontFamily: 'var(--font-cormorant), serif' }}
          >
            {tStory.headlineMain}{' '}
            <span className="italic bg-gradient-to-r from-[#E07A8A] to-[#D4B483] bg-clip-text text-transparent">
              {tStory.headlineHighlight}
            </span>
          </h2>
          <p className="mt-5 text-sm sm:text-base text-[#F7F4EE]/80 font-light leading-[1.8] max-w-[65ch]">
            {tStory.lead}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          {/* Phase 1 */}
          <article className="bg-[#1C1917]/90 border border-[#D4B483]/25 p-6 sm:p-8 rounded-sm space-y-6">
            <div className="relative aspect-video overflow-hidden bg-[#110F0E]">
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
              <span className="absolute top-3 left-3 px-3 py-1 bg-[#110F0E]/85 text-[#E07A8A] text-[10px] font-bold tracking-widest uppercase">
                {tStory.card1Badge}
              </span>
            </div>

            <h3
              className="text-3xl font-normal text-[#F7F4EE]"
              style={{ fontFamily: 'var(--font-cormorant), serif' }}
            >
              {tStory.card1Title}
            </h3>

            <ul className="space-y-4 border-t border-[#D4B483]/20 pt-5">
              <li>
                <h4 className="text-sm font-semibold text-[#F7F4EE]">{tStory.card1Item1Title}</h4>
                <p className="text-xs sm:text-sm text-[#B6AFA6] mt-1 leading-relaxed">{tStory.card1Item1Desc}</p>
              </li>
              <li>
                <h4 className="text-sm font-semibold text-[#F7F4EE]">{tStory.card1Item2Title}</h4>
                <p className="text-xs sm:text-sm text-[#B6AFA6] mt-1 leading-relaxed">{tStory.card1Item2Desc}</p>
              </li>
              <li>
                <h4 className="text-sm font-semibold text-[#F7F4EE]">{tStory.card1Item3Title}</h4>
                <p className="text-xs sm:text-sm text-[#B6AFA6] mt-1 leading-relaxed">
                  {tStory.card1Item3DescPrefix}{' '}
                  <span className="font-bold bg-gradient-to-r from-[#E07A8A] to-[#D4B483] bg-clip-text text-transparent">
                    {tStory.card1Item3Forever}
                  </span>{' '}
                  {tStory.card1Item3DescSuffix}{' '}
                  <button
                    type="button"
                    onClick={openNftModal}
                    className="text-[#E07A8A] hover:text-[#D4B483] underline underline-offset-4 transition-colors cursor-pointer font-medium"
                  >
                    {tStory.card1Item3ModalLink}
                  </button>
                </p>
              </li>
            </ul>
          </article>

          {/* Phase 2 */}
          <article className="bg-[#1C1917]/90 border border-[#D4B483]/25 p-6 sm:p-8 rounded-sm space-y-6">
            <div className="relative aspect-video overflow-hidden bg-[#110F0E]">
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
              <span className="absolute top-3 left-3 px-3 py-1 bg-[#110F0E]/85 text-[#D4B483] text-[10px] font-bold tracking-widest uppercase">
                {tStory.card2Badge}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <h3
                className="text-3xl font-normal text-[#F7F4EE]"
                style={{ fontFamily: 'var(--font-cormorant), serif' }}
              >
                {tStory.card2Title}
              </h3>
              <span className="text-xs text-[#D4B483]">{tStory.card2Loading}</span>
            </div>

            <ul className="space-y-4 border-t border-[#D4B483]/20 pt-5">
              <li>
                <h4 className="text-sm font-semibold text-[#F7F4EE]">{tStory.card2Item1Title}</h4>
                <p className="text-xs sm:text-sm text-[#B6AFA6] mt-1 leading-relaxed">{tStory.card2Item1Desc}</p>
              </li>
              <li>
                <h4 className="text-sm font-semibold text-[#F7F4EE]">{tStory.card2Item2Title}</h4>
                <p className="text-xs sm:text-sm text-[#B6AFA6] mt-1 leading-relaxed">{tStory.card2Item2Desc}</p>
              </li>
              <li>
                <h4 className="text-sm font-semibold text-[#F7F4EE]">{tStory.card2Item3Title}</h4>
                <p className="text-xs sm:text-sm text-[#B6AFA6] mt-1 leading-relaxed">{tStory.card2Item3Desc}</p>
              </li>
            </ul>
          </article>
        </div>
      </section>

      {/* 4. Newsletter */}
      <section id="newsletter" className="py-16 sm:py-24 px-6 sm:px-10 lg:px-16 max-w-6xl mx-auto">
        <div className="border-y border-[#D4B483]/30 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6">
            <h2
              className="text-3xl sm:text-4xl font-normal text-[#F7F4EE]"
              style={{ fontFamily: 'var(--font-cormorant), serif' }}
            >
              {tNews.headline}
            </h2>
            <p className="mt-2 text-sm text-[#B6AFA6] max-w-[52ch]">{tNews.subline}</p>
          </div>
          <div className="lg:col-span-6">
            {submitted ? (
              <div className="p-4 border border-[#E07A8A]/50 text-[#E07A8A] text-sm">
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
                  className="flex-1 bg-[#1C1917] border border-[#D4B483]/30 px-4 py-3 text-sm text-[#F7F4EE] placeholder:text-[#B6AFA6]/60 focus:outline-none focus:border-[#E07A8A]"
                />
                <button
                  type="submit"
                  className="px-7 py-3 bg-[#E07A8A] text-[#110F0E] text-xs font-bold tracking-[0.12em] uppercase hover:bg-[#F7F4EE] transition-colors cursor-pointer shrink-0"
                >
                  {tNews.btn}
                </button>
              </form>
            )}
            {emailError && <p className="mt-2 text-xs text-red-400">{tNews.errorMsg}</p>}
            <p className="mt-2.5 text-xs text-[#B6AFA6]/80">{tNews.privacyNote}</p>
          </div>
        </div>
      </section>

      {/* Lightbox Modal: Artworks (mit beiden Bildern!) */}
      {mounted && isArtworksModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={closeArtworksModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1C1917] border border-[#D4B483]/40 p-6 sm:p-8 text-[#F7F4EE]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeArtworksModal}
              className="absolute top-5 right-5 p-2 text-[#B6AFA6] hover:text-[#F7F4EE] cursor-pointer"
              aria-label={tExp.artworksModal.closeBtn}
            >
              <FiX className="w-5 h-5" />
            </button>
            <h3
              className="text-3xl font-normal mb-1"
              style={{ fontFamily: 'var(--font-cormorant), serif' }}
            >
              {tExp.artworksModal.title}
            </h3>
            <p className="text-xs text-[#D4B483] mb-6">{tExp.artworksModal.subtitle}</p>

            <div className="space-y-6">
              <div className="border-t border-[#D4B483]/20 pt-5 space-y-4">
                <div className="w-full max-h-[300px] overflow-hidden border border-[#D4B483]/25 bg-[#f7f5f0]">
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
                  <h4 className="text-lg font-medium text-[#E07A8A] mb-1">{tExp.artworksModal.sumieTitle}</h4>
                  <p className="text-sm text-[#F7F4EE]/80 leading-relaxed">{tExp.artworksModal.sumieText}</p>
                </div>
              </div>

              <div className="border-t border-[#D4B483]/20 pt-5 space-y-4">
                <div className="w-full max-h-[300px] overflow-hidden border border-[#D4B483]/25 bg-[#0d0914]">
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
                  <h4 className="text-lg font-medium text-[#D4B483] mb-1">{tExp.artworksModal.plexusTitle}</h4>
                  <p className="text-sm text-[#F7F4EE]/80 leading-relaxed">{tExp.artworksModal.plexusText}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#D4B483]/20 flex justify-end">
              <button
                type="button"
                onClick={closeArtworksModal}
                className="px-6 py-2.5 bg-[#E07A8A] text-[#110F0E] text-xs font-bold uppercase tracking-wider cursor-pointer"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={closeNftModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#1C1917] border border-[#D4B483]/40 p-6 sm:p-8 text-[#F7F4EE]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeNftModal}
              className="absolute top-5 right-5 p-2 text-[#B6AFA6] hover:text-[#F7F4EE] cursor-pointer"
              aria-label={tStory.modal.closeBtn}
            >
              <FiX className="w-5 h-5" />
            </button>
            <h3
              className="text-2xl font-normal mb-1"
              style={{ fontFamily: 'var(--font-cormorant), serif' }}
            >
              {tStory.modal.title}
            </h3>
            <p className="text-xs text-[#D4B483] mb-5">{tStory.modal.subtitle}</p>
            <div className="space-y-4 text-sm text-[#F7F4EE]/80 leading-relaxed">
              <div className="border-t border-[#D4B483]/20 pt-4">
                <h4 className="font-semibold text-[#E07A8A] mb-1">{tStory.modal.item1Title}</h4>
                <p>{tStory.modal.item1Desc}</p>
              </div>
              <div className="border-t border-[#D4B483]/20 pt-4">
                <h4 className="font-semibold text-[#E07A8A] mb-1">{tStory.modal.item2Title}</h4>
                <p>{tStory.modal.item2Desc}</p>
              </div>
              <div className="border-t border-[#D4B483]/20 pt-4">
                <h4 className="font-semibold text-[#E07A8A] mb-1">{tStory.modal.item3Title}</h4>
                <p>{tStory.modal.item3Desc}</p>
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-[#D4B483]/20 flex justify-end">
              <button
                type="button"
                onClick={closeNftModal}
                className="px-6 py-2.5 bg-[#E07A8A] text-[#110F0E] text-xs font-bold uppercase tracking-wider cursor-pointer"
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

