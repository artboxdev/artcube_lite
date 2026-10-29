'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Language, translations } from './translations';

interface SakuraverseDualSliderProps {
  lang: Language;
}

interface BranchPoint {
  x: number; // normalized 0..1 relative to full canvas width
  y: number; // normalized 0..1 relative to canvas height
  w: number; // stroke width in px
}

interface BlossomClusterDef {
  nx: number;
  ny: number;
  radius: number;
  petals: {
    dx: number;
    dy: number;
    r: number;
    angle: number;
    color: string;
  }[];
}

interface FlyingPetal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  spin: number;
  swayPhase: number;
  swaySpeed: number;
  color: string;
  vortexAngle: number;
  vortexRadius: number;
  vortexSpeed: number;
}

interface AttachedPlexusNode {
  baseRadius: number;
  angle: number;
  elevation: number;
  orbitSpeed: number;
  shade: string;
  size: number;
  wx: number;
  wy: number;
  wz: number;
}

interface PlexusOrb {
  id: 'red' | 'blue' | 'yellow' | 'green';
  name: string;
  primary: string;
  secondary: string;
  rgb: [number, number, number];
  shades: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  orbitCenterX: number; // normalized 0.55..0.92
  orbitCenterY: number; // normalized 0.22..0.78
  orbitRx: number;
  orbitRy: number;
  orbitSpeed: number;
  orbitPhase: number;
  wobbleTimer: number;
  trail: { x: number; y: number }[];
  nodes: AttachedPlexusNode[];
}

interface ActiveOrbImpulse {
  orbA: PlexusOrb;
  orbB: PlexusOrb;
  remaining: number; // 3.0s countdown
  duration: number;
  midX: number;
  midY: number;
}

const PINK_SHADES = ['#ffaae6', '#ff77dd', '#ff55cc', '#ff88ee', '#ffccee'];

