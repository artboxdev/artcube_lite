'use client';

import { useState, useEffect, useCallback } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LuBox } from 'react-icons/lu';
import { PiX } from 'react-icons/pi';
import type { ExperienceDefinition } from '../lib/experience-types';
import WalletUnavailableModal from './WalletUnavailableModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StartScreenProps {
  isVisible: boolean;
  isHost: boolean;
  sessionId: string;
  myName: string;
  onNameChange: (name: string) => void;
  onJoin: () => void;
  onStart: (mode?: 'bluten' | 'plexus') => void;
  isJoined: boolean;
  experiences?: ExperienceDefinition[];
  selectedExperienceId?: string;
  onSelectExperience?: (id: string) => void;
}

export function StartScreen({
  isVisible,
  isHost,
  sessionId,
  myName,
  onNameChange,
  onJoin,
  onStart,
  isJoined,
  experiences,
  selectedExperienceId,
  onSelectExperience,
}: StartScreenProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  // Sakura v3 Modals
  const [testModeModalOpen, setTestModeModalOpen] = useState(false);
  const [souvenirModalOpen, setSouvenirModalOpen] = useState(false);
  const [showExperienceMenu, setShowExperienceMenu] = useState(false);
  const [testModeArtwork, setTestModeArtwork] = useState<'bluten' | 'plexus'>('bluten');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.href.split('?')[0];
      setShareUrl(`${baseUrl}?sid=${sessionId}`);
    }
  }, [sessionId]);

  const showToast = useCallback((_msg: string) => {}, []);

  const handleCopyLink = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      showToast('🔗 Einladungslink in Zwischenablage kopiert!');
      setTimeout(() => setCopied(false), 2400);
    } catch {
      prompt('Link für den Gast (manuell kopieren):', shareUrl);
    }
  }, [shareUrl, showToast]);

  const validateName = useCallback(() => {
    if (!myName.trim()) {
      setShowValidation(true);
      showToast('⚠️ Bitte gib zuerst deinen Namen ein!');
      setTimeout(() => setShowValidation(false), 1400);
      return false;
    }
    return true;
  }, [myName, showToast]);

  const handleOpenTestMode = useCallback(() => {
    if (!validateName()) return;
    setTestModeModalOpen(true);
  }, [validateName]);

  const handleOpenSouvenirMode = useCallback(() => {
    if (!validateName()) return;
    setSouvenirModalOpen(true);
  }, [validateName]);

  const handleStartFromTestMode = useCallback(() => {
    setTestModeModalOpen(false);
    onStart(testModeArtwork);
  }, [onStart, testModeArtwork]);

  const handleStartSouvenirArtwork = useCallback((mode: 'bluten' | 'plexus') => {
    setSouvenirModalOpen(false);
    onStart(mode);
  }, [onStart]);

  const handleGuestJoin = useCallback(() => {
    if (!validateName()) return;
    onJoin();
    showToast('✨ Beitritt erfolgreich! Warte auf den Host...');
  }, [validateName, onJoin, showToast]);

  if (!isVisible) return null;

  const currentExperience = experiences?.find((e) => e.id === selectedExperienceId);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col justify-start sm:justify-center items-center overflow-x-hidden overflow-y-auto select-none p-3 sm:p-6 pt-[max(3.5rem,calc(var(--sat)+3rem))] pb-[max(1rem,var(--sab))]",
        "bg-[rgba(8,0,12,0.45)] backdrop-blur-md text-white transition-opacity duration-700",
        !isVisible && "opacity-0 pointer-events-none"
      )}
    >

      {/* Top Header Navigation (ART.CUBE Brand & Connect Wallet) */}
      <header className="fixed top-0 left-0 right-0 z-20 h-12 border-b border-white/10 backdrop-blur-md bg-[rgba(8,0,12,0.65)]">
        <div className="grid grid-cols-12 h-full max-w-7xl mx-auto px-4 sm:px-6">
          <div className="hidden md:flex col-span-4 items-center h-full">
            <a
              href="https://art-box-landing.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium tracking-[0.2em] text-pink-200/60 hover:text-white transition-colors duration-300"
            >
              THE EXPERIENCE
            </a>
          </div>

          <div className="col-span-8 md:col-span-4 flex items-center justify-center h-full">
            <div className="font-semibold text-lg tracking-wider whitespace-nowrap flex items-center gap-2 text-white">
              <LuBox className="w-5 h-5 text-[#ff2a9d]" strokeWidth={1.75} />
              <span className="tracking-[0.18em]">ART.CUBE</span>
            </div>
          </div>

          <div className="col-span-4 flex items-center justify-end h-full">
            <button
              onClick={() => setWalletModalOpen(true)}
              className="px-4 py-1.5 rounded-full border border-[#ff2a9d]/50 bg-[#ff2a9d]/15 text-[10px] font-semibold tracking-widest text-pink-200 hover:bg-[#ff2a9d]/30 hover:border-[#ff2a9d] hover:text-white transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(255,42,157,0.2)]"
            >
              <span>CONNECT WALLET</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Center Content: Authentic Sakuraverse Lobby Card */}
      <div className="relative z-10 w-full flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-[540px]">
          {/* Lobby Card */}
          <div
            className={cn(
              "w-full rounded-[28px] sm:rounded-[34px] p-7 sm:p-10 flex flex-col gap-6 text-center",
              "bg-[rgba(18,12,28,0.88)] backdrop-blur-2xl border border-[rgba(255,105,180,0.4)]",
              "shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(255,42,157,0.25)]",
              "animate-[pulseGlow_3.5s_infinite_ease-in-out]"
            )}
            style={{
              animation: 'lobbyPulseGlow 3.5s infinite ease-in-out',
            }}
          >
            {/* Brand Title */}
            <div className="flex flex-col gap-1.5 items-center">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[5px] uppercase bg-gradient-to-br from-white via-[#ff80df] to-[#ff2a9d] bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(255,42,157,0.6)]">
                Sakuraverse
              </h1>
              <p className="text-[11px] font-semibold tracking-[3px] uppercase text-[rgba(255,200,235,0.75)]">
                A Collaborative Artwork
              </p>

              {/* Discreet Multi-Experience Pill / Switcher */}
              {experiences && experiences.length > 1 && onSelectExperience && (
                <div className="mt-2 flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => setShowExperienceMenu(!showExperienceMenu)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] tracking-widest uppercase text-white/70 hover:text-white hover:border-[#ff2a9d]/50 transition-all duration-200"
                  >
                    <span>Artwork: <strong className="text-pink-300 font-semibold">{currentExperience?.title || 'Sakura'}</strong></span>
                    <span className="text-[9px] opacity-60">▼</span>
                  </button>

                  {showExperienceMenu && (
                    <div className="mt-2 p-2 rounded-2xl bg-[rgba(12,8,20,0.95)] border border-pink-500/30 backdrop-blur-xl flex flex-col gap-1 w-full max-w-[280px] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                      {experiences.map((exp) => (
                        <button
                          key={exp.id}
                          type="button"
                          onClick={() => {
                            onSelectExperience(exp.id);
                            setShowExperienceMenu(false);
                          }}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-semibold tracking-wider text-left transition-colors flex items-center justify-between",
                            selectedExperienceId === exp.id
                              ? "bg-gradient-to-r from-pink-600/40 to-transparent text-white border-l-2 border-[#ff2a9d]"
                              : "text-white/60 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <span>{exp.title}</span>
                          {selectedExperienceId === exp.id && <span className="text-[10px] text-[#ff80df]">●</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lobby Form */}
            <div className="flex flex-col gap-5 text-left">
              {/* Name Input */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="userNameInput"
                  className="text-[11px] font-semibold tracking-[2px] uppercase text-[rgba(255,180,220,0.85)]"
                >
                  Dein Name
                </label>
                <input
                  id="userNameInput"
                  type="text"
                  value={myName}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Dein Name"
                  maxLength={18}
                  className={cn(
                    "w-full px-5 py-3.5 rounded-2xl bg-white/[0.07] border border-[rgba(255,105,180,0.35)]",
                    "text-white text-sm font-semibold tracking-wider placeholder:text-white/35 outline-none",
                    "transition-all duration-300 focus:bg-white/[0.12] focus:border-[#ff2a9d] focus:shadow-[0_0_15px_rgba(255,42,157,0.4)]",
                    showValidation && "border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.5)]"
                  )}
                />
              </div>

              {/* Host Mode Options (Testmodus vs Souvenirmodus) */}
              {isHost ? (
                <div className="grid grid-cols-1 landscape:grid-cols-2 sm:grid-cols-2 gap-3 mt-1">
                  {/* Option 1: Testmodus Card */}
                  <div className="group rounded-[20px] p-4 sm:p-5 bg-white/[0.04] border border-[rgba(255,105,180,0.28)] flex flex-col gap-3 transition-all duration-300 hover:bg-white/[0.07] hover:border-[rgba(255,42,157,0.55)] hover:shadow-[0_8px_25px_rgba(255,42,157,0.2)] hover:-translate-y-0.5">
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-bold tracking-[1.5px] uppercase text-[#ff80df]">
                        Testmodus
                      </div>
                      <div className="text-xs leading-relaxed text-white/85 font-normal">
                        Lerne das interaktive Kunstwerk allein oder mit einer weiteren Person kennen.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenTestMode}
                      className={cn(
                        "w-full py-3.5 px-5 rounded-[18px] font-bold text-xs tracking-[1.5px] uppercase cursor-pointer",
                        "bg-gradient-to-r from-[rgba(78,226,236,0.3)] to-[rgba(18,12,28,0.95)]",
                        "border border-[rgba(78,226,236,0.7)] text-white shadow-[0_4px_18px_rgba(78,226,236,0.25)]",
                        "hover:bg-gradient-to-r hover:from-[rgba(78,226,236,0.5)] hover:to-[rgba(78,226,236,0.2)]",
                        "hover:border-[#4ee2ec] hover:shadow-[0_8px_25px_rgba(78,226,236,0.45)] hover:-translate-y-0.5",
                        "transition-all duration-300 flex items-center justify-center gap-2"
                      )}
                    >
                      <span>🤝 Testmodus starten</span>
                    </button>
                  </div>

                  {/* Option 2: Souvenirmodus Card */}
                  <div className="group rounded-[20px] p-4 sm:p-5 bg-white/[0.04] border border-[rgba(255,105,180,0.28)] flex flex-col gap-3 transition-all duration-300 hover:bg-white/[0.07] hover:border-[rgba(255,42,157,0.55)] hover:shadow-[0_8px_25px_rgba(255,42,157,0.2)] hover:-translate-y-0.5">
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-bold tracking-[1.5px] uppercase text-[#ff80df]">
                        Souvenirmodus
                      </div>
                      <div className="text-xs leading-relaxed text-white/85 font-normal">
                        Interagiere mit dem Kunstwerk und erstelle am Ende dein eigenes Souvenir.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenSouvenirMode}
                      className={cn(
                        "w-full py-3.5 px-5 rounded-[18px] font-bold text-xs tracking-[1.5px] uppercase cursor-pointer",
                        "bg-gradient-to-r from-[rgba(255,42,157,0.45)] to-[rgba(18,12,28,0.95)]",
                        "border border-[rgba(255,42,157,0.8)] text-white shadow-[0_6px_22px_rgba(255,42,157,0.35)]",
                        "hover:bg-gradient-to-r hover:from-[rgba(255,42,157,0.65)] hover:to-[rgba(255,42,157,0.2)]",
                        "hover:border-[#ff2a9d] hover:shadow-[0_10px_30px_rgba(255,42,157,0.55)] hover:-translate-y-0.5",
                        "transition-all duration-300 flex items-center justify-center gap-2"
                      )}
                    >
                      <span>🎨 Souvenirmodus starten</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Guest Join Section */
                <div className="flex flex-col gap-3 mt-1">
                  {!isJoined ? (
                    <button
                      type="button"
                      onClick={handleGuestJoin}
                      className={cn(
                        "w-full py-3.5 px-5 rounded-[18px] font-bold text-xs tracking-[1.5px] uppercase cursor-pointer",
                        "bg-gradient-to-r from-[rgba(0,240,255,0.3)] to-[rgba(18,12,28,0.9)]",
                        "border border-[rgba(78,226,236,0.8)] text-white shadow-[0_4px_20px_rgba(0,240,255,0.35)]",
                        "hover:bg-gradient-to-r hover:from-[rgba(0,240,255,0.5)] hover:to-[rgba(78,226,236,0.4)]",
                        "hover:border-[#4ee2ec] hover:shadow-[0_8px_25px_rgba(0,240,255,0.55)] hover:-translate-y-0.5",
                        "transition-all duration-300 flex items-center justify-center gap-2"
                      )}
                    >
                      <span>✨ Beitreten</span>
                    </button>
                  ) : (
                    <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/15 text-center text-xs tracking-wider text-white/80 animate-pulse">
                      ⏳ Warte darauf, dass der Host das Kunstwerk startet...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          LIGHTBOX 1: Testmodus Lobby Modal
         ========================================================================= */}
      {testModeModalOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setTestModeModalOpen(false)}
        >
          <div
            className={cn(
              "relative w-full max-w-[520px] rounded-[30px] p-7 sm:p-9 text-left",
              "bg-[rgba(18,12,28,0.95)] border border-[rgba(78,226,236,0.6)]",
              "shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(78,226,236,0.35)]",
              "animate-in zoom-in-95 duration-200"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setTestModeModalOpen(false)}
              className="absolute top-6 right-6 p-1.5 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200"
              title="Zurück"
            >
              <PiX className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col gap-1 pr-8">
              <h2 className="text-2xl font-bold tracking-[2px] uppercase text-white">
                Testmodus
              </h2>
              <p className="text-xs tracking-[1px] text-[rgba(255,200,235,0.75)]">
                Allein oder mit einer weiteren Person erkunden
              </p>
            </div>

            {/* Test Lobby Body */}
            <div className="flex flex-col gap-5 mt-6">
              {/* Mitspieler einladen */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold tracking-[2px] uppercase text-[rgba(255,180,220,0.85)]">
                  Mitspieler einladen
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-2xl font-semibold text-xs tracking-wider uppercase cursor-pointer",
                      "bg-white/[0.06] border border-[rgba(78,226,236,0.5)] text-white/95",
                      "hover:bg-[rgba(78,226,236,0.2)] hover:border-[#4ee2ec] hover:-translate-y-0.5",
                      "transition-all duration-300 flex items-center justify-center gap-2",
                      copied && "bg-[rgba(0,255,163,0.25)] border-[#00ffa3] text-[#00ffa3]"
                    )}
                  >
                    <span>{copied ? '✅ Link kopiert!' : '🔗 Einladungslink kopieren'}</span>
                  </button>
                </div>
                <div className="text-[10px] font-mono text-cyan-200/50 truncate bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 select-all">
                  {shareUrl}
                </div>
              </div>

              {/* Kunstwerk Auswahl für Testmodus */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold tracking-[2px] uppercase text-[rgba(255,180,220,0.85)]">
                  Kunstwerk wählen
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTestModeArtwork('bluten')}
                    className={cn(
                      "py-2.5 px-3 rounded-2xl text-xs font-semibold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer",
                      testModeArtwork === 'bluten'
                        ? "bg-gradient-to-r from-pink-600/50 to-pink-900/50 border border-[#ff2a9d] text-white shadow-[0_0_15px_rgba(255,42,157,0.4)]"
                        : "bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08]"
                    )}
                  >
                    <span>🌸 Sumi-e</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTestModeArtwork('plexus')}
                    className={cn(
                      "py-2.5 px-3 rounded-2xl text-xs font-semibold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer",
                      testModeArtwork === 'plexus'
                        ? "bg-gradient-to-r from-cyan-600/50 to-cyan-900/50 border border-[#4ee2ec] text-white shadow-[0_0_15px_rgba(78,226,236,0.4)]"
                        : "bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08]"
                    )}
                  >
                    <span>✨ Plexus</span>
                  </button>
                </div>
              </div>

              {/* Teilnehmer Liste */}
              <div className="flex flex-col gap-2 bg-black/30 p-4 rounded-2xl border border-white/10">
                <div className="text-[10px] tracking-widest uppercase text-white/50 mb-1">
                  Teilnehmende (Max. 2)
                </div>

                {/* Host Item */}
                <div className="flex items-center justify-between text-xs text-white py-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                    <span className="font-semibold tracking-wider">{myName || 'Host'} (Du)</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium">
                    Bereit
                  </span>
                </div>

                {/* Gast Item */}
                <div className={cn(
                  "flex items-center justify-between text-xs py-1 transition-opacity",
                  isJoined ? "text-white opacity-100" : "text-white/40"
                )}>
                  <div className="flex items-center gap-2.5">
                    <span className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      isJoined ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-white/20"
                    )} />
                    <span className="font-semibold tracking-wider">Gast</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider">
                    {isJoined ? 'Bereit' : 'Warte auf Beitritt...'}
                  </span>
                </div>
              </div>

              {/* Start Artwork Button */}
              <button
                type="button"
                onClick={handleStartFromTestMode}
                className={cn(
                  "w-full py-4 px-6 rounded-3xl font-bold text-xs tracking-[2px] uppercase cursor-pointer",
                  "bg-gradient-to-r from-[rgba(255,42,157,0.85)] to-[rgba(18,12,28,0.95)]",
                  "border border-[rgba(78,226,236,0.8)] text-white",
                  "shadow-[0_10px_30px_rgba(255,42,157,0.4),0_0_20px_rgba(78,226,236,0.3)]",
                  "hover:bg-gradient-to-r hover:from-[rgba(255,42,157,0.95)] hover:to-[rgba(78,226,236,0.4)]",
                  "hover:border-[#4ee2ec] hover:shadow-[0_15px_40px_rgba(255,42,157,0.6),0_0_30px_rgba(78,226,236,0.5)]",
                  "hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-300",
                  "flex items-center justify-center gap-2 mt-2"
                )}
              >
                <span>✨ Kunstwerk starten</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          LIGHTBOX 2: Souvenir Artwork Selection Modal (Sumi-e vs Plexus)
         ========================================================================= */}
      {souvenirModalOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setSouvenirModalOpen(false)}
        >
          <div
            className={cn(
              "relative w-full max-w-[680px] rounded-[32px] p-6 sm:p-9 text-center",
              "bg-[rgba(18,12,28,0.95)] border border-[rgba(255,105,180,0.5)]",
              "shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_50px_rgba(255,42,157,0.35)]",
              "animate-in zoom-in-95 duration-200"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSouvenirModalOpen(false)}
              className="absolute top-6 right-6 p-1.5 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200"
              title="Schließen"
            >
              <PiX className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex flex-col gap-1 items-center mb-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[3px] uppercase text-white">
                Wähle dein Kunstwerk
              </h2>
              <p className="text-xs tracking-[1.5px] uppercase text-[rgba(255,200,235,0.75)]">
                Für dein persönliches 14s Video-Souvenir
              </p>
            </div>

            {/* Session Notice */}
            <div className="mb-6 p-3 sm:p-3.5 rounded-2xl bg-[rgba(255,170,0,0.12)] border border-[rgba(255,170,0,0.5)] text-amber-200 text-xs font-semibold leading-relaxed">
              ℹ️ Hinweis: Alle Teilnehmenden verlassen die aktuelle Session und machen allein im Souvenirmodus weiter.
            </div>

            {/* Artwork Selection Grid (Sumi-e vs Plexus) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
              {/* Sumi-e Card */}
              <button
                type="button"
                onClick={() => handleStartSouvenirArtwork('bluten')}
                className={cn(
                  "group relative overflow-hidden rounded-[24px] p-5 flex flex-col justify-between h-[230px]",
                  "border border-[rgba(255,105,180,0.4)] bg-gradient-to-b from-[rgba(255,42,157,0.15)] to-[rgba(18,12,28,0.9)]",
                  "hover:border-[#ff2a9d] hover:shadow-[0_10px_35px_rgba(255,42,157,0.45)] hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left"
                )}
              >
                {/* Decorative Canvas Background Simulating Cherry Blossoms */}
                <div className="absolute inset-0 opacity-40 group-hover:opacity-65 transition-opacity duration-500 bg-[radial-gradient(circle_at_70%_30%,rgba(255,60,160,0.4),transparent_60%)] pointer-events-none" />
                <div className="absolute top-4 right-4 text-3xl opacity-80 group-hover:scale-110 transition-transform duration-300">
                  🌸
                </div>

                <div className="relative z-10">
                  <span className="text-[10px] uppercase font-bold tracking-[2px] text-pink-300/80">
                    Klassischer Stil
                  </span>
                  <h3 className="text-2xl font-bold tracking-wider text-white mt-1">
                    Sumi-e
                  </h3>
                  <p className="text-xs text-white/70 mt-1.5 leading-snug">
                    Fließende Kirschblüten-Äste im japanischen Tusche- und Blütendesign.
                  </p>
                </div>

                <div className="relative z-10 w-full py-2.5 px-4 rounded-xl text-center text-xs font-bold tracking-widest uppercase bg-pink-500/30 border border-pink-400/50 text-pink-100 group-hover:bg-[#ff2a9d] group-hover:text-white transition-colors duration-300">
                  🌸 Blüten-Modus starten
                </div>
              </button>

              {/* Plexus Card */}
              <button
                type="button"
                onClick={() => handleStartSouvenirArtwork('plexus')}
                className={cn(
                  "group relative overflow-hidden rounded-[24px] p-5 flex flex-col justify-between h-[230px]",
                  "border border-[rgba(78,226,236,0.4)] bg-gradient-to-b from-[rgba(78,226,236,0.15)] to-[rgba(18,12,28,0.9)]",
                  "hover:border-[#4ee2ec] hover:shadow-[0_10px_35px_rgba(78,226,236,0.45)] hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left"
                )}
              >
                {/* Decorative Canvas Background Simulating Plexus Network */}
                <div className="absolute inset-0 opacity-40 group-hover:opacity-65 transition-opacity duration-500 bg-[radial-gradient(circle_at_70%_30%,rgba(78,226,236,0.4),transparent_60%)] pointer-events-none" />
                <div className="absolute top-4 right-4 text-3xl opacity-80 group-hover:scale-110 transition-transform duration-300">
                  ✨
                </div>

                <div className="relative z-10">
                  <span className="text-[10px] uppercase font-bold tracking-[2px] text-cyan-300/80">
                    Cybernetic Flow
                  </span>
                  <h3 className="text-2xl font-bold tracking-wider text-white mt-1">
                    Plexus
                  </h3>
                  <p className="text-xs text-white/70 mt-1.5 leading-snug">
                    Geometrische Partikel-Konstellationen und magnetisch verbundene Lichtknoten.
                  </p>
                </div>

                <div className="relative z-10 w-full py-2.5 px-4 rounded-xl text-center text-xs font-bold tracking-widest uppercase bg-cyan-500/30 border border-cyan-400/50 text-cyan-100 group-hover:bg-[#4ee2ec] group-hover:text-black transition-colors duration-300">
                  ✨ Plexus-Modus starten
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Wallet Modal */}
      <WalletUnavailableModal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
    </div>
  );
}
