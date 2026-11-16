'use client';

import { useState, useEffect, useCallback } from 'react';
import { Language, translations } from '../translations';

export type DesignVariant = 'original' | 'aether' | 'kinetik' | 'lumen';

export interface VariantOnepagerProps {
  lang: Language;
  myName: string;
  onNameChange: (name: string) => void;
  isHost: boolean;
  sessionId: string;
  isJoined: boolean;
  guestName?: string;
  onJoin: (name?: string) => void;
  onStart: (artwork: 'bluten' | 'plexus', mode: 'test' | 'souvenir') => void;
  onModalToggle?: (open: boolean) => void;
  isAudioMuted?: boolean;
  onToggleAudioMuted?: () => void;
  onNavigateTo: (id: string) => void;
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

function requestAndroidImmersiveFullscreen(): void {
  if (typeof navigator === 'undefined' || !/Android/i.test(navigator.userAgent)) {
    return;
  }
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
  } catch {
    // ignore fullscreen/orientation errors on unsupported browsers
  }
}

export function useOnepagerExperience({
  lang,
  myName,
  onNameChange,
  sessionId,
  onJoin,
  onStart,
  onModalToggle,
}: {
  lang: Language;
  myName: string;
  onNameChange: (name: string) => void;
  sessionId: string;
  onJoin: (name?: string) => void;
  onStart: (artwork: 'bluten' | 'plexus', mode: 'test' | 'souvenir') => void;
  onModalToggle?: (open: boolean) => void;
}) {
  const [activeMode, setActiveMode] = useState<'test' | 'souvenir'>('test');
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isArtworksModalOpen, setIsArtworksModalOpen] = useState(false);
  const [isNftModalOpen, setIsNftModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [basePath, setBasePath] = useState('');

  const tExp = translations[lang].experience;

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/artcube_lite')) {
        setBasePath('/artcube_lite');
      } else if (path.startsWith('/artcube')) {
        setBasePath('/artcube');
      }
      const baseUrl = window.location.href.split('?')[0];
      setShareUrl(`${baseUrl}?sid=${sessionId}`);
    }
  }, [sessionId]);

  const setBodyScrollLocked = useCallback((locked: boolean) => {
    onModalToggle?.(locked);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = locked ? 'hidden' : '';
    }
  }, [onModalToggle]);

  const openArtworksModal = useCallback(() => {
    setIsArtworksModalOpen(true);
    setBodyScrollLocked(true);
  }, [setBodyScrollLocked]);

  const closeArtworksModal = useCallback(() => {
    setIsArtworksModalOpen(false);
    setBodyScrollLocked(false);
  }, [setBodyScrollLocked]);

  const openNftModal = useCallback(() => {
    setIsNftModalOpen(true);
    setBodyScrollLocked(true);
  }, [setBodyScrollLocked]);

  const closeNftModal = useCallback(() => {
    setIsNftModalOpen(false);
    setBodyScrollLocked(false);
  }, [setBodyScrollLocked]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isArtworksModalOpen) closeArtworksModal();
        if (isNftModalOpen) closeNftModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [isArtworksModalOpen, isNftModalOpen, closeArtworksModal, closeNftModal]);

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      prompt(tExp.copyBtn + ':', shareUrl);
    }
  }, [shareUrl, tExp.copyBtn]);

  const handleStartArtwork = useCallback(
    (modeToStart: 'test' | 'souvenir', artworkToStart: 'bluten' | 'plexus' = 'bluten') => {
      setActiveMode(modeToStart);
      const finalName = myName.trim() || generateRandomUserName();
      if (!myName.trim()) {
        onNameChange(finalName);
      }
      requestAndroidImmersiveFullscreen();
      onStart(artworkToStart, modeToStart);
    },
    [myName, onNameChange, onStart]
  );

  const handleGuestJoin = useCallback(() => {
    const finalName = myName.trim() || generateRandomUserName();
    if (!myName.trim()) {
      onNameChange(finalName);
    }
    requestAndroidImmersiveFullscreen();
    onJoin(finalName);
  }, [myName, onNameChange, onJoin]);

  return {
    activeMode,
    setActiveMode,
    copied,
    shareUrl,
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
  };
}

