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
        className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-10 bg-[rgba(18,12,28,0.98)] border border-pink-500/40 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(255,42,157,0.3)] animate-in zoom-in-95 duration-200 my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
          aria-label={t.close}
        >
          <PiX className="w-5 h-5 hover:rotate-90 transition-transform duration-300" />
        </button>

        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4 text-white">
          {t.titlePrefix} <span className="bg-gradient-to-r from-[#ff2a9d] to-[#4ee2ec] bg-clip-text text-transparent">{t.titleHighlight}</span>
        </h3>

        <div className="space-y-4 font-light text-sm text-white/80 leading-relaxed">
          <p>{t.p1}</p>
          <p>{t.p2}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-6 py-3.5 px-6 rounded-2xl font-bold text-xs tracking-wider uppercase text-white bg-gradient-to-r from-[#ff2a9d] to-[#7928ca] shadow-[0_10px_25px_rgba(255,42,157,0.4)] hover:shadow-[0_12px_30px_rgba(255,42,157,0.6)] hover:scale-[1.01] transition-all cursor-pointer"
        >
          {t.close}
        </button>
      </div>
    </div>,
    document.body
  );
}

