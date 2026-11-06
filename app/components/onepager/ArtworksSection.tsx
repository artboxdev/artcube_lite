'use client';

import { FiArrowRight, FiCheck } from 'react-icons/fi';

interface ArtworksSectionProps {
  activeArtwork: 'bluten' | 'plexus';
  onSelectArtwork: (artwork: 'bluten' | 'plexus') => void;
  onNavigateTo: (id: string) => void;
}

export function ArtworksSection({ activeArtwork, onSelectArtwork, onNavigateTo }: ArtworksSectionProps) {
  const handleSelect = (artwork: 'bluten' | 'plexus') => {
    onSelectArtwork(artwork);
    onNavigateTo('erleben');
  };

  return (
    <section id="sakuraverse" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-300 text-[11px] font-bold tracking-[0.2em] uppercase mb-4">
          Die Kunstwerke
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Willkommen im{' '}
          <span className="bg-gradient-to-r from-[#ff80df] via-[#ff2a9d] to-[#4ee2ec] bg-clip-text text-transparent">
            Sakuraverse.
          </span>
        </h2>
        <p className="mt-4 text-sm sm:text-base text-white/75 font-light leading-relaxed">
          Zwei kontrastreiche Ästhetiken, eine kollaborative Welt: Wählt zwischen der Poesie traditioneller Tuschemalerei und der dynamischen Energie cybernetischer Lichtnetzwerke.
        </p>
      </div>

      {/* Artworks Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Card 1: Sumi-e */}
        <div
          className={`relative rounded-[32px] p-7 sm:p-9 bg-[rgba(18,12,28,0.85)] border backdrop-blur-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1 ${
            activeArtwork === 'bluten'
              ? 'border-[#ff2a9d] shadow-[0_20px_50px_rgba(255,42,157,0.35)]'
              : 'border-pink-500/25 hover:border-pink-500/60 shadow-[0_15px_40px_rgba(0,0,0,0.5)]'
          }`}
        >
          {/* Decorative Background Glow & Motif */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-pink-500/20 via-pink-900/10 to-transparent blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between gap-3 mb-6">
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-pink-300/80">
                Organischer Stil
              </span>
              <svg className="w-8 h-8 text-pink-300/90 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c1.5 2.5 1.5 5 0 7-1.5-2-1.5-4.5 0-7zm6 3c.5 3-1 5-3 5.5 1-2.5 1-4.5 3-5.5zM6 6c2 1 2 3 3 5.5-2-.5-3.5-2.5-3-5.5zm11 9c-1 2.5-3 3-5.5 3 2-1 3-2.5 5.5-3zm-10 0c2.5.5 3.5 2 5.5 3-2.5 0-4.5-.5-5.5-3z" />
                <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.4" />
              </svg>
            </div>

            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide mb-3 flex items-center gap-3">
              <span>Sumi-e</span>
              {activeArtwork === 'bluten' && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-200 font-normal tracking-wider">
                  Gewählt
                </span>
              )}
            </h3>

            <p className="text-sm text-white/80 leading-relaxed font-light mb-6">
              Ästhetik traditioneller japanischer Tuschemalerei vereint mit fließendem organischem Wachstum. Jeder Klick entfaltet zarte Äste, knospende Blüten und dichte Blütenstürme im Raum.
            </p>

            <div className="space-y-2.5 mb-8">
              <div className="flex items-center gap-2 text-xs text-white/70">
                <FiCheck className="text-pink-400 shrink-0" />
                <span>Reaktive Verästelungen an interaktiven Knotenpunkten</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <FiCheck className="text-pink-400 shrink-0" />
                <span>Sanft schwebende Blütenpartikel mit Winddynamik</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <FiCheck className="text-pink-400 shrink-0" />
                <span>Audioreaktive Farb- und Dichteveränderungen</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSelect('bluten')}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-xs tracking-[1.5px] uppercase transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer ${
              activeArtwork === 'bluten'
                ? 'bg-gradient-to-r from-[#ff2a9d] to-pink-700 text-white shadow-[0_0_20px_rgba(255,42,157,0.5)]'
                : 'bg-white/[0.06] hover:bg-pink-500/20 border border-pink-500/40 text-white hover:border-[#ff2a9d]'
            }`}
          >
            <span>Sumi-e in Experience wählen</span>
            <FiArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 2: Plexus */}
        <div
          className={`relative rounded-[32px] p-7 sm:p-9 bg-[rgba(18,12,28,0.85)] border backdrop-blur-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1 ${
            activeArtwork === 'plexus'
              ? 'border-[#4ee2ec] shadow-[0_20px_50px_rgba(78,226,236,0.35)]'
              : 'border-cyan-500/25 hover:border-cyan-500/60 shadow-[0_15px_40px_rgba(0,0,0,0.5)]'
          }`}
        >
          {/* Decorative Background Glow & Motif */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-cyan-500/20 via-cyan-900/10 to-transparent blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between gap-3 mb-6">
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-cyan-300/80">
                Cybernetic Flow
              </span>
              <svg className="w-8 h-8 text-cyan-300/90 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>

            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide mb-3 flex items-center gap-3">
              <span>Plexus</span>
              {activeArtwork === 'plexus' && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 font-normal tracking-wider">
                  Gewählt
                </span>
              )}
            </h3>

            <p className="text-sm text-white/80 leading-relaxed font-light mb-6">
              Kosmische Netzwerke und rotierende fraktale Planetenkerne. Energiegeladene Filamente verbinden eure Berührungen zu dynamischen Gravitationsfeldern im Raum.
            </p>

            <div className="space-y-2.5 mb-8">
              <div className="flex items-center gap-2 text-xs text-white/70">
                <FiCheck className="text-cyan-400 shrink-0" />
                <span>5 fraktale Himmelskörper in einheitlicher Umlaufbahn</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <FiCheck className="text-cyan-400 shrink-0" />
                <span>Reaktive Laser-Filamente & Magnetfeld-Linien</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <FiCheck className="text-cyan-400 shrink-0" />
                <span>Audiogesteuerte Pulsationen und Schockwellen</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSelect('plexus')}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-xs tracking-[1.5px] uppercase transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer ${
              activeArtwork === 'plexus'
                ? 'bg-gradient-to-r from-[#4ee2ec] to-cyan-700 text-black font-extrabold shadow-[0_0_20px_rgba(78,226,236,0.5)]'
                : 'bg-white/[0.06] hover:bg-cyan-500/20 border border-cyan-500/40 text-white hover:border-[#4ee2ec]'
            }`}
          >
            <span>Plexus in Experience wählen</span>
            <FiArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
}
