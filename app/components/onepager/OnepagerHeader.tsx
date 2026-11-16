'use client';

import { useState } from 'react';
import { LuBox } from 'react-icons/lu';
import { HiMenu, HiX } from 'react-icons/hi';
import { Language, translations } from './translations';

interface OnepagerHeaderProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenWallet: () => void;
  onNavigateTo: (id: string) => void;
}

export function OnepagerHeader({
  lang,
  onLanguageChange,
  onOpenWallet,
  onNavigateTo,
}: OnepagerHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[lang].header;

  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false);
    onNavigateTo(id);
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-40 h-16 backdrop-blur-xl bg-[rgba(10,5,16,0.78)] transition-all duration-300">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        
        {/* Brand / Logo */}
        <button
          type="button"
          onClick={() => handleNavClick('top')}
          className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none shrink-0"
        >
          <div className="w-8 h-8 rounded-none bg-gradient-to-br from-[#ff2a9d] to-[#7928ca] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <LuBox className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-sm sm:text-base tracking-[0.22em] text-white leading-none">
              ART<span className="text-[#ff2a9d]">.</span>CUBE
            </span>
            <span className="text-[10px] tracking-[0.22em] text-pink-200/70 uppercase font-medium mt-1">
              {t.claim}
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-4">
          {t.navLinks.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => handleNavClick(link.href)}
              className="px-3 py-1.5 rounded-none text-xs font-medium tracking-wider text-white/75 hover:text-white hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Actions / CTA Buttons & Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenWallet}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-none bg-white/[0.06] text-[11px] font-semibold tracking-widest text-white/85 hover:text-white hover:bg-[#ff2a9d]/20 transition-all duration-300 cursor-pointer"
          >
            <span>{t.wallet}</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('erleben')}
            className="hidden sm:inline-flex px-4 py-2 rounded-none font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-[#ff2a9d] to-[#4ee2ec] hover:opacity-90 transition-all duration-300 cursor-pointer"
          >
            {t.launchArtwork}
          </button>

          {/* Bilingual Language Switcher (DE | EN) - Positioned at far right */}
          <div
            className="flex items-center rounded-none bg-white/[0.06] p-0.5"
            role="group"
            aria-label="Language selection"
          >
            <button
              type="button"
              onClick={() => onLanguageChange('de')}
              className={`px-2.5 py-1.5 rounded-none text-[11px] font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                lang === 'de'
                  ? 'bg-[#ff2a9d] text-white'
                  : 'text-white/65 hover:text-white hover:bg-white/[0.05]'
              }`}
              title="Deutsch"
            >
              DE
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1.5 rounded-none text-[11px] font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                lang === 'en'
                  ? 'bg-[#4ee2ec] text-black'
                  : 'text-white/65 hover:text-white hover:bg-white/[0.05]'
              }`}
              title="English"
            >
              EN
            </button>
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-none text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={t.menuAria}
          >
            {mobileMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Overlay Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-[rgba(12,8,22,0.96)] backdrop-blur-2xl p-5 animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-2">
            {t.navLinks.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => handleNavClick(link.href)}
                className="w-full text-left px-4 py-3 rounded-none text-sm font-semibold tracking-wider text-white/90 hover:text-white hover:bg-pink-500/15 transition-all"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-3 flex justify-between items-center mt-1">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenWallet();
                }}
                className="text-xs font-semibold tracking-widest text-pink-300 uppercase py-2 px-3"
              >
                {t.connectWallet}
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('erleben')}
                className="px-4 py-2.5 rounded-none text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#ff2a9d] to-[#4ee2ec] text-white"
              >
                {t.launchArtwork}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
