'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiVolume2, FiVolumeX, FiCheck, FiCopy } from 'react-icons/fi';
import { translations } from '../translations';
import { SakuraverseDualSlider } from '../SakuraverseDualSlider';
import { VariantOnepagerProps, useOnepagerExperience } from './useOnepagerExperience';

export function MonolithOnepager({
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
      className="text-[#F8FAFC] antialiased"
      style={{ fontFamily: 'var(--font-space), sans-serif' }}
    >
      {/* 1. Architectural Split Hero */}
      <section
        id="top"
        className="min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col justify-between"
      >
        <div className="border border-[#F8FAFC]/16 bg-[#0B0F15]/80">
          <div className="p-6 sm:p-12 lg:p-16 border-b border-[#F8FAFC]/16">
            <h1
              className="text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-extrabold tracking-[-0.04em] leading-[0.9] text-[#F8FAFC] uppercase"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              ART<span className="text-[#38BDF8]">.</span>CUBE
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 p-6 sm:p-10 border-b lg:border-b-0 lg:border-r border-[#F8FAFC]/16">
              <p className="max-w-[60ch] text-base sm:text-lg text-[#F8FAFC]/85 leading-relaxed whitespace-pre-line">
                {tHero.lead}
              </p>
            </div>
            <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between gap-4 bg-[#05070A]/75">
              <button
                type="button"
                onClick={() => onNavigateTo('erleben')}
                className="w-full py-4 px-6 bg-[#38BDF8] text-[#05070A] font-bold text-xs tracking-[0.14em] uppercase hover:bg-[#F8FAFC] transition-colors cursor-pointer text-left flex items-center justify-between"
              >
                <span>{tHero.btnPrimary}</span>
                <span>01</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTo('vision')}
                className="w-full py-4 px-6 border border-[#F8FAFC]/25 text-[#F8FAFC] font-bold text-xs tracking-[0.14em] uppercase hover:border-[#38BDF8] hover:text-[#38BDF8] transition-colors cursor-pointer text-left flex items-center justify-between"
              >
                <span>{tHero.btnSecondary}</span>
                <span>02</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Live Console — Strict Grid */}
      <section id="erleben" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="border border-[#F8FAFC]/16 bg-[#0B0F15]/85">
          {/* Header Cell */}
          <div className="p-6 sm:p-10 border-b border-[#F8FAFC]/16 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-6">
              <h2
                className="text-3xl sm:text-5xl font-bold tracking-[-0.03em] leading-none text-[#F8FAFC] uppercase"
                style={{ fontFamily: 'var(--font-syne), sans-serif' }}
              >
                {tExp.titlePrefix} <span className="text-[#38BDF8]">{tExp.titleHighlight}</span>
              </h2>
            </div>
            <div className="lg:col-span-6 space-y-3">
              <p className="text-sm text-[#7E8B9B] leading-relaxed max-w-[65ch]">{tExp.subline}</p>
              <button
                type="button"
                onClick={openArtworksModal}
                className="text-xs font-semibold text-[#38BDF8] hover:text-[#F8FAFC] underline underline-offset-4 cursor-pointer"
              >
                {tExp.sublineModalLink}
              </button>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Console: Session & Mode */}
            <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#F8FAFC]/16 flex flex-col justify-between">
              <div className="p-6 sm:p-8 space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#7E8B9B] mb-2">
                    {tExp.nameLabel}
                  </label>
                  <input
                    type="text"
                    value={myName}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder={isHost ? tExp.namePlaceholderHost : tExp.namePlaceholderGuest}
                    className="w-full px-4 py-3 bg-[#05070A] border border-[#F8FAFC]/20 text-sm text-[#F8FAFC] placeholder:text-[#7E8B9B]/60 focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>

                {/* Mode Switch */}
                {isHost && (
                  <div>
                    <span className="block text-xs font-semibold text-[#7E8B9B] mb-2">
                      {tExp.modeLabel}
                    </span>
                    <div className="grid grid-cols-2 border border-[#F8FAFC]/20">
                      <button
                        type="button"
                        onClick={() => setActiveMode('test')}
                        className={`p-3.5 text-left border-r border-[#F8FAFC]/20 transition-colors cursor-pointer ${
                          activeMode === 'test'
                            ? 'bg-[#38BDF8] text-[#05070A]'
                            : 'bg-[#05070A] text-[#F8FAFC] hover:bg-[#F8FAFC]/5'
                        }`}
                      >
                        <div className="text-xs font-bold uppercase tracking-wider">{tExp.testModeTitle}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveMode('souvenir')}
                        className={`p-3.5 text-left transition-colors cursor-pointer ${
                          activeMode === 'souvenir'
                            ? 'bg-[#38BDF8] text-[#05070A]'
                            : 'bg-[#05070A] text-[#F8FAFC] hover:bg-[#F8FAFC]/5'
                        }`}
                      >
                        <div className="text-xs font-bold uppercase tracking-wider">{tExp.souvenirModeTitle}</div>
                      </button>
                    </div>
                    <p className="mt-2.5 text-xs text-[#7E8B9B] leading-relaxed">
                      {activeMode === 'test' ? tExp.testModeDesc : tExp.souvenirModeDesc}
                    </p>
                  </div>
                )}

                {/* Peer Status */}
                <div className="border border-[#F8FAFC]/16 bg-[#05070A] p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#7E8B9B]">{tExp.inviteLabel}</span>
                    <span className="text-[#38BDF8] font-medium">{tExp.inviteTag}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#F8FAFC]/10 text-xs">
                    <div>
                      <span className="text-[#7E8B9B] block">{tExp.hostStatus}</span>
                      <span className="text-[#F8FAFC] font-medium">
                        {isHost ? myName || tExp.you : tExp.connected}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#7E8B9B] block">{tExp.guestStatus}</span>
                      <span className="text-[#F8FAFC] font-medium">
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
                      className="w-full py-2.5 px-4 border border-[#F8FAFC]/20 text-xs font-semibold text-[#F8FAFC] hover:border-[#38BDF8] hover:text-[#38BDF8] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {copied ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
                      <span>{copied ? tExp.copiedBtn : tExp.copyBtn}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Audio Bar */}
              {onToggleAudioMuted && (
                <button
                  type="button"
                  onClick={onToggleAudioMuted}
                  className="w-full px-6 py-4 border-t border-[#F8FAFC]/16 bg-[#05070A] text-xs font-semibold text-[#7E8B9B] hover:text-[#38BDF8] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>{isAudioMuted ? 'Audio: Off' : 'Audio: On'}</span>
                  {isAudioMuted ? <FiVolumeX className="w-4 h-4" /> : <FiVolume2 className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* Right Console: Preview & Launch */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div>
                <div className="text-xs font-semibold text-[#7E8B9B] mb-3">{tExp.sliderPrompt}</div>
                <SakuraverseDualSlider lang={lang} />
              </div>

              <div className="pt-4 border-t border-[#F8FAFC]/16">
                {isHost ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleStartArtwork(activeMode, 'bluten')}
                        className="py-4 px-5 bg-[#38BDF8] text-[#05070A] font-bold text-xs tracking-[0.12em] uppercase hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                      >
                        {activeMode === 'test' ? tExp.startTestSumieBtn : tExp.startSouvenirSumieBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartArtwork(activeMode, 'plexus')}
                        className="py-4 px-5 border border-[#F8FAFC]/30 text-[#F8FAFC] font-bold text-xs tracking-[0.12em] uppercase hover:border-[#38BDF8] hover:text-[#38BDF8] transition-colors cursor-pointer"
                      >
                        {activeMode === 'test' ? tExp.startTestPlexusBtn : tExp.startSouvenirPlexusBtn}
                      </button>
                    </div>
                    <p className="text-xs text-[#7E8B9B]">
                      {activeMode === 'souvenir' ? tExp.souvenirNotice : tExp.interactionHint}
                    </p>
                  </div>
                ) : isJoined ? (
                  <div className="p-4 border border-[#38BDF8]/40 text-sm text-[#38BDF8]">
                    {tExp.guestWaitingNotice}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGuestJoin}
                    className="w-full py-4 px-6 bg-[#38BDF8] text-[#05070A] font-bold text-xs tracking-[0.12em] uppercase hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                  >
                    {tExp.joinBtn}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Story — Architectural Grid */}
      <section id="vision" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="border border-[#F8FAFC]/16 bg-[#0B0F15]/85">
          <div className="p-6 sm:p-10 border-b border-[#F8FAFC]/16 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <h2
                className="text-3xl sm:text-5xl font-bold tracking-[-0.03em] leading-tight text-[#F8FAFC] uppercase"
                style={{ fontFamily: 'var(--font-syne), sans-serif' }}
              >
                {tStory.headlineMain}{' '}
                <span className="text-[#38BDF8]">{tStory.headlineHighlight}</span>
              </h2>
            </div>
            <div className="lg:col-span-6">
              <p className="text-sm text-[#7E8B9B] leading-relaxed max-w-[65ch]">{tStory.lead}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Phase 1 */}
            <div className="p-6 sm:p-10 border-b lg:border-b-0 lg:border-r border-[#F8FAFC]/16 space-y-6">
              <div className="aspect-video border border-[#F8FAFC]/16 bg-[#05070A] overflow-hidden">
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
              <div className="flex items-center justify-between border-b border-[#F8FAFC]/16 pb-3">
                <h3
                  className="text-2xl font-bold uppercase tracking-tight"
                  style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                >
                  {tStory.card1Title}
                </h3>
                <span className="text-xs font-semibold text-[#38BDF8]">{tStory.card1Badge}</span>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-[#F8FAFC]">{tStory.card1Item1Title}</h4>
                  <p className="text-xs text-[#7E8B9B] mt-1 leading-relaxed">{tStory.card1Item1Desc}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#F8FAFC]">{tStory.card1Item2Title}</h4>
                  <p className="text-xs text-[#7E8B9B] mt-1 leading-relaxed">{tStory.card1Item2Desc}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#F8FAFC]">{tStory.card1Item3Title}</h4>
                  <p className="text-xs text-[#7E8B9B] mt-1 leading-relaxed">
                    {tStory.card1Item3DescPrefix}{' '}
                    <span className="text-[#38BDF8] font-semibold">{tStory.card1Item3Forever}</span>{' '}
                    {tStory.card1Item3DescSuffix}{' '}
                    <button
                      type="button"
                      onClick={openNftModal}
                      className="text-[#38BDF8] underline underline-offset-4 hover:text-[#F8FAFC] cursor-pointer"
                    >
                      {tStory.card1Item3ModalLink}
                    </button>
                  </p>
                </div>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="p-6 sm:p-10 space-y-6">
              <div className="aspect-video border border-[#F8FAFC]/16 bg-[#05070A] overflow-hidden">
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
              <div className="flex items-center justify-between border-b border-[#F8FAFC]/16 pb-3">
                <h3
                  className="text-2xl font-bold uppercase tracking-tight"
                  style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                >
                  {tStory.card2Title}
                </h3>
                <span className="text-xs font-semibold text-[#7E8B9B]">{tStory.card2Badge}</span>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-[#F8FAFC]">{tStory.card2Item1Title}</h4>
                  <p className="text-xs text-[#7E8B9B] mt-1 leading-relaxed">{tStory.card2Item1Desc}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#F8FAFC]">{tStory.card2Item2Title}</h4>
                  <p className="text-xs text-[#7E8B9B] mt-1 leading-relaxed">{tStory.card2Item2Desc}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#F8FAFC]">{tStory.card2Item3Title}</h4>
                  <p className="text-xs text-[#7E8B9B] mt-1 leading-relaxed">{tStory.card2Item3Desc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Newsletter Terminal */}
      <section id="newsletter" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="border border-[#F8FAFC]/16 bg-[#0B0F15]/90 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6">
            <h2
              className="text-2xl sm:text-4xl font-bold uppercase tracking-tight text-[#F8FAFC]"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              {tNews.headline}
            </h2>
            <p className="mt-2 text-sm text-[#7E8B9B] max-w-[55ch]">{tNews.subline}</p>
          </div>
          <div className="lg:col-span-6">
            {submitted ? (
              <div className="p-4 border border-[#38BDF8] text-[#38BDF8] text-sm font-medium">
                {tNews.success}
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(false);
                  }}
                  placeholder={tNews.placeholder}
                  className="flex-1 px-4 py-3.5 bg-[#05070A] border border-[#F8FAFC]/20 text-sm text-[#F8FAFC] placeholder:text-[#7E8B9B]/60 focus:outline-none focus:border-[#38BDF8]"
                />
                <button
                  type="submit"
                  className="px-7 py-3.5 bg-[#38BDF8] text-[#05070A] text-xs font-bold uppercase tracking-[0.12em] hover:bg-[#F8FAFC] transition-colors cursor-pointer shrink-0"
                >
                  {tNews.btn}
                </button>
              </form>
            )}
            {emailError && <p className="mt-2 text-xs text-red-400">{tNews.errorMsg}</p>}
            <p className="mt-2.5 text-xs text-[#7E8B9B]">{tNews.privacyNote}</p>
          </div>
        </div>
      </section>

      {/* Artworks Modal */}
      {mounted && isArtworksModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85"
          onClick={closeArtworksModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0B0F15] border border-[#F8FAFC]/25 p-6 sm:p-10 text-[#F8FAFC]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeArtworksModal}
              className="absolute top-6 right-6 p-2 text-[#7E8B9B] hover:text-[#F8FAFC] cursor-pointer"
              aria-label={tExp.artworksModal.closeBtn}
            >
              <FiX className="w-5 h-5" />
            </button>
            <h3
              className="text-2xl font-bold uppercase mb-2"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              {tExp.artworksModal.title}
            </h3>
            <p className="text-sm text-[#7E8B9B] mb-6">{tExp.artworksModal.subtitle}</p>
            <div className="space-y-6">
              <div className="border-t border-[#F8FAFC]/16 pt-5">
                <h4 className="text-base font-bold text-[#38BDF8] mb-2">{tExp.artworksModal.sumieTitle}</h4>
                <p className="text-sm text-[#F8FAFC]/80 leading-relaxed">{tExp.artworksModal.sumieText}</p>
              </div>
              <div className="border-t border-[#F8FAFC]/16 pt-5">
                <h4 className="text-base font-bold text-[#38BDF8] mb-2">{tExp.artworksModal.plexusTitle}</h4>
                <p className="text-sm text-[#F8FAFC]/80 leading-relaxed">{tExp.artworksModal.plexusText}</p>
              </div>
            </div>
            <div className="mt-8 pt-5 border-t border-[#F8FAFC]/16 flex justify-end">
              <button
                type="button"
                onClick={closeArtworksModal}
                className="px-6 py-2.5 bg-[#38BDF8] text-[#05070A] text-xs font-bold uppercase tracking-wider cursor-pointer"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85"
          onClick={closeNftModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0B0F15] border border-[#F8FAFC]/25 p-6 sm:p-10 text-[#F8FAFC]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeNftModal}
              className="absolute top-6 right-6 p-2 text-[#7E8B9B] hover:text-[#F8FAFC] cursor-pointer"
              aria-label={tStory.modal.closeBtn}
            >
              <FiX className="w-5 h-5" />
            </button>
            <h3
              className="text-2xl font-bold uppercase mb-4"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              {tStory.modal.title}
            </h3>
            <div className="space-y-4 text-sm text-[#F8FAFC]/80 leading-relaxed">
              <p className="text-[#7E8B9B]">{tStory.modal.subtitle}</p>
              <div className="border-t border-[#F8FAFC]/16 pt-4">
                <h4 className="font-bold text-[#38BDF8] mb-1">{tStory.modal.item1Title}</h4>
                <p>{tStory.modal.item1Desc}</p>
              </div>
              <div className="border-t border-[#F8FAFC]/16 pt-4">
                <h4 className="font-bold text-[#38BDF8] mb-1">{tStory.modal.item2Title}</h4>
                <p>{tStory.modal.item2Desc}</p>
              </div>
              <div className="border-t border-[#F8FAFC]/16 pt-4">
                <h4 className="font-bold text-[#38BDF8] mb-1">{tStory.modal.item3Title}</h4>
                <p>{tStory.modal.item3Desc}</p>
              </div>
            </div>
            <div className="mt-8 pt-5 border-t border-[#F8FAFC]/16 flex justify-end">
              <button
                type="button"
                onClick={closeNftModal}
                className="px-6 py-2.5 bg-[#38BDF8] text-[#05070A] text-xs font-bold uppercase tracking-wider cursor-pointer"
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

