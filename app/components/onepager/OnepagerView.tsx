'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { OnepagerHeader } from './OnepagerHeader';
import { HeroSection } from './HeroSection';
import { ExperienceStation } from './ExperienceStation';
import { StorySection } from './StorySection';
import { NewsletterSection } from './NewsletterSection';
import { OnepagerFooter } from './OnepagerFooter';
import WalletUnavailableModal from '../WalletUnavailableModal';
import { Language } from './translations';

interface OnepagerViewProps {
  isVisible: boolean;
  isHost: boolean;
  sessionId: string;
  myName: string;
  onNameChange: (name: string) => void;
  onJoin: () => void;
  onStart: (artwork: 'bluten' | 'plexus', mode?: 'test' | 'souvenir') => void;
  isJoined: boolean;
}

export function OnepagerView({
  isVisible,
  isHost,
  sessionId,
  myName,
  onNameChange,
  onJoin,
  onStart,
  isJoined,
}: OnepagerViewProps) {
  const [lang, setLang] = useState<Language>('de');
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Restore language from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedLang = localStorage.getItem('artcube_language') as Language | null;
        if (storedLang === 'de' || storedLang === 'en') {
          setLang(storedLang);
        }
      } catch {
        // ignore localStorage errors
      }
    }
  }, []);

  // Save language changes to localStorage
  const handleLanguageChange = useCallback((newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem('artcube_language', newLang);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('artcube-language-change', { detail: newLang }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Scroll locking for open modals (Lightbox, Wallet, Legal)
  const handleModalToggle = useCallback((open: boolean) => {
    if (containerRef.current) {
      if (open) {
        containerRef.current.style.overflowY = 'hidden';
      } else {
        containerRef.current.style.overflowY = 'auto';
      }
    }
  }, []);

  // Restore name from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('artcube_user_name');
        if (stored && !myName) {
          onNameChange(stored);
        }
      } catch {
        // ignore localStorage errors
      }
    }
  }, [myName, onNameChange]);

  // Save name changes
  const handleNameUpdate = useCallback((val: string) => {
    onNameChange(val);
    try {
      localStorage.setItem('artcube_user_name', val);
    } catch {
      // ignore
    }
  }, [onNameChange]);

  const handleNavigateTo = useCallback((id: string) => {
    if (id === 'top') {
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleOpenWallet = useCallback(() => {
    setWalletModalOpen(true);
    handleModalToggle(true);
  }, [handleModalToggle]);

  const handleCloseWallet = useCallback(() => {
    setWalletModalOpen(false);
    handleModalToggle(false);
  }, [handleModalToggle]);

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 overflow-x-hidden overflow-y-auto select-none transition-opacity duration-700 scroll-smooth bg-[rgba(8,0,14,0.45)] backdrop-blur-[2px] text-white ${
        !isVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 1. Sticky Glassmorphic Header with Language Switcher */}
      <OnepagerHeader
        lang={lang}
        onLanguageChange={handleLanguageChange}
        onOpenWallet={handleOpenWallet}
        onNavigateTo={handleNavigateTo}
      />

      {/* 2. Hero Section */}
      <HeroSection lang={lang} onNavigateTo={handleNavigateTo} />

      {/* 3. Live Experience Station (Unified Sakuraverse Artworks & Launch Console) - Swapped to follow Hero immediately */}
      <ExperienceStation
        lang={lang}
        myName={myName}
        onNameChange={handleNameUpdate}
        isHost={isHost}
        sessionId={sessionId}
        isJoined={isJoined}
        onJoin={onJoin}
        onStart={onStart}
        onModalToggle={handleModalToggle}
      />

      {/* 4. Story Section: Was ist art.cube? (Story & Vision) - Swapped to follow Experience Station */}
      <StorySection lang={lang} onModalToggle={handleModalToggle} />

      {/* 5. Newsletter Section */}
      <NewsletterSection lang={lang} />

      {/* 7. Footer */}
      <OnepagerFooter
        lang={lang}
        onScrollToTop={() => handleNavigateTo('top')}
        onModalToggle={handleModalToggle}
      />

      {/* Wallet Unavailable Modal */}
      <WalletUnavailableModal
        open={walletModalOpen}
        onClose={handleCloseWallet}
        lang={lang}
      />
    </div>
  );
}
