'use client';

import { useState } from 'react';
import { Language, translations } from './translations';

interface NewsletterSectionProps {
  lang: Language;
}

export function NewsletterSection({ lang }: NewsletterSectionProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const t = translations[lang].newsletter;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError(true);
      return;
    }
    setError(false);
    setSubmitted(true);
  };

  return (
    <section id="newsletter" className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Main Open Panel */}
      <div className="relative rounded-none p-8 sm:p-14 bg-[rgba(14,8,22,0.78)] backdrop-blur-xl text-center flex flex-col items-center">
        {/* Category Label */}
        <div className="text-[#ff80df] text-[11px] font-bold tracking-[0.22em] uppercase mb-4">
          {t.pill}
        </div>

        {/* Headline */}
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-white tracking-tight leading-snug max-w-2xl">
          {t.headline}
        </h2>

        {/* Subline */}
        <p className="mt-4 text-sm sm:text-base text-white/80 font-normal leading-relaxed max-w-xl">
          {t.subline}
        </p>

        {/* Subscription Form */}
        <div className="w-full max-w-md mt-8">
          {submitted ? (
            <div className="p-4 sm:p-5 rounded-none bg-emerald-500/15 text-emerald-300 text-sm font-semibold flex items-center justify-center gap-3 animate-in fade-in duration-300">
              <span>{t.success}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder={t.placeholder}
                  className={`w-full px-5 py-4 rounded-none bg-white/[0.06] text-white text-sm placeholder:text-white/40 outline-none transition-colors duration-200 ${
                    error
                      ? 'bg-red-500/15'
                      : 'focus:bg-white/[0.11]'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="py-4 px-7 rounded-none font-bold text-xs tracking-[0.14em] uppercase text-white bg-gradient-to-r from-[#ff2a9d] via-[#d946ef] to-[#4ee2ec] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>{t.btn}</span>
              </button>
            </form>
          )}

          {error && (
            <p className="mt-2 text-xs text-red-400 text-left">
              {t.errorMsg}
            </p>
          )}
        </div>

        {/* Privacy Note */}
        <p className="mt-5 text-xs text-white/55">
          {t.privacyNote}
        </p>
      </div>
    </section>
  );
}
