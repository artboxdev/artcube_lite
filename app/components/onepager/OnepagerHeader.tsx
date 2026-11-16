'use client';

import { useState } from 'react';
import { LuBox } from 'react-icons/lu';
import { HiMenu, HiX } from 'react-icons/hi';
import { Language, translations } from './translations';
import type { DesignVariant } from './variants/useOnepagerExperience';

interface OnepagerHeaderProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  designVariant: DesignVariant;
  onDesignVariantChange: (variant: DesignVariant) => void;
  onOpenWallet: () => void;
  onNavigateTo: (id: string) => void;
}

const DESIGN_OPTIONS: { id: DesignVariant; label: string }[] = [
  { id: 'original', label: 'Classic' },
  { id: 'aether', label: 'Aether' },
  { id: 'kinetik', label: 'Kinetik' },
  { id: 'lumen', label: 'Lumen' },
  { id: 'm3-blue', label: 'M3 Blue' },
  { id: 'm3-sakura', label: 'M3 Sakura' },
];

export function OnepagerHeader({
  lang,
  onLanguageChange,
  designVariant,
  onDesignVariantChange,
  onOpenWallet,
  onNavigateTo,
}: OnepagerHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[lang].header;

  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false);
    onNavigateTo(id);
  };

  const headerSurfaceClass =
    designVariant === 'aether'
      ? 'border-b border-[#F8FAFC]/12 backdrop-blur-xl bg-[rgba(7,9,13,0.86)]'
      : designVariant === 'kinetik'
        ? 'border-b border-white/15 backdrop-blur-xl bg-[rgba(5,6,8,0.9)]'
        : designVariant === 'lumen'
          ? 'border-b border-white/12 backdrop-blur-xl bg-[rgba(11,12,14,0.88)]'
          : designVariant === 'm3-blue'
            ? 'border-b border-white/[0.08] backdrop-blur-xl bg-[rgba(17,19,24,0.92)]'
            : designVariant === 'm3-sakura'
              ? 'border-b border-[#FFB1C8]/[0.12] backdrop-blur-xl bg-[rgba(20,18,22,0.92)]'
              : 'border-b border-white/10 backdrop-blur-xl bg-[rgba(10,5,16,0.78)]';

  return (
    <header className={`sticky top-0 left-0 right-0 z-40 h-16 transition-all duration-300 ${headerSurfaceClass}`}>
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        
        {/* Brand / Logo */}
        <button
          type="button"
          onClick={() => handleNavClick('top')}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff2a9d] to-[#7928ca] flex items-center justify-center shadow-[0_0_15px_rgba(255,42,157,0.4)] group-hover:scale-105 group-hover:shadow-[0_0_22px_rgba(255,42,157,0.7)] transition-all duration-300">
            <LuBox className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-[0.22em] text-white leading-none">
              ART<span className="text-[#ff2a9d]">.</span>CUBE
            </span>
            <span className="text-[9px] tracking-[0.25em] text-pink-300/60 uppercase font-medium mt-0.5">
              {t.claim}
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {t.navLinks.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => handleNavClick(link.href)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider text-white/70 hover:text-white hover:bg-white/[0.08] transition-all duration-200 cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Actions / CTA Buttons, Design Switcher & Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Design Variant Switcher (Desktop & Tablet) */}
          <div
            className={`hidden md:flex items-center p-0.5 border backdrop-blur-md ${
              designVariant === 'aether'
                ? 'rounded-xl bg-[#0F141C] border-[#F8FAFC]/16'
                : designVariant === 'kinetik'
                  ? 'rounded-sm bg-[#0D1017] border-white/20'
                  : designVariant === 'lumen'
                    ? 'rounded-2xl bg-[#16181D] border-white/15'
                    : designVariant === 'm3-blue'
                      ? 'rounded-full bg-[#1D2026] border-white/[0.08]'
                      : designVariant === 'm3-sakura'
                        ? 'rounded-full bg-[#211E24] border-[#FFB1C8]/[0.15]'
                        : 'rounded-full bg-white/[0.08] border-white/15 shadow-inner'
            }`}
            role="group"
            aria-label="Design variant"
          >
            {DESIGN_OPTIONS.map((opt) => {
              const isActive = designVariant === opt.id;
              const activeClass =
                designVariant === 'aether'
                  ? 'rounded-lg bg-[#38BDF8] text-[#07090D] font-bold'
                  : designVariant === 'kinetik'
                    ? 'rounded-sm bg-white text-[#050608] font-bold'
                    : designVariant === 'lumen'
                      ? 'rounded-xl bg-[#FAFAFA] text-[#0B0C0E] font-bold'
                      : designVariant === 'm3-blue'
                        ? 'rounded-full bg-[#A8C7FA] text-[#062E6F] font-bold'
                        : designVariant === 'm3-sakura'
                          ? 'rounded-full bg-[#FFB1C8] text-[#4A152B] font-bold'
                          : 'rounded-full bg-gradient-to-r from-[#ff2a9d] to-[#7928ca] text-white shadow-[0_0_12px_rgba(255,42,157,0.5)]';
              const inactiveClass =
                designVariant === 'aether'
                  ? 'rounded-lg text-[#CBD5E1] hover:text-white'
                  : designVariant === 'kinetik'
                    ? 'rounded-sm text-white/70 hover:text-white'
                    : designVariant === 'lumen'
                      ? 'rounded-xl text-[#D4D4D8] hover:text-white'
                      : designVariant === 'm3-blue'
                        ? 'rounded-full text-[#C4C6D0] hover:text-[#E2E2E9] hover:bg-white/[0.06]'
                        : designVariant === 'm3-sakura'
                          ? 'rounded-full text-[#D6C2C8] hover:text-[#EDE0E4] hover:bg-white/[0.06]'
                          : 'rounded-full text-white/65 hover:text-white hover:bg-white/[0.05]';

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onDesignVariantChange(opt.id)}
                  className={`px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                    isActive ? activeClass : inactiveClass
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenWallet}
            className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/[0.05] text-[10px] font-semibold tracking-widest text-white/80 hover:text-white hover:border-[#ff2a9d]/50 hover:bg-[#ff2a9d]/10 transition-all duration-300 cursor-pointer"
          >
            <span>{t.wallet}</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('erleben')}
            className="hidden lg:inline-flex px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-full font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-[#ff2a9d] to-[#4ee2ec] shadow-[0_0_20px_rgba(255,42,157,0.4)] hover:shadow-[0_0_30px_rgba(78,226,236,0.6)] hover:scale-[1.03] transition-all duration-300 cursor-pointer"
          >
            {t.launchArtwork}
          </button>

          {/* Bilingual Language Switcher (DE | EN) - Positioned at far right */}
          <div
            className="flex items-center rounded-full bg-white/[0.08] p-0.5 border border-white/15 backdrop-blur-md shadow-inner"
            role="group"
            aria-label="Language selection"
          >
            <button
              type="button"
              onClick={() => onLanguageChange('de')}
              className={`px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold tracking-wider transition-all duration-300 cursor-pointer ${
                lang === 'de'
                  ? 'bg-gradient-to-r from-[#ff2a9d] to-[#7928ca] text-white shadow-[0_0_12px_rgba(255,42,157,0.6)]'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
              }`}
              title="Deutsch"
            >
              DE
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold tracking-wider transition-all duration-300 cursor-pointer ${
                lang === 'en'
                  ? 'bg-gradient-to-r from-[#06b6d4] to-[#4ee2ec] text-black shadow-[0_0_12px_rgba(78,226,236,0.6)]'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
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
            className="md:hidden p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={t.menuAria}
          >
            {mobileMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Overlay Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-[rgba(12,8,22,0.98)] border-b border-pink-500/20 backdrop-blur-2xl p-5 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-2">
            {t.navLinks.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => handleNavClick(link.href)}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold tracking-wider text-white/90 hover:text-white hover:bg-pink-500/15 border border-transparent hover:border-pink-500/30 transition-all"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-3 border-t border-white/10 mt-1">
              <div className="grid grid-cols-3 gap-2 mb-3" role="group" aria-label="Design variant">
                {DESIGN_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onDesignVariantChange(opt.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      designVariant === opt.id
                        ? 'bg-white text-black border-white'
                        : 'bg-white/5 text-white/75 border-white/15 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-white/10 flex justify-between items-center">
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
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#ff2a9d] to-[#4ee2ec] text-white"
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
