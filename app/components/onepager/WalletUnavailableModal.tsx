"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PiX } from "react-icons/pi";
import { Language, translations } from "./translations";

type WalletUnavailableModalProps = {
  open: boolean;
  onClose: () => void;
  lang?: Language;
};

export default function WalletUnavailableModal({
  open,
  onClose,
  lang = 'de',
}: WalletUnavailableModalProps) {
  const [mounted, setMounted] = useState(false);
  const t = translations[lang].walletModal;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      style={{ touchAction: 'none' }}
      role="dialog"
      aria-modal="true"
      aria-label={`${t.titlePrefix} ${t.titleHighlight}`}
    >
      <div
        className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-none p-7 sm:p-10 bg-[rgba(14,8,22,0.98)] animate-in zoom-in-95 duration-200 my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-none bg-white/10 text-white/75 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          aria-label={t.close}
        >
          <PiX className="w-5 h-5" />
        </button>

        <h3 className="font-display text-xl sm:text-2xl tracking-tight mb-4 text-white pr-8">
          {t.titlePrefix} <span className="bg-gradient-to-r from-[#ff2a9d] to-[#4ee2ec] bg-clip-text text-transparent">{t.titleHighlight}</span>
        </h3>

        <div className="space-y-4 font-normal text-sm text-white/85 leading-relaxed">
          <p>{t.p1}</p>
          <p>{t.p2}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-7 py-3.5 px-6 rounded-none font-bold text-xs tracking-[0.14em] uppercase text-white bg-gradient-to-r from-[#ff2a9d] to-[#7928ca] hover:opacity-90 transition-opacity cursor-pointer"
        >
          {t.close}
        </button>
      </div>
    </div>,
    document.body
  );
}

