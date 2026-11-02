import React from 'react';

export function PrototypeHeroVisual() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#0d0714]">
      <svg
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        viewBox="0 0 800 450"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Illustration: Phase 1 Digitaler Prototyp - Zwei synchronisierte Smartphones"
      >
        <defs>
          <linearGradient id="bgGradP1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14061f" />
            <stop offset="50%" stopColor="#240b36" />
            <stop offset="100%" stopColor="#0a0210" />
          </linearGradient>
          <radialGradient id="pinkGlowRad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff2a9d" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ff2a9d" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="phoneBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff80df" />
            <stop offset="100%" stopColor="#4ee2ec" />
          </linearGradient>
        </defs>

        <rect width="800" height="450" fill="url(#bgGradP1)" />
        <circle cx="400" cy="225" r="220" fill="url(#pinkGlowRad)" />

        {/* Cyber grid lines in background */}
        <g opacity="0.15" stroke="#ff2a9d" strokeWidth="1">
          <line x1="0" y1="100" x2="800" y2="100" />
          <line x1="0" y1="200" x2="800" y2="200" />
          <line x1="0" y1="300" x2="800" y2="300" />
          <line x1="0" y1="400" x2="800" y2="400" />
          <line x1="200" y1="0" x2="200" y2="450" />
          <line x1="400" y1="0" x2="400" y2="450" />
          <line x1="600" y1="0" x2="600" y2="450" />
        </g>

        {/* Synced Connection Laser Beam */}
        <path
          d="M 280 230 C 340 180, 460 180, 520 230"
          stroke="url(#phoneBorder)"
          strokeWidth="4"
          strokeDasharray="8 6"
          opacity="0.9"
        >
          <animate attributeName="stroke-dashoffset" values="100;0" dur="2s" repeatCount="indefinite" />
        </path>
        <circle cx="400" cy="195" r="8" fill="#4ee2ec" opacity="0.8">
          <animate attributeName="r" values="6;11;6" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <text
          x="400"
          y="170"
          textAnchor="middle"
          fill="#4ee2ec"
          fontSize="11"
          fontFamily="monospace"
          fontWeight="bold"
          letterSpacing="2"
        >
          P2P WEBRTC SYNC · 60 FPS
        </text>

        {/* Smartphone 1 (Left - Host) */}
        <g transform="translate(160, 110) rotate(-8)">
          <rect width="130" height="230" rx="20" fill="#0c0714" stroke="#ff2a9d" strokeWidth="2.5" opacity="0.95" />
          <rect x="8" y="12" width="114" height="206" rx="14" fill="#1b0c26" />
          {/* Screen Content: Sumi-e Swirl */}
          <path
            d="M 25 150 Q 55 50, 95 100 T 90 180"
            stroke="#ff80df"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />
          {/* Host touch cursor */}
          <circle cx="65" cy="110" r="14" fill="#ff2a9d" fillOpacity="0.3" stroke="#ff2a9d" strokeWidth="2" />
          <circle cx="65" cy="110" r="4" fill="#ffffff" />
          <text x="65" y="90" textAnchor="middle" fill="#ff80df" fontSize="9" fontFamily="sans-serif" fontWeight="bold">
            HOST CURSOR
          </text>
        </g>

        {/* Smartphone 2 (Right - Guest) */}
        <g transform="translate(510, 110) rotate(8)">
          <rect width="130" height="230" rx="20" fill="#0c0714" stroke="#4ee2ec" strokeWidth="2.5" opacity="0.95" />
          <rect x="8" y="12" width="114" height="206" rx="14" fill="#0a1926" />
          {/* Screen Content: Matching Swirl */}
          <path
            d="M 25 150 Q 55 50, 95 100 T 90 180"
            stroke="#4ee2ec"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />
          {/* Guest touch cursor */}
          <circle cx="65" cy="110" r="14" fill="#4ee2ec" fillOpacity="0.3" stroke="#4ee2ec" strokeWidth="2" />
          <circle cx="65" cy="110" r="4" fill="#ffffff" />
          <text x="65" y="90" textAnchor="middle" fill="#4ee2ec" fontSize="9" fontFamily="sans-serif" fontWeight="bold">
            GUEST CURSOR
          </text>
        </g>

        {/* Floating Sakura Petals */}
        <g opacity="0.8">
          <path d="M 370 120 C 375 110, 395 115, 390 130 C 385 140, 365 135, 370 120 Z" fill="#ff80df" />
          <path d="M 430 260 C 435 250, 455 255, 450 270 C 445 280, 425 275, 430 260 Z" fill="#ff80df" />
          <path d="M 330 290 C 335 282, 350 286, 346 298 C 342 306, 326 302, 330 290 Z" fill="#ff2a9d" />
          <path d="M 470 100 C 474 92, 488 96, 485 106 C 481 114, 467 110, 470 100 Z" fill="#ff80df" />
        </g>

        {/* Bottom Telemetry Pill */}
        <rect x="250" y="405" width="300" height="26" rx="13" fill="#000000" fillOpacity="0.7" stroke="#ff2a9d" strokeWidth="1" />
        <text x="400" y="422" textAnchor="middle" fill="#ffffff" fontSize="11" fontFamily="monospace">
          PHASE 1 · ZWEI GERÄTE · EIN KUNSTWERK
        </text>
      </svg>
    </div>
  );
}

