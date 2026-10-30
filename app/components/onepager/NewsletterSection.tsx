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
      
      {/* Background Ambience Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[300px] bg-gradient-to-r from-pink-600/15 via-purple-600/15 to-cyan-500/15 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Main Glass Card */}
      <div className="relative rounded-[32px] sm:rounded-[40px] p-8 sm:p-14 bg-[rgba(16,10,26,0.92)] border border-pink-500/30 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(255,42,157,0.18)] text-center flex flex-col items-center">
        
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-300 text-[11px] font-bold tracking-[0.2em] uppercase mb-4">
          {t.pill}
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-2xl">
          {t.headline}
        </h2>

        {/* Subline */}
        <p className="mt-4 text-sm sm:text-base text-white/75 font-light leading-relaxed max-w-xl">
          {t.subline}
        </p>

        {/* Subscription Form */}
        <div className="w-full max-w-md mt-8">
          {submitted ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/15 border border-emerald-400/50 text-emerald-300 text-sm font-semibold flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(52,211,153,0.3)] animate-in fade-in duration-300">
              <span>{t.success}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder={t.placeholder}
                  className={`w-full px-5 py-4 rounded-2xl bg-white/[0.06] border text-white text-sm placeholder:text-white/35 outline-none transition-all duration-300 ${
                    error
                      ? 'border-red-400 shadow-[0_0_18px_rgba(248,113,113,0.5)]'
                      : 'border-white/15 focus:border-[#ff2a9d] focus:bg-white/[0.1] focus:shadow-[0_0_20px_rgba(255,42,157,0.35)]'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="py-4 px-7 rounded-2xl font-bold text-sm tracking-wider uppercase text-white bg-gradient-to-r from-[#ff2a9d] via-[#d946ef] to-[#06b6d4] shadow-[0_8px_25px_rgba(255,42,157,0.45)] hover:shadow-[0_12px_35px_rgba(78,226,236,0.6)] hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>{t.btn}</span>
              </button>
            </form>
          )}

          {error && (
            <p className="mt-2 text-xs text-red-400 text-left pl-2">
              {t.errorMsg}
            </p>
          )}
        </div>

        {/* Privacy Note */}
        <p className="mt-5 text-[11px] text-white/50 tracking-wider">
          {t.privacyNote}
        </p>

      </div>
    </section>
  );
}