export function SakuraverseDualSlider({ lang }: SakuraverseDualSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [splitRatio, setSplitRatio] = useState<number>(0.5);
  const splitRatioRef = useRef<number>(0.5);
  const isDraggingHandleRef = useRef<boolean>(false);

  const [isVortexUI, setIsVortexUI] = useState<boolean>(false);
  const [isImpulseUI, setIsImpulseUI] = useState<boolean>(false);
  const [cursorStyle, setCursorStyle] = useState<'default' | 'grab' | 'grabbing'>('default');

  const t = translations[lang].experience;

  useEffect(() => {
    splitRatioRef.current = splitRatio;
  }, [splitRatio]);

  // Handle dragging of the central slider divider ONLY when grabbed on the handle
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingHandleRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const nextRatio = Math.max(0.12, Math.min(0.88, (e.clientX - rect.left) / Math.max(1, rect.width)));
      splitRatioRef.current = nextRatio;
      setSplitRatio(nextRatio);
    };

    const onPointerUp = () => {
      if (isDraggingHandleRef.current) {
        isDraggingHandleRef.current = false;
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 800;
    let height = 340;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(300, rect.width);
      height = Math.max(240, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // =========================================================================
    // 1. SUMI-E ARTWORK DATA (Main Branch, Sub-Twigs, Pink Blossom Clusters, Petals)
    // =========================================================================
    // Main trunk curve points (normalized x in 0..0.48, y in 0..1)
    const mainTrunk: BranchPoint[] = [
      { x: -0.02, y: 0.78, w: 14 },
      { x: 0.06, y: 0.68, w: 12 },
      { x: 0.13, y: 0.69, w: 10.5 },
      { x: 0.21, y: 0.54, w: 8.5 },
      { x: 0.29, y: 0.46, w: 6.8 },
      { x: 0.36, y: 0.35, w: 5.0 },
      { x: 0.43, y: 0.38, w: 3.4 },
      { x: 0.48, y: 0.30, w: 2.0 },
    ];

    const subBranches: BranchPoint[][] = [
      // Upper twig 1
      [
        { x: 0.13, y: 0.69, w: 7.0 },
        { x: 0.16, y: 0.52, w: 5.0 },
        { x: 0.20, y: 0.38, w: 3.2 },
        { x: 0.24, y: 0.27, w: 1.8 },
      ],
      // Lower twig 2
      [
        { x: 0.21, y: 0.54, w: 6.2 },
        { x: 0.27, y: 0.64, w: 4.5 },
        { x: 0.34, y: 0.68, w: 2.8 },
        { x: 0.39, y: 0.63, w: 1.6 },
      ],
      // Upper twig 3
      [
        { x: 0.29, y: 0.46, w: 5.2 },
        { x: 0.32, y: 0.31, w: 3.6 },
        { x: 0.37, y: 0.21, w: 2.2 },
        { x: 0.41, y: 0.16, w: 1.3 },
      ],
      // Side twig 4
      [
        { x: 0.36, y: 0.35, w: 4.0 },
        { x: 0.41, y: 0.47, w: 2.6 },
        { x: 0.46, y: 0.51, w: 1.5 },
      ],
    ];

    // Pink Sakura Blossom Clusters ("pinke Sakurablütenknollen") sitting on the branches
    const clusterAnchors = [
      { nx: 0.16, ny: 0.52, r: 16 },
      { nx: 0.20, ny: 0.38, r: 19 },
      { nx: 0.24, ny: 0.27, r: 15 },
      { nx: 0.21, ny: 0.54, r: 21 },
      { nx: 0.29, ny: 0.46, r: 22 },
      { nx: 0.34, ny: 0.68, r: 16 },
      { nx: 0.37, ny: 0.21, r: 18 },
      { nx: 0.41, ny: 0.16, r: 14 },
      { nx: 0.36, ny: 0.35, r: 20 },
      { nx: 0.43, ny: 0.38, r: 17 },
      { nx: 0.48, ny: 0.30, r: 15 },
      { nx: 0.46, ny: 0.51, r: 14 },
    ];

    const blossomClusters: BlossomClusterDef[] = clusterAnchors.map((a) => {
      const petals = [];
      const count = 11 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const dist = Math.random() * a.r * 0.85;
        petals.push({
          dx: Math.cos(ang) * dist,
          dy: Math.sin(ang) * dist,
          r: 3.5 + Math.random() * 4.5,
          angle: Math.random() * Math.PI * 2,
          color: PINK_SHADES[i % PINK_SHADES.length],
        });
      }
      return { nx: a.nx, ny: a.ny, radius: a.r, petals };
    });

    // Flying Sakura Petals (diagonal flight + 3s Vortex on circular mouse motion)
    const NUM_FLYING_PETALS = 44;
    const flyingPetals: FlyingPetal[] = [];
    for (let i = 0; i < NUM_FLYING_PETALS; i++) {
      flyingPetals.push({
        x: Math.random() * 450,
        y: Math.random() * 340,
        vx: 0.65 + Math.random() * 0.85,
        vy: 0.38 + Math.random() * 0.65,
        size: 4.2 + Math.random() * 4.8,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.045,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 1.5 + Math.random() * 1.8,
        color: PINK_SHADES[i % PINK_SHADES.length],
        vortexAngle: Math.random() * Math.PI * 2,
        vortexRadius: 18 + Math.random() * 95,
        vortexSpeed: (2.8 + Math.random() * 2.2) * (i % 2 === 0 ? 1 : -1),
      });
    }

    // Vortex state (triggered for 3.0s by circular mouse motion on Sumi-e side)
    let vortexRemaining = 0.0;
    let vortexBlend = 0.0;
    let vortexCenterX = 180;
    let vortexCenterY = 170;
    const mouseTrailHistory: { x: number; y: number; t: number }[] = [];

    // =========================================================================
    // 2. PLEXUS ARTWORK DATA (4 Orbs: Red, Blue, Yellow, Green + Attached Plexus)
    // =========================================================================
    const orbConfigs: {
      id: 'red' | 'blue' | 'yellow' | 'green';
      name: string;
      primary: string;
      secondary: string;
      rgb: [number, number, number];
      shades: string[];
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      speed: number;
      phase: number;
    }[] = [
      {
        id: 'red',
        name: 'Rot',
        primary: '#ff2a4b',
        secondary: '#ff8800',
        rgb: [255, 42, 75],
        shades: ['#ff3366', '#ff5577', '#ff2a55', '#ff7088'],
        cx: 0.63,
        cy: 0.32,
        rx: 28,
        ry: 20,
        speed: 0.75,
        phase: 0.2,
      },
      {
        id: 'blue',
        name: 'Blau',
        primary: '#00c3ff',
        secondary: '#6e00ff',
        rgb: [0, 195, 255],
        shades: ['#38bdf8', '#0ea5e9', '#60a5fa', '#7dd3fc'],
        cx: 0.84,
        cy: 0.30,
        rx: 30,
        ry: 22,
        speed: -0.68,
        phase: 1.7,
      },
      {
        id: 'yellow',
        name: 'Gelb',
        primary: '#ffd000',
        secondary: '#ff7700',
        rgb: [255, 208, 0],
        shades: ['#fbbf24', '#f59e0b', '#fde047', '#ffea00'],
        cx: 0.65,
        cy: 0.70,
        rx: 32,
        ry: 20,
        speed: 0.62,
        phase: 3.1,
      },
      {
        id: 'green',
        name: 'Grün',
        primary: '#10e782',
        secondary: '#0062ff',
        rgb: [16, 231, 130],
        shades: ['#34d399', '#10b981', '#6ee7b7', '#00f59b'],
        cx: 0.85,
        cy: 0.68,
        rx: 28,
        ry: 24,
        speed: -0.72,
        phase: 4.5,
      },
    ];

    const plexusOrbs: PlexusOrb[] = orbConfigs.map((cfg) => {
      const nodes: AttachedPlexusNode[] = [];
      const nodeCount = 12;
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          baseRadius: 24 + (i % 3) * 7 + Math.random() * 4,
          angle: (i / nodeCount) * Math.PI * 2 + Math.random() * 0.3,
          elevation: (Math.random() - 0.5) * Math.PI * 0.7,
          orbitSpeed: (0.7 + (i % 3) * 0.35) * (i % 2 === 0 ? 1 : -1),
          shade: cfg.shades[i % cfg.shades.length],
          size: 2.5 + (i % 3) * 0.9,
          wx: 0,
          wy: 0,
          wz: 0,
        });
      }
      return {
        id: cfg.id,
        name: cfg.name,
        primary: cfg.primary,
        secondary: cfg.secondary,
        rgb: cfg.rgb,
        shades: cfg.shades,
        x: cfg.cx * width,
        y: cfg.cy * height,
        vx: 0,
        vy: 0,
        orbitCenterX: cfg.cx,
        orbitCenterY: cfg.cy,
        orbitRx: cfg.rx,
        orbitRy: cfg.ry,
        orbitSpeed: cfg.speed,
        orbitPhase: cfg.phase,
        wobbleTimer: 999,
        trail: [],
        nodes,
      };
    });

    let draggedOrb: PlexusOrb | null = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    const activeImpulses: ActiveOrbImpulse[] = [];
    // Cooldown map so two separating orbs don't immediately re-trigger before drifting apart
    const pairCooldowns = new Map<string, number>();

    const getPairKey = (a: PlexusOrb, b: PlexusOrb) =>
      a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;

    // =========================================================================
    // POINTER INTERACTION ON CANVAS (Sumi-e Circular Gesture & Plexus Orb Drag)
    // =========================================================================
    const getCanvasPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const onCanvasPointerDown = (e: PointerEvent) => {
      // Never move slider from canvas click!
      const pos = getCanvasPos(e);
      const splitX = width * splitRatioRef.current;

      if (pos.x > splitX) {
        // Check if user clicked on one of the 4 Plexus Orbs
        let closest: PlexusOrb | null = null;
        let minDist = 38; // generous grab radius including attached plexus
        for (const orb of plexusOrbs) {
          const d = Math.hypot(pos.x - orb.x, pos.y - orb.y);
          if (d < minDist) {
            minDist = d;
            closest = orb;
          }
        }
        if (closest) {
          draggedOrb = closest;
          dragOffsetX = closest.x - pos.x;
          dragOffsetY = closest.y - pos.y;
          closest.wobbleTimer = 0;
          setCursorStyle('grabbing');
          canvas.setPointerCapture?.(e.pointerId);
        }
      }
    };

    const onCanvasPointerMove = (e: PointerEvent) => {
      const pos = getCanvasPos(e);
      const splitX = width * splitRatioRef.current;
      const now = performance.now();

      // 1. If dragging a Plexus Orb: move it & check for collision with other orbs
      if (draggedOrb) {
        const minX = splitX + 34;
        const maxX = width - 34;
        const minY = 34;
        const maxY = height - 34;
        draggedOrb.x = Math.max(minX, Math.min(maxX, pos.x + dragOffsetX));
        draggedOrb.y = Math.max(minY, Math.min(maxY, pos.y + dragOffsetY));
        draggedOrb.vx = 0;
        draggedOrb.vy = 0;
        // Also gently update its home orbit center so it stays near where user placed it
        draggedOrb.orbitCenterX = Math.max(0.55, Math.min(0.92, draggedOrb.x / width));
        draggedOrb.orbitCenterY = Math.max(0.20, Math.min(0.80, draggedOrb.y / height));
        return;
      }

      // 2. If pointer is on Sumi-e side (left of splitX): detect circular mouse motion!
      if (pos.x < splitX - 10) {
        setCursorStyle('default');
        mouseTrailHistory.push({ x: pos.x, y: pos.y, t: now });
        // Keep last 950ms of points
        while (mouseTrailHistory.length > 0 && now - mouseTrailHistory[0].t > 950) {
          mouseTrailHistory.shift();
        }

        if (mouseTrailHistory.length >= 10 && vortexRemaining <= 0.1) {
          // Filter points with minimum step distance to measure clean angles
          const filtered: { x: number; y: number }[] = [mouseTrailHistory[0]];
          for (let i = 1; i < mouseTrailHistory.length; i++) {
            const prev = filtered[filtered.length - 1];
            const cur = mouseTrailHistory[i];
            if (Math.hypot(cur.x - prev.x, cur.y - prev.y) >= 6) {
              filtered.push(cur);
            }
          }

          if (filtered.length >= 7) {
            let totalAngle = 0;
            for (let i = 1; i < filtered.length - 1; i++) {
              const a1 = Math.atan2(
                filtered[i].y - filtered[i - 1].y,
                filtered[i].x - filtered[i - 1].x
              );
              const a2 = Math.atan2(
                filtered[i + 1].y - filtered[i].y,
                filtered[i + 1].x - filtered[i].x
              );
              let da = a2 - a1;
              while (da > Math.PI) da -= Math.PI * 2;
              while (da < -Math.PI) da += Math.PI * 2;
              totalAngle += da;
            }

            // ~230 degrees of cumulative circular rotation triggers 3s Vortex
            if (Math.abs(totalAngle) >= Math.PI * 1.28) {
              let cx = 0;
              let cy = 0;
              for (const p of filtered) {
                cx += p.x;
                cy += p.y;
              }
              cx /= filtered.length;
              cy /= filtered.length;

              vortexCenterX = Math.max(60, Math.min(splitX - 60, cx));
              vortexCenterY = Math.max(60, Math.min(height - 60, cy));
              vortexRemaining = 3.0; // 3 seconds Vortex!
              setIsVortexUI(true);

              // Initialize each petal's polar coordinates relative to vortexCenter for smooth entry
              flyingPetals.forEach((p, idx) => {
                const dx = p.x - vortexCenterX;
                const dy = p.y - vortexCenterY;
                p.vortexAngle = Math.atan2(dy, dx);
                p.vortexRadius = Math.max(16, Math.min(115, Math.hypot(dx, dy) * 0.75 + 15));
                p.vortexSpeed = (3.2 + (idx % 5) * 0.45) * (totalAngle >= 0 ? 1 : -1);
              });

              mouseTrailHistory.length = 0;
            }
          }
        }
      } else {
        // Pointer is on Plexus side: check hover over orbs
        let hoveringOrb = false;
        for (const orb of plexusOrbs) {
          if (Math.hypot(pos.x - orb.x, pos.y - orb.y) < 34) {
            hoveringOrb = true;
            if (orb.wobbleTimer > 0.6) orb.wobbleTimer = 0;
            break;
          }
        }
        setCursorStyle(hoveringOrb ? 'grab' : 'default');
      }
    };

    const onCanvasPointerUp = (e: PointerEvent) => {
      if (draggedOrb) {
        canvas.releasePointerCapture?.(e.pointerId);
        draggedOrb = null;
        setCursorStyle('default');
      }
    };

    canvas.addEventListener('pointerdown', onCanvasPointerDown);
    canvas.addEventListener('pointermove', onCanvasPointerMove);
    canvas.addEventListener('pointerup', onCanvasPointerUp);
    canvas.addEventListener('pointercancel', onCanvasPointerUp);

    // =========================================================================
    // HELPER: DRAW SAKURA PETAL SILHOUETTE (exact bezier shape from SakuraCanvas)
    // =========================================================================
    const drawSakuraPetal = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      angle: number,
      color: string,
      alpha = 0.92
    ) => {
      c.save();
      c.translate(x, y);
      c.rotate(angle);
      c.scale(size / 14, size / 14);
      c.globalAlpha = alpha;
      c.fillStyle = color;
      c.shadowColor = color;
      c.shadowBlur = 6;
      c.beginPath();
      c.moveTo(0, -10);
      c.bezierCurveTo(7, -6, 10, 2, 6, 9);
      c.bezierCurveTo(3, 13, -3, 13, -6, 9);
      c.bezierCurveTo(-10, 2, -7, -6, 0, -10);
      c.fill();
      c.restore();
    };

    // =========================================================================
    // HELPER: DRAW 4-POINTED STARBURST GLINT (exact match to generateStarCrossTexture)
    // =========================================================================
    const drawStarFlare = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      radius: number,
      colorHex: string,
      alpha = 1.0
    ) => {
      c.save();
      c.translate(x, y);
      c.globalAlpha = alpha;

      const angles = [Math.PI / 4, -Math.PI / 4];
      for (const ang of angles) {
        c.save();
        c.rotate(ang);
        const grad = c.createLinearGradient(-radius, 0, radius, 0);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.35, colorHex);
        grad.addColorStop(0.5, '#ffffff');
        grad.addColorStop(0.65, colorHex);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        c.strokeStyle = grad;
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(-radius, 0);
        c.lineTo(radius, 0);
        c.stroke();
        c.restore();
      }

      // Central core glint dot
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(0, 0, 2.2, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    // =========================================================================
    // MAIN RENDER LOOP
    // =========================================================================
    let animId = 0;
    let lastTime = performance.now();

    const renderLoop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const time = now * 0.001;
      const splitX = width * splitRatioRef.current;

      ctx.save();
      ctx.scale(dpr, dpr);

      // -----------------------------------------------------------------------
      // PART A: SUMI-E ARTWORK (LEFT OF SPLITX)
      // -----------------------------------------------------------------------
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, height);
      ctx.clip();

      // 1. Shibuya Magenta Metallic Fluid Shader Backdrop
      const bgGradSumie = ctx.createLinearGradient(0, 0, width * 0.6, height);
      bgGradSumie.addColorStop(0, '#0d0006');
      bgGradSumie.addColorStop(0.45, '#470024');
      bgGradSumie.addColorStop(0.8, '#7a023e');
      bgGradSumie.addColorStop(1, '#1a000e');
      ctx.fillStyle = bgGradSumie;
      ctx.fillRect(0, 0, splitX, height);

      // Moving fluid silk highlights (like pattern() in bgFragmentShader)
      for (let wIdx = 0; wIdx < 3; wIdx++) {
        const fx = width * (0.18 + wIdx * 0.14) + Math.sin(time * 0.6 + wIdx * 2.1) * 35;
        const fy = height * (0.35 + wIdx * 0.18) + Math.cos(time * 0.5 + wIdx * 1.7) * 25;
        const fGrad = ctx.createRadialGradient(fx, fy, 8, fx, fy, 150);
        fGrad.addColorStop(0, 'rgba(204, 10, 112, 0.28)');
        fGrad.addColorStop(0.5, 'rgba(189, 0, 92, 0.12)');
        fGrad.addColorStop(1, 'rgba(13, 0, 5, 0)');
        ctx.fillStyle = fGrad;
        ctx.fillRect(0, 0, splitX, height);
      }

      // Helper for branch sway matching sumiVertexShader
      const getBranchSwayY = (nx: number) => {
        const normX = Math.max(0, Math.min(1, nx / 0.5));
        const mainSway = Math.sin(time * 1.25) * 6.5;
        const subSway = Math.sin(time * 0.6) * 2.5;
        return (mainSway + subSway) * normX;
      };

      // 2. Draw Sumi-e Calligraphic Branch & Twigs (ImmersiveStroke style)
      const drawSumieBranch = (pts: BranchPoint[]) => {
        if (pts.length < 2) return;
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[i];
          const p1 = pts[i + 1];
          const x0 = p0.x * width;
          const y0 = p0.y * height + getBranchSwayY(p0.x);
          const x1 = p1.x * width;
          const y1 = p1.y * height + getBranchSwayY(p1.x);

          // Outer eroded dry-brush ink edge
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.strokeStyle = 'rgba(195, 202, 214, 0.55)';
          ctx.lineWidth = (p0.w + p1.w) * 0.58;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Inner warm ivory-white Sumi-e core (0xf5e4cf mixed with greyWhiteBase)
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.strokeStyle = 'rgba(247, 236, 224, 0.94)';
          ctx.lineWidth = (p0.w + p1.w) * 0.38;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      };

      drawSumieBranch(mainTrunk);
      subBranches.forEach(drawSumieBranch);

      // 3. Draw Pink Sakura Blossom Clusters ("pinke Sakurablütenknollen") on the branches
      for (const cluster of blossomClusters) {
        const cx = cluster.nx * width;
        const cy = cluster.ny * height + getBranchSwayY(cluster.nx);

        // Soft Sakura pink aura behind each blossom cluster (sakuraOrbFragmentShader look)
        const aura = ctx.createRadialGradient(cx, cy, 1, cx, cy, cluster.radius * 1.45);
        aura.addColorStop(0, 'rgba(255, 180, 230, 0.55)');
        aura.addColorStop(0.45, 'rgba(255, 77, 166, 0.28)');
        aura.addColorStop(1, 'rgba(255, 51, 204, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(cx, cy, cluster.radius * 1.45, 0, Math.PI * 2);
        ctx.fill();

        // Layered pink blossom strokes inside the cluster
        for (const bp of cluster.petals) {
          drawSakuraPetal(
            ctx,
            cx + bp.dx,
            cy + bp.dy,
            bp.r * 1.9,
            bp.angle + Math.sin(time * 1.4 + cluster.nx * 5) * 0.12,
            bp.color,
            0.94
          );
        }

        // Delicate luminous blossom center pistils
        ctx.fillStyle = '#fff5fb';
        ctx.beginPath();
        ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Update & Draw Flying Sakura Petals (Diagonal flight vs. 3s Vortex)
      if (vortexRemaining > 0) {
        vortexRemaining = Math.max(0, vortexRemaining - dt);
        vortexBlend = Math.min(1, vortexBlend + dt * 4.2);
        if (vortexRemaining <= 0) {
          setIsVortexUI(false);
        }

        // Subtle glowing vortex swirl ring while active
        const vRing = ctx.createRadialGradient(
          vortexCenterX,
          vortexCenterY,
          8,
          vortexCenterX,
          vortexCenterY,
          105
        );
        vRing.addColorStop(0, 'rgba(255, 170, 230, 0.22)');
        vRing.addColorStop(0.5, 'rgba(255, 77, 166, 0.14)');
        vRing.addColorStop(1, 'rgba(255, 77, 166, 0)');
        ctx.fillStyle = vRing;
        ctx.beginPath();
        ctx.arc(vortexCenterX, vortexCenterY, 105, 0, Math.PI * 2);
        ctx.fill();
      } else {
        vortexBlend = Math.max(0, vortexBlend - dt * 2.2);
      }

      const maxSumieX = Math.max(220, width * 0.55);
      for (let i = 0; i < flyingPetals.length; i++) {
        const p = flyingPetals[i];

        // Normal diagonal drift position update
        const diagVx = p.vx + Math.sin(time * p.swaySpeed + p.swayPhase) * 0.35;
        const diagVy = p.vy + Math.cos(time * p.swaySpeed + p.swayPhase) * 0.25;

        if (vortexBlend > 0.001) {
          // Advance vortex polar angle
          p.vortexAngle += p.vortexSpeed * dt;
          const targetVx =
            vortexCenterX +
            Math.cos(p.vortexAngle) * p.vortexRadius * (0.85 + 0.15 * Math.sin(time * 3 + i));
          const targetVy =
            vortexCenterY +
            Math.sin(p.vortexAngle) * (p.vortexRadius * 0.78) * (0.85 + 0.15 * Math.cos(time * 3 + i));

          // Blend between diagonal drift and vortex orbit
          p.x = p.x * (1 - vortexBlend * 0.18) + targetVx * (vortexBlend * 0.18);
          p.y = p.y * (1 - vortexBlend * 0.18) + targetVy * (vortexBlend * 0.18);
          p.angle += p.spin * 2.8;
        } else {
          p.x += diagVx;
          p.y += diagVy;
          p.angle += p.spin;

          // Wrap around smoothly for continuous diagonal flight
          if (p.x > maxSumieX + 20) {
            p.x = -15;
            p.y = Math.random() * height * 0.85;
          }
          if (p.y > height + 18) {
            p.y = -15;
            p.x = Math.random() * maxSumieX;
          }
        }

        drawSakuraPetal(ctx, p.x, p.y, p.size, p.angle, p.color, 0.9);
      }

      ctx.restore();

      // -----------------------------------------------------------------------
      // PART B: PLEXUS ARTWORK (RIGHT OF SPLITX)
      // -----------------------------------------------------------------------
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, width - splitX, height);
      ctx.clip();

      // 1. Deep Cosmic Shibuya-Magenta / Space Background
      const bgGradPlexus = ctx.createLinearGradient(splitX, 0, width, height);
      bgGradPlexus.addColorStop(0, '#09000b');
      bgGradPlexus.addColorStop(0.5, '#1e0016');
      bgGradPlexus.addColorStop(1, '#060312');
      ctx.fillStyle = bgGradPlexus;
      ctx.fillRect(splitX, 0, width - splitX, height);

      // Update pair cooldowns
      for (const [k, cd] of Array.from(pairCooldowns.entries())) {
        if (cd - dt <= 0) pairCooldowns.delete(k);
        else pairCooldowns.set(k, cd - dt);
      }

      // 2. Update Orb Positions & Check for Orb-to-Orb Docking (triggers 3s Network Impulse)
      for (const orb of plexusOrbs) {
        if (orb.wobbleTimer < 1.0) {
          orb.wobbleTimer += dt;
        }

        // Check if this orb is currently in an active 3s impulse
        const activeImp = activeImpulses.find((imp) => imp.orbA === orb || imp.orbB === orb);

        if (orb !== draggedOrb) {
          if (activeImp) {
            // While in 3s Network Impulse: orbit gently around the shared impulse midpoint
            const isA = activeImp.orbA === orb;
            const pairAngle = time * 2.2 + (isA ? 0 : Math.PI);
            const targetX = activeImp.midX + Math.cos(pairAngle) * 26;
            const targetY = activeImp.midY + Math.sin(pairAngle) * 20;
            orb.x += (targetX - orb.x) * 0.12;
            orb.y += (targetY - orb.y) * 0.12;
          } else {
            // Normal floating along its own elliptical path + any separation drift velocity
            const homeX =
               Math.max(splitX + 42, Math.min(width - 42, orb.orbitCenterX * width)) +
              Math.cos(time * orb.orbitSpeed + orb.orbitPhase) * orb.orbitRx;
            const homeY =
              orb.orbitCenterY * height +
              Math.sin(time * orb.orbitSpeed * 1.15 + orb.orbitPhase) * orb.orbitRy;

            orb.x += orb.vx * dt + (homeX - orb.x) * 0.035;
            orb.y += orb.vy * dt + (homeY - orb.y) * 0.035;
            orb.vx *= 0.94;
            orb.vy *= 0.94;

            // Keep inside Plexus bounds
            const minX = splitX + 34;
            const maxX = width - 34;
            if (orb.x < minX) orb.x = minX;
            if (orb.x > maxX) orb.x = maxX;
            if (orb.y < 34) orb.y = 34;
            if (orb.y > height - 34) orb.y = height - 34;
          }
        }

        // Record comet ribbon trail
        orb.trail.unshift({ x: orb.x, y: orb.y });
        if (orb.trail.length > 22) orb.trail.pop();

        // Update 3D attached plexus nodes around this orb
        for (const n of orb.nodes) {
          n.angle += n.orbitSpeed * dt;
          const rProj = n.baseRadius * Math.cos(n.elevation);
          n.wx = orb.x + Math.cos(n.angle) * rProj;
          n.wy = orb.y + Math.sin(n.angle) * rProj * 0.85 + Math.sin(n.elevation) * 12;
          n.wz = Math.sin(n.angle) * rProj;
        }
      }

      // Check pairwise distance to trigger 3s Network Impulse when pushed together
      for (let i = 0; i < plexusOrbs.length; i++) {
        for (let j = i + 1; j < plexusOrbs.length; j++) {
          const a = plexusOrbs[i];
          const b = plexusOrbs[j];
          const key = getPairKey(a, b);
          const alreadyActive = activeImpulses.some(
            (imp) => (imp.orbA === a && imp.orbB === b) || (imp.orbA === b && imp.orbB === a)
          );
          if (alreadyActive || pairCooldowns.has(key)) continue;

          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 64) {
            // Release dragged orb so the 3s impulse & subsequent separation play out cleanly
            if (draggedOrb === a || draggedOrb === b) {
              draggedOrb = null;
              setCursorStyle('default');
            }
            a.wobbleTimer = 0;
            b.wobbleTimer = 0;
            activeImpulses.push({
              orbA: a,
              orbB: b,
              remaining: 3.0,
              duration: 3.0,
              midX: (a.x + b.x) * 0.5,
              midY: (a.y + b.y) * 0.5,
            });
            setIsImpulseUI(true);
          }
        }
      }

      // 3. Render & Update Active 3-Second Dual-Color Network Impulses!
      for (let idx = activeImpulses.length - 1; idx >= 0; idx--) {
        const imp = activeImpulses[idx];
        imp.remaining -= dt;
        imp.midX = (imp.orbA.x + imp.orbB.x) * 0.5;
        imp.midY = (imp.orbA.y + imp.orbB.y) * 0.5;

        const progress = 1 - Math.max(0, imp.remaining) / imp.duration;
        const env = Math.sin(Math.min(1, progress) * Math.PI); // smooth fade in/out over 3s
        const [r1, g1, b1] = imp.orbA.rgb;
        const [r2, g2, b2] = imp.orbB.rgb;

        // a) Dual-color background aura glow representing both orbs' colors
        const bgPulse = ctx.createRadialGradient(imp.midX, imp.midY, 5, imp.midX, imp.midY, 150);
        bgPulse.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, ${0.32 * env})`);
        bgPulse.addColorStop(0.5, `rgba(${r2}, ${g2}, ${b2}, ${0.24 * env})`);
        bgPulse.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = bgPulse;
        ctx.beginPath();
        ctx.arc(imp.midX, imp.midY, 150, 0, Math.PI * 2);
        ctx.fill();

        // b) Concentric expanding dual-color shockwave rings (impulseMesh style)
        for (let w = 0; w < 3; w++) {
          const waveP = (progress * 2.2 + w * 0.33) % 1;
          const waveR = 14 + waveP * 115;
          const waveAlpha = (1 - waveP) * (0.75 * env + 0.2);
          ctx.beginPath();
          ctx.arc(imp.midX, imp.midY, waveR, 0, Math.PI * 2);
          ctx.strokeStyle =
            w % 2 === 0
              ? `rgba(${r1}, ${g1}, ${b1}, ${waveAlpha})`
              : `rgba(${r2}, ${g2}, ${b2}, ${waveAlpha})`;
          ctx.lineWidth = 2.2 * (1 - waveP * 0.5);
          ctx.stroke();
        }

        // c) Inter-Orb Plexus Bridge Filaments & Traveling Color Data Pulses
        const nodesA = imp.orbA.nodes;
        const nodesB = imp.orbB.nodes;
        for (let i = 0; i < nodesA.length; i++) {
          const na = nodesA[i];
          const nb = nodesB[(i * 3) % nodesB.length];
          const gradLine = ctx.createLinearGradient(na.wx, na.wy, nb.wx, nb.wy);
          gradLine.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, ${0.75 * env + 0.15})`);
          gradLine.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
          gradLine.addColorStop(1, `rgba(${r2}, ${g2}, ${b2}, ${0.75 * env + 0.15})`);

          ctx.beginPath();
          ctx.moveTo(na.wx, na.wy);
          ctx.lineTo(nb.wx, nb.wy);
          ctx.strokeStyle = gradLine;
          ctx.lineWidth = 1.35;
          ctx.stroke();

          // Traveling spark along the bridge
          const sparkT = (time * 2.4 + i * 0.17) % 1;
          const sx = na.wx + (nb.wx - na.wx) * sparkT;
          const sy = na.wy + (nb.wy - na.wy) * sparkT;
          ctx.fillStyle = i % 2 === 0 ? imp.orbA.primary : imp.orbB.primary;
          ctx.beginPath();
          ctx.arc(sx, sy, 2.3, 0, Math.PI * 2);
          ctx.fill();
        }

        //When 3 seconds are over -> Gently push the two orbs apart so they drift into their own orbits!
        if (imp.remaining <= 0) {
          const dx = imp.orbB.x - imp.orbA.x;
          const dy = imp.orbB.y - imp.orbA.y;
          const d = Math.hypot(dx, dy) || 1;
          const nx = dx / d;
          const ny = dy / d;

          const sepSpeed = 95;
          imp.orbA.vx = -nx * sepSpeed;
          imp.orbA.vy = -ny * sepSpeed;
          imp.orbB.vx = nx * sepSpeed;
          imp.orbB.vy = ny * sepSpeed;

          pairCooldowns.set(getPairKey(imp.orbA, imp.orbB), 2.2);
          activeImpulses.splice(idx, 1);
          if (activeImpulses.length === 0) {
            setIsImpulseUI(false);
          }
        }
      }

      // 4. Draw Each of the 4 Orbs + Their Attached Plexus Networks
      for (const orb of plexusOrbs) {
        const [r, g, b] = orb.rgb;

        // a) Silky Comet Ribbon Trail
        if (orb.trail.length > 2) {
          for (let tIdx = 0; tIdx < orb.trail.length - 1; tIdx++) {
            const p0 = orb.trail[tIdx];
            const p1 = orb.trail[tIdx + 1];
            const ratio = 1 - tIdx / orb.trail.length;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${ratio * 0.42})`;
            ctx.lineWidth = ratio * 8;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        }

        // b) Attached Plexus Filaments (connecting orb's plexus nodes to each other & to orb center)
        const nodes = orb.nodes;
        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i];
          // Filament to orb core
          if (i % 2 === 0) {
            ctx.beginPath();
            ctx.moveTo(orb.x, orb.y);
            ctx.lineTo(n1.wx, n1.wy);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.35)`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }

          // Filaments to neighbor nodes in same attached plexus
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const nd = Math.hypot(n1.wx - n2.wx, n1.wy - n2.wy);
            if (nd < 34) {
              const alpha = (1 - nd / 34) * 0.78;
              ctx.beginPath();
              ctx.moveTo(n1.wx, n1.wy);
              ctx.lineTo(n2.wx, n2.wy);
              ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
              ctx.lineWidth = 1.1;
              ctx.stroke();
            }
          }
        }

        // c) Attached Plexus Star Nodes
        for (const n of nodes) {
          ctx.save();
          ctx.fillStyle = n.shade;
          ctx.shadowColor = orb.primary;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(n.wx, n.wy, n.size, 0, Math.PI * 2);
          ctx.fill();

          // Crisp white pinpoint core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(n.wx, n.wy, n.size * 0.45, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // d) Volumetric Fractal Energy Orb Core + Atmosphere Halo Ring + Starburst Glint
        let scaleX = 1;
        let scaleY = 1;
        if (orb.wobbleTimer < 0.8) {
          const wt = orb.wobbleTimer / 0.8;
          const wob = Math.sin(wt * Math.PI * 6) * Math.exp(-wt * 3.5);
          scaleX = 1 + wob * 0.22;
          scaleY = 1 - wob * 0.18;
        }

        ctx.save();
        ctx.translate(orb.x, orb.y);
        ctx.scale(scaleX, scaleY);

        const orbRadius = 15.5;

        // Outer soft atmosphere glow
        const outerHalo = ctx.createRadialGradient(0, 0, orbRadius * 0.4, 0, 0, orbRadius * 2.2);
        outerHalo.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.55)`);
        outerHalo.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.18)`);
        outerHalo.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = outerHalo;
        ctx.beginPath();
        ctx.arc(0, 0, orbRadius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Dark sphere base with fractal plasma lobes inside
        const sphereGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, orbRadius);
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.35, orb.primary);
        sphereGrad.addColorStop(0.75, orb.secondary);
        sphereGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.15)`);
        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(0, 0, orbRadius, 0, Math.PI * 2);
        ctx.fill();

        // Internal rotating fractal energy filaments
        for (let f = 0; f < 3; f++) {
          const fAng = time * (1.2 + f * 0.4) + f * 2.1;
          ctx.save();
          ctx.rotate(fAng);
          ctx.strokeStyle = f % 2 === 0 ? 'rgba(255,255,255,0.55)' : orb.secondary;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.ellipse(0, 0, orbRadius * 0.72, orbRadius * 0.35, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Atmosphere Fresnel Rim Ring (atmosphereFragmentShader look)
        ctx.strokeStyle = orb.primary;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = orb.primary;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, orbRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 45deg / -45deg Starburst Cross Glint on top of the orb
        drawStarFlare(ctx, orb.x, orb.y, 20, orb.primary, 0.95);
      }

      ctx.restore();
      ctx.restore();

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onCanvasPointerDown);
      canvas.removeEventListener('pointermove', onCanvasPointerMove);
      canvas.removeEventListener('pointerup', onCanvasPointerUp);
      canvas.removeEventListener('pointercancel', onCanvasPointerUp);
    };
  }, []);

  return (
    <div className="mb-10 sm:mb-12">
      <div
        ref={containerRef}
        className="relative h-64 sm:h-80 w-full rounded-[28px] sm:rounded-[34px] overflow-hidden border border-pink-500/40 bg-[#0d0006] shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_45px_rgba(255,42,157,0.22)] select-none"
      >
        <canvas
          ref={canvasRef}
          className={`w-full h-full block touch-none ${
            cursorStyle === 'grabbing'
              ? 'cursor-grabbing'
              : cursorStyle === 'grab'
              ? 'cursor-grab'
              : 'cursor-default'
          }`}
        />

        {/* Top-Left Badge: Sumi-e */}
        <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 flex flex-col gap-1.5 pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-pink-400/40 text-pink-200 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-lg">
            <span>{t.sliderSumieBadge}</span>
          </div>
          {isVortexUI && (
            <div className="px-3 py-1 rounded-full bg-pink-500/80 backdrop-blur-md text-white text-xs font-bold tracking-wide animate-pulse shadow-[0_0_15px_#ff2a9d]">
              {t.sliderVortexActive}
            </div>
          )}
        </div>

        {/* Top-Right Badge: Plexus */}
        <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 flex flex-col items-end gap-1.5 pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-cyan-400/40 text-cyan-200 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-lg">
            <span>{t.sliderPlexusBadge}</span>
          </div>
          {isImpulseUI && (
            <div className="px-3 py-1 rounded-full bg-cyan-500/80 backdrop-blur-md text-white text-xs font-bold tracking-wide animate-pulse shadow-[0_0_15px_#00c3ff]">
              {t.sliderPulseActive}
            </div>
          )}
        </div>

        {/* Bottom Interaction Hints */}
        <div className="absolute bottom-3 left-3.5 right-3.5 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <span className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-pink-500/25 text-xs text-pink-100/90 font-light">
            🔄 {t.sliderHintSumie}
          </span>
          <span className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-cyan-500/25 text-xs text-cyan-100/90 font-light">
            ✨ {t.sliderHintPlexus}
          </span>
        </div>

        {/* Divider Line (non-interactive visual line) */}
        <div
          style={{ left: `${splitRatio * 100}%` }}
          className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-[#ff80df] via-white to-[#4ee2ec] shadow-[0_0_15px_#ffffff] pointer-events-none"
        />

        {/* Interactive Handle Button — ONLY dragging this handle moves the slider! */}
        <button
          type="button"
          aria-label="Slider verschieben"
          style={{ left: `${splitRatio * 100}%` }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            isDraggingHandleRef.current = true;
          }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#12091c]/95 border-2 border-white shadow-[0_0_22px_rgba(255,42,157,0.85)] hover:scale-110 active:scale-95 transition-transform flex items-center justify-center text-xs text-white font-bold cursor-ew-resize touch-none z-20"
        >
          ↔
        </button>
      </div>
    </div>
  );
}

