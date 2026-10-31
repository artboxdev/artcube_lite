'use client';

import { useState } from 'react';
import { Language, translations } from './translations';

interface GuestJoinScreenProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  sessionId: string;
  myName: string;
  onNameChange: (name: string) => void;
  isJoined: boolean;
  onJoin: (name: string) => void;
  onStart: (artwork: 'bluten' | 'plexus', mode: 'test' | 'souvenir') => void;
  onDismissToWebsite: () => void;
}

function generateRandomUserName(): string {
  const digits = '0123456789';
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const chars: string[] = [];
  for (let i = 0; i < 3; i++) {
    chars.push(digits[Math.floor(Math.random() * digits.length)]);
    chars.push(letters[Math.floor(Math.random() * letters.length)]);
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
  }
  return `user${chars.join('')}`;
}

export function GuestJoinScreen({
  lang,
  onLanguageChange,
  sessionId,
  myName,
  onNameChange,
  isJoined,
  onJoin,
  onStart,
  onDismissToWebsite,
}: GuestJoinScreenProps) {
  const [localName, setLocalName] = useState(myName || '');
  const t = translations[lang].guestJoin;

  const handleRandomize = () => {
    const rand = generateRandomUserName();
    setLocalName(rand);
    onNameChange(rand);
  };

  const handleJoinClick = () => {
    const finalName = localName.trim() || myName.trim() || generateRandomUserName();
    setLocalName(finalName);
    onNameChange(finalName);
    onJoin(finalName);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-between items-center p-4 sm:p-6 md:p-8 bg-gradient-to-b from-[#08020e]/95 via-[#12071f]/95 to-[#06000c]/98 backdrop-blur-xl overflow-y-auto select-none animate-in fade-in duration-300">
      
      {/* Top Header Bar */}
      <header className="w-full max-w-xl flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌸</span>
          <span className="text-sm font-extrabold tracking-[2px] uppercase bg-gradient-to-r from-white via-pink-200 to-[#ff2a9d] bg-clip-text text-transparent">
            Sakuraverse
          </span>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/[0.06] border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => onLanguageChange('de')}
            className={`px-2.5 py-1 rounded-full font-bold transition-all ${
              lang === 'de' ? 'bg-[#ff2a9d] text-white shadow-[0_0_10px_#ff2a9d]' : 'text-white/60 hover:text-white'
            }`}
          >
            DE
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-2.5 py-1 rounded-full font-bold transition-all ${
              lang === 'en' ? 'bg-[#ff2a9d] text-white shadow-[0_0_10px_#ff2a9d]' : 'text-white/60 hover:text-white'
            }`}
          >
            EN
          </button>
        </div>
      </header>

      {/* Main Join Console Card */}
      <main className="w-full max-w-lg my-auto py-4">
        <div className="relative rounded-[32px] p-6 sm:p-8 md:p-10 bg-[rgba(18,10,28,0.92)] border border-pink-500/40 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.85),0_0_60px_rgba(255,42,157,0.3)] flex flex-col gap-6 text-center">
          
          {/* Badge & Title */}
          <div className="flex flex-col items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/40 text-pink-300 text-[10px] font-bold tracking-[2px] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff2a9d] animate-ping" />
              {t.badge}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide uppercase bg-gradient-to-r from-white via-pink-100 to-[#ff80df] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(255,42,157,0.5)]">
              {t.title}
            </h1>
            <p className="text-xs sm:text-sm text-white/75 font-light leading-relaxed max-w-md">
              {t.subtitle}
            </p>
          </div>

          {/* Session Identification Info */}
          <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-cyan-300/80 bg-cyan-950/40 border border-cyan-500/30 rounded-xl py-2 px-3">
            <span>ID:</span>
            <span className="font-bold tracking-wider">{sessionId}</span>
          </div>

          {/* STATE 1: Before Joining -> Name Input & Join Button */}
          {!isJoined ? (
            <div className="flex flex-col gap-5 text-left">
              <div className="flex flex-col gap-2">
                <label htmlFor="guestJoinInput" className="text-xs font-bold tracking-[1.5px] uppercase text-pink-200/90 flex items-center justify-between">
                  <span>{t.nameLabel}</span>
                  <button
                    type="button"
                    onClick={handleRandomize}
                    className="text-[10px] lowercase font-normal text-pink-300/70 hover:text-pink-300 hover:underline cursor-pointer"
                  >
                    🎲 {t.randomNameBtn}
                  </button>
                </label>
                <div className="relative">
                  <input
                    id="guestJoinInput"
                    type="text"
                    value={localName}
                    onChange={(e) => {
                      setLocalName(e.target.value);
                      onNameChange(e.target.value);
                    }}
                    placeholder={t.namePlaceholder}
                    maxLength={20}
                    className="w-full px-5 py-4 rounded-2xl bg-white/[0.06] border border-pink-500/35 focus:border-[#ff2a9d] focus:bg-white/[0.1] focus:shadow-[0_0_25px_rgba(255,42,157,0.45)] text-white text-base font-semibold tracking-wide placeholder:text-white/30 outline-none transition-all duration-300"
                  />
                </div>
                <p className="text-[10px] text-white/45 font-light">
                  {t.nameHint}
                </p>
              </div>

              <button
                type="button"
                onClick={handleJoinClick}
                className="w-full py-4 sm:py-5 px-6 rounded-2xl font-extrabold text-sm sm:text-base tracking-[2px] uppercase text-white bg-gradient-to-r from-[#ff2a9d] via-[#d946ef] to-[#06b6d4] shadow-[0_10px_35px_rgba(255,42,157,0.45)] hover:shadow-[0_15px_45px_rgba(255,42,157,0.7)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>✨</span>
                <span>{t.joinBtn}</span>
              </button>
            </div>
          ) : (
            /* STATE 2: After Joining -> Joined Badge & Immediate Start Options */
            <div className="flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-300">
              
              {/* Joined Status Pill */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-200">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse" />
                  <span>{t.joinedSuccessBadge}: {localName || myName}</span>
                </div>
                <span className="text-[11px] text-white/70">
                  {t.connectedWithHost} ✓
                </span>
              </div>

              {/* Ready prompt */}
              <div className="flex flex-col gap-1 text-center">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {t.readyToStartTitle}
                </h3>
                <p className="text-xs text-white/70 leading-relaxed font-light">
                  {t.readyToStartDesc}
                </p>
              </div>

              {/* Action Buttons to Launch Session */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => onStart('bluten', 'test')}
                  className="flex-1 py-4 px-5 rounded-2xl font-extrabold text-xs sm:text-sm tracking-[1.5px] uppercase text-white bg-gradient-to-r from-[#ff2a9d] to-[#d946ef] shadow-[0_8px_25px_rgba(255,42,157,0.4)] hover:shadow-[0_12px_35px_rgba(255,42,157,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t.startTestBlutenBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onStart('plexus', 'test')}
                  className="flex-1 py-4 px-5 rounded-2xl font-extrabold text-xs sm:text-sm tracking-[1.5px] uppercase text-white bg-gradient-to-r from-[#06b6d4] to-[#0284c7] shadow-[0_8px_25px_rgba(6,182,212,0.4)] hover:shadow-[0_12px_35px_rgba(6,182,212,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t.startTestPlexusBtn}</span>
                </button>
              </div>
            </div>
          )}

          {/* Link to dismiss overlay and view full website if desired */}
          <div className="pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onDismissToWebsite}
              className="text-xs text-white/50 hover:text-white/80 transition-colors underline-offset-4 hover:underline cursor-pointer"
            >
              {t.exploreWebsiteBtn} →
            </button>
          </div>

        </div>
      </main>

      {/* Footer Branding */}
      <footer className="w-full max-w-xl text-center py-2">
        <p className="text-[10px] text-white/40 tracking-[1.5px] uppercase">
          art.cube · Collaborative Generative Media
        </p>
      </footer>

    </div>
  );
}