export function ArtcubeHeroVisual() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#06121a]">
      <svg
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        viewBox="0 0 800 450"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Illustration: Phase 2 Begehbarer art.cube mit 360-Grad-Projektion"
      >
        <defs>
          <linearGradient id="bgGradP2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#04121c" />
            <stop offset="50%" stopColor="#082233" />
            <stop offset="100%" stopColor="#020910" />
          </linearGradient>
          <radialGradient id="cyanGlowRad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4ee2ec" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#4ee2ec" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="800" height="450" fill="url(#bgGradP2)" />
        <circle cx="400" cy="225" r="230" fill="url(#cyanGlowRad)" />

        {/* Perspective Floor Grid */}
        <g opacity="0.2" stroke="#4ee2ec" strokeWidth="1">
          <line x1="100" y1="450" x2="350" y2="280" />
          <line x1="250" y1="450" x2="380" y2="280" />
          <line x1="400" y1="450" x2="400" y2="280" />
          <line x1="550" y1="450" x2="420" y2="280" />
          <line x1="700" y1="450" x2="450" y2="280" />
          <line x1="150" y1="400" x2="650" y2="400" />
          <line x1="220" y1="350" x2="580" y2="350" />
          <line x1="280" y1="310" x2="520" y2="310" />
        </g>

        {/* 3D Holographic Cube Structure Wireframe */}
        <g stroke="#4ee2ec" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5">
          <line x1="280" y1="120" x2="520" y2="120" />
          <line x1="280" y1="120" x2="280" y2="300" />
          <line x1="520" y1="120" x2="520" y2="300" />
        </g>

        {/* Cube Projection Surfaces */}
        <polygon points="220,160 280,120 520,120 460,160" fill="#4ee2ec" fillOpacity="0.08" />
        <polygon points="220,160 280,120 280,300 220,340" fill="#ff2a9d" fillOpacity="0.05" />
        <polygon points="460,160 520,120 520,300 460,340" fill="#4ee2ec" fillOpacity="0.12" />

        {/* Front Frame */}
        <g stroke="#4ee2ec" strokeWidth="2.5" opacity="0.95">
          <line x1="220" y1="160" x2="460" y2="160" />
          <line x1="460" y1="160" x2="460" y2="340" />
          <line x1="460" y1="340" x2="220" y2="340" />
          <line x1="220" y1="340" x2="220" y2="160" />
          {/* Connection to Back Vertices */}
          <line x1="220" y1="160" x2="280" y2="120" />
          <line x1="460" y1="160" x2="520" y2="120" />
          <line x1="460" y1="340" x2="520" y2="300" />
          <line x1="220" y1="340" x2="280" y2="300" />
        </g>

        {/* Corner Cyber Joints */}
        <circle cx="220" cy="160" r="4" fill="#ffffff" />
        <circle cx="460" cy="160" r="4" fill="#ffffff" />
        <circle cx="460" cy="340" r="4" fill="#ffffff" />
        <circle cx="220" cy="340" r="4" fill="#ffffff" />

        {/* Plexus Nodes inside the Cube */}
        <g stroke="#4ee2ec" strokeWidth="1" opacity="0.7">
          <line x1="310" y1="180" x2="370" y2="210" />
          <line x1="370" y1="210" x2="430" y2="190" />
          <line x1="370" y1="210" x2="350" y2="250" />
          <line x1="430" y1="190" x2="410" y2="240" />
          <line x1="310" y1="180" x2="330" y2="230" />
        </g>
        <circle cx="310" cy="180" r="3.5" fill="#ff80df" />
        <circle cx="370" cy="210" r="5" fill="#4ee2ec" />
        <circle cx="430" cy="190" r="4" fill="#ff2a9d" />
        <circle cx="350" cy="250" r="4" fill="#4ee2ec" />
        <circle cx="410" cy="240" r="3.5" fill="#ffffff" />

        {/* 2 Human Silhouettes inside Cube experiencing the 360 projection */}
        {/* Person 1 (Center-Left) */}
        <g fill="#0b1b24" stroke="#4ee2ec" strokeWidth="0.8">
          <circle cx="330" cy="275" r="7" />
          <path d="M 320 325 L 325 287 Q 330 284, 335 287 L 340 325 Z" />
          {/* Smartphone light beam */}
          <circle cx="337" cy="298" r="2" fill="#4ee2ec" />
          <line x1="337" y1="298" x2="370" y2="210" stroke="#4ee2ec" strokeWidth="1" strokeDasharray="2 2" opacity="0.8" />
        </g>
        {/* Person 2 (Center-Right) */}
        <g fill="#0b1b24" stroke="#ff2a9d" strokeWidth="0.8">
          <circle cx="380" cy="278" r="7" />
          <path d="M 370 325 L 375 289 Q 380 286, 385 289 L 390 325 Z" />
          {/* Smartphone light beam */}
          <circle cx="376" cy="299" r="2" fill="#ff2a9d" />
          <line x1="376" y1="299" x2="370" y2="210" stroke="#ff2a9d" strokeWidth="1" strokeDasharray="2 2" opacity="0.8" />
        </g>

        {/* Bottom Telemetry Pill */}
        <rect x="230" y="405" width="340" height="26" rx="13" fill="#000000" fillOpacity="0.7" stroke="#4ee2ec" strokeWidth="1" />
        <text x="400" y="422" textAnchor="middle" fill="#ffffff" fontSize="11" fontFamily="monospace">
          PHASE 2 · 360° PROJEKTION · BEGEHBARER KUBUS
        </text>
      </svg>
    </div>
  );
}

