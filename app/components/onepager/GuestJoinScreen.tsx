'use client';

import { useState } from 'react';
import { FiVolume2, FiVolumeX } from 'react-icons/fi';
import { Language, translations } from './translations';

interface GuestJoinScreenProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  sessionId: string;
  myName: string;
  onNameChange: (name: string) => void;
  isJoined: boolean;
  onJoin: (name: string) => void;
  onDismissToWebsite: () => void;
  isAudioMuted?: boolean;
  onToggleAudioMuted?: () => void;
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
  onDismissToWebsite,
  isAudioMuted = false,
  onToggleAudioMuted,
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

    // On Android devices, initiate fullscreen and landscape orientation lock directly during this active user gesture
    if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) {
      try {
        const docEl = document.documentElement as unknown as {
          requestFullscreen?: () => Promise<void>;
          webkitRequestFullscreen?: () => void;
        };
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        }
        const screenAny = (typeof screen !== 'undefined' ? screen : null) as unknown as {
          orientation?: {
            lock?: (orientation: string) => Promise<void>;
          };
        } | null;
        if (screenAny?.orientation?.lock) {
          screenAny.orientation.lock('landscape').catch(() => {
            return screenAny?.orientation?.lock?.('landscape-primary')?.catch(() => {});
          });
        }
      } catch {}
    }

    onJoin(finalName);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-between items-center p-4 sm:p-6 md:p-8 bg-gradient-to-b from-[#08020e]/95 via-[#12071f]/95 to-[#06000c]/98 backdrop-blur-xl overflow-y-auto select-none animate-in fade-in duration-300">
      
      {/* Top Header Bar */}
      <header className="w-full max-w-xl flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#ff2a9d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c1.5 2.5 1.5 5 0 7-1.5-2-1.5-4.5 0-7zm6 3c.5 3-1 5-3 5.5 1-2.5 1-4.5 3-5.5zM6 6c2 1 2 3 3 5.5-2-.5-3.5-2.5-3-5.5zm11 9c-1 2.5-3 3-5.5 3 2-1 3-2.5 5.5-3zm-10 0c2.5.5 3.5 2 5.5 3-2.5 0-4.5-.5-5.5-3z" />
            <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.4" />
          </svg>
          <span className="font-display text-sm tracking-[0.18em] uppercase bg-gradient-to-r from-white via-pink-200 to-[#ff2a9d] bg-clip-text text-transparent">
            Sakuraverse
          </span>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1 p-0.5 rounded-none bg-white/[0.06] text-xs">
          <button
            type="button"
            onClick={() => onLanguageChange('de')}
            className={`px-2.5 py-1 rounded-none font-bold transition-colors cursor-pointer ${
              lang === 'de' ? 'bg-[#ff2a9d] text-white' : 'text-white/65 hover:text-white'
            }`}
          >
            DE
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-2.5 py-1 rounded-none font-bold transition-colors cursor-pointer ${
              lang === 'en' ? 'bg-[#4ee2ec] text-black' : 'text-white/65 hover:text-white'
            }`}
          >
            EN
          </button>
        </div>
      </header>

      {/* Main Join Console */}
      <main className="w-full max-w-lg my-auto py-4">
        <div className="relative rounded-none p-7 sm:p-10 bg-[rgba(14,8,22,0.88)] backdrop-blur-xl flex flex-col gap-6 text-center">
          
          {/* Badge & Title */}
          <div className="flex flex-col items-center gap-2.5">
            <span className="inline-flex items-center gap-2 text-pink-300 text-[11px] font-bold tracking-[0.2em] uppercase">
              <span className="w-1.5 h-1.5 rounded-none bg-[#ff2a9d] animate-ping" />
              {t.badge}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl tracking-wide uppercase text-white">
              {t.title}
            </h1>
            <p className="text-sm text-white/80 font-normal leading-relaxed max-w-md">
              {t.subtitle}
            </p>
          </div>

          {/* Session Identification Info */}
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-cyan-300 bg-white/[0.04] rounded-none py-2.5 px-3">
            <span>ID:</span>
            <span className="font-bold tracking-wider">{sessionId}</span>
          </div>

          {/* STATE 1: Before Joining -> Name Input & Join Button */}
          {!isJoined ? (
            <div className="flex flex-col gap-5 text-left">
              <div className="flex flex-col gap-2">
                <label htmlFor="guestJoinInput" className="text-xs font-bold tracking-[0.14em] uppercase text-pink-200/90 flex items-center justify-between">
                  <span>{t.nameLabel}</span>
                  <button
                    type="button"
                    onClick={handleRandomize}
                    className="text-[11px] lowercase font-normal text-pink-300/80 hover:text-pink-300 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <svg className="w-3 h-3 text-pink-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="3" width="18" height="18" rx="0" />
                      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
                      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                    </svg>
                    <span>{t.randomNameBtn}</span>
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
                    className="w-full px-5 py-4 rounded-none bg-white/[0.06] focus:bg-white/[0.11] text-white text-base font-medium placeholder:text-white/35 outline-none transition-colors duration-200"
                  />
                </div>
                <p className="text-xs text-white/55 font-normal">
                  {t.nameHint}
                </p>
              </div>

              {/* Pre-Session Sound Toggle Button */}
              <div className="flex items-center justify-center -my-1">
                <button
                  type="button"
                  onClick={onToggleAudioMuted}
                  className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-none bg-white/[0.06] hover:bg-white/[0.12] text-white/85 hover:text-white transition-colors text-xs font-medium cursor-pointer"
                  aria-label={isAudioMuted ? 'Sound anschalten' : 'Sound ausschalten'}
                >
                  {isAudioMuted ? (
                    <FiVolumeX className="w-4 h-4 text-pink-400 shrink-0" />
                  ) : (
                    <FiVolume2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  )}
                  <span className="text-center">
                    {lang === 'de'
                      ? (isAudioMuted ? 'Klicke, um den Sound in der Session wieder anzuschalten' : 'Klicke, um den Sound in der Session erst einmal auszuschalten')
                      : (isAudioMuted ? 'Click to turn sound back on in the session' : 'Click to turn off sound in the session for now')}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleJoinClick}
                className="w-full py-4 sm:py-5 px-6 rounded-none font-bold text-xs sm:text-sm tracking-[0.14em] uppercase text-white bg-gradient-to-r from-[#ff2a9d] via-[#d946ef] to-[#4ee2ec] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t.joinBtn}</span>
              </button>
            </div>
          ) : (
            /* STATE 2: After Joining -> Waiting for Host to Start */
            <div className="flex flex-col items-center gap-6 py-2 animate-in fade-in zoom-in-95 duration-300">
              
              {/* Joined Status */}
              <div className="w-full flex flex-col items-center gap-2 p-4 rounded-none bg-emerald-500/12 text-emerald-200">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse" />
                  <span>{t.joinedSuccessBadge}: {localName || myName}</span>
                </div>
                <span className="text-xs text-white/75">
                  {t.connectedWithHost}
                </span>
              </div>

              {/* Waiting Indicator & Animated Visual */}
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="relative flex items-center justify-center w-16 h-16">
                  <span className="absolute inset-0 rounded-none border border-pink-500/35 animate-ping" style={{ animationDuration: '2.5s' }} />
                  <span className="w-12 h-12 rounded-none bg-pink-500/15 flex items-center justify-center text-pink-300">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c1.5 2.5 1.5 5 0 7-1.5-2-1.5-4.5 0-7zm6 3c.5 3-1 5-3 5.5 1-2.5 1-4.5 3-5.5zM6 6c2 1 2 3 3 5.5-2-.5-3.5-2.5-3-5.5zm11 9c-1 2.5-3 3-5.5 3 2-1 3-2.5 5.5-3zm-10 0c2.5.5 3.5 2 5.5 3-2.5 0-4.5-.5-5.5-3z" />
                      <circle cx="12" cy="12" r="2" fill="currentColor" />
                    </svg>
                  </span>
                </div>
                <div className="flex flex-col gap-2 text-center max-w-sm">
                  <h3 className="font-display text-base sm:text-lg text-white tracking-wide">
                    {t.waitingForHostTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/75 leading-relaxed font-normal">
                    {t.waitingForHostDesc}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Link to dismiss overlay and view full website if desired */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onDismissToWebsite}
              className="text-xs text-white/60 hover:text-white transition-colors underline-offset-4 hover:underline cursor-pointer"
            >
              {t.exploreWebsiteBtn}
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

