'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import type { ExperienceComponentProps } from '../../lib/experience-types';

// ==========================================
// CONSTANTS & SHADERS
// ==========================================

const MAX_PETALS = 300;
const MAX_TRAIL_PARTICLES = 2000;
const MAX_TOTAL_NODES = 600;
const MAX_TOTAL_LINES = 2500;

function createNoiseTexture(): THREE.DataTexture {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const val = Math.floor(Math.random() * 256);
    data[i * 4] = val;
    data[i * 4 + 1] = val;
    data[i * 4 + 2] = val;
    data[i * 4 + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function generatePetalTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.filter = 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.9))';
    const grad = ctx.createLinearGradient(0, 0, 64, 64);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#f5f5f5');
    grad.addColorStop(0.7, '#e0e0e0');
    grad.addColorStop(1, '#c0c0c0');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(32, 4);
    ctx.bezierCurveTo(50, 12, 60, 32, 50, 52);
    ctx.bezierCurveTo(40, 62, 24, 62, 14, 52);
    ctx.bezierCurveTo(4, 32, 14, 12, 32, 4);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function generateStarCrossTexture(hexColorStr: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  if (ctx) {
    const cx = 64, cy = 64;

    // Soft radial glow aura
    const rad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 56);
    rad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    rad.addColorStop(0.25, hexColorStr + 'bb');
    rad.addColorStop(0.55, hexColorStr + '33');
    rad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, 128, 128);

    // Starburst cross flares rotated at 45deg and -45deg
    const angles = [Math.PI / 4, -Math.PI / 4];
    const half = 52;

    for (let i = 0; i < angles.length; i++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angles[i]);

      const flareGrad = ctx.createLinearGradient(-half, 0, half, 0);
      flareGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      flareGrad.addColorStop(0.5, '#ffffff');
      flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.shadowColor = hexColorStr;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = flareGrad;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-half, 0);
      ctx.lineTo(half, 0);
      ctx.stroke();

      ctx.restore();
    }

    // Central core glint dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

// 1. Background Metallic Fluid Shader
const bgVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const bgFragmentShader = /* glsl */ `
  uniform vec3 iResolution;
  uniform float iTime;
  uniform sampler2D iChannel0;
  uniform float uKaleidoscope;
  uniform float uGridVibe;
  uniform float uRippleActive;
  uniform float uRippleTime;
  uniform vec3 uBgColor1;
  uniform vec3 uBgColor2;
  uniform vec3 uBgColor3;
  uniform vec3 uRippleCrest;
  uniform float uBgBlend;
  uniform float uBgDim;
  varying vec2 vUv;

  float noise(in vec2 x) {
    vec2 p = floor(x);
    vec2 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float a = texture2D(iChannel0, (p + vec2(0.5, 0.5)) / 256.0).x;
    float b = texture2D(iChannel0, (p + vec2(1.5, 0.5)) / 256.0).x;
    float c = texture2D(iChannel0, (p + vec2(0.5, 1.5)) / 256.0).x;
    float d = texture2D(iChannel0, (p + vec2(1.5, 1.5)) / 256.0).x;
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  const mat2 mtx = mat2(0.80, 0.60, -0.60, 0.80);

  float fbm(vec2 p) {
    float f = 0.0;
    f += 0.500000 * noise(p); p = mtx * p * 2.02;
    f += 0.250000 * noise(p); p = mtx * p * 2.03;
    f += 0.125000 * noise(p); p = mtx * p * 2.01;
    f += 0.062500 * noise(p); p = mtx * p * 2.04;
    f += 0.031250 * noise(p); p = mtx * p * 2.01;
    f += 0.015625 * noise(p);
    return f / 0.96875;
  }

  float pattern(in vec2 p, in float t, in vec2 uv) {
    vec2 q = vec2(fbm(p), fbm(p + vec2(10.0, 1.3)));
    vec2 r = vec2(fbm(p + 4.0 * q + vec2(t) + vec2(1.7, 9.2)), fbm(p + 4.0 * q + vec2(t) + vec2(8.3, 2.8)));
    vec2 g = vec2(fbm(p + 2.0 * r + vec2(t * 20.0) + vec2(2.0, 6.0)), fbm(p + 2.0 * r + vec2(t * 10.0) + vec2(5.0, 3.0)));
    return fbm(p + 5.5 * g + vec2(-t * 7.0));
  }

  void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = clamp(fragCoord / max(iResolution.xy, vec2(1.0)), 0.0, 1.0);
    
    vec2 rippleOffset = vec2(0.0);
    float waveNormal = 0.0;
    float waveFade = 0.0;
    float insideWave = 0.0;

    // Transparente Wasser-Lichtbrechungs-Verzerrung & Farbtransformation
    if (uRippleActive > 0.5) {
      vec2 centerUv = uv - vec2(0.5);
      centerUv.x *= iResolution.x / iResolution.y;
      float dist = length(centerUv);

      float waveRadius = (uRippleTime / 3.0) * 1.8;
      float waveDist = abs(dist - waveRadius);

      float wavePhase = waveDist * 32.0 - uRippleTime * 9.0;
      waveNormal = cos(wavePhase) * exp(-waveDist * waveDist * 110.0);
      waveFade = smoothstep(3.0, 2.2, uRippleTime) * smoothstep(0.0, 0.1, uRippleTime);

      insideWave = smoothstep(waveRadius + 0.15, waveRadius - 0.15, dist) * waveFade;
      rippleOffset = normalize(centerUv + vec2(0.0001)) * waveNormal * 0.045 * waveFade;
    }

    vec2 distortedFragCoord = fragCoord + rippleOffset * iResolution.xy;
    vec2 distortedUv = clamp(uv + rippleOffset, 0.0, 1.0);

    if (uKaleidoscope > 0.001) {
      vec2 p = distortedUv - vec2(0.5);
      float r = length(p);
      float a = atan(p.y, p.x);
      float sides = 6.0;
      float tau = 6.2831853;
      a = mod(a, tau / sides);
      a = abs(a - tau / (2.0 * sides));
      vec2 kUV = vec2(cos(a), sin(a)) * r + vec2(0.5);
      distortedUv = mix(distortedUv, kUV, uKaleidoscope);
    }

    float noiseVal = pattern(distortedFragCoord * vec2(0.004), iTime * 0.007, distortedUv);
    
    float effectiveBlend = clamp(max(uBgBlend, insideWave), 0.0, 1.0);
    vec3 baseC1 = mix(vec3(0.05, 0.00, 0.02), uBgColor1, effectiveBlend);
    vec3 baseC2 = mix(vec3(0.74, 0.00, 0.36), uBgColor2, effectiveBlend);
    vec3 baseC3 = mix(vec3(0.80, 0.04, 0.44), uBgColor3, effectiveBlend);

    vec3 col = mix(baseC1, baseC2, smoothstep(0.0, 1.0, noiseVal));
    col = mix(col, baseC1 * 2.2, noiseVal * 0.8);
    col = mix(col, baseC3, 0.35 * noiseVal);
    col = mix(col, baseC2 * 0.7, smoothstep(0.0, 0.6, 0.6 * noiseVal));
    col = mix(col, baseC3 * 1.1, 0.12 * noiseVal);
    
    col *= noiseVal * 1.68;

    if (uKaleidoscope > 0.001) {
      vec3 colKaleido = mix(baseC3, vec3(1.0), 0.3) * (0.8 + 0.5 * sin(iTime * 1.5 + noiseVal * 6.28));
      col = mix(col, col * 1.35 + colKaleido * 0.4, uKaleidoscope * 0.7);
    }

    // Grid removed: uGridVibe is always 0.0

    if (uRippleActive > 0.5) {
      col += uRippleCrest * waveNormal * waveFade * 0.65;
    }

    float vignetteVal = max(0.0, 70.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y));
    col *= (0.80 * (0.70 + 0.65 * sqrt(vignetteVal))) * uBgDim;
    
    gl_FragColor = vec4(col, 1.0);
  }
`;

// 2. Sumi-e 3D Ribbon Stroke Shaders
const sumiVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;

  void main() {
    vUv = uv;
    vPosition = position;

    float normX = clamp((position.x + 11.5) / 20.0, 0.0, 1.0);
    float mainSway = sin(uTime * 1.25) * 0.38;
    float subSway  = sin(uTime * 0.60) * 0.14;
    
    vec3 displacedPos = position;
    displacedPos.y += (mainSway + subSway) * normX;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPos, 1.0);
  }
`;

export type BlossomColorId = 'pink' | 'red' | 'blue' | 'green' | 'yellow';

export interface BlossomColorConfig {
  id: BlossomColorId;
  name: string;
  uiColor: string;
  glow: string;
  shades: number[];
  vortexTint: number;
}

export const BLOSSOM_PALETTES: Record<BlossomColorId, BlossomColorConfig> = {
  pink: {
    id: 'pink',
    name: 'Pink',
    uiColor: '#ff4da6',
    glow: 'rgba(255, 77, 166, 0.7)',
    shades: [0xffaae6, 0xff77dd, 0xff55cc, 0xff88ee, 0xffccee],
    vortexTint: 0xff66cc
  },
  red: {
    id: 'red',
    name: 'Rot',
    uiColor: '#ff2a4b',
    glow: 'rgba(255, 42, 75, 0.7)',
    shades: [0xff3366, 0xff5577, 0xff2a55, 0xff7088, 0xff4466],
    vortexTint: 0xff2a4b
  },
  blue: {
    id: 'blue',
    name: 'Blau',
    uiColor: '#00c3ff',
    glow: 'rgba(0, 195, 255, 0.7)',
    shades: [0x38bdf8, 0x0ea5e9, 0x60a5fa, 0x0284c7, 0x7dd3fc],
    vortexTint: 0x00c3ff
  },
  green: {
    id: 'green',
    name: 'Grün',
    uiColor: '#10e782',
    glow: 'rgba(16, 231, 130, 0.7)',
    shades: [0x34d399, 0x10b981, 0x059669, 0x6ee7b7, 0x00f59b],
    vortexTint: 0x10e782
  },
  yellow: {
    id: 'yellow',
    name: 'Gelb',
    uiColor: '#ffd000',
    glow: 'rgba(255, 208, 0, 0.7)',
    shades: [0xfbbf24, 0xf59e0b, 0xfde047, 0xfacc15, 0xffea00],
    vortexTint: 0xffd000
  }
};

export const PALETTE_RGB_CACHE: Record<BlossomColorId, { r: number; g: number; b: number }[]> = {
  pink: BLOSSOM_PALETTES.pink.shades.map(s => { const c = new THREE.Color(s); return { r: c.r, g: c.g, b: c.b }; }),
  red: BLOSSOM_PALETTES.red.shades.map(s => { const c = new THREE.Color(s); return { r: c.r, g: c.g, b: c.b }; }),
  blue: BLOSSOM_PALETTES.blue.shades.map(s => { const c = new THREE.Color(s); return { r: c.r, g: c.g, b: c.b }; }),
  green: BLOSSOM_PALETTES.green.shades.map(s => { const c = new THREE.Color(s); return { r: c.r, g: c.g, b: c.b }; }),
  yellow: BLOSSOM_PALETTES.yellow.shades.map(s => { const c = new THREE.Color(s); return { r: c.r, g: c.g, b: c.b }; }),
};

export const BG_COLOR_PALETTES = {
  default: {
    c1: new THREE.Vector3(0.05, 0.00, 0.02),
    c2: new THREE.Vector3(0.74, 0.00, 0.36),
    c3: new THREE.Vector3(0.80, 0.04, 0.44),
    crest: new THREE.Vector3(1.0, 0.4, 0.8)
  },
  pink: {
    c1: new THREE.Vector3(0.06, 0.00, 0.03),
    c2: new THREE.Vector3(0.82, 0.02, 0.46),
    c3: new THREE.Vector3(0.95, 0.18, 0.65),
    crest: new THREE.Vector3(1.0, 0.45, 0.85)
  },
  red: {
    c1: new THREE.Vector3(0.07, 0.00, 0.01),
    c2: new THREE.Vector3(0.85, 0.03, 0.15),
    c3: new THREE.Vector3(1.00, 0.15, 0.25),
    crest: new THREE.Vector3(1.0, 0.3, 0.35)
  },
  blue: {
    c1: new THREE.Vector3(0.00, 0.02, 0.08),
    c2: new THREE.Vector3(0.00, 0.48, 0.88),
    c3: new THREE.Vector3(0.12, 0.72, 1.00),
    crest: new THREE.Vector3(0.3, 0.85, 1.0)
  },
  green: {
    c1: new THREE.Vector3(0.00, 0.06, 0.02),
    c2: new THREE.Vector3(0.00, 0.72, 0.38),
    c3: new THREE.Vector3(0.18, 0.95, 0.58),
    crest: new THREE.Vector3(0.35, 1.0, 0.65)
  },
  yellow: {
    c1: new THREE.Vector3(0.07, 0.04, 0.00),
    c2: new THREE.Vector3(0.88, 0.58, 0.00),
    c3: new THREE.Vector3(1.00, 0.82, 0.12),
    crest: new THREE.Vector3(1.0, 0.9, 0.4)
  }
};

const sumiFragmentShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform vec3 uColor;
  uniform float uTotalLength;
  uniform float uProgress;
  uniform float uAlpha;

  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    float currentLength = uTotalLength * uProgress;
    if (vUv.y > currentLength) discard;

    float noiseVal = snoise(vec2(vUv.x * 30.0, vUv.y * 8.0));
    float wave = snoise(vec2(vUv.y * 2.0)) * 0.15;
    float distortedX = clamp(vUv.x + wave, 0.0, 1.0);
    float edgeBias = pow(distortedX, 2.0); 
    float threshold = mix(-1.5, 0.4, edgeBias); 
    
    float alpha = 0.95;
    float erosion = smoothstep(threshold, threshold + 0.6, noiseVal);
    alpha *= erosion;
    
    float distFromStart = vUv.y;
    float distFromEnd = currentLength - vUv.y;
    float startFade = smoothstep(0.0, min(0.12, currentLength * 0.35), distFromStart);
    float endFade = smoothstep(0.0, min(0.15, currentLength * 0.35), distFromEnd);
    alpha *= clamp(startFade * endFade + 0.15, 0.0, 1.0);

    vec3 greyWhiteBase = mix(vec3(0.97, 0.97, 0.98), vec3(0.78, 0.80, 0.84), erosion);
    vec3 finalColor = mix(greyWhiteBase, uColor, erosion * 0.90);
    gl_FragColor = vec4(finalColor, alpha * uAlpha);
  }
`;

// 3. Glowing Orbs & Ring Shaders
const orbMeshVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ringFragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uAlpha;
  uniform float uTime;

  void main() {
    vec2 p = vUv - vec2(0.5);
    float r = length(p);
    float uRadius = 0.38;
    float dist = abs(r - uRadius);
    
    float thinRing = smoothstep(0.018, 0.0, dist);
    float specularGlow = exp(-dist * dist * 900.0);
    float softHalo = exp(-dist * 35.0) * 0.25;
    float totalIntensity = (thinRing * 1.8 + specularGlow * 1.4 + softHalo) * smoothstep(0.50, 0.20, r);

    if (totalIntensity < 0.005) discard;
    float pulse = 0.85 + 0.15 * sin(uTime * 6.0);
    vec3 shinyCore = vec3(0.90, 0.97, 1.0);
    vec3 cyanElectric = vec3(0.0, 0.75, 1.0);
    vec3 finalCol = mix(cyanElectric, shinyCore, specularGlow * 0.85);

    gl_FragColor = vec4(finalCol, totalIntensity * uAlpha * pulse * 0.98);
  }
`;

// Dedicated Sakura / Blüten Branch & Petal Guide Orb Shader (Pure delicate Sakura pink/magenta glow, no noise distortion, no green spectral color cycling)
const sakuraOrbFragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uAlpha;
  uniform float uTime;
  uniform vec3 uColor;

  void main() {
    vec2 p = vUv - vec2(0.5);
    float r = length(p);
    if (r > 0.5) discard;

    float core = exp(-r * r * 45.0);
    float glow = exp(-r * 7.5) * 0.75;
    float pulse = 0.88 + 0.12 * sin(uTime * 5.0);
    float intensity = (core * 1.6 + glow) * pulse;

    vec3 col = mix(uColor, vec3(1.0, 0.95, 0.98), core * 0.75);
    float alpha = intensity * uAlpha * smoothstep(0.5, 0.22, r);

    if (alpha < 0.005) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

// Dedicated Volumetric Fractal Energy Orb Shaders
const fractalOrbVertexShader = /* glsl */ `
  varying vec3 vLocalPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vLocalPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fractalOrbFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uLocalCamPos;
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;
  uniform float uDensity;
  uniform float uAlpha;
  
  // Fractal specific uniforms
  uniform float uFractalIters;
  uniform float uFractalScale;
  uniform float uFractalDecay;
  uniform float uInternalAnim;
  uniform float uSmoothness;
  uniform float uAsymmetry;
  uniform float uRadius;
  
  varying vec3 vLocalPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  float evaluateStructure(vec3 pos) {
    float densityAcc = 0.0;
    vec3 anchor = pos;
    
    float animTime = uTime * uInternalAnim;
    float s = sin(animTime);
    float c = cos(animTime);
    mat2 rotAnim = mat2(c, s, -s, c);

    float a = 0.5 * uAsymmetry;
    mat2 rotAsym1 = mat2(cos(a), sin(a), -sin(a), cos(a));
    float b = 0.3 * uAsymmetry;
    mat2 rotAsym2 = mat2(cos(b), sin(b), -sin(b), cos(b));
    
    for (int step = 0; step < 12; ++step) {
      if (float(step) >= uFractalIters) break;
      
      pos.xy *= rotAnim;
      pos.yz *= rotAnim;
      
      pos.xz *= rotAsym1;
      pos.yz *= rotAsym2;
      pos += vec3(0.05, -0.02, 0.03) * uAsymmetry;
      
      vec3 foldedPos = sqrt(pos * pos + uSmoothness);
      float magnitudeSq = dot(foldedPos, foldedPos);
      magnitudeSq = max(magnitudeSq, 0.00001); 
      
      pos = (uFractalScale * foldedPos / magnitudeSq) - uFractalScale;
      
      float ySq = pos.y * pos.y;
      float zSq = pos.z * pos.z;
      float yz2 = 2.0 * pos.y * pos.z;
      pos.yz = vec2(ySq - zSq, yz2);
      
      pos = vec3(pos.z, pos.x, pos.y);
      
      densityAcc += exp(uFractalDecay * abs(dot(pos, anchor)));
    }
    
    return densityAcc * 0.5;
  }

  vec2 getVolumeBounds(vec3 origin, vec3 dir, float radius) {
    float b = dot(origin, dir);
    float c = dot(origin, origin) - radius * radius;
    float discriminant = b * b - c;
    
    if (discriminant < 0.0) {
      return vec2(-1.0);
    }
    
    float root = sqrt(discriminant);
    return vec2(-b - root, -b + root);
  }

  vec3 traceEnergy(vec3 origin, vec3 dir, vec2 limits, float radius) {
    float currentDepth = limits.x;
    float marchStep = (limits.y - limits.x) / 48.0;
    vec3 finalEnergy = vec3(0.0);
    float fieldVal = 0.0;
    float normScale = 2.0 / radius;
    
    for(int i = 0; i < 48; i++) {
      currentDepth += marchStep * exp(-1.5 * fieldVal);
      if(currentDepth > limits.y) break;
      
      vec3 samplePoint = origin + currentDepth * dir;
      vec3 normSample = samplePoint * normScale;
      fieldVal = evaluateStructure(normSample);
      
      float vSq = fieldVal * fieldVal;
      float gradientBlend = smoothstep(0.0, 0.4, fieldVal);
      vec3 currentGradient = mix(uSecondaryColor, uPrimaryColor, gradientBlend);
      
      vec3 emission = currentGradient * (fieldVal * 1.8 + vSq * 1.0);
      finalEnergy = 0.99 * finalEnergy + (0.08 * uDensity) * emission;
    }
    
    return finalEnergy;
  }

  void main() {
    if (uAlpha < 0.005) discard;
    
    vec3 rayOrig = uLocalCamPos;
    vec3 rayDir = normalize(vLocalPosition - uLocalCamPos);
    
    float t = uTime * 0.1;
    float s = sin(t);
    float c = cos(t);
    mat2 rotXZ = mat2(c, s, -s, c);
    rayOrig.xz *= rotXZ;
    rayDir.xz *= rotXZ;

    vec2 limits = getVolumeBounds(rayOrig, rayDir, uRadius);
    
    if (limits.x < 0.0) {
      discard;
    }
    
    vec3 volumeColor = traceEnergy(rayOrig, rayDir, limits, uRadius);
    
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float facingRatio = max(dot(normal, viewDir), 0.0);
    
    float edgeAA = smoothstep(0.0, 0.08, facingRatio);
    vec3 finalColor = 0.5 * log(1.0 + volumeColor);
    finalColor = clamp(finalColor, 0.0, 1.0) * edgeAA;
    
    float maxLuma = max(finalColor.r, max(finalColor.g, finalColor.b));
    float alpha = clamp(maxLuma * 1.6, 0.0, 1.0) * edgeAA * uAlpha;
    
    if (alpha < 0.005) discard;
    gl_FragColor = vec4(finalColor * 1.65, alpha);
  }
`;

const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uGlow;
  uniform float uLevel;
  uniform float uAlpha;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    if (uAlpha < 0.005) discard;
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float vdn = max(dot(normal, viewDir), 0.0);
    
    float edgeFade = smoothstep(0.0, 0.15, vdn);
    float innerFadePoint = clamp(1.0 - uLevel, 0.0, 0.99);
    float centerFade = smoothstep(1.0, innerFadePoint, vdn);
    
    float alpha = edgeFade * centerFade * uGlow * uAlpha;
    if (alpha < 0.005) discard;
    
    gl_FragColor = vec4(uColor * 1.4, alpha);
  }
`;

const FRACTAL_ORB_PRESETS: Record<BlossomColorId, {
  primary: string;
  secondary: string;
  density: number;
  speed: number;
  fractalIters: number;
  fractalScale: number;
  fractalDecay: number;
  smoothness: number;
  asymmetry: number;
  atmosphereGlow: number;
  atmosphereLevel: number;
  atmosphereScale: number;
}> = {
  pink: {
    primary: '#ff1a8c',
    secondary: '#ff99e6',
    density: 3.0,
    speed: 0.55,
    fractalIters: 4,
    fractalScale: 0.95,
    fractalDecay: -16.7,
    smoothness: 0.031,
    asymmetry: 0.48,
    atmosphereGlow: 1.5,
    atmosphereLevel: 1.0,
    atmosphereScale: 1.03
  },
  red: {
    primary: '#ff2244',
    secondary: '#ff8800',
    density: 3.0,
    speed: 0.55,
    fractalIters: 4,
    fractalScale: 0.95,
    fractalDecay: -16.7,
    smoothness: 0.031,
    asymmetry: 0.48,
    atmosphereGlow: 1.5,
    atmosphereLevel: 1.0,
    atmosphereScale: 1.03
  },
  blue: {
    primary: '#00b3ff',
    secondary: '#6e00ff',
    density: 3.0,
    speed: 0.55,
    fractalIters: 4,
    fractalScale: 0.95,
    fractalDecay: -16.7,
    smoothness: 0.031,
    asymmetry: 0.48,
    atmosphereGlow: 1.5,
    atmosphereLevel: 1.0,
    atmosphereScale: 1.03
  },
  green: {
    primary: '#00e676',
    secondary: '#0062ff',
    density: 3.0,
    speed: 0.55,
    fractalIters: 4,
    fractalScale: 0.95,
    fractalDecay: -16.7,
    smoothness: 0.031,
    asymmetry: 0.48,
    atmosphereGlow: 1.5,
    atmosphereLevel: 1.0,
    atmosphereScale: 1.03
  },
  yellow: {
    primary: '#ffbb00',
    secondary: '#ff7700',
    density: 3.0,
    speed: 0.55,
    fractalIters: 4,
    fractalScale: 0.95,
    fractalDecay: -16.7,
    smoothness: 0.031,
    asymmetry: 0.48,
    atmosphereGlow: 1.5,
    atmosphereLevel: 1.0,
    atmosphereScale: 1.03
  }
};

// Dedicated Plexus Finale Grand Network Shader (The Universe Within multi-layer parallax network)
const plexusFinaleVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.999, 1.0);
  }
`;

const plexusFinaleFragmentShader = /* glsl */ `
  #define S(a, b, t) smoothstep(a, b, t)

  varying vec2 vUv;
  uniform vec3 iResolution;
  uniform float iTime;
  uniform vec2 iMouse;
  uniform float uAlpha;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;

  float N21(vec2 p) {
    vec3 a = fract(vec3(p.xyx) * vec3(213.897, 653.453, 253.098));
    a += dot(a, a.yzx + 79.76);
    return fract((a.x + a.y) * a.z);
  }

  vec2 GetPos(vec2 id, vec2 offs, float t) {
    float n = N21(id + offs);
    float n1 = fract(n * 10.0);
    float n2 = fract(n * 100.0);
    float a = t + n;
    return offs + vec2(sin(a * n1), cos(a * n2)) * 0.4;
  }

  float df_line(in vec2 a, in vec2 b, in vec2 p) {
    vec2 pa = p - a, ba = b - a;
    float denom = dot(ba, ba);
    if (denom < 0.00001) return length(pa);
    float h = clamp(dot(pa, ba) / denom, 0.0, 1.0);	
    return length(pa - ba * h);
  }

  float line(vec2 a, vec2 b, vec2 uv) {
    float d = df_line(a, b, uv);
    float d2 = length(a - b);
    float fade = S(1.6, 0.35, d2);
    
    // Razor-sharp line filament with crisp laser edge
    float coreLine = smoothstep(0.009, 0.001, d);
    float glow = exp(-d * 50.0) * 0.45;
    
    return (coreLine * 1.8 + glow) * fade;
  }

  float NetLayer(vec2 st, float n, float t) {
    vec2 id = floor(st) + n;
    st = fract(st) - 0.5;
   
    vec2 p0 = GetPos(id, vec2(-1.0, -1.0), t);
    vec2 p1 = GetPos(id, vec2( 0.0, -1.0), t);
    vec2 p2 = GetPos(id, vec2( 1.0, -1.0), t);
    vec2 p3 = GetPos(id, vec2(-1.0,  0.0), t);
    vec2 p4 = GetPos(id, vec2( 0.0,  0.0), t);
    vec2 p5 = GetPos(id, vec2( 1.0,  0.0), t);
    vec2 p6 = GetPos(id, vec2(-1.0,  1.0), t);
    vec2 p7 = GetPos(id, vec2( 0.0,  1.0), t);
    vec2 p8 = GetPos(id, vec2( 1.0,  1.0), t);
    
    float m = 0.0;
    float sparkle = 0.0;
    
    // Star hub lines from center p4 to all neighbors
    m += line(p4, p0, st);
    m += line(p4, p1, st);
    m += line(p4, p2, st);
    m += line(p4, p3, st);
    m += line(p4, p5, st);
    m += line(p4, p6, st);
    m += line(p4, p7, st);
    m += line(p4, p8, st);

    // Cross perimeter links
    m += line(p1, p3, st);
    m += line(p1, p5, st);
    m += line(p7, p5, st);
    m += line(p7, p3, st);

    // Brilliant pinpoint star nuclei & sparkling flares
    vec2 pts[9];
    pts[0] = p0; pts[1] = p1; pts[2] = p2;
    pts[3] = p3; pts[4] = p4; pts[5] = p5;
    pts[6] = p6; pts[7] = p7; pts[8] = p8;

    for(int j = 0; j < 9; j++) {
      vec2 diff = st - pts[j];
      float d = length(diff);
      
      // Pinpoint nucleus (crystal sharp)
      float nucleus = exp(-d * d * 400.0);
      float halo = exp(-d * 24.0) * 0.35;
      
      // 4-pointed micro cross star flare
      vec2 ad = abs(diff);
      float flare = max(0.0, 1.0 - (ad.x * ad.y) * 450.0);
      flare = pow(flare, 4.0) * S(0.35, 0.02, d);
      
      float pulse = clamp(sin((fract(pts[j].x) + fract(pts[j].y) + t) * 5.0) * 0.45 + 0.55, 0.0, 1.0);
      pulse = pow(pulse, 12.0);
      
      sparkle += (nucleus * 2.5 + halo + flare * 1.8) * pulse;
    }
    
    float sPhase = (sin(t + n) + sin(t * 0.1)) * 0.25 + 0.5;
    sPhase += pow(clamp(sin(t * 0.1) * 0.5 + 0.5, 0.0, 1.0), 30.0) * 4.0;
    m += sparkle * sPhase;
    
    return m;
  }

  void main() {
    if (uAlpha < 0.001) discard;

    vec2 res = max(iResolution.xy, vec2(1.0, 1.0));
    vec2 fragCoord = vUv * res;
    vec2 uv = (fragCoord - res * 0.5) / res.y;
    vec2 M = (iMouse.xy / res) - 0.5;
    
    float m = 0.0;
    
    // 3D orbital rotation of network shells around the center (where the orbs orbit)
    for(int layer = 0; layer < 4; layer++) {
      float fi = float(layer);
      
      // Distinct 3D orbital speed, tilt, and yaw for each layer revolving around center
      float yaw = iTime * 0.35 + fi * 0.785;
      float pitch = sin(iTime * 0.22 + fi * 0.6) * 0.38 + 0.22;
      float roll = iTime * 0.12 + fi * 0.4;
      
      float cy = cos(yaw), sy = sin(yaw);
      float cx = cos(pitch), sx = sin(pitch);
      float cz = cos(roll), sz = sin(roll);

      // Coordinate from center with slight 3D spherical radius offset per layer
      vec3 p = vec3(uv - M * (0.15 * (fi + 1.0)), (fi - 1.5) * 0.25);

      // 3D Rotation Matrix (Yaw -> Pitch -> Roll) around center (0,0,0)
      vec3 pRot;
      pRot.x = p.x * cy - p.z * sy;
      pRot.z = p.x * sy + p.z * cy;
      pRot.y = p.y;
      
      float y2 = pRot.y * cx - pRot.z * sx;
      float z2 = pRot.y * sx + pRot.z * cx;
      pRot.y = y2;
      pRot.z = z2;

      float x3 = pRot.x * cz - pRot.y * sz;
      float y3 = pRot.x * sz + pRot.y * cz;
      pRot.x = x3;
      pRot.y = y3;

      // Perspective projection mapping rotating 3D spherical surface onto grid
      float layerScale = 3.2 + fi * 1.4;
      vec2 st = pRot.xy * layerScale;
      
      float depthFade = 0.85 + 0.15 * pRot.z;
      m += depthFade * NetLayer(st, fi * 0.25, iTime * 0.7);
    }
    
    float colCycle = sin(iTime * 0.4) * 0.5 + 0.5;
    vec3 baseCol = mix(uColor1, uColor2, colCycle);
    baseCol = mix(baseCol, uColor3, sin(iTime * 0.25 + uv.x * 2.0 + uv.y * 1.2) * 0.5 + 0.5);
    
    // Sharp core highlighting & laser filament glow
    vec3 col = baseCol * m * 1.8;
    col += vec3(1.0, 0.96, 1.0) * pow(clamp(m * 0.7, 0.0, 1.0), 3.0) * 1.2;
    col *= 1.0 - dot(uv * 0.5, uv * 0.5);
    
    float alphaVal = clamp(m * 1.25, 0.0, 1.0) * uAlpha;
    gl_FragColor = vec4(col * uAlpha, alphaVal);
  }
`;

// 4. Particle Trail Shaders
const particleTrailVertexShader = /* glsl */ `
  attribute float size;
  attribute float alpha;
  attribute vec3 color;
  attribute float rotAngle;

  varying float vAlpha;
  varying vec3 vColor;
  varying float vRotAngle;

  void main() {
    vAlpha = alpha;
    vColor = color;
    vRotAngle = rotAngle;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleTrailFragmentShader = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  varying float vRotAngle;

  void main() {
    vec2 p = gl_PointCoord - vec2(0.5);
    
    float cosA = cos(vRotAngle);
    float sinA = sin(vRotAngle);
    vec2 rotP = vec2(
      p.x * cosA - p.y * sinA,
      p.x * sinA + p.y * cosA
    );

    float d = length(rotP);
    if (d > 0.5) discard;

    float starVal = pow(clamp(1.0 - abs(rotP.x) * 2.0, 0.0, 1.0) * clamp(1.0 - abs(rotP.y) * 2.0, 0.0, 1.0), 3.0);
    vec2 diagP = vec2(rotP.x + rotP.y, rotP.x - rotP.y) * 0.7071;
    float diagStar = pow(clamp(1.0 - abs(diagP.x) * 2.0, 0.0, 1.0) * clamp(1.0 - abs(diagP.y) * 2.0, 0.0, 1.0), 4.0);
    
    float softCore = exp(-d * d * 18.0);
    float totalIntensity = max(starVal * 1.5, max(diagStar * 0.8, softCore * 1.2));

    vec3 finalColor = mix(vColor, vec3(1.0, 1.0, 1.0), softCore * 0.7);
    gl_FragColor = vec4(finalColor, totalIntensity * vAlpha * 0.95);
  }
`;

// ==========================================
// HELPER CLASSES
// ==========================================

class ImmersiveStroke {
  maxPoints = 2000;
  pointCount = 0;
  points: THREE.Vector3[] = [];
  pathLength = 0;
  baseWidth: number;
  currentWidth: number;
  level: number;
  seed = Math.random();
  lengthUniform = { value: 0 };
  progressUniform = { value: 0.0 };
  timeUniform = { value: 0.0 };
  alphaUniform = { value: 1.0 };
  positions: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  mesh: THREE.Mesh;

  constructor(sceneGroup: THREE.Group, baseWidth = 0.45, level = 0, colorHex = 0xf5e4cf) {
    this.baseWidth = baseWidth;
    this.currentWidth = baseWidth;
    this.level = level;

    this.positions = new Float32Array(this.maxPoints * 2 * 3);
    this.uvs = new Float32Array(this.maxPoints * 2 * 2);
    this.indices = new Uint16Array(this.maxPoints * 6);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(this.uvs, 2));
    this.geometry.setIndex(new THREE.BufferAttribute(this.indices, 1));
    this.geometry.setDrawRange(0, 0);

    this.material = new THREE.ShaderMaterial({
      vertexShader: sumiVertexShader,
      fragmentShader: sumiFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(colorHex) },
        uTotalLength: this.lengthUniform,
        uProgress: this.progressUniform,
        uTime: this.timeUniform,
        uAlpha: this.alphaUniform
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    sceneGroup.add(this.mesh);
  }

  addPoint(p: THREE.Vector3, widthScale = 1.0) {
    if (this.pointCount >= this.maxPoints - 1) return;

    let dir = new THREE.Vector3(0, 1, 0);
    let dist = 0.5;

    if (this.pointCount > 0) {
      const lastP = this.points[this.pointCount - 1];
      dir.subVectors(p, lastP);
      dist = dir.length();
      if (dist < 0.02) return;
      dir.normalize();
    }

    const currentPoint = p.clone();
    this.points.push(currentPoint);
    this.pathLength += dist * 0.5;

    const up = new THREE.Vector3(0, 0, 1);
    let normal = new THREE.Vector3().crossVectors(dir, up).normalize();
    if (normal.lengthSq() < 0.001) {
      normal = new THREE.Vector3(1, 0, 0);
    }

    const normDist = Math.min(1.0, this.pathLength / 8.0);
    const pressureMod = 1.0 + 0.32 * Math.sin(normDist * Math.PI * 4.5 + this.seed * 7.0) + 0.12 * Math.cos(normDist * Math.PI * 9.0);
    const finalWidthScale = widthScale * Math.max(0.40, Math.min(1.40, pressureMod));

    const targetWidth = Math.max(0.035, this.baseWidth * finalWidthScale);
    this.currentWidth += (targetWidth - this.currentWidth) * 0.25;
    const width = this.currentWidth;

    const left = currentPoint.clone().add(normal.clone().multiplyScalar(width * 0.5));
    const right = currentPoint.clone().sub(normal.clone().multiplyScalar(width * 0.5));

    const i = this.pointCount * 6;
    this.positions[i] = left.x;
    this.positions[i + 1] = left.y;
    this.positions[i + 2] = left.z;

    this.positions[i + 3] = right.x;
    this.positions[i + 4] = right.y;
    this.positions[i + 5] = right.z;

    const u = this.pointCount * 4;
    this.uvs[u] = 0;
    this.uvs[u + 1] = this.pathLength;
    this.uvs[u + 2] = 1;
    this.uvs[u + 3] = this.pathLength;

    if (this.pointCount > 0) {
      const idx = (this.pointCount - 1) * 6;
      const vIdx = (this.pointCount - 1) * 2;
      this.indices[idx] = vIdx;
      this.indices[idx + 1] = vIdx + 1;
      this.indices[idx + 2] = vIdx + 2;
      this.indices[idx + 3] = vIdx + 1;
      this.indices[idx + 4] = vIdx + 3;
      this.indices[idx + 5] = vIdx + 2;
    }

    this.pointCount++;
    this.lengthUniform.value = this.pathLength;

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.uv.needsUpdate = true;
    if (this.geometry.index) this.geometry.index.needsUpdate = true;
    this.geometry.setDrawRange(0, Math.max(0, (this.pointCount - 1) * 6));
  }

  setProgress(progress: number) {
    this.progressUniform.value = progress;
  }

  setTime(t: number) {
    this.timeUniform.value = t;
  }

  setAlpha(alpha: number) {
    this.alphaUniform.value = alpha;
  }
}

class OrbNode {
  basePosition: THREE.Vector3;
  position: THREE.Vector3;
  parentBranchInfo: { curve: THREE.CatmullRomCurve3; stroke: ImmersiveStroke; level: number; totalLength: number } | null;
  level: number;
  roundId: number;
  type: string;
  alpha = 0.0;
  active = false;
  userDrawn = false;
  branchSpawned = false;
  seed = Math.random();
  isExploding = false;
  explosionTimer = 0.0;
  explosionDuration = 0.40;
  targetChildLength: number;
  angleRad: number;
  guideDir: THREE.Vector3;
  material: THREE.ShaderMaterial;
  mesh: THREE.Mesh;
  guideLine?: THREE.Line;

  constructor(
    orbGroup: THREE.Group,
    parentBranchInfo: { curve: THREE.CatmullRomCurve3; stroke: ImmersiveStroke; level: number; totalLength: number } | null,
    level: number,
    roundId: number,
    orbT: number,
    type = 'branch',
    customPos: THREE.Vector3 | null = null
  ) {
    this.basePosition = customPos ? customPos.clone() : (parentBranchInfo ? parentBranchInfo.curve.getPointAt(orbT).clone() : new THREE.Vector3(0, 0, 0));
    this.position = this.basePosition.clone();
    this.parentBranchInfo = parentBranchInfo;
    this.level = level;
    this.roundId = roundId;
    this.type = type;

    const parentLen = parentBranchInfo ? parentBranchInfo.totalLength : 16.0;
    this.targetChildLength = parentLen * (0.45 + Math.random() * 0.12);

    const sideSign = Math.random() > 0.5 ? 1 : -1;
    const angleDeg = sideSign * (20 + Math.random() * 20);
    this.angleRad = THREE.MathUtils.degToRad(angleDeg);
    this.guideDir = new THREE.Vector3(Math.cos(this.angleRad), Math.sin(this.angleRad), 0).normalize();

    const planeSize = this.type === 'petal' ? 1.1 : 2.2;
    const geom = new THREE.PlaneGeometry(planeSize, planeSize);

    if (this.type === 'petal') {
      this.material = new THREE.ShaderMaterial({
        vertexShader: orbMeshVertexShader,
        fragmentShader: ringFragmentShader,
        uniforms: {
          uAlpha: { value: 0.0 },
          uTime: { value: 0.0 }
        },
        transparent: true,
        depthWrite: false
      });
    } else {
      const orbColor = this.type === 'branch' ? new THREE.Color(0xffb5dc) : new THREE.Color(0xff33cc);
      this.material = new THREE.ShaderMaterial({
        vertexShader: orbMeshVertexShader,
        fragmentShader: sakuraOrbFragmentShader,
        uniforms: {
          uAlpha: { value: 0.0 },
          uTime: { value: 0.0 },
          uColor: { value: orbColor }
        },
        transparent: true,
        depthWrite: false
      });
    }

    this.mesh = new THREE.Mesh(geom, this.material);
    this.mesh.position.copy(this.position);
    this.mesh.position.z += 0.15;
    orbGroup.add(this.mesh);

    if (this.type === 'branch') {
      const lineMat = new THREE.LineDashedMaterial({
        color: 0xffffff,
        dashSize: 0.22,
        gapSize: 0.12,
        transparent: true,
        opacity: 0.0,
        depthWrite: false
      });

      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3().copy(this.guideDir).multiplyScalar(0.95)
      ]);

      this.guideLine = new THREE.Line(lineGeom, lineMat);
      this.guideLine.computeLineDistances();
      this.mesh.add(this.guideLine);
    }
  }

  triggerExplosion() {
    this.isExploding = true;
    this.userDrawn = true;
    this.explosionTimer = 0.0;
  }

  setAlpha(a: number) {
    if (!this.isExploding) {
      this.alpha = a;
      this.material.uniforms.uAlpha.value = a;
    }
    if (this.guideLine) (this.guideLine.material as THREE.LineDashedMaterial).opacity = a * 0.75;
  }

  update(time: number, delta = 0.016, modeFadeAlpha = 1.0) {
    this.material.uniforms.uTime.value = time;
    const normX = Math.max(0.0, Math.min(1.0, (this.basePosition.x + 11.5) / 20.0));
    const mainSway = Math.sin(time * 1.25) * 0.38;
    const subSway = Math.sin(time * 0.60) * 0.14;
    const swayY = (mainSway + subSway) * normX;

    this.position.y = this.basePosition.y + swayY;
    this.mesh.position.copy(this.position);
    this.mesh.position.z += 0.15;

    if (this.isExploding) {
      this.explosionTimer += delta;
      const t = Math.min(1.0, this.explosionTimer / this.explosionDuration);
      const easeOut = 1.0 - Math.pow(1.0 - t, 3.0);
      const currentScale = 1.0 + easeOut * 2.2;
      this.mesh.scale.setScalar(currentScale);
      this.alpha = (1.0 - t) * 0.95;
      this.material.uniforms.uAlpha.value = this.alpha * modeFadeAlpha;

      if (t >= 1.0) {
        this.active = false;
        this.mesh.visible = false;
      }
    } else {
      this.material.uniforms.uAlpha.value = this.alpha * modeFadeAlpha;
      if (this.guideLine) (this.guideLine.material as THREE.LineDashedMaterial).opacity = this.alpha * 0.75 * modeFadeAlpha;
    }
  }

  destroy(orbGroup: THREE.Group) {
    orbGroup.remove(this.mesh);
  }
}

interface SakuraCanvasProps extends ExperienceComponentProps {
  onExit?: () => void;
  initialMode?: 'bluten' | 'plexus' | string;
}

export function SakuraCanvas({
  isRunning = false,
  isMobile = false,
  sendInteraction,
  onCanvasesReady,
  onRendererReady,
  onExit,
  initialMode = 'bluten'
}: SakuraCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const baseCamPosRef = useRef(new THREE.Vector3(0, -0.4, 16));
  const baseLookAtRef = useRef(new THREE.Vector3(0, -0.4, 0));

  // App & Artwork Mode State
  const [activeMode, setActiveMode] = useState<'bluten' | 'plexus'>(
    initialMode === 'plexus' ? 'plexus' : 'bluten'
  );

  useEffect(() => {
    if (initialMode === 'plexus' || initialMode === 'bluten') {
      setActiveMode(initialMode);
      activeModeRef.current = initialMode;
    }
  }, [initialMode]);

  const isRunningRef = useRef(isRunning);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  const sendInteractionRef = useRef(sendInteraction);
  useEffect(() => {
    sendInteractionRef.current = sendInteraction;
  }, [sendInteraction]);

  const onRendererReadyRef = useRef(onRendererReady);
  useEffect(() => {
    onRendererReadyRef.current = onRendererReady;
  }, [onRendererReady]);

  const onExitRef = useRef(onExit);
  useEffect(() => {
    onExitRef.current = onExit;
  }, [onExit]);

  const [isPaused, setIsPaused] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [completedArtworksCount, setCompletedArtworksCount] = useState(0);
  const [blutenCounted, setBlutenCounted] = useState(false);
  const [plexusCounted, setPlexusCounted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [plexusAttachedCount, setPlexusAttachedCount] = useState(0);
  const [isPlexusFinale, setIsPlexusFinale] = useState(false);

  // Collaborative Creation Readiness & Lightbox State
  const [hostCreationReady, setHostCreationReady] = useState(false);
  const [guestCreationReady, setGuestCreationReady] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isCreationMode, setIsCreationMode] = useState(false);

  // Zen Mode HUD Auto-Dimming State (Zen Mode after 4.5s inactivity)
  const [isHudDimmed, setIsHudDimmed] = useState(false);
  const hudInactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Smartphone (Android & iOS) Orientation States
  const [isIOSLandscapeBlocked, setIsIOSLandscapeBlocked] = useState(false);
  const [isAndroidPortraitPrompt, setIsAndroidPortraitPrompt] = useState(false);
  const [isPortraitMode, setIsPortraitMode] = useState(false);

  // Souvenir Video Lightbox & NFT Direct Download State
  const [isSouvenirVideoOpen, setIsSouvenirVideoOpen] = useState(false);
  const [souvenirVideoBlob, setSouvenirVideoBlob] = useState<Blob | null>(null);
  const [souvenirVideoUrl, setSouvenirVideoUrl] = useState<string | null>(null);
  const [isNftSaved, setIsNftSaved] = useState(false);

  // Mobile Double-Back Notice State
  const [backNoticeVisible, setBackNoticeVisible] = useState(false);

  // Step-by-Step Artwork Phase Lifecycle State
  const [currentPhase, setCurrentPhase] = useState<'BRANCH' | 'BLOSSOM' | 'VORTEX' | 'DONE'>('BRANCH');
  const [currentRound, setCurrentRound] = useState(1);
  const [isTrunkGrowing, setIsTrunkGrowing] = useState(true);
  const [selectedColor, setSelectedColor] = useState<BlossomColorId>('pink');
  const maxRoundsPerPhase = 3;

  const activeModeRef = useRef(activeMode);
  const isPausedRef = useRef(isPaused);
  const selectedColorRef = useRef(selectedColor);
  const currentPhaseRef = useRef(currentPhase);
  const currentRoundRef = useRef(currentRound);

  const colorCountsRef = useRef<Record<BlossomColorId, number>>({
    pink: 0,
    red: 0,
    blue: 0,
    green: 0,
    yellow: 0
  });

  useEffect(() => { activeModeRef.current = activeMode; }, [activeMode]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { selectedColorRef.current = selectedColor; }, [selectedColor]);
  useEffect(() => { currentPhaseRef.current = currentPhase; }, [currentPhase]);
  useEffect(() => { currentRoundRef.current = currentRound; }, [currentRound]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Wake HUD Controls upon any user interaction
  const wakeHUDControls = useCallback(() => {
    setIsHudDimmed(false);
    if (hudInactivityTimerRef.current) {
      clearTimeout(hudInactivityTimerRef.current);
      hudInactivityTimerRef.current = null;
    }
    if (!isPausedRef.current) {
      hudInactivityTimerRef.current = setTimeout(() => {
        if (!isPausedRef.current) {
          setIsHudDimmed(true);
        }
      }, 4500);
    }
  }, []);

  // Listeners for HUD wake
  useEffect(() => {
    window.addEventListener('pointerdown', wakeHUDControls, { passive: true });
    window.addEventListener('pointermove', wakeHUDControls, { passive: true });
    window.addEventListener('touchstart', wakeHUDControls, { passive: true });
    window.addEventListener('touchmove', wakeHUDControls, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', wakeHUDControls);
      window.removeEventListener('pointermove', wakeHUDControls);
      window.removeEventListener('touchstart', wakeHUDControls);
      window.removeEventListener('touchmove', wakeHUDControls);
      if (hudInactivityTimerRef.current) clearTimeout(hudInactivityTimerRef.current);
    };
  }, [wakeHUDControls]);

  // Request Landscape Fullscreen & Orientation Lock (Android & non-iOS Mobile)
  const requestLandscapeOrientation = useCallback(() => {
    try {
      const docEl = document.documentElement as unknown as {
        requestFullscreen?: () => Promise<void>;
        webkitRequestFullscreen?: () => void;
        mozRequestFullScreen?: () => void;
        msRequestFullscreen?: () => void;
      };
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      }
      const screenAny = (typeof screen !== 'undefined' ? screen : null) as unknown as {
        orientation?: {
          lock?: (orientation: string) => Promise<void>;
          unlock?: () => void;
        };
      } | null;
      if (screenAny?.orientation?.lock) {
        screenAny.orientation.lock('landscape').catch(() => {
          screenAny?.orientation?.lock?.('landscape-primary')?.catch(() => {});
        });
      }
    } catch {
      // fallback
    }
    setIsAndroidPortraitPrompt(false);
  }, []);

  const requestLandscapeOrientationRef = useRef(requestLandscapeOrientation);
  useEffect(() => {
    requestLandscapeOrientationRef.current = requestLandscapeOrientation;
  }, [requestLandscapeOrientation]);

  // Smartphone Orientation Management (Android: Querformat / iOS: Hochformat)
  useEffect(() => {
    const checkOrientation = () => {
      if (typeof navigator === 'undefined' || typeof window === 'undefined') return;

      const isLandscape = window.innerWidth > window.innerHeight;
      const isPortrait = !isLandscape;
      setIsPortraitMode(isPortrait);

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isIPhone = /iPhone|iPod/.test(navigator.userAgent) || 
        (isIOS && Math.min(window.innerWidth, window.innerHeight) < 768);
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isAndroidPhone = isAndroid && Math.min(window.innerWidth, window.innerHeight) < 768;

      // 1. iOS iPhone: Intended mode is Portrait during active session.
      // Block rotation to landscape ONLY during active artwork session!
      if (isRunning && isIPhone && isLandscape) {
        setIsIOSLandscapeBlocked(true);
      } else {
        setIsIOSLandscapeBlocked(false);
      }

      // 2. Android: Intended mode is Landscape during active session.
      // Prompt to rotate to landscape if in portrait during active session!
      if (isRunning && isAndroidPhone && isPortrait) {
        setIsAndroidPortraitPrompt(true);
      } else {
        setIsAndroidPortraitPrompt(false);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [isRunning]);

  // Mobile Double-Back Session Exit Gesture
  useEffect(() => {
    let lastBack = 0;
    const onPop = () => {
      const now = Date.now();
      if (now - lastBack < 2500) {
        if (onExit) onExit();
      } else {
        lastBack = now;
        setBackNoticeVisible(true);
        setTimeout(() => setBackNoticeVisible(false), 2500);
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [onExit]);

  // Direct NFT Download Handler
  const handleSaveNFT = useCallback(() => {
    const url = souvenirVideoUrl || (souvenirVideoBlob ? URL.createObjectURL(souvenirVideoBlob) : '');
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `sakuraverse_souvenir_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 1000);
    setIsNftSaved(true);
    showToast('✨ Video auf dein Gerät heruntergeladen! Bereit als NFT.');
  }, [souvenirVideoBlob, souvenirVideoUrl, showToast]);

  const markArtworkCompleted = useCallback((type: 'bluten' | 'plexus') => {
    if (type === 'bluten' && !blutenCounted) {
      setBlutenCounted(true);
      setCompletedArtworksCount(c => c + 1);
    } else if (type === 'plexus' && !plexusCounted) {
      setPlexusCounted(true);
      setCompletedArtworksCount(c => c + 1);
    }
  }, [blutenCounted, plexusCounted]);

  const markArtworkCompletedRef = useRef(markArtworkCompleted);
  useEffect(() => {
    markArtworkCompletedRef.current = markArtworkCompleted;
  }, [markArtworkCompleted]);

  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const updateCameraDistance = useCallback((w: number, h: number, mode: 'bluten' | 'plexus') => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    const aspect = w / h;

    camera.aspect = aspect;
    if (mode === 'bluten') {
      camera.fov = 45;
      camera.updateProjectionMatrix();
      const visibleWidth = 2 * Math.tan(THREE.MathUtils.degToRad(22.5)) * 16 * aspect;
      const targetCamX = -9.6 + (visibleWidth * 0.48);
      baseCamPosRef.current.set(targetCamX, -0.4, 16);
      baseLookAtRef.current.set(targetCamX, -0.4, 0);
      camera.position.copy(baseCamPosRef.current);
      camera.lookAt(baseLookAtRef.current);
    } else {
      camera.fov = 60;
      camera.updateProjectionMatrix();
      const baseDist = aspect < 1.0 ? 640 : 540;
      baseCamPosRef.current.set(0, 0, baseDist);
      baseLookAtRef.current.set(0, 0, 0);
      camera.position.copy(baseCamPosRef.current);
      camera.lookAt(baseLookAtRef.current);
    }
  }, []);

  const modeTransitionTimerRef = useRef(1.0);

  const handleSwitchMode = useCallback((newMode: 'bluten' | 'plexus') => {
    activeModeRef.current = newMode;
    setActiveMode(newMode);
    modeTransitionTimerRef.current = 0.0;
    if (containerRef.current) {
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      updateCameraDistance(w, h, newMode);
    }
    sendInteractionRef.current?.('MODE_SWITCH', { mode: newMode });
  }, [updateCameraDistance]);

  useEffect(() => {
    if (initialMode && (initialMode === 'bluten' || initialMode === 'plexus') && initialMode !== activeModeRef.current) {
      handleSwitchMode(initialMode);
    }
  }, [initialMode, handleSwitchMode]);

  const handleColorSelect = useCallback((color: BlossomColorId) => {
    setSelectedColor(color);
    showToast(`Farbe: ${BLOSSOM_PALETTES[color].name} ausgewählt`);
    sendInteractionRef.current?.('COLOR_SELECT', { color });
  }, [showToast]);

  const togglePause = useCallback(() => {
    setIsPaused(p => !p);
    showToast(!isPaused ? 'Session pausiert' : 'Session fortgesetzt');
    sendInteractionRef.current?.('PAUSE_TOGGLE', { isPaused: !isPaused });
  }, [isPaused, showToast]);

  const toggleAudio = useCallback(() => {
    setIsAudioMuted(m => !m);
    showToast(!isAudioMuted ? 'Audio stummgeschaltet' : 'Audio aktiviert');
  }, [isAudioMuted, showToast]);

  const restartTriggerRef = useRef<() => void>(() => {});

  const handleRestart = useCallback(() => {
    setIsCreationMode(false);
    colorCountsRef.current = { pink: 0, red: 0, blue: 0, green: 0, yellow: 0 };
    setSelectedColor('pink');
    setPlexusAttachedCount(0);
    setIsPlexusFinale(false);
    restartTriggerRef.current();
    showToast('Kunstwerk zurückgesetzt — Beginn von vorn!');
    sendInteractionRef.current?.('RESTART_ARTWORK', {});
  }, [showToast]);

  const toggleCreationReady = useCallback(() => {
    setHostCreationReady(prev => {
      const next = !prev;
      sendInteractionRef.current?.('CREATION_READY', { ready: next });
      // In single-player host mode or when guest is also ready, open Lightbox
      setIsLightboxOpen(true);
      return next;
    });
  }, []);

  const selectArtworkChoice = useCallback((type: 'bluten' | 'plexus') => {
    setIsCreationMode(true);
    setActiveMode(type);
    activeModeRef.current = type;
    modeTransitionTimerRef.current = 0.0;
    if (containerRef.current) {
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      updateCameraDistance(w, h, type);
    }
    // Clean wipe of artwork residue & fresh start for Creation Mode
    colorCountsRef.current = { pink: 0, red: 0, blue: 0, green: 0, yellow: 0 };
    setSelectedColor('pink');
    setPlexusAttachedCount(0);
    setIsPlexusFinale(false);
    restartTriggerRef.current();

    // Start 14s Souvenir Recording from the live canvas
    if (canvasRef.current && typeof MediaRecorder !== 'undefined') {
      try {
        const stream = canvasRef.current.captureStream(60);
        let selectedMimeType = 'video/webm';
        const mimeTypes = [
          'video/mp4;codecs=avc1',
          'video/mp4;codecs=h264',
          'video/mp4',
          'video/webm;codecs=h264',
          'video/webm;codecs=vp9',
          'video/webm'
        ];
        for (const mt of mimeTypes) {
          if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mt)) {
            selectedMimeType = mt;
            break;
          }
        }
        const chunks: Blob[] = [];
        const recorder = new MediaRecorder(stream, {
          mimeType: selectedMimeType,
          videoBitsPerSecond: 15000000
        });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: selectedMimeType });
          const url = URL.createObjectURL(blob);
          setSouvenirVideoBlob(blob);
          setSouvenirVideoUrl(url);
          setIsNftSaved(false);
          setIsSouvenirVideoOpen(true);
          showToast('✨ Dein 14s Video-Souvenir ist fertig!');
        };
        recorder.start(100);
        setTimeout(() => {
          if (recorder.state !== 'inactive') recorder.stop();
        }, 14000);
      } catch (err) {
        console.warn('Canvas recorder fallback:', err);
      }
    }

    showToast(type === 'bluten' ? '🌸 Sumi-e Kunstwerk gestartet (Creation Mode)' : '✨ Plexus Kunstwerk gestartet (Creation Mode)');
    sendInteractionRef.current?.('ARTWORK_SELECT', { artwork: type });
    setIsLightboxOpen(false);
    setHostCreationReady(false);
    setGuestCreationReady(false);
  }, [showToast, updateCameraDistance]);

  const selectArtworkChoiceRef = useRef(selectArtworkChoice);
  useEffect(() => {
    selectArtworkChoiceRef.current = selectArtworkChoice;
  }, [selectArtworkChoice]);

  const handleExit = useCallback(() => {
    try {
      if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      const screenAny = (typeof screen !== 'undefined' ? screen : null) as unknown as {
        orientation?: {
          unlock?: () => void;
        };
      } | null;
      if (screenAny?.orientation?.unlock) {
        try { screenAny.orientation.unlock(); } catch {}
      }
    } catch {}
    setIsIOSLandscapeBlocked(false);
    setIsAndroidPortraitPrompt(false);
    if (onExitRef.current) {
      onExitRef.current();
    } else {
      window.location.reload();
    }
  }, []);

  // Main Three.js Scene Setup & Native WebGL Engine
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const isPortrait = window.innerHeight > window.innerWidth;
    const width = window.innerWidth;
    const height = isPortrait ? Math.round(window.innerWidth * 9 / 16) : window.innerHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    const targetPixelRatio = isMobile ? Math.min(window.devicePixelRatio, 1.0) : Math.min(window.devicePixelRatio, 1.25);
    renderer.setPixelRatio(targetPixelRatio);
    renderer.setSize(width, height);
    renderer.autoClear = false;

    // Call onCanvasesReady contract (architecture.md)
    if (onCanvasesReady && canvasRef.current) {
      onCanvasesReady(canvasRef.current, canvasRef.current);
    }

    // Background Scene
    const bgScene = new THREE.Scene();
    const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const noiseTex = createNoiseTexture();

    const bgUniforms = {
      iResolution: { value: new THREE.Vector3(renderer.domElement.width, renderer.domElement.height, 1) },
      iTime: { value: 0 },
      iChannel0: { value: noiseTex },
      uKaleidoscope: { value: 0.0 },
      uGridVibe: { value: 0.0 },
      uRippleActive: { value: 0.0 },
      uRippleTime: { value: 0.0 },
      uBgColor1: { value: new THREE.Vector3(0.05, 0.00, 0.02) },
      uBgColor2: { value: new THREE.Vector3(0.74, 0.00, 0.36) },
      uBgColor3: { value: new THREE.Vector3(0.80, 0.04, 0.44) },
      uRippleCrest: { value: new THREE.Vector3(1.0, 0.4, 0.8) },
      uBgBlend: { value: 0.0 },
      uBgDim: { value: 1.0 }
    };

    const bgMat = new THREE.ShaderMaterial({
      vertexShader: bgVertexShader,
      fragmentShader: bgFragmentShader,
      uniforms: bgUniforms,
      depthWrite: false,
      depthTest: false
    });
    const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
    bgScene.add(bgMesh);

    // Main 3D Scene
    const mainScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    cameraRef.current = camera;
    updateCameraDistance(width, height, activeModeRef.current);

    // ==========================================
    // SEPARATE ROOT GROUPS FOR THE TWO ARTWORKS
    // ==========================================
    const blutenSceneGroup = new THREE.Group();
    const plexusSceneGroup = new THREE.Group();
    mainScene.add(blutenSceneGroup);
    mainScene.add(plexusSceneGroup);

    blutenSceneGroup.visible = (activeModeRef.current === 'bluten');
    plexusSceneGroup.visible = (activeModeRef.current === 'plexus');

    // Groups for Blüten Artwork
    const strokeGroup = new THREE.Group();
    const orbGroup = new THREE.Group();
    const petalGroup = new THREE.Group();
    blutenSceneGroup.add(strokeGroup);
    blutenSceneGroup.add(orbGroup);
    blutenSceneGroup.add(petalGroup);

    // Mouse Tracking Vectors
    const mouseScreen = new THREE.Vector2(0.5, 0.5);
    const mouseWorld = new THREE.Vector3(0, 0, 0);

    // 1. Instanced Sakura Petals (600 Petals)
    const petalGeo = new THREE.PlaneGeometry(0.9, 0.9);
    const petalMat = new THREE.MeshBasicMaterial({
      map: generatePetalTexture(),
      color: new THREE.Color(BLOSSOM_PALETTES.pink.vortexTint),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const instancedPetalMesh = new THREE.InstancedMesh(petalGeo, petalMat, MAX_PETALS);
    instancedPetalMesh.matrixAutoUpdate = false;
    instancedPetalMesh.visible = false;
    petalGroup.add(instancedPetalMesh);

    const petalOriginX = new Float32Array(MAX_PETALS);
    const petalOriginY = new Float32Array(MAX_PETALS);
    const petalRadiusX = new Float32Array(MAX_PETALS);
    const petalRadiusY = new Float32Array(MAX_PETALS);
    const petalSpeed = new Float32Array(MAX_PETALS);
    const petalAngle = new Float32Array(MAX_PETALS);
    const petalPhaseZ = new Float32Array(MAX_PETALS);
    const petalScales = new Float32Array(MAX_PETALS);
    const dummy = new THREE.Object3D();
    let activePetalCount = 0;

    for (let i = 0; i < MAX_PETALS; i++) {
      petalOriginX[i] = 2.4 + (Math.random() - 0.5) * 12.8;
      petalOriginY[i] = -0.4 + (Math.random() - 0.5) * 8.0;
      petalRadiusX[i] = 3.2 + Math.random() * 6.4;
      petalRadiusY[i] = 2.4 + Math.random() * 4.8;
      petalSpeed[i] = (0.24 + Math.random() * 0.40) * (i % 2 === 0 ? 1 : -1);
      petalAngle[i] = Math.random() * Math.PI * 2.0;
      petalPhaseZ[i] = Math.random() * Math.PI * 2.0;
      petalScales[i] = 0.5 + Math.random() * 0.5;
    }

    // 2. Main Trunk & Progressive Growth Lifecycle
    const startX = -11.9;
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(startX, -3.4, 0.0),
      new THREE.Vector3(startX + 2.5, -2.2, 0.25),
      new THREE.Vector3(-5.4, -2.7, -0.20),
      new THREE.Vector3(-3.4, -1.1, 0.30),
      new THREE.Vector3(-1.6, -0.4, -0.15),
      new THREE.Vector3(0.4, 0.8, 0.20),
      new THREE.Vector3(2.2, 0.1, -0.25),
      new THREE.Vector3(4.4, 0.7, 0.15),
      new THREE.Vector3(6.8, -0.4, 0.0)
    ], false, 'centripetal', 0.5);

    let mainTrunkStroke = new ImmersiveStroke(strokeGroup, 0.58, 0, 0xf5e4cf);
    const pts = trunkCurve.getSpacedPoints(140);
    for (let i = 0; i <= 140; i++) {
      const t = i / 140;
      mainTrunkStroke.addPoint(pts[i], Math.max(0.18, 1.0 - t * 0.55));
    }
    mainTrunkStroke.setProgress(0.0);

    interface BranchInfo {
      curve: THREE.CatmullRomCurve3;
      stroke: ImmersiveStroke;
      level: number;
      totalLength: number;
    }

    const allBranches: BranchInfo[] = [
      { curve: trunkCurve, stroke: mainTrunkStroke, level: 0, totalLength: trunkCurve.getLength() }
    ];

    const activeOrbs: OrbNode[] = [];
    const growingSubBranches: { stroke: ImmersiveStroke; progress: number; duration: number }[] = [];
    const growingBlossomClusters: { stroke: ImmersiveStroke; progress: number; duration: number }[] = [];
    const persistentBlossomStrokes: ImmersiveStroke[] = [];

    let isTrunkGrowthFinished = false;
    let growthProgressVal = 0.0;
    const growthDurationSeconds = 6.0;

    // Sumi-e Step-by-Step Round Lifecycle Timers
    const ROUND_ACTIVE_TIME_DEFAULT = 5.0; // 5.0s active interaction window for user
    const ROUND_FADE_TIME = 1.0;           // 1.0s unclicked orbs fade out gently
    const ROUND_PAUSE_TIME = 0.8;          // 0.8s pause to let branches settle before next round
    const TRUNK_POST_DELAY = 2.0;          // 2.0s pause after trunk completes before round 1
    let roundState: 'IDLE' | 'ACTIVE' | 'FADING' | 'PAUSE' = 'IDLE';
    let roundTimer = 0.0;
    let trunkPostDelayTimer = 0.0;
    let currentRoundNum = 1;
    let currentPhaseName: 'BRANCH' | 'BLOSSOM' | 'VORTEX' | 'DONE' = 'BRANCH';

    // 14-Second Dominant Color Vortex State (4s alignment + 10s storm)
    let isVortexActive = false;
    let vortexTimer = 0.0;
    const VORTEX_ALIGN_TIME = 4.0;
    const VORTEX_STORM_TIME = 10.0;
    const VORTEX_TOTAL_DURATION = VORTEX_ALIGN_TIME + VORTEX_STORM_TIME; // 14.0s

    const startVortexFinale = () => {
      const counts = colorCountsRef.current;
      const activeColors = (Object.keys(counts) as BlossomColorId[]).filter(c => counts[c] > 0);
      const weightedColorPool: BlossomColorId[] = [];
      activeColors.forEach(c => {
        const count = counts[c];
        for (let k = 0; k < count; k++) {
          weightedColorPool.push(c);
        }
      });
      if (weightedColorPool.length === 0) {
        weightedColorPool.push(selectedColorRef.current);
      }

      petalMat.color.set(0xffffff);

      const vortexPetalLimit = isMobile ? 160 : MAX_PETALS;
      for (let i = 0; i < vortexPetalLimit; i++) {
        const colorKey = weightedColorPool[i % weightedColorPool.length];
        const pal = BLOSSOM_PALETTES[colorKey] || BLOSSOM_PALETTES.pink;
        const colorHex = pal.shades[Math.floor(Math.random() * pal.shades.length)];
        instancedPetalMesh.setColorAt(i, new THREE.Color(colorHex));
      }
      if (instancedPetalMesh.instanceColor) {
        instancedPetalMesh.instanceColor.needsUpdate = true;
      }

      isVortexActive = true;
      vortexTimer = 0.0;
      activePetalCount = vortexPetalLimit;
      if (instancedPetalMesh && instancedPetalMesh.material) {
        (instancedPetalMesh.material as THREE.MeshBasicMaterial).opacity = 0.0;
      }
      instancedPetalMesh.visible = true;

      roundState = 'IDLE';
      currentPhaseName = 'VORTEX';
      currentPhaseRef.current = 'VORTEX';
      setCurrentPhase('VORTEX');

      const bgPal = BG_COLOR_PALETTES.default;
      if (bgUniforms.uBgColor1) {
        bgUniforms.uBgColor1.value.copy(bgPal.c1);
        bgUniforms.uBgColor2.value.copy(bgPal.c2);
        bgUniforms.uBgColor3.value.copy(bgPal.c3);
        bgUniforms.uRippleCrest.value.copy(bgPal.crest);
        bgUniforms.uBgBlend.value = 0.0;
        bgUniforms.uRippleActive.value = 1.0;
        bgUniforms.uRippleTime.value = 0.0;
      }

      showToastRef.current?.('🌸 14s Blüten-Vortex aktiviert!');
    };

    const spawnOrbRound = (roundNum: number, phase: 'BRANCH' | 'BLOSSOM') => {
      currentRoundNum = roundNum;
      currentRoundRef.current = roundNum;
      setCurrentRound(roundNum);

      currentPhaseName = phase;
      currentPhaseRef.current = phase;
      setCurrentPhase(phase);

      roundState = 'ACTIVE';
      roundTimer = 0.0;

      activeOrbs.forEach(o => o.destroy(orbGroup));
      activeOrbs.length = 0;

      if (phase === 'BRANCH') {
        const validBranches = allBranches.filter(b => b.level < 2);
        validBranches.forEach(bInfo => {
          const numOrbs = bInfo.level === 0 ? 2 : 1;
          for (let i = 0; i < numOrbs; i++) {
            const t = 0.25 + Math.random() * 0.60;
            const orb = new OrbNode(orbGroup, bInfo, bInfo.level, roundNum, t, 'branch');
            orb.setAlpha(0.0);
            activeOrbs.push(orb);
          }
        });
      } else if (phase === 'BLOSSOM') {
        const numTotalBlossoms = Math.min(6, allBranches.length * 2);
        for (let i = 0; i < numTotalBlossoms; i++) {
          const bInfo = allBranches[i % allBranches.length];
          const t = 0.20 + Math.random() * 0.70;
          const orb = new OrbNode(orbGroup, bInfo, bInfo.level, roundNum, t, 'blossom');
          orb.setAlpha(0.0);
          activeOrbs.push(orb);
        }
      }
    };

    const spawnSubBranchFromOrb = (orb: OrbNode) => {
      if (isPausedRef.current || orb.branchSpawned) return;
      orb.branchSpawned = true;
      orb.userDrawn = true;
      orb.triggerExplosion();
      orb.setAlpha(0.15);

      const startPos = orb.basePosition.clone();
      const numPts = 45;
      const pts = [startPos.clone()];
      const totalLen = orb.targetChildLength;

      let effectiveGuideDir = orb.guideDir.clone();
      const normal = new THREE.Vector3(-effectiveGuideDir.y, effectiveGuideDir.x, 0).normalize();

      for (let i = 1; i <= numPts; i++) {
        const t = i / numPts;
        const currentDist = totalLen * t;
        const wave1 = Math.sin(t * Math.PI * 4.0 + orb.seed * 6.0) * 0.48;
        const wave2 = Math.cos(t * Math.PI * 8.0 + orb.seed * 3.0) * 0.22;
        const sideOffset = (wave1 + wave2) * (1.0 - t * 0.35);

        const p = startPos.clone()
          .addScaledVector(effectiveGuideDir, currentDist)
          .addScaledVector(normal, sideOffset);

        p.z += (Math.sin(t * Math.PI * 2.0 + orb.seed) - 0.5) * 0.3;
        pts.push(p);
      }

      const childCurve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
      const childStroke = new ImmersiveStroke(strokeGroup, 0.32, orb.level + 1, 0xf5e4cf);
      const spacedPts = childCurve.getSpacedPoints(70);
      for (let i = 0; i <= 70; i++) {
        const t = i / 70;
        childStroke.addPoint(spacedPts[i], Math.max(0.15, 1.0 - t * 0.60));
      }

      const childBranch: BranchInfo = {
        curve: childCurve,
        stroke: childStroke,
        level: orb.level + 1,
        totalLength: childCurve.getLength()
      };
      allBranches.push(childBranch);

      growingSubBranches.push({ stroke: childStroke, progress: 0.0, duration: 3.0 });
    };

    const spawnBlossomClusterFromOrb = (orb: OrbNode) => {
      if (isPausedRef.current || orb.branchSpawned) return;
      orb.branchSpawned = true;
      orb.userDrawn = true;
      orb.triggerExplosion();
      orb.setAlpha(0.15);

      const curColor = selectedColorRef.current;
      colorCountsRef.current[curColor] += 1;
      const palette = BLOSSOM_PALETTES[curColor];

      const centerPos = orb.basePosition.clone();
      const numLayerStrokes = 2 + Math.floor(Math.random() * 2);

      for (let s = 0; s < numLayerStrokes; s++) {
        const strokeColor = palette.shades[Math.floor(Math.random() * palette.shades.length)];
        const clusterRadius = 0.16 + Math.random() * 0.12;
        const baseAngle = Math.random() * Math.PI * 2.0;
        const pts = [];

        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          const angle = baseAngle + t * Math.PI * (1.2 + Math.random() * 0.5);
          const r = clusterRadius * (0.6 + 0.4 * Math.sin(t * Math.PI * 2.0 + s));
          pts.push(centerPos.clone().add(new THREE.Vector3(
            Math.cos(angle) * r,
            Math.sin(angle) * r,
            (Math.random() - 0.5) * 0.12
          )));
        }

        const clusterCurve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
        const clusterStroke = new ImmersiveStroke(strokeGroup, 0.30 + Math.random() * 0.12, 3, strokeColor);
        const spacedPts = clusterCurve.getSpacedPoints(35);
        for (let i = 0; i <= 35; i++) {
          const t = i / 35;
          clusterStroke.addPoint(spacedPts[i], 0.6 + 0.8 * Math.sin(t * Math.PI));
        }

        growingBlossomClusters.push({ stroke: clusterStroke, progress: 0.0, duration: 0.5 });
        persistentBlossomStrokes.push(clusterStroke);
      }
    };

    // 3. Particle Trail Mesh (4,000 Starburst Flares)
    const trailPositions = new Float32Array(MAX_TRAIL_PARTICLES * 3);
    const trailColors = new Float32Array(MAX_TRAIL_PARTICLES * 3);
    const trailSizes = new Float32Array(MAX_TRAIL_PARTICLES);
    const trailAlphas = new Float32Array(MAX_TRAIL_PARTICLES);
    const trailRotations = new Float32Array(MAX_TRAIL_PARTICLES);

    const tpLife = new Float32Array(MAX_TRAIL_PARTICLES);
    const tpMaxLife = new Float32Array(MAX_TRAIL_PARTICLES);
    const tpX = new Float32Array(MAX_TRAIL_PARTICLES);
    const tpY = new Float32Array(MAX_TRAIL_PARTICLES);
    const tpZ = new Float32Array(MAX_TRAIL_PARTICLES);
    const tpVX = new Float32Array(MAX_TRAIL_PARTICLES);
    const tpVY = new Float32Array(MAX_TRAIL_PARTICLES);
    const tpVZ = new Float32Array(MAX_TRAIL_PARTICLES);
    const tpR = new Float32Array(MAX_TRAIL_PARTICLES);
    const tpG = new Float32Array(MAX_TRAIL_PARTICLES);
    const tpB = new Float32Array(MAX_TRAIL_PARTICLES);
    const tpRot = new Float32Array(MAX_TRAIL_PARTICLES);
    const activeTrailBudget = isMobile ? 800 : MAX_TRAIL_PARTICLES;
    let tpNextFreeIndex = 0;
    const emitExplosionStarParticle = (x: number, y: number, z: number, vx: number, vy: number, vz: number) => {
      const idx = tpNextFreeIndex;
      tpNextFreeIndex = (tpNextFreeIndex + 1) % activeTrailBudget;

      tpX[idx] = x;
      tpY[idx] = y;
      tpZ[idx] = z;

      tpVX[idx] = vx;
      tpVY[idx] = vy;
      tpVZ[idx] = vz;

      tpLife[idx] = 0.0;
      tpMaxLife[idx] = 2.2 + Math.random() * 1.5;
      trailSizes[idx] = 70.0 + Math.random() * 85.0;

      const colorType = Math.floor(Math.random() * 4);
      if (colorType === 0) {
        tpR[idx] = 1.9; tpG[idx] = 1.8; tpB[idx] = 2.0;
      } else if (colorType === 1) {
        tpR[idx] = 0.2; tpG[idx] = 1.8; tpB[idx] = 2.0;
      } else if (colorType === 2) {
        tpR[idx] = 2.0; tpG[idx] = 0.2; tpB[idx] = 1.6;
      } else {
        tpR[idx] = 2.0; tpG[idx] = 1.6; tpB[idx] = 0.3;
      }

      trailAlphas[idx] = 1.0;
      tpRot[idx] = Math.random() * Math.PI * 2;
    };

    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
    trailGeo.setAttribute('size', new THREE.BufferAttribute(trailSizes, 1));
    trailGeo.setAttribute('alpha', new THREE.BufferAttribute(trailAlphas, 1));
    trailGeo.setAttribute('rotAngle', new THREE.BufferAttribute(trailRotations, 1));

    const trailMat = new THREE.ShaderMaterial({
      vertexShader: particleTrailVertexShader,
      fragmentShader: particleTrailFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const trailPointsMesh = new THREE.Points(trailGeo, trailMat);
    plexusSceneGroup.add(trailPointsMesh);

    // 4. Plexus Mesh
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_TOTAL_LINES * 6), 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_TOTAL_LINES * 6), 3));
    const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    const plexusLinesMesh = new THREE.LineSegments(lineGeo, lineMat);
    plexusSceneGroup.add(plexusLinesMesh);

    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_TOTAL_NODES * 3), 3));
    nodeGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_TOTAL_NODES * 3), 3));
    nodeGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(MAX_TOTAL_NODES), 1));
    const nodeMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAlpha: { value: 1.0 }
      },
      vertexShader: /* glsl */ `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uAlpha;
        varying vec3 vColor;
        void main() {
          vec2 p = gl_PointCoord - vec2(0.5);
          float d = length(p);
          if (d > 0.5) discard;
          float starVal = pow(clamp(1.0 - abs(p.x) * 2.0, 0.0, 1.0) * clamp(1.0 - abs(p.y) * 2.0, 0.0, 1.0), 2.5);
          float softCore = exp(-d * d * 14.0);
          float intensity = max(starVal * 2.2, softCore * 1.8);
          vec3 brightColor = vColor * 1.45 + vec3(0.55) * starVal + vec3(0.35) * softCore;
          gl_FragColor = vec4(brightColor, clamp(intensity * 1.25 * uAlpha, 0.0, 1.0));
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const plexusPointsMesh = new THREE.Points(nodeGeo, nodeMat);
    plexusSceneGroup.add(plexusPointsMesh);

    // Plexus Finale Shader Mesh (The Universe Within multi-layer network)
    const plexusFinaleGeo = new THREE.PlaneGeometry(2, 2);
    const plexusFinaleUniforms = {
      iResolution: { value: new THREE.Vector3(renderer.domElement.width, renderer.domElement.height, 1) },
      iTime: { value: 0.0 },
      iMouse: { value: new THREE.Vector2(0, 0) },
      uAlpha: { value: 0.0 },
      uColor1: { value: new THREE.Vector3(1.0, 0.1, 0.6) },
      uColor2: { value: new THREE.Vector3(0.0, 0.8, 1.0) },
      uColor3: { value: new THREE.Vector3(1.0, 0.8, 0.1) }
    };
    const plexusFinaleMat = new THREE.ShaderMaterial({
      vertexShader: plexusFinaleVertexShader,
      fragmentShader: plexusFinaleFragmentShader,
      uniforms: plexusFinaleUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false
    });
    const plexusFinaleMesh = new THREE.Mesh(plexusFinaleGeo, plexusFinaleMat);
    plexusFinaleMesh.visible = false;
    plexusSceneGroup.add(plexusFinaleMesh);

    // Pre-allocated flat buffers for high-performance zero-GC Plexus updates
    const worldNodeX = new Float32Array(MAX_TOTAL_NODES);
    const worldNodeY = new Float32Array(MAX_TOTAL_NODES);
    const worldNodeZ = new Float32Array(MAX_TOTAL_NODES);
    const worldNodeR = new Float32Array(MAX_TOTAL_NODES);
    const worldNodeG = new Float32Array(MAX_TOTAL_NODES);
    const worldNodeB = new Float32Array(MAX_TOTAL_NODES);
    const worldNodeSize = new Float32Array(MAX_TOTAL_NODES);
    const worldNodeDistCenter = new Float32Array(MAX_TOTAL_NODES);
    const nodeConnCounts = new Uint8Array(MAX_TOTAL_NODES);
    let prevActiveTrailCount = 0;

    // ==========================================
    // 5 FLOATING PLEXUS ORBS SYSTEM
    // ==========================================
    interface AttachedPlexusNode {
      radius: number;
      angle: number;
      elevation: number;
      orbitSpeed: number;
      r: number;
      g: number;
      b: number;
      size: number;
      rot: number;
      rotSpeed: number;
      tier: number;
      chaosTargetX: number;
      chaosTargetY: number;
      chaosTargetZ: number;
      chaosFreqX: number;
      chaosFreqY: number;
      chaosFreqZ: number;
      chaosPhase: number;
    }

    interface PlexusNodeDef {
      dx: number;
      dy: number;
      dz: number;
      freq: number;
      phase: number;
      rot: number;
      rotSpeed: number;
    }

    interface PlexusCluster {
      id: number;
      centerX: number;
      centerY: number;
      centerZ: number;
      driftX: number;
      driftY: number;
      driftZ: number;
      nodes: PlexusNodeDef[];
      r: number;
      g: number;
      b: number;
    }

    // Planetary orbital configurations (Uniform focal depth so all orbs have identical visual size)
    const PLANETARY_ORBIT_CONFIGS = [
      { radiusX: 115.0, radiusY: 72.0, baseZ: 0.0, speed: 0.38, zPhase: 0.0, zAmp: 0.0 },  // Pink (Innermost)
      { radiusX: 162.0, radiusY: 98.0, baseZ: 0.0, speed: 0.30, zPhase: 1.2, zAmp: 0.0 },  // Rot
      { radiusX: 210.0, radiusY: 128.0, baseZ: 0.0, speed: 0.23, zPhase: 2.5, zAmp: 0.0 }, // Blau
      { radiusX: 255.0, radiusY: 155.0, baseZ: 0.0, speed: 0.18, zPhase: 3.8, zAmp: 0.0 }, // Grün
      { radiusX: 300.0, radiusY: 178.0, baseZ: 0.0, speed: 0.14, zPhase: 5.0, zAmp: 0.0 }  // Gold (Outermost)
    ];

    class FloatingPlexusOrbInstance {
      config: typeof BLOSSOM_PALETTES[BlossomColorId];
      id: BlossomColorId;
      name: string;
      orbIndex: number;
      radiusX: number;
      radiusY: number;
      baseZ: number;
      orbitSpeed: number;
      zPhase: number;
      zAmp: number;
      orbitAngle: number;
      initialOrbitAngle: number;
      x: number;
      y: number;
      z: number;
      attachedPlexusCount = 0;
      attachedNodes: AttachedPlexusNode[] = [];
      mesh: THREE.Mesh;
      material: THREE.ShaderMaterial;
      atmosphereMesh: THREE.Mesh;
      atmosphereMaterial: THREE.ShaderMaterial;
      starSprite: THREE.Sprite;
      trailRibbonGeo: THREE.BufferGeometry;
      trailRibbonMat: THREE.ShaderMaterial;
      trailRibbonMesh: THREE.Mesh;
      ribbonSamples: number;
      trailLength: number;
      trailHistory: { x: number; y: number; z: number }[];
      impulseMesh: THREE.Mesh;
      impulseMaterial: THREE.ShaderMaterial;
      impulseTimer = 999.0;
      hoverWobbleTimer = 999.0;
      dockWobbleTimer = 999.0;
      internalTime = Math.random() * 10.0;
      preset: typeof FRACTAL_ORB_PRESETS[BlossomColorId];

      preFinaleOrbitAngle = 0;
      hasCapturedPreFinale = false;

      constructor(config: typeof BLOSSOM_PALETTES[BlossomColorId], orbIndex = 0) {
        this.config = config;
        this.id = config.id;
        this.name = config.name;
        this.orbIndex = orbIndex;

        const orbitCfg = PLANETARY_ORBIT_CONFIGS[this.orbIndex % PLANETARY_ORBIT_CONFIGS.length];
        this.radiusX = orbitCfg.radiusX;
        this.radiusY = orbitCfg.radiusY;
        this.baseZ = orbitCfg.baseZ;
        this.orbitSpeed = orbitCfg.speed;
        this.zPhase = orbitCfg.zPhase;
        this.zAmp = orbitCfg.zAmp;

        this.initialOrbitAngle = (this.orbIndex / 5.0) * Math.PI * 2 + this.orbIndex * 0.55;
        this.orbitAngle = this.initialOrbitAngle;
        this.x = Math.cos(this.orbitAngle) * this.radiusX;
        this.y = Math.sin(this.orbitAngle) * this.radiusY;
        this.z = Math.sin(this.orbitAngle * 1.5 + this.zPhase) * this.zAmp + this.baseZ;

        this.preFinaleOrbitAngle = this.orbitAngle;
        this.hasCapturedPreFinale = false;

        const ORB_RADIUS = 24.0;
        const geom = new THREE.SphereGeometry(ORB_RADIUS, 48, 48);
        const preset = FRACTAL_ORB_PRESETS[config.id] || FRACTAL_ORB_PRESETS.pink;
        this.preset = preset;

        this.material = new THREE.ShaderMaterial({
          vertexShader: fractalOrbVertexShader,
          fragmentShader: fractalOrbFragmentShader,
          uniforms: {
            uTime: { value: this.internalTime },
            uLocalCamPos: { value: new THREE.Vector3(0, 0, 150) },
            uPrimaryColor: { value: new THREE.Color(preset.primary) },
            uSecondaryColor: { value: new THREE.Color(preset.secondary) },
            uDensity: { value: preset.density },
            uAlpha: { value: 0.0 },
            uFractalIters: { value: preset.fractalIters },
            uFractalScale: { value: preset.fractalScale },
            uFractalDecay: { value: preset.fractalDecay },
            uInternalAnim: { value: 0.43 },
            uSmoothness: { value: preset.smoothness },
            uAsymmetry: { value: preset.asymmetry },
            uRadius: { value: ORB_RADIUS }
          },
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        this.mesh = new THREE.Mesh(geom, this.material);
        this.mesh.position.set(this.x, this.y, this.z);
        this.mesh.visible = false;

        // Atmosphere Halo Ring Mesh (child of orb)
        this.atmosphereMaterial = new THREE.ShaderMaterial({
          vertexShader: atmosphereVertexShader,
          fragmentShader: atmosphereFragmentShader,
          uniforms: {
            uColor: { value: new THREE.Color(preset.primary) },
            uGlow: { value: preset.atmosphereGlow },
            uLevel: { value: preset.atmosphereLevel },
            uAlpha: { value: 0.0 }
          },
          transparent: true,
          side: THREE.FrontSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        this.atmosphereMesh = new THREE.Mesh(geom, this.atmosphereMaterial);
        this.atmosphereMesh.scale.set(preset.atmosphereScale, preset.atmosphereScale, preset.atmosphereScale);
        this.mesh.add(this.atmosphereMesh);

        // Shining Starburst Sprite Flare
        const starTex = generateStarCrossTexture(config.uiColor || preset.primary);
        const spriteMat = new THREE.SpriteMaterial({
          map: starTex,
          color: 0xffffff,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        this.starSprite = new THREE.Sprite(spriteMat);
        this.starSprite.scale.set(48, 48, 1);
        this.starSprite.visible = false;
        this.mesh.add(this.starSprite);

        // Silky Smooth Continuous Glowing Comet Ribbon Geometry
        const RIBBON_SAMPLES = 96;
        this.ribbonSamples = RIBBON_SAMPLES;
        this.trailLength = 125;
        this.trailHistory = [];

        const totalVerts = RIBBON_SAMPLES * 2;
        const totalIndices = (RIBBON_SAMPLES - 1) * 6;
        const ribbonPositions = new Float32Array(totalVerts * 3);
        const ribbonUvs = new Float32Array(totalVerts * 2);
        const ribbonIndices = new Uint16Array(totalIndices);

        let idxOffset = 0;
        for (let s = 0; s < RIBBON_SAMPLES; s++) {
          const vY = s / (RIBBON_SAMPLES - 1);
          ribbonUvs[s * 4] = 0.0;
          ribbonUvs[s * 4 + 1] = vY;
          ribbonUvs[s * 4 + 2] = 1.0;
          ribbonUvs[s * 4 + 3] = vY;

          if (s < RIBBON_SAMPLES - 1) {
            const i0 = s * 2;
            const i1 = s * 2 + 1;
            const i2 = (s + 1) * 2;
            const i3 = (s + 1) * 2 + 1;
            ribbonIndices[idxOffset++] = i0;
            ribbonIndices[idxOffset++] = i1;
            ribbonIndices[idxOffset++] = i2;
            ribbonIndices[idxOffset++] = i2;
            ribbonIndices[idxOffset++] = i1;
            ribbonIndices[idxOffset++] = i3;
          }
        }

        this.trailRibbonGeo = new THREE.BufferGeometry();
        this.trailRibbonGeo.setAttribute('position', new THREE.BufferAttribute(ribbonPositions, 3));
        this.trailRibbonGeo.setAttribute('uv', new THREE.BufferAttribute(ribbonUvs, 2));
        this.trailRibbonGeo.setIndex(new THREE.BufferAttribute(ribbonIndices, 1));

        const rgbList = PALETTE_RGB_CACHE[this.id];
        const orbRgb = rgbList[0];

        this.trailRibbonMat = new THREE.ShaderMaterial({
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 uColor;
            uniform float uAlpha;
            varying vec2 vUv;
            void main() {
              float distFromCenter = abs(vUv.x - 0.5) * 2.0;
              float lateralGlow = exp(-distFromCenter * distFromCenter * 3.6);
              float coreBeam = exp(-distFromCenter * distFromCenter * 14.0) * 0.4;
              float brightness = mix(1.4, 0.35, vUv.y);
              float lengthAlpha = pow(clamp(1.0 - vUv.y, 0.0, 1.0), 1.2) * uAlpha;
              float combinedIntensity = (lateralGlow + coreBeam) * lengthAlpha;
              if (combinedIntensity < 0.002) discard;
              vec3 headTint = mix(vec3(1.0), uColor, 0.3);
              vec3 beamColor = mix(headTint, uColor, clamp(vUv.y * 1.8, 0.0, 1.0)) * brightness;
              gl_FragColor = vec4(beamColor * combinedIntensity, combinedIntensity);
            }
          `,
          uniforms: {
            uColor: { value: new THREE.Color(orbRgb.r, orbRgb.g, orbRgb.b) },
            uAlpha: { value: 0.0 }
          },
          side: THREE.DoubleSide,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });

        this.trailRibbonMesh = new THREE.Mesh(this.trailRibbonGeo, this.trailRibbonMat);
        this.trailRibbonMesh.visible = false;
        plexusSceneGroup.add(this.trailRibbonMesh);

        plexusSceneGroup.add(this.mesh);

        // Gentle colored shockwave impulse ring expanding on docking
        const impulseGeom = new THREE.PlaneGeometry(240, 240);
        this.impulseMaterial = new THREE.ShaderMaterial({
          vertexShader: orbMeshVertexShader,
          fragmentShader: /* glsl */ `
            varying vec2 vUv;
            uniform float uProgress;
            uniform vec3 uColor;
            void main() {
              vec2 p = vUv - vec2(0.5);
              float r = length(p) * 2.0;
              float targetR = uProgress * 0.92;
              float ringWidth = 0.07 * (1.0 - uProgress * 0.5);
              float d = abs(r - targetR);
              float ring = smoothstep(ringWidth, 0.0, d);
              float alpha = ring * (1.0 - uProgress) * 0.95;
              if (alpha < 0.005) discard;
              gl_FragColor = vec4(uColor * 1.5, alpha);
            }
          `,
          uniforms: {
            uProgress: { value: 1.0 },
            uColor: { value: new THREE.Color(config.vortexTint) }
          },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        this.impulseMesh = new THREE.Mesh(impulseGeom, this.impulseMaterial);
        this.impulseMesh.position.set(this.x, this.y, this.z);
        this.impulseMesh.visible = false;
        plexusSceneGroup.add(this.impulseMesh);
      }

      triggerHoverWobble() {
        if (this.hoverWobbleTimer > 0.4) {
          this.hoverWobbleTimer = 0.0;
        }
      }

      triggerDockImpulse() {
        this.impulseTimer = 0.0;
      }

      triggerDockWobble() {
        this.dockWobbleTimer = 0.0;
        this.impulseTimer = 0.0;
      }

      update(delta: number, time: number, isFinale: boolean, finaleTimer: number, camera?: THREE.Camera | null, modeFadeAlpha = 1.0) {
        this.internalTime += delta * 0.55;
        this.material.uniforms.uTime.value = this.internalTime;

        // Smooth 3D tumbling rotation of volumetric orb
        this.mesh.rotation.y += delta * 0.55;
        this.mesh.rotation.x += delta * 0.28;
        this.mesh.updateMatrixWorld();

        if (camera) {
          const localCam = camera.position.clone();
          this.mesh.worldToLocal(localCam);
          this.material.uniforms.uLocalCamPos.value.copy(localCam);
        }

        if (isFinale) {
          if (!this.hasCapturedPreFinale) {
            this.preFinaleOrbitAngle = this.orbitAngle;
            this.hasCapturedPreFinale = true;
          }

          const orbitRadius = 180.0;
          const angle = time * 1.14 + (this.orbIndex * ((Math.PI * 2) / 5));
          const targetOrbitX = Math.cos(angle) * orbitRadius;
          const targetOrbitY = Math.sin(angle) * orbitRadius * 0.75;
          const targetOrbitZ = Math.sin(angle * 2.0) * 35.0;

          this.x = THREE.MathUtils.lerp(this.x, targetOrbitX, 0.08);
          this.y = THREE.MathUtils.lerp(this.y, targetOrbitY, 0.08);
          this.z = THREE.MathUtils.lerp(this.z, targetOrbitZ, 0.08);

          this.material.uniforms.uAlpha.value = THREE.MathUtils.lerp(this.material.uniforms.uAlpha.value, 1.0 * modeFadeAlpha, 0.1);
          this.atmosphereMaterial.uniforms.uAlpha.value = 1.0 * modeFadeAlpha;
          this.atmosphereMaterial.uniforms.uGlow.value = 3.2; // Extra radiant atmosphere in finale
          this.mesh.visible = (activeModeRef.current === 'plexus');

          // Starburst & Ribbon Trail in Finale
          const finaleAlpha = 1.0 * modeFadeAlpha;
          const effectiveShine = 48.0;
          this.starSprite.scale.set(effectiveShine, effectiveShine, 1.0);
          this.starSprite.visible = (activeModeRef.current === 'plexus');
          this.starSprite.material.opacity = modeFadeAlpha;

          this.trailHistory.unshift({ x: this.x, y: this.y, z: this.z });
          if (this.trailHistory.length > this.trailLength) this.trailHistory.pop();

          if (this.trailRibbonMesh && this.trailRibbonGeo) {
            const effectiveTailFactor = 1.0;
            const hasTrail = (activeModeRef.current === 'plexus') && this.trailHistory.length >= 3;
            this.trailRibbonMesh.visible = hasTrail;
            this.trailRibbonMat.uniforms.uAlpha.value = finaleAlpha;

            if (hasTrail) {
              const activeCount = Math.max(6, Math.floor(effectiveTailFactor * this.trailHistory.length));
              const activePts = [];
              for (let h = 0; h < activeCount; h++) {
                const pt = this.trailHistory[h];
                if (pt) activePts.push(new THREE.Vector3(pt.x, pt.y, pt.z));
              }

              if (activePts.length >= 2) {
                const spline = new THREE.CatmullRomCurve3(activePts, false, 'centripetal', 0.5);
                const samples = spline.getSpacedPoints(this.ribbonSamples - 1);
                const rPositions = this.trailRibbonGeo.attributes.position.array as Float32Array;
                const camPos = camera ? camera.position : { x: 0, y: 0, z: 540 };
                const BASE_RIBBON_WIDTH = 28.0 * Math.min(1.0, effectiveTailFactor * 1.5);

                for (let s = 0; s < this.ribbonSamples; s++) {
                  const curP = samples[s];
                  const prevP = samples[Math.max(0, s - 1)];
                  const nextP = samples[Math.min(this.ribbonSamples - 1, s + 1)];

                  let tx = nextP.x - prevP.x;
                  let ty = nextP.y - prevP.y;
                  let tz = nextP.z - prevP.z;
                  const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1.0;
                  tx /= tLen; ty /= tLen; tz /= tLen;

                  let vx = camPos.x - curP.x;
                  let vy = camPos.y - curP.y;
                  let vz = camPos.z - curP.z;
                  const vLen = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1.0;
                  vx /= vLen; vy /= vLen; vz /= vLen;

                  let nx = ty * vz - tz * vy;
                  let ny = tz * vx - tx * vz;
                  let nz = tx * vy - ty * vx;
                  const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;
                  nx /= nLen; ny /= nLen; nz /= nLen;

                  const normS = s / (this.ribbonSamples - 1);
                  const w = BASE_RIBBON_WIDTH * Math.pow(Math.max(0.0, 1.0 - normS), 0.92);

                  const vIdx = s * 6;
                  rPositions[vIdx]     = curP.x + nx * w;
                  rPositions[vIdx + 1] = curP.y + ny * w;
                  rPositions[vIdx + 2] = curP.z + nz * w;

                  rPositions[vIdx + 3] = curP.x - nx * w;
                  rPositions[vIdx + 4] = curP.y - ny * w;
                  rPositions[vIdx + 5] = curP.z - nz * w;
                }

                this.trailRibbonGeo.attributes.position.needsUpdate = true;
              }
            }
          }
        } else {
          if (this.trailRibbonMesh) this.trailRibbonMesh.visible = false;
          if (this.starSprite) this.starSprite.visible = false;
          this.trailHistory = [];

          if (this.hasCapturedPreFinale) {
            this.orbitAngle = this.preFinaleOrbitAngle;
            this.hasCapturedPreFinale = false;
          }

            // Restore visibility and opacity for all orbs (clean fade-in without pop-in)
            this.material.uniforms.uAlpha.value = 0.95 * modeFadeAlpha;
            this.atmosphereMaterial.uniforms.uAlpha.value = this.preset.atmosphereGlow * modeFadeAlpha;
            this.mesh.visible = (activeModeRef.current === 'plexus' && modeFadeAlpha > 0.001);

            // Planetary Orbiting computed deterministically from time (exact sync)
            this.orbitAngle = this.initialOrbitAngle + this.orbitSpeed * time;
            const targetX = Math.cos(this.orbitAngle) * this.radiusX;
            const targetY = Math.sin(this.orbitAngle) * this.radiusY;
            const targetZ = Math.sin(this.orbitAngle * 1.5 + this.zPhase) * this.zAmp + this.baseZ;

            this.x = targetX;
            this.y = targetY;
            this.z = targetZ;
        }

        // Squash-and-Stretch & Spring Wobble (1.0s)
        let scaleX = 1.0, scaleY = 1.0, scaleZ = 1.0;
        let wobbleDispX = 0.0, wobbleDispY = 0.0;

        // 1. Hover Wobble: Elastic organic spring reaction (1.0s)
        if (this.hoverWobbleTimer < 1.0) {
          this.hoverWobbleTimer += delta;
          const t = Math.min(1.0, this.hoverWobbleTimer / 1.0);
          const wobble = Math.sin(t * Math.PI * 8.0) * Math.exp(-t * 3.5);
          scaleX *= (1.0 + wobble * 0.22);
          scaleY *= (1.0 - wobble * 0.18);
          scaleZ *= (1.0 + wobble * 0.22);
          wobbleDispX += Math.sin(t * Math.PI * 10.0) * (1.0 - t) * 4.5;
          wobbleDispY += Math.cos(t * Math.PI * 10.0) * (1.0 - t) * 4.5;
        }

        // 2. Dock Wobble: Energetic impact squash & stretch (1.0s)
        if (this.dockWobbleTimer < 1.0) {
          this.dockWobbleTimer += delta;
          const t = Math.min(1.0, this.dockWobbleTimer / 1.0);
          const dockWobble = Math.sin(t * Math.PI * 10.0) * Math.exp(-t * 3.2);
          scaleX *= (1.0 + dockWobble * 0.36);
          scaleY *= (1.0 - dockWobble * 0.28);
          scaleZ *= (1.0 + dockWobble * 0.36);
          wobbleDispX += Math.sin(t * Math.PI * 12.0) * (1.0 - t) * 6.0;
          wobbleDispY += Math.cos(t * Math.PI * 12.0) * (1.0 - t) * 6.0;

          const glowBoost = 1.0 + Math.max(0.0, dockWobble * 2.0);
          this.atmosphereMaterial.uniforms.uGlow.value = this.preset.atmosphereGlow * glowBoost;
        } else if (this.hoverWobbleTimer >= 1.0) {
          this.atmosphereMaterial.uniforms.uGlow.value = this.preset.atmosphereGlow;
        }

        this.mesh.scale.set(scaleX, scaleY, scaleZ);
        this.mesh.position.set(this.x + wobbleDispX, this.y + wobbleDispY, this.z);

        // Update dock impulse shockwave ring
        if (this.impulseTimer < 0.85) {
          this.impulseTimer += delta;
          const progress = Math.min(1.0, this.impulseTimer / 0.85);
          this.impulseMaterial.uniforms.uProgress.value = progress;
          this.impulseMesh.position.set(this.x, this.y, this.z);
          this.impulseMesh.visible = (activeModeRef.current === 'plexus');
        } else {
          this.impulseMesh.visible = false;
        }

        const baseRotSpeed = 0.45 + (this.attachedPlexusCount * 0.20);
        this.attachedNodes.forEach(node => {
          node.rot += (delta * (baseRotSpeed + node.rotSpeed * 0.2));
        });
      }

      attachCluster(cluster: PlexusCluster) {
        this.attachedPlexusCount += 1;
        const tier = this.attachedPlexusCount;
        // Adapted layer radius to fit outside the 24 radius sphere
        const layerRadius = 38.0 + (tier - 1) * 14.0;
        const speedMul = 1.0 + (tier % 2 === 0 ? 0.35 : -0.25);

        const rgbList = PALETTE_RGB_CACHE[this.id];

        cluster.nodes.forEach((cn, i) => {
          const angle = (i / cluster.nodes.length) * Math.PI * 2 + Math.random() * 0.4;
          const elevation = (Math.random() - 0.5) * Math.PI * 0.6;
          const colIndex = i % rgbList.length;
          const rgb = rgbList[colIndex];
          this.attachedNodes.push({
            radius: layerRadius + (Math.random() - 0.5) * 6.0,
            angle: angle,
            elevation: elevation,
            orbitSpeed: (0.45 + (i % 3) * 0.20) * (i % 2 === 0 ? 1 : -1) * speedMul,
            r: rgb.r,
            g: rgb.g,
            b: rgb.b,
            size: 16.0 + Math.random() * 8.0,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 3.0,
            tier: tier,
            chaosTargetX: (Math.random() - 0.5) * 540.0,
            chaosTargetY: (Math.random() - 0.5) * 340.0,
            chaosTargetZ: (Math.random() - 0.5) * 120.0,
            chaosFreqX: 0.4 + Math.random() * 0.8,
            chaosFreqY: 0.4 + Math.random() * 0.8,
            chaosFreqZ: 0.3 + Math.random() * 0.6,
            chaosPhase: Math.random() * Math.PI * 2
          });
        });
      }

      destroy() {
        plexusSceneGroup.remove(this.mesh);
        plexusSceneGroup.remove(this.impulseMesh);
        if (this.trailRibbonMesh) plexusSceneGroup.remove(this.trailRibbonMesh);
        this.mesh.geometry.dispose();
        this.atmosphereMesh.geometry.dispose();
        this.impulseMesh.geometry.dispose();
        if (this.trailRibbonGeo) this.trailRibbonGeo.dispose();
        this.material.dispose();
        this.atmosphereMaterial.dispose();
        this.impulseMaterial.dispose();
        if (this.trailRibbonMat) this.trailRibbonMat.dispose();
      }
    }

    const floatingPlexusOrbs: FloatingPlexusOrbInstance[] = [];
    (Object.keys(BLOSSOM_PALETTES) as BlossomColorId[]).forEach((cid, idx) => {
      const orb = new FloatingPlexusOrbInstance(BLOSSOM_PALETTES[cid], idx);
      floatingPlexusOrbs.push(orb);
    });

    const activePlexusClusters: PlexusCluster[] = [];
    let draggedPlexusCluster: PlexusCluster | null = null;
    const dragOffset = new THREE.Vector2();
    let isMouseDown = false;
    let plexusHoldTime = 0.0;
    let plexusOriginX = 0;
    let plexusOriginY = 0;
    let activeHoldNodes: PlexusNodeDef[] = [];
    let totalAttachedPlexusCount = 0;
    let isPlexusFinaleActive = false;
    let plexusFinaleStartTime = 0.0;
    let isPlexusCompleted = false;
    let isPlexusRippleActive = false;
    let plexusRippleTimer = 0.0;
    const PLEXUS_TRANSITION_DURATION = 4.0;
    const PLEXUS_GRAND_FINALE_DURATION = 10.0;
    const PLEXUS_FINALE_DURATION = 14.0;

    interface FinaleMeshOpts {
      particleAmount: number;
      defaultSpeed: number;
      variantSpeed: number;
      defaultRadius: number;
      variantRadius: number;
      linkRadius: number;
      maxLinksPerNode?: number;
      boundX: number;
      boundY: number;
      boundZ: number;
    }

    const FINALE_MESH_OPTS: FinaleMeshOpts = {
      particleAmount: 100,
      defaultSpeed: 0.75,
      variantSpeed: 0.75,
      defaultRadius: 18.0,
      variantRadius: 9.0,
      linkRadius: 88.0,
      maxLinksPerNode: 4,
      boundX: 295.0, // 50% margin to screen edges
      boundY: 185.0, // 50% margin to screen edges
      boundZ: 48.0
    };

    class FinaleMeshParticle {
      x = 0;
      y = 0;
      z = 0;
      renderX = 0;
      renderY = 0;
      renderZ = 0;
      originX = 0;
      originY = 0;
      originZ = 0;
      particleIndex = 0;
      strandPhase = 0;
      strandAmp = 42.0;
      curlPhase = 0;
      curlSpeed = 2.4;
      speed = 1;
      directionAngle = 0;
      pitchAngle = 0;
      vector = { x: 0, y: 0, z: 0 };
      radius = 10;
      color = { r: 1, g: 1, b: 1 };
      rotAngle = 0;
      rotSpeed = 0;
      boundX: number;
      boundY: number;
      boundZ: number;

      constructor(opts: FinaleMeshOpts, boundX?: number, boundY?: number, boundZ?: number, palette?: { r: number; g: number; b: number }[], originPos?: { x: number; y: number; z: number } | null, particleIndex = 0) {
        this.boundX = boundX || FINALE_MESH_OPTS.boundX;
        this.boundY = boundY || FINALE_MESH_OPTS.boundY;
        this.boundZ = boundZ || FINALE_MESH_OPTS.boundZ;
        this.particleIndex = particleIndex;
        this.originX = originPos ? (originPos.x + (Math.random() - 0.5) * 14.0) : (Math.random() - 0.5) * 40;
        this.originY = originPos ? (originPos.y + (Math.random() - 0.5) * 14.0) : (Math.random() - 0.5) * 30;
        this.originZ = originPos ? (originPos.z + (Math.random() - 0.5) * 10.0) : 0;

        // Long organic wavy filament thread streaming properties
        this.strandPhase = (particleIndex % 20) / 20.0;
        this.strandAmp = 42.0 + (particleIndex % 6) * 7.0;
        this.curlPhase = (particleIndex * 1.45) % (Math.PI * 2);
        this.curlSpeed = 2.4 + (particleIndex % 3) * 0.65;

        this.reset(opts, palette);
      }

      reset(opts: FinaleMeshOpts, palette?: { r: number; g: number; b: number }[]) {
        const opt = opts || FINALE_MESH_OPTS;
        const angle = Math.random() * Math.PI * 2;
        const rFrac = Math.sqrt(Math.random());
        this.x = Math.cos(angle) * this.boundX * 0.90 * rFrac;
        this.y = Math.sin(angle) * this.boundY * 0.90 * rFrac;
        this.z = (Math.random() - 0.5) * 2.0 * this.boundZ;

        this.renderX = this.originX;
        this.renderY = this.originY;
        this.renderZ = this.originZ;

        this.speed = opt.defaultSpeed + Math.random() * opt.variantSpeed;
        this.directionAngle = Math.random() * Math.PI * 2;
        this.pitchAngle = (Math.random() - 0.5) * Math.PI * 0.7;

        this.vector = {
          x: Math.cos(this.directionAngle) * Math.cos(this.pitchAngle) * this.speed,
          y: Math.sin(this.directionAngle) * Math.cos(this.pitchAngle) * this.speed,
          z: Math.sin(this.pitchAngle) * this.speed * 0.6
        };

        this.radius = opt.defaultRadius + Math.random() * opt.variantRadius;
        this.color = palette ? palette[Math.floor(Math.random() * palette.length)] : { r: 1.0, g: 0.8, b: 0.9 };
        this.rotAngle = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 2.0;
      }

      update(delta: number, transitionProgress = 1.0, finaleAge = 0.0, totalTime = 0.0) {
        const dt60 = Math.min(2.0, delta * 60.0);
        this.border();
        this.x += this.vector.x * dt60;
        this.y += this.vector.y * dt60;
        this.z += this.vector.z * dt60;
        this.rotAngle += this.rotSpeed * delta;

        // 1. Long organic wavy filament thread motion streaming from docked orbs into center area
        let particleProg = 1.0;
        let easeProg = 1.0;
        let waveX = 0.0, waveY = 0.0, waveZ = 0.0;

        if (transitionProgress < 1.0) {
          const strandStart = this.strandPhase * 0.38;
          particleProg = Math.max(0.0, Math.min(1.0, (transitionProgress - strandStart) / (1.0 - strandStart)));
          easeProg = particleProg * particleProg * (3.0 - 2.0 * particleProg);

          const filamentWaveEnvelope = Math.sin(particleProg * Math.PI);
          waveX = Math.sin(totalTime * this.curlSpeed + this.curlPhase + particleProg * 6.28) * this.strandAmp * filamentWaveEnvelope;
          waveY = Math.cos(totalTime * (this.curlSpeed * 0.85) + this.curlPhase * 1.3 + particleProg * 5.5) * (this.strandAmp * 0.8) * filamentWaveEnvelope;
          waveZ = Math.sin(totalTime * (this.curlSpeed * 1.2) + this.curlPhase * 2.1 + particleProg * 7.0) * (this.strandAmp * 0.6) * filamentWaveEnvelope;
        }

        const baseX = THREE.MathUtils.lerp(this.originX, this.x, easeProg) + waveX;
        const baseY = THREE.MathUtils.lerp(this.originY, this.y, easeProg) + waveY;
        const baseZ = THREE.MathUtils.lerp(this.originZ, this.z, easeProg) + waveZ;

        // 2. Moderate whole-network 3D rotation around its own central Y-axis (and subtle vertical tilt)
        const netRotY = finaleAge * 0.24;
        const netTiltX = Math.sin(finaleAge * 0.32) * 0.08;

        const cosY = Math.cos(netRotY);
        const sinY = Math.sin(netRotY);
        const rx = baseX * cosY - baseZ * sinY;
        const rz1 = baseX * sinY + baseZ * cosY;

        const cosX = Math.cos(netTiltX);
        const sinX = Math.sin(netTiltX);
        const ry = baseY * cosX - rz1 * sinX;
        const rz = baseY * sinX + rz1 * cosX;

        this.renderX = rx;
        this.renderY = ry;
        this.renderZ = rz;
      }

      border() {
        const normY = this.y / this.boundY;
        const currentBoundX = this.boundX * Math.sqrt(Math.max(0.12, 1.0 - normY * normY * 0.72));

        if (this.x >= currentBoundX) {
          this.vector.x = -Math.abs(this.vector.x);
          this.x = currentBoundX;
        } else if (this.x <= -currentBoundX) {
          this.vector.x = Math.abs(this.vector.x);
          this.x = -currentBoundX;
        }

        if (this.y >= this.boundY) {
          this.vector.y = -Math.abs(this.vector.y);
          this.y = this.boundY;
        } else if (this.y <= -this.boundY) {
          this.vector.y = Math.abs(this.vector.y);
          this.y = -this.boundY;
        }

        if (this.z >= this.boundZ) {
          this.vector.z = -Math.abs(this.vector.z);
          this.z = this.boundZ;
        } else if (this.z <= -this.boundZ) {
          this.vector.z = Math.abs(this.vector.z);
          this.z = -this.boundZ;
        }
      }
    }

    let finaleParticles: FinaleMeshParticle[] = [];
    const initFinaleParticles = (activeOrbPalettes?: { r: number; g: number; b: number }[][], activeOrbPositions?: { x: number; y: number; z: number }[]) => {
      finaleParticles = [];
      const palettes = (activeOrbPalettes && activeOrbPalettes.length > 0)
        ? activeOrbPalettes
        : [PALETTE_RGB_CACHE.pink, PALETTE_RGB_CACHE.red, PALETTE_RGB_CACHE.blue, PALETTE_RGB_CACHE.green, PALETTE_RGB_CACHE.yellow];
      for (let i = 0; i < FINALE_MESH_OPTS.particleAmount; i++) {
        const pal = palettes[i % palettes.length];
        const origin = activeOrbPositions && activeOrbPositions.length > 0 ? activeOrbPositions[i % activeOrbPositions.length] : null;
        finaleParticles.push(new FinaleMeshParticle(FINALE_MESH_OPTS, FINALE_MESH_OPTS.boundX, FINALE_MESH_OPTS.boundY, FINALE_MESH_OPTS.boundZ, pal, origin, i));
      }
    };

    const generateRandomPlexusHoldNodes = (): PlexusNodeDef[] => {
      const nodes: PlexusNodeDef[] = [];
      const nodeCount = 14 + Math.floor(Math.random() * 4);
      for (let i = 0; i < nodeCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 15.0 + Math.random() * 45.0;
        const heightZ = (Math.random() - 0.5) * 35.0;
        nodes.push({
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          dz: heightZ,
          freq: 0.8 + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 3.0
        });
      }
      return nodes;
    };

    const createDriftingPlexusCluster = (x: number, y: number, z: number, customNodes?: PlexusNodeDef[]) => {
      const nodes = customNodes || generateRandomPlexusHoldNodes();
      const clusterId = activePlexusClusters.length + 1;
      const dirX = (activePlexusClusters.length % 2 === 0) ? 1 : -1;
      const dirY = (activePlexusClusters.length % 3 === 0) ? 1 : -1;

      activePlexusClusters.push({
        id: clusterId,
        centerX: x,
        centerY: y,
        centerZ: z,
        driftX: (12.0 + Math.random() * 18.0) * dirX,
        driftY: (10.0 + Math.random() * 16.0) * dirY,
        driftZ: (8.0 + Math.random() * 14.0) * dirX,
        nodes: nodes,
        r: 1.0,
        g: 0.18,
        b: 0.65
      });
    };

    // Scratch instances for zero-allocation pointer & camera math (quality_and_performance.md)
    const unprojectScratch = new THREE.Vector3();
    const rayDirScratch = new THREE.Vector3();
    const targetParallax = new THREE.Vector2(0, 0);
    const currentParallax = new THREE.Vector2(0, 0);

    // Interactive Pointer Handlers
    const updatePointerWorld = (clientX: number, clientY: number) => {
      if (canvasRef.current && cameraRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        mouseScreen.x = Math.max(0.0, Math.min(1.0, (clientX - rect.left) / rect.width));
        mouseScreen.y = Math.max(0.0, Math.min(1.0, 1.0 - ((clientY - rect.top) / rect.height)));

        unprojectScratch.set(mouseScreen.x * 2 - 1, mouseScreen.y * 2 - 1, 0.5);
        unprojectScratch.unproject(cameraRef.current);
        rayDirScratch.copy(unprojectScratch).sub(cameraRef.current.position).normalize();
        const dist = -cameraRef.current.position.z / rayDirScratch.z;
        mouseWorld.copy(cameraRef.current.position).add(rayDirScratch.multiplyScalar(dist));
      }
    };

    let hasHitOrbThisGesture = false;

    const checkAndTriggerOrbHit = (clientX: number, clientY: number) => {
      if (isPausedRef.current || activeModeRef.current !== 'bluten') return false;
      if (!isTrunkGrowthFinished || isVortexActive) return false;
      if (!cameraRef.current || !canvasRef.current) return false;

      const rect = canvasRef.current.getBoundingClientRect();
      // Reduced precision hit radius so two nearby nodes are never triggered simultaneously
      const screenRadius = isMobile ? 26.0 : 20.0;
      const worldHitDistance = isMobile ? 1.4 : 1.0;

      let bestOrb: OrbNode | null = null;
      let minDistance = Infinity;

      for (let i = 0; i < activeOrbs.length; i++) {
        const orb = activeOrbs[i];
        if (orb.userDrawn || orb.branchSpawned || orb.isExploding) continue;

        // 1. Direct Screen-space projected hit detection
        const orbPos = orb.position;
        const p = orbPos.clone().project(cameraRef.current);
        const orbScreenX = rect.left + ((p.x + 1) / 2) * rect.width;
        const orbScreenY = rect.top + ((1 - p.y) / 2) * rect.height;
        const pixelDist = Math.hypot(clientX - orbScreenX, clientY - orbScreenY);

        if (pixelDist <= screenRadius) {
          if (pixelDist < minDistance) {
            minDistance = pixelDist;
            bestOrb = orb;
          }
        } else {
          // 2. World-space distance check fallback
          const wDist = mouseWorld.distanceTo(orb.position);
          if (wDist < worldHitDistance) {
            const approxPx = (wDist / worldHitDistance) * screenRadius;
            if (approxPx < minDistance) {
              minDistance = approxPx;
              bestOrb = orb;
            }
          }
        }
      }

      if (bestOrb) {
        if (currentPhaseName === 'BRANCH') {
          spawnSubBranchFromOrb(bestOrb);
        } else if (currentPhaseName === 'BLOSSOM') {
          spawnBlossomClusterFromOrb(bestOrb);
        }

        showToastRef.current?.('🌸 Interaktiver Knotenpunkt aktiviert!');

        const remainingOrbs = activeOrbs.filter(o => !o.userDrawn && !o.branchSpawned);
        if (remainingOrbs.length === 0 && roundState === 'ACTIVE') {
          roundState = 'FADING';
          roundTimer = 0.0;
        }
        return true;
      }
      return false;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (e.cancelable && e.target instanceof HTMLElement && (e.target.tagName === 'CANVAS' || e.target.closest('canvas'))) {
        e.preventDefault();
      }
      const touch = 'touches' in e && e.touches.length > 0 ? e.touches[0] : null;
      const clientX = touch ? touch.clientX : (e as MouseEvent).clientX;
      const clientY = touch ? touch.clientY : (e as MouseEvent).clientY;
      if (clientX === undefined || clientY === undefined) return;
      updatePointerWorld(clientX, clientY);

      if (isMouseDown && draggedPlexusCluster && activeModeRef.current === 'plexus') {
        draggedPlexusCluster.centerX = mouseWorld.x + dragOffset.x;
        draggedPlexusCluster.centerY = mouseWorld.y + dragOffset.y;

        for (let i = 0; i < floatingPlexusOrbs.length; i++) {
          const orb = floatingPlexusOrbs[i];
          const dx = orb.x - draggedPlexusCluster.centerX;
          const dy = orb.y - draggedPlexusCluster.centerY;
          if (Math.sqrt(dx * dx + dy * dy) < 80.0) {
            orb.triggerHoverWobble();
          }
        }
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (isPausedRef.current) return;
      if (e.cancelable && e.target instanceof HTMLElement && (e.target.tagName === 'CANVAS' || e.target.closest('canvas'))) {
        e.preventDefault();
      }
      isMouseDown = true;

      const touch = 'touches' in e && e.touches.length > 0 ? e.touches[0] : null;
      const clientX = touch ? touch.clientX : (e as MouseEvent).clientX;
      const clientY = touch ? touch.clientY : (e as MouseEvent).clientY;
      if (clientX === undefined || clientY === undefined) return;
      updatePointerWorld(clientX, clientY);

      if (activeModeRef.current === 'bluten') {
        hasHitOrbThisGesture = checkAndTriggerOrbHit(clientX, clientY);
      } else if (activeModeRef.current === 'plexus') {
        draggedPlexusCluster = null;

        for (let i = 0; i < activePlexusClusters.length; i++) {
          const cluster = activePlexusClusters[i];
          const dx = cluster.centerX - mouseWorld.x;
          const dy = cluster.centerY - mouseWorld.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= 75.0) {
            draggedPlexusCluster = cluster;
            dragOffset.set(dx, dy);
            break;
          }
        }

        if (!draggedPlexusCluster) {
          plexusHoldTime = 0.0;
          activeHoldNodes = generateRandomPlexusHoldNodes();
          plexusOriginX = mouseWorld.x;
          plexusOriginY = mouseWorld.y;
        }
      }
    };

    const handlePointerUp = (e?: MouseEvent | TouchEvent) => {
      if (e && activeModeRef.current === 'bluten') {
        const touch = 'changedTouches' in e && e.changedTouches.length > 0 ? e.changedTouches[0] : null;
        const clientX = touch ? touch.clientX : (e as MouseEvent).clientX;
        const clientY = touch ? touch.clientY : (e as MouseEvent).clientY;
        if (clientX !== undefined && clientY !== undefined && !hasHitOrbThisGesture) {
          checkAndTriggerOrbHit(clientX, clientY);
        }
        hasHitOrbThisGesture = false;
      }
      if (isMouseDown && activeModeRef.current === 'plexus') {
        if (draggedPlexusCluster) {
          let dockedOrb: FloatingPlexusOrbInstance | null = null;
          let minDist = 120.0;

          for (let i = 0; i < floatingPlexusOrbs.length; i++) {
            const orb = floatingPlexusOrbs[i];
            const dx = orb.x - draggedPlexusCluster.centerX;
            const dy = orb.y - draggedPlexusCluster.centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
              minDist = dist;
              dockedOrb = orb;
            }
          }

          if (dockedOrb) {
            dockedOrb.attachCluster(draggedPlexusCluster);
            dockedOrb.triggerDockImpulse();
            dockedOrb.triggerDockWobble();
            totalAttachedPlexusCount++;
            setPlexusAttachedCount(totalAttachedPlexusCount);

            const clusterIdx = activePlexusClusters.indexOf(draggedPlexusCluster);
            if (clusterIdx !== -1) activePlexusClusters.splice(clusterIdx, 1);

            showToast(`🔮 Plexus an ${dockedOrb.name}-Orb angedockt! (${totalAttachedPlexusCount}/6 Gesamt)`);

            if (totalAttachedPlexusCount >= 6 && !isPlexusFinaleActive && !isPlexusCompleted) {
              isPlexusFinaleActive = true;
              setIsPlexusFinale(true);
              plexusFinaleStartTime = totalAnimTime;
              isPlexusRippleActive = true;
              plexusRippleTimer = 0.0;
              if (bgUniforms.uRippleActive) bgUniforms.uRippleActive.value = 1.0;
              if (bgUniforms.uRippleTime) bgUniforms.uRippleTime.value = 0.0;

              // Initialize network particles exclusively from docked orbs
              const activeDockedOrbs = floatingPlexusOrbs.filter(o => o.attachedPlexusCount > 0);
              const activeOrbsList = activeDockedOrbs.length > 0 ? activeDockedOrbs : floatingPlexusOrbs;
              const weightedPalettes: { r: number; g: number; b: number }[][] = [];
              const weightedPositions: { x: number; y: number; z: number }[] = [];
              activeOrbsList.forEach(orb => {
                const count = Math.max(1, orb.attachedPlexusCount);
                const pal = PALETTE_RGB_CACHE[orb.id] || PALETTE_RGB_CACHE.pink;
                for (let w = 0; w < count; w++) {
                  weightedPalettes.push(pal);
                  weightedPositions.push({ x: orb.x, y: orb.y, z: orb.z });
                }
              });
              initFinaleParticles(weightedPalettes, weightedPositions);

              showToast('🌟 10s Finale: Stern-Netzwerk aktiviert!');
            }
          }
        } else {
          if (plexusHoldTime >= 1.5) {
            createDriftingPlexusCluster(plexusOriginX, plexusOriginY, 0.0, activeHoldNodes);
          }
        }
      }
      isMouseDown = false;
      draggedPlexusCluster = null;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchstart', handlePointerDown, { passive: false });
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp, { passive: false });

    // Restart function to reset 3D scene elements cleanly
    restartTriggerRef.current = () => {
      isVortexActive = false;
      vortexTimer = 0.0;
      instancedPetalMesh.visible = false;
      activePetalCount = 0;

      while (strokeGroup.children.length > 0) {
        strokeGroup.remove(strokeGroup.children[0]);
      }
      activeOrbs.forEach(o => o.destroy(orbGroup));
      activeOrbs.length = 0;
      growingSubBranches.length = 0;
      growingBlossomClusters.length = 0;
      persistentBlossomStrokes.length = 0;
      allBranches.length = 0;

      // Reset Plexus State
      activePlexusClusters.length = 0;
      totalAttachedPlexusCount = 0;
      isPlexusFinaleActive = false;
      isPlexusCompleted = false;
      finaleParticles.length = 0;
      isPlexusRippleActive = false;
      plexusRippleTimer = 0.0;
      setPlexusAttachedCount(0);
      setIsPlexusFinale(false);
      floatingPlexusOrbs.forEach(orb => {
        orb.attachedPlexusCount = 0;
        orb.attachedNodes = [];
      });

      if (activeModeRef.current === 'bluten') {
        blutenSceneGroup.visible = true;
        plexusSceneGroup.visible = false;

        mainTrunkStroke = new ImmersiveStroke(strokeGroup, 0.58, 0, 0xf5e4cf);
        for (let i = 0; i <= 140; i++) {
          const t = i / 140;
          mainTrunkStroke.addPoint(pts[i], Math.max(0.18, 1.0 - t * 0.55));
        }
        mainTrunkStroke.setProgress(0.0);
        allBranches.push({ curve: trunkCurve, stroke: mainTrunkStroke, level: 0, totalLength: trunkCurve.getLength() });

        isTrunkGrowthFinished = false;
        growthProgressVal = 0.0;
        setIsTrunkGrowing(true);
        roundState = 'IDLE';
        roundTimer = 0.0;
        trunkPostDelayTimer = 0.0;
        currentRoundNum = 1;
        currentRoundRef.current = 1;
        setCurrentRound(1);
        currentPhaseName = 'BRANCH';
        currentPhaseRef.current = 'BRANCH';
        setCurrentPhase('BRANCH');
      } else {
        blutenSceneGroup.visible = false;
        plexusSceneGroup.visible = true;

        setIsTrunkGrowing(false);
        // Pre-spawn 2 fresh drifting clusters for user interaction
        createDriftingPlexusCluster(-120, 40, 0);
        createDriftingPlexusCluster(140, -60, 0);
      }

      if (bgUniforms.uBgColor1) bgUniforms.uBgColor1.value.copy(BG_COLOR_PALETTES.default.c1);
      if (bgUniforms.uBgColor2) bgUniforms.uBgColor2.value.copy(BG_COLOR_PALETTES.default.c2);
      if (bgUniforms.uBgColor3) bgUniforms.uBgColor3.value.copy(BG_COLOR_PALETTES.default.c3);
      if (bgUniforms.uRippleCrest) bgUniforms.uRippleCrest.value.copy(BG_COLOR_PALETTES.default.crest);
      if (bgUniforms.uBgBlend) bgUniforms.uBgBlend.value = 0.0;
      if (bgUniforms.uRippleActive) bgUniforms.uRippleActive.value = 0.0;
      if (bgUniforms.uRippleTime) bgUniforms.uRippleTime.value = 0.0;
    };

    // Animation Loop
    let animFrameId: number;
    const clock = new THREE.Clock();
    let totalAnimTime = 0;

    const animateLoop = () => {
      animFrameId = requestAnimationFrame(animateLoop);
      const delta = Math.min(clock.getDelta(), 0.1);
      if (isPausedRef.current) return;

      totalAnimTime += delta;

      // Update uniforms
      bgUniforms.iTime.value = totalAnimTime;
      bgUniforms.uGridVibe.value = 0.0; // Raster explicitly removed as requested

      // Stable camera alignment for pixel-accurate hit detection
      if (cameraRef.current) {
        cameraRef.current.position.copy(baseCamPosRef.current);
        cameraRef.current.lookAt(baseLookAtRef.current);
      }

      if (bgUniforms.uRippleActive.value > 0.5) {
        bgUniforms.uRippleTime.value += delta;
        if (bgUniforms.uRippleTime.value > 3.0) {
          bgUniforms.uRippleActive.value = 0.0;
        }
      }

      // While on the start screen, ONLY render the living metallic background shader pass!
      // Do NOT start trunk growth, branch spawning, or Plexus physics!
      if (!isRunningRef.current) {
        renderer.clear();
        renderer.render(bgScene, bgCamera);
        return;
      }

      // Mode visibility sync
      const showBlüten = (activeModeRef.current === 'bluten');
      blutenSceneGroup.visible = showBlüten;
      plexusSceneGroup.visible = !showBlüten;

      // 1-second smooth visual fade-in when switching between artworks
      if (modeTransitionTimerRef.current < 1.0) {
        modeTransitionTimerRef.current = Math.min(1.0, modeTransitionTimerRef.current + delta / 1.0);
      }
      const modeFadeAlpha = THREE.MathUtils.smoothstep(modeTransitionTimerRef.current, 0.0, 1.0);

      if (showBlüten) {
        mainTrunkStroke.setTime(totalAnimTime);
        mainTrunkStroke.setAlpha(modeFadeAlpha);
        allBranches.forEach(b => {
          b.stroke.setTime(totalAnimTime);
          b.stroke.setAlpha(modeFadeAlpha);
        });
        persistentBlossomStrokes.forEach(s => {
          s.setTime(totalAnimTime);
          s.setAlpha(modeFadeAlpha);
        });

        // Step-by-Step Trunk Growth Animation (0.0 -> 1.0 over 6 seconds)
        if (!isTrunkGrowthFinished) {
          growthProgressVal += delta / growthDurationSeconds;
          if (growthProgressVal >= 1.0) {
            growthProgressVal = 1.0;
            isTrunkGrowthFinished = true;
            setIsTrunkGrowing(false);
            trunkPostDelayTimer = 0.0;
          }
          mainTrunkStroke.setProgress(growthProgressVal);
        } else if (roundState === 'IDLE' && !isVortexActive && currentPhaseName === 'BRANCH' && activeOrbs.length === 0) {
          trunkPostDelayTimer += delta;
          if (trunkPostDelayTimer >= TRUNK_POST_DELAY) {
            spawnOrbRound(1, 'BRANCH');
            showToastRef.current?.('🌱 Astphase gestartet — Klicke die Knotenpunkte!');
          }
        }

        // Animate Subbranches (3.0s)
        for (let i = growingSubBranches.length - 1; i >= 0; i--) {
          const item = growingSubBranches[i];
          item.progress += delta / item.duration;
          if (item.progress > 1.0) item.progress = 1.0;
          item.stroke.setProgress(item.progress);
          item.stroke.setTime(totalAnimTime);
          item.stroke.setAlpha(modeFadeAlpha);
          if (item.progress >= 1.0) {
            growingSubBranches.splice(i, 1);
          }
        }

        // Animate Blossom Clusters (0.5s)
        for (let i = growingBlossomClusters.length - 1; i >= 0; i--) {
          const item = growingBlossomClusters[i];
          item.progress += delta / item.duration;
          if (item.progress > 1.0) item.progress = 1.0;
          item.stroke.setProgress(item.progress);
          item.stroke.setTime(totalAnimTime);
          item.stroke.setAlpha(modeFadeAlpha);
          if (item.progress >= 1.0) {
            growingBlossomClusters.splice(i, 1);
          }
        }

        if (instancedPetalMesh && instancedPetalMesh.material) {
          // Petals fade in smoothly over 1.0 second at the start of the final animation
          const vortexFadeIn = isVortexActive ? Math.min(1.0, vortexTimer / 1.0) : 1.0;
          (instancedPetalMesh.material as THREE.MeshBasicMaterial).opacity = modeFadeAlpha * vortexFadeIn;
        }

        // 14-Second Dominant Color Petal Vortex Animation (4s alignment + 10s storm)
        if (isVortexActive) {
          vortexTimer += delta;
          const centerX = cameraRef.current ? cameraRef.current.position.x : 2.4;
          const centerY = cameraRef.current ? cameraRef.current.position.y : -0.4;
          const sideTilt = 0.15;

          if (vortexTimer < VORTEX_ALIGN_TIME) {
            // Phase 1: 4s gentle transition & alignment into flight paths
            const alignProgress = Math.min(1.0, vortexTimer / VORTEX_ALIGN_TIME);
            const blend = alignProgress * alignProgress * (3.0 - 2.0 * alignProgress);
            const spinMultiplier = 0.65 + blend * 2.8;

            for (let i = 0; i < activePetalCount; i++) {
              petalAngle[i] += petalSpeed[i] * delta * spinMultiplier;
              const a = petalAngle[i];
              const normH = (i / activePetalCount);

              // Initial floating drift position (scaled 20% inwards)
              const driftX = petalOriginX[i] + Math.sin(totalAnimTime * 0.4 + petalPhaseZ[i]) * petalRadiusX[i] * 0.4;
              const driftY = petalOriginY[i] + Math.cos(totalAnimTime * 0.35 + petalPhaseZ[i]) * petalRadiusY[i] * 0.4;
              const driftZ = Math.sin(totalAnimTime * 0.3 + petalPhaseZ[i]) * 1.6;

              // Vortex circular cylinder with 20% diameter reduction on all axes & organic path variance
              const baseTubeRadius = (7.5 + (petalRadiusX[i] % 2.5)) * 0.80;
              const radialWobble = Math.sin(a * 2.8 + petalPhaseZ[i] + totalAnimTime * 1.6) * 0.5;
              const currentRadius = baseTubeRadius + radialWobble * blend;

              const heightWobble = Math.sin(a * 2.2 + petalPhaseZ[i] + totalAnimTime * 1.4) * 0.7 * blend;
              const rawY = (normH - 0.5) * 12.8 + heightWobble;
              const rawX = Math.cos(a) * currentRadius;
              const rawZ = Math.sin(a) * currentRadius;

              const vortexX = rawX + centerX;
              const vortexY = centerY + rawY * Math.cos(sideTilt) - rawZ * Math.sin(sideTilt);
              const vortexZ = rawY * Math.sin(sideTilt) + rawZ * Math.cos(sideTilt);

              const px = THREE.MathUtils.lerp(driftX, vortexX, blend);
              const py = THREE.MathUtils.lerp(driftY, vortexY, blend);
              const pz = THREE.MathUtils.lerp(driftZ, vortexZ, blend);

              dummy.position.set(px, py, pz);
              dummy.rotation.set(
                totalAnimTime * (0.9 + (petalRadiusX[i] % 0.6)) + i,
                totalAnimTime * (1.3 + (petalRadiusY[i] % 0.6)) + i,
                a + Math.sin(totalAnimTime * 2.5 + i) * 0.35
              );
              dummy.scale.setScalar(petalScales[i] * (0.6 + 0.4 * blend));
              dummy.updateMatrix();
              instancedPetalMesh.setMatrixAt(i, dummy.matrix);
            }
          } else {
            // Phase 2: 10s full vortex storm (20% reduced diameter, increased flight variance & wilder paths)
            const stormTimer = vortexTimer - VORTEX_ALIGN_TIME;
            const stormProgress = Math.min(1.0, stormTimer / VORTEX_STORM_TIME);
            const spinMultiplier = 3.6 + Math.sin(stormProgress * Math.PI) * 1.6;

            for (let i = 0; i < activePetalCount; i++) {
              petalAngle[i] += petalSpeed[i] * delta * spinMultiplier;
              const a = petalAngle[i];
              const normH = (i / activePetalCount);

              // 20% diameter reduction on all axes
              const baseTubeRadius = (7.5 + (petalRadiusX[i] % 2.5)) * 0.80 * (0.85 + 0.35 * Math.sin(stormProgress * Math.PI));

              // Organic turbulent variance in flight trajectories:
              // 1. Radial undulation (petals dive in and swoosh out)
              const radialWobble = Math.sin(a * 2.8 + petalPhaseZ[i] * 2.0 + totalAnimTime * 2.2) * (0.75 + 0.35 * (petalRadiusY[i] % 1.5))
                                 + Math.cos(a * 4.5 + petalPhaseZ[i]) * 0.35;
              const currentRadius = Math.max(1.5, baseTubeRadius + radialWobble);

              // 2. Vertical undulating wave (petals dynamically rise and dip)
              const heightWobble = Math.sin(a * 2.2 + petalPhaseZ[i] * 1.5 + totalAnimTime * 1.8) * 1.1
                                 + Math.cos(a * 1.4 + i * 0.5) * 0.45;
              const rawY = (normH - 0.5) * 12.8 + heightWobble; // 16.0 * 0.80 = 12.8

              // 3. Tangential flutter
              const flutterX = Math.sin(a * 3.5 + petalPhaseZ[i]) * 0.3;
              const flutterZ = Math.cos(a * 3.5 + petalPhaseZ[i]) * 0.3;

              const rawX = Math.cos(a) * currentRadius + flutterX;
              const rawZ = Math.sin(a) * currentRadius + flutterZ;

              const px = rawX + centerX;
              const py = centerY + rawY * Math.cos(sideTilt) - rawZ * Math.sin(sideTilt);
              const pz = rawY * Math.sin(sideTilt) + rawZ * Math.cos(sideTilt);

              dummy.position.set(px, py, pz);
              dummy.rotation.set(
                totalAnimTime * (1.1 + (petalRadiusX[i] % 0.8)) + i,
                totalAnimTime * (1.5 + (petalRadiusY[i] % 0.8)) + i,
                a + Math.sin(totalAnimTime * 3.2 + i) * 0.5
              );
              dummy.scale.setScalar(petalScales[i] * (0.9 + 0.3 * Math.sin(stormProgress * Math.PI)));
              dummy.updateMatrix();
              instancedPetalMesh.setMatrixAt(i, dummy.matrix);
            }
          }
          instancedPetalMesh.instanceMatrix.needsUpdate = true;

          if (vortexTimer >= VORTEX_TOTAL_DURATION) {
            isVortexActive = false;
            if (bgUniforms.uBgColor1) bgUniforms.uBgColor1.value.copy(BG_COLOR_PALETTES.default.c1);
            if (bgUniforms.uBgColor2) bgUniforms.uBgColor2.value.copy(BG_COLOR_PALETTES.default.c2);
            if (bgUniforms.uBgColor3) bgUniforms.uBgColor3.value.copy(BG_COLOR_PALETTES.default.c3);
            if (bgUniforms.uRippleCrest) bgUniforms.uRippleCrest.value.copy(BG_COLOR_PALETTES.default.crest);
            if (bgUniforms.uBgBlend) bgUniforms.uBgBlend.value = 0.0;
            if (bgUniforms.uRippleActive) bgUniforms.uRippleActive.value = 0.0;
            if (bgUniforms.uRippleTime) bgUniforms.uRippleTime.value = 0.0;

            markArtworkCompletedRef.current?.('bluten');
            roundState = 'IDLE';
            currentPhaseName = 'DONE';
            currentPhaseRef.current = 'DONE';
            setCurrentPhase('DONE');
            showToastRef.current?.('🌸 Blütenkunstwerk nach 14s vollendet!');
          }
        }

        // 3-Round Step-by-Step Lifecycle for BRANCH and BLOSSOM phases
        if (roundState !== 'IDLE') {
          roundTimer += delta;
          const activeTimeLimit = ROUND_ACTIVE_TIME_DEFAULT;

          if (roundState === 'ACTIVE') {
            activeOrbs.forEach(orb => {
              if (orb.roundId === currentRoundNum && !orb.userDrawn && !orb.isExploding) {
                orb.setAlpha(Math.min(1.0, orb.alpha + delta * 3.0));
              }
              orb.update(totalAnimTime, delta, modeFadeAlpha);
            });

            // Check if user activated all orbs OR if 5s active timer expired
            const remainingUndrawn = activeOrbs.filter(o => !o.userDrawn && !o.branchSpawned);
            if (remainingUndrawn.length === 0 || roundTimer >= activeTimeLimit) {
              roundState = 'FADING';
              roundTimer = 0.0;
            }
          } else if (roundState === 'FADING') {
            activeOrbs.forEach(orb => {
              if (orb.roundId === currentRoundNum && !orb.isExploding) {
                orb.setAlpha(Math.max(0.0, orb.alpha - delta * 2.0));
              }
              orb.update(totalAnimTime, delta, modeFadeAlpha);
            });

            if (roundTimer >= ROUND_FADE_TIME) {
              roundState = 'PAUSE';
              roundTimer = 0.0;
            }
          } else if (roundState === 'PAUSE') {
            activeOrbs.forEach(orb => {
              orb.update(totalAnimTime, delta, modeFadeAlpha);
            });

            if (roundTimer >= ROUND_PAUSE_TIME) {
              if (currentRoundNum < maxRoundsPerPhase) {
                if (currentPhaseName === 'BRANCH' || currentPhaseName === 'BLOSSOM') {
                  spawnOrbRound(currentRoundNum + 1, currentPhaseName);
                }
              } else {
                if (currentPhaseName === 'BRANCH') {
                  spawnOrbRound(1, 'BLOSSOM');
                  showToastRef.current?.('🌸 Blütenphase gestartet! Wähle deine Wunschfarbe.');
                } else if (currentPhaseName === 'BLOSSOM') {
                  roundState = 'IDLE';
                  startVortexFinale();
                } else {
                  roundState = 'IDLE';
                }
              }
            }
          }
        }
      } else {
        // ==========================================
        // PLEXUS ENGINE UPDATE LOOP
        // ==========================================
        if (plexusLinesMesh && plexusLinesMesh.material) {
          (plexusLinesMesh.material as THREE.LineBasicMaterial).opacity = 0.85 * modeFadeAlpha;
        }
        if (plexusPointsMesh && plexusPointsMesh.material && (plexusPointsMesh.material as THREE.ShaderMaterial).uniforms?.uAlpha) {
          (plexusPointsMesh.material as THREE.ShaderMaterial).uniforms.uAlpha.value = modeFadeAlpha;
        }
        const linePosAttr = plexusLinesMesh.geometry.attributes.position;
        const lineColAttr = plexusLinesMesh.geometry.attributes.color;
        const linePositions = linePosAttr.array as Float32Array;
        const lineColors = lineColAttr.array as Float32Array;

        const nodePosAttr = plexusPointsMesh.geometry.attributes.position;
        const nodeColAttr = plexusPointsMesh.geometry.attributes.color;
        const nodeSizeAttr = plexusPointsMesh.geometry.attributes.size;
        const nodePositions = nodePosAttr.array as Float32Array;
        const nodeColors = nodeColAttr.array as Float32Array;
        const nodeSizes = nodeSizeAttr.array as Float32Array;

        if (isMouseDown) {
          if (draggedPlexusCluster) {
            draggedPlexusCluster.centerX = mouseWorld.x + dragOffset.x;
            draggedPlexusCluster.centerY = mouseWorld.y + dragOffset.y;
            for (let i = 0; i < floatingPlexusOrbs.length; i++) {
              const orb = floatingPlexusOrbs[i];
              const dx = orb.x - draggedPlexusCluster.centerX;
              const dy = orb.y - draggedPlexusCluster.centerY;
              if (Math.sqrt(dx * dx + dy * dy) < 80.0) {
                orb.triggerHoverWobble();
              }
            }
          } else {
            plexusHoldTime += delta;
            plexusOriginX = mouseWorld.x;
            plexusOriginY = mouseWorld.y;
          }
        }

        const finaleAge = isPlexusFinaleActive ? (totalAnimTime - plexusFinaleStartTime) : 0.0;

        if (isPlexusRippleActive) {
          plexusRippleTimer += delta;
          if (bgUniforms.uRippleActive) bgUniforms.uRippleActive.value = 1.0;
          if (bgUniforms.uRippleTime) bgUniforms.uRippleTime.value = plexusRippleTimer;
          if (plexusRippleTimer >= 2.5) {
            isPlexusRippleActive = false;
            if (bgUniforms.uRippleActive) bgUniforms.uRippleActive.value = 0.0;
            if (bgUniforms.uRippleTime) bgUniforms.uRippleTime.value = 0.0;
          }
        }

        if (isPlexusFinaleActive && finaleAge >= PLEXUS_FINALE_DURATION) {
          isPlexusFinaleActive = false;
          setIsPlexusFinale(false);
          if (bgUniforms.uRippleActive) bgUniforms.uRippleActive.value = 0.0;
          if (bgUniforms.uRippleTime) bgUniforms.uRippleTime.value = 0.0;
          if (!isPlexusCompleted) {
            isPlexusCompleted = true;
            markArtworkCompletedRef.current?.('plexus');
            showToastRef.current?.('✨ Plexus-Netzwerk nach 14s vollendet!');
          }
        }

        if (bgUniforms.uBgDim) {
          const targetDim = isPlexusFinaleActive ? 0.45 : 1.0;
          bgUniforms.uBgDim.value = THREE.MathUtils.lerp(bgUniforms.uBgDim.value, targetDim, delta * 2.0);
        }

        floatingPlexusOrbs.forEach(orb => {
          orb.update(delta, totalAnimTime, isPlexusFinaleActive, finaleAge, cameraRef.current, modeFadeAlpha);
        });

        if (isPlexusFinaleActive) {
          plexusFinaleMesh.visible = false;
          plexusLinesMesh.visible = true;
          plexusPointsMesh.visible = true;

          const fadeIn = THREE.MathUtils.smoothstep(finaleAge, 0.0, 3.5);
          const fadeOut = Math.max(0.0, Math.min(1.0, (PLEXUS_FINALE_DURATION - finaleAge) / 1.5));
          const finaleAlpha = fadeIn * fadeOut;

          const activeOrbsList = floatingPlexusOrbs; // All 5 orbs form the cosmic network hubs

          if (finaleParticles.length === 0) {
            const weightedPalettes: { r: number; g: number; b: number }[][] = [];
            const weightedPositions: { x: number; y: number; z: number }[] = [];
            activeOrbsList.forEach(orb => {
              const count = Math.max(2, orb.attachedPlexusCount);
              const pal = PALETTE_RGB_CACHE[orb.id] || PALETTE_RGB_CACHE.pink;
              for (let w = 0; w < count; w++) {
                weightedPalettes.push(pal);
                weightedPositions.push({ x: orb.x, y: orb.y, z: orb.z });
              }
            });
            initFinaleParticles(weightedPalettes, weightedPositions);
          }

          // 1. Update dynamic finale particles with 4s smooth transition unfolding
          const transitionProgress = Math.min(1.0, finaleAge / PLEXUS_TRANSITION_DURATION);
          for (let p = 0; p < finaleParticles.length; p++) {
            finaleParticles[p].update(delta, transitionProgress, finaleAge, totalAnimTime);
          }

          // 2. Collect world nodes
          let worldNodeCount = 0;

          // Add dynamic particles
          for (let p = 0; p < finaleParticles.length; p++) {
            if (worldNodeCount >= MAX_TOTAL_NODES) break;
            const pt = finaleParticles[p];
            const idx = worldNodeCount++;
            worldNodeX[idx] = pt.renderX;
            worldNodeY[idx] = pt.renderY;
            worldNodeZ[idx] = pt.renderZ;
            worldNodeR[idx] = pt.color.r;
            worldNodeG[idx] = pt.color.g;
            worldNodeB[idx] = pt.color.b;
            worldNodeSize[idx] = (pt.radius + Math.sin(totalAnimTime * 3.2 + p) * 3.5) * finaleAlpha;
            worldNodeDistCenter[idx] = Math.sqrt(pt.renderX * pt.renderX + pt.renderY * pt.renderY);
          }

          // Add orbiting floating orbs as active network hubs (ALL 5 celestial orbs!)
          for (let o = 0; o < activeOrbsList.length; o++) {
            if (worldNodeCount >= MAX_TOTAL_NODES) break;
            const orb = activeOrbsList[o];
            const oIdx = worldNodeCount++;
            worldNodeX[oIdx] = orb.x;
            worldNodeY[oIdx] = orb.y;
            worldNodeZ[oIdx] = orb.z;
            const pal = PALETTE_RGB_CACHE[orb.id] || PALETTE_RGB_CACHE.pink;
            const col = pal[0];
            worldNodeR[oIdx] = col.r;
            worldNodeG[oIdx] = col.g;
            worldNodeB[oIdx] = col.b;
            worldNodeSize[oIdx] = 42.0 * finaleAlpha;
            worldNodeDistCenter[oIdx] = Math.sqrt(orb.x * orb.x + orb.y * orb.y);
          }

          // Populate Node Buffers
          for (let k = 0; k < worldNodeCount; k++) {
            const k3 = k * 3;
            nodePositions[k3] = worldNodeX[k];
            nodePositions[k3 + 1] = worldNodeY[k];
            nodePositions[k3 + 2] = worldNodeZ[k];

            const baseNodeR = Math.max(0.45, worldNodeR[k]);
            const baseNodeG = Math.max(0.45, worldNodeG[k]);
            const baseNodeB = Math.max(0.45, worldNodeB[k]);

            nodeColors[k3] = Math.min(1.0, baseNodeR * 1.65 * finaleAlpha);
            nodeColors[k3 + 1] = Math.min(1.0, baseNodeG * 1.65 * finaleAlpha);
            nodeColors[k3 + 2] = Math.min(1.0, baseNodeB * 1.65 * finaleAlpha);

            nodeSizes[k] = worldNodeSize[k];
          }

          // 3. Dynamic Distance-Based Line Connections with Thick Filaments & Random Twinkling Flicker
          let lineVertexIdx = 0;
          let lineColorIdx = 0;
          const maxLineVertices = linePositions.length - 18;

          const linkRadius = FINALE_MESH_OPTS.linkRadius;
          const linkRadiusSq = linkRadius * linkRadius;
          const maxLinksPerNode = FINALE_MESH_OPTS.maxLinksPerNode || 4;
          const nodeLinkCounts = new Uint8Array(worldNodeCount);

          for (let i = 0; i < worldNodeCount; i++) {
            if (nodeLinkCounts[i] >= maxLinksPerNode) continue;
            const x1 = worldNodeX[i], y1 = worldNodeY[i], z1 = worldNodeZ[i];
            for (let j = i + 1; j < worldNodeCount; j++) {
              if (lineVertexIdx >= maxLineVertices) break;
              if (nodeLinkCounts[i] >= maxLinksPerNode) break;
              if (nodeLinkCounts[j] >= maxLinksPerNode) continue;
              const x2 = worldNodeX[j], y2 = worldNodeY[j], z2 = worldNodeZ[j];
              const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
              const distSq = dx * dx + dy * dy + dz * dz;

              if (distSq < linkRadiusSq) {
                const distance = Math.sqrt(distSq);
                const opacity = (1.0 - distance / linkRadius) * finaleAlpha;
                if (opacity > 0.01) {
                  const lineSeed = (i * 137.5 + j * 269.3) % 1000.0;
                  const flickerA = Math.sin(totalAnimTime * 14.0 + lineSeed);
                  const flickerB = Math.cos(totalAnimTime * 25.0 + lineSeed * 1.7);
                  const flickerNoise = flickerA * 0.6 + flickerB * 0.4;

                  let flickerMul = 1.0;
                  if (flickerNoise < -0.32) {
                    flickerMul = Math.max(0.0, (flickerNoise + 0.32) * -3.0 > 0.4 ? 0.0 : 0.35);
                  } else if (flickerNoise > 0.68) {
                    flickerMul = 1.65;
                  }

                  if (flickerMul <= 0.02) continue;

                  nodeLinkCounts[i]++;
                  nodeLinkCounts[j]++;

                  const lineAlpha = Math.min(1.0, Math.pow(opacity, 0.55) * 1.85 * flickerMul);
                  const coreWhite = 0.50 * lineAlpha; // Luminous core that cuts through dark backgrounds

                  const r1 = Math.min(1.0, worldNodeR[i] * lineAlpha * 1.6 + coreWhite);
                  const g1 = Math.min(1.0, worldNodeG[i] * lineAlpha * 1.6 + coreWhite);
                  const b1 = Math.min(1.0, worldNodeB[i] * lineAlpha * 1.6 + coreWhite);
                  const r2 = Math.min(1.0, worldNodeR[j] * lineAlpha * 1.6 + coreWhite);
                  const g2 = Math.min(1.0, worldNodeG[j] * lineAlpha * 1.6 + coreWhite);
                  const b2 = Math.min(1.0, worldNodeB[j] * lineAlpha * 1.6 + coreWhite);

                  const pLen = Math.sqrt(dx * dx + dy * dy) || 1.0;
                  const perpX = (-dy / pLen) * 0.85;
                  const perpY = (dx / pLen) * 0.85;

                  // 1. Center Line
                  linePositions[lineVertexIdx++] = x1;
                  linePositions[lineVertexIdx++] = y1;
                  linePositions[lineVertexIdx++] = z1;
                  linePositions[lineVertexIdx++] = x2;
                  linePositions[lineVertexIdx++] = y2;
                  linePositions[lineVertexIdx++] = z2;

                  lineColors[lineColorIdx++] = r1;
                  lineColors[lineColorIdx++] = g1;
                  lineColors[lineColorIdx++] = b1;
                  lineColors[lineColorIdx++] = r2;
                  lineColors[lineColorIdx++] = g2;
                  lineColors[lineColorIdx++] = b2;

                  // 2. Positive Perpendicular Filament
                  if (lineVertexIdx < maxLineVertices) {
                    linePositions[lineVertexIdx++] = x1 + perpX;
                    linePositions[lineVertexIdx++] = y1 + perpY;
                    linePositions[lineVertexIdx++] = z1;
                    linePositions[lineVertexIdx++] = x2 + perpX;
                    linePositions[lineVertexIdx++] = y2 + perpY;
                    linePositions[lineVertexIdx++] = z2;

                    const perpGlow = 0.32 * lineAlpha;
                    lineColors[lineColorIdx++] = Math.min(1.0, r1 * 0.95 + perpGlow);
                    lineColors[lineColorIdx++] = Math.min(1.0, g1 * 0.95 + perpGlow);
                    lineColors[lineColorIdx++] = Math.min(1.0, b1 * 0.95 + perpGlow);
                    lineColors[lineColorIdx++] = Math.min(1.0, r2 * 0.95 + perpGlow);
                    lineColors[lineColorIdx++] = Math.min(1.0, g2 * 0.95 + perpGlow);
                    lineColors[lineColorIdx++] = Math.min(1.0, b2 * 0.95 + perpGlow);
                  }

                  // 3. Negative Perpendicular Filament
                  if (lineVertexIdx < maxLineVertices) {
                    linePositions[lineVertexIdx++] = x1 - perpX;
                    linePositions[lineVertexIdx++] = y1 - perpY;
                    linePositions[lineVertexIdx++] = z1;
                    linePositions[lineVertexIdx++] = x2 - perpX;
                    linePositions[lineVertexIdx++] = y2 - perpY;
                    linePositions[lineVertexIdx++] = z2;

                    const perpGlow = 0.32 * lineAlpha;
                    lineColors[lineColorIdx++] = Math.min(1.0, r1 * 0.95 + perpGlow);
                    lineColors[lineColorIdx++] = Math.min(1.0, g1 * 0.95 + perpGlow);
                    lineColors[lineColorIdx++] = Math.min(1.0, b1 * 0.95 + perpGlow);
                    lineColors[lineColorIdx++] = Math.min(1.0, r2 * 0.95 + perpGlow);
                    lineColors[lineColorIdx++] = Math.min(1.0, g2 * 0.95 + perpGlow);
                    lineColors[lineColorIdx++] = Math.min(1.0, b2 * 0.95 + perpGlow);
                  }
                }
              }
            }
          }

          lineGeo.setDrawRange(0, lineVertexIdx / 3);
          nodeGeo.setDrawRange(0, worldNodeCount);

          linePosAttr.needsUpdate = true;
          lineColAttr.needsUpdate = true;
          nodePosAttr.needsUpdate = true;
          nodeColAttr.needsUpdate = true;
          nodeSizeAttr.needsUpdate = true;
        } else {
          plexusFinaleMesh.visible = false;
          plexusFinaleUniforms.uAlpha.value = 0.0;
          plexusLinesMesh.visible = true;
          plexusPointsMesh.visible = true;

          let worldNodeCount = 0;

          // 1. Growing cluster around cursor
          if (isMouseDown && !draggedPlexusCluster && activeHoldNodes.length > 0) {
            const progress = Math.min(1.0, plexusHoldTime / 1.5);
            const activeCount = Math.floor(progress * activeHoldNodes.length);

            for (let n = 0; n < activeCount; n++) {
              if (worldNodeCount >= MAX_TOTAL_NODES) break;
              const node = activeHoldNodes[n];
              node.rot += delta * node.rotSpeed;

              const wx = plexusOriginX + node.dx * progress + Math.sin(totalAnimTime * node.freq + node.phase) * 10.0;
              const wy = plexusOriginY + node.dy * progress + Math.cos(totalAnimTime * node.freq + node.phase) * 10.0;
              const wz = node.dz * progress;

              const idx = worldNodeCount++;
              worldNodeX[idx] = wx;
              worldNodeY[idx] = wy;
              worldNodeZ[idx] = wz;
              worldNodeR[idx] = 1.0;
              worldNodeG[idx] = 0.18;
              worldNodeB[idx] = 0.65;
              worldNodeSize[idx] = 15.0 * progress;
              worldNodeDistCenter[idx] = Math.sqrt(wx * wx + wy * wy);
            }
          }

          // 2. Free floating clusters
          const safeMarginX = 260.0;
          const safeMarginY = 160.0;

          for (let c = 0; c < activePlexusClusters.length; c++) {
            const cluster = activePlexusClusters[c];
            if (cluster !== draggedPlexusCluster) {
              cluster.centerX += cluster.driftX * delta;
              cluster.centerY += cluster.driftY * delta;
              cluster.centerZ += cluster.driftZ * delta;

              if (cluster.centerX > safeMarginX) { cluster.driftX = -Math.abs(cluster.driftX); cluster.centerX = safeMarginX; }
              else if (cluster.centerX < -safeMarginX) { cluster.driftX = Math.abs(cluster.driftX); cluster.centerX = -safeMarginX; }
              if (cluster.centerY > safeMarginY) { cluster.driftY = -Math.abs(cluster.driftY); cluster.centerY = safeMarginY; }
              else if (cluster.centerY < -safeMarginY) { cluster.driftY = Math.abs(cluster.driftY); cluster.centerY = -safeMarginY; }
              if (Math.abs(cluster.centerZ) > 60.0) { cluster.driftZ *= -1.0; cluster.centerZ = Math.sign(cluster.centerZ) * 60.0; }
            }

            for (let i = 0; i < cluster.nodes.length; i++) {
              if (worldNodeCount >= MAX_TOTAL_NODES) break;
              const node = cluster.nodes[i];
              node.rot += delta * node.rotSpeed;

              const wx = cluster.centerX + node.dx + Math.sin(totalAnimTime * node.freq + node.phase) * 10.0;
              const wy = cluster.centerY + node.dy + Math.cos(totalAnimTime * node.freq + node.phase) * 10.0;
              const wz = cluster.centerZ + node.dz + Math.sin(totalAnimTime * 0.9 + node.phase * 1.5) * 15.0;

              const idx = worldNodeCount++;
              worldNodeX[idx] = wx;
              worldNodeY[idx] = wy;
              worldNodeZ[idx] = wz;
              worldNodeR[idx] = cluster.r;
              worldNodeG[idx] = cluster.g;
              worldNodeB[idx] = cluster.b;
              worldNodeSize[idx] = 15.0;
              worldNodeDistCenter[idx] = Math.sqrt(wx * wx + wy * wy);
            }
          }

          // 3. Attached Plexus Nodes: Local Orb Shells
          for (let o = 0; o < floatingPlexusOrbs.length; o++) {
            const orb = floatingPlexusOrbs[o];
            const attNodes = orb.attachedNodes;
            const attLen = attNodes.length;
            if (attLen === 0) continue;

            for (let n = 0; n < attLen; n++) {
              if (worldNodeCount >= MAX_TOTAL_NODES) break;
              const node = attNodes[n];
              node.angle += node.orbitSpeed * delta;
              node.rot += delta * node.rotSpeed;

              const localRadius = node.radius;
              const localX = orb.x + Math.cos(node.angle) * Math.cos(node.elevation) * localRadius;
              const localY = orb.y + Math.sin(node.angle) * Math.cos(node.elevation) * localRadius * 0.85;
              const localZ = orb.z + Math.sin(node.elevation) * localRadius;

              const idx = worldNodeCount++;
              worldNodeX[idx] = localX;
              worldNodeY[idx] = localY;
              worldNodeZ[idx] = localZ;
              worldNodeR[idx] = node.r;
              worldNodeG[idx] = node.g;
              worldNodeB[idx] = node.b;
              worldNodeSize[idx] = node.size;
              worldNodeDistCenter[idx] = Math.sqrt(localX * localX + localY * localY);
            }
          }

          // Populate Node Buffers
          for (let k = 0; k < worldNodeCount; k++) {
            const k3 = k * 3;
            nodePositions[k3] = worldNodeX[k];
            nodePositions[k3 + 1] = worldNodeY[k];
            nodePositions[k3 + 2] = worldNodeZ[k];

            nodeColors[k3] = worldNodeR[k];
            nodeColors[k3 + 1] = worldNodeG[k];
            nodeColors[k3 + 2] = worldNodeB[k];

            nodeSizes[k] = worldNodeSize[k];
          }

          // Render Dynamic Lines Between Connected Nodes
          let lineVertexIdx = 0;
          let lineColorIdx = 0;
          const maxLineVertices = linePositions.length - 6;
          nodeConnCounts.fill(0, 0, worldNodeCount);

          const maxDistCutoff = 85.0;
          const maxDistCutoff2 = maxDistCutoff * maxDistCutoff;

          for (let i = 0; i < worldNodeCount; i++) {
            const ax = worldNodeX[i];
            const ay = worldNodeY[i];
            const az = worldNodeZ[i];
            const ar = worldNodeR[i];
            const ag = worldNodeG[i];
            const ab = worldNodeB[i];

            for (let j = i + 1; j < worldNodeCount; j++) {
              if (lineVertexIdx >= maxLineVertices) break;

              const dx = ax - worldNodeX[j];
              if (dx > maxDistCutoff || dx < -maxDistCutoff) continue;

              const dy = ay - worldNodeY[j];
              if (dy > maxDistCutoff || dy < -maxDistCutoff) continue;

              const dz = az - worldNodeZ[j];
              if (dz > maxDistCutoff || dz < -maxDistCutoff) continue;

              const d2 = dx * dx + dy * dy + dz * dz;
              if (d2 >= maxDistCutoff2) continue;

              nodeConnCounts[i]++;
              nodeConnCounts[j]++;

              const dist = Math.sqrt(d2);
              const alpha = (1.0 - dist / 85.0) * 0.92;

              linePositions[lineVertexIdx++] = ax;
              linePositions[lineVertexIdx++] = ay;
              linePositions[lineVertexIdx++] = az;

              linePositions[lineVertexIdx++] = worldNodeX[j];
              linePositions[lineVertexIdx++] = worldNodeY[j];
              linePositions[lineVertexIdx++] = worldNodeZ[j];

              const effAlpha = Math.pow(alpha, 0.72) * 1.35;
              lineColors[lineColorIdx++] = Math.min(1.0, ar * effAlpha);
              lineColors[lineColorIdx++] = Math.min(1.0, ag * effAlpha);
              lineColors[lineColorIdx++] = Math.min(1.0, ab * effAlpha);

              lineColors[lineColorIdx++] = Math.min(1.0, worldNodeR[j] * effAlpha);
              lineColors[lineColorIdx++] = Math.min(1.0, worldNodeG[j] * effAlpha);
              lineColors[lineColorIdx++] = Math.min(1.0, worldNodeB[j] * effAlpha);
            }
          }

          lineGeo.setDrawRange(0, lineVertexIdx / 3);
          nodeGeo.setDrawRange(0, worldNodeCount);

          linePosAttr.needsUpdate = true;
          lineColAttr.needsUpdate = true;
          nodePosAttr.needsUpdate = true;
          nodeColAttr.needsUpdate = true;
          nodeSizeAttr.needsUpdate = true;
        }

        // Update Particle Trail & Explosion Flare Mesh (Plexus mode only)
        const tpPositions = trailGeo.attributes.position.array as Float32Array;
        const tpColors = trailGeo.attributes.color.array as Float32Array;
        const tpSizes = trailGeo.attributes.size.array as Float32Array;
        const tpAlphas = trailGeo.attributes.alpha.array as Float32Array;
        const tpRotAngles = trailGeo.attributes.rotAngle.array as Float32Array;
        let activeTrailCount = 0;

        for (let k = 0; k < activeTrailBudget; k++) {
          if (tpLife[k] < tpMaxLife[k]) {
            tpLife[k] += delta;
            activeTrailCount++;
            const progress = tpLife[k] / tpMaxLife[k];

            tpVX[k] *= 0.965;
            tpVY[k] *= 0.965;
            tpVZ[k] *= 0.965;

            tpX[k] += tpVX[k] * delta;
            tpY[k] += tpVY[k] * delta;
            tpZ[k] += tpVZ[k] * delta;

            tpRot[k] += delta * 3.0;

            const k3 = k * 3;
            tpPositions[k3] = tpX[k];
            tpPositions[k3 + 1] = tpY[k];
            tpPositions[k3 + 2] = tpZ[k];

            tpColors[k3] = tpR[k];
            tpColors[k3 + 1] = tpG[k];
            tpColors[k3 + 2] = tpB[k];

            tpAlphas[k] = Math.max(0.0, (1.0 - Math.pow(progress, 1.8)));
            tpSizes[k] = trailSizes[k] * (1.0 - progress * 0.35);
            tpRotAngles[k] = tpRot[k];
          } else if (tpSizes[k] > 0) {
            tpSizes[k] = 0;
            tpAlphas[k] = 0;
          }
        }

        if (activeTrailCount > 0 || prevActiveTrailCount > 0) {
          trailGeo.attributes.position.needsUpdate = true;
          trailGeo.attributes.color.needsUpdate = true;
          trailGeo.attributes.size.needsUpdate = true;
          trailGeo.attributes.alpha.needsUpdate = true;
          trailGeo.attributes.rotAngle.needsUpdate = true;
        }
        prevActiveTrailCount = activeTrailCount;
      }

      // Render dual pass
      renderer.clear();
      renderer.render(bgScene, bgCamera);
      renderer.clearDepth();
      renderer.render(mainScene, camera);
    };

    animateLoop();

    // Resize Handler
    const handleResize = () => {
      if (!canvasRef.current) return;
      const isPortrait = window.innerHeight > window.innerWidth;
      const w = window.innerWidth;
      const h = isPortrait ? Math.round(window.innerWidth * 9 / 16) : window.innerHeight;
      updateCameraDistance(w, h, activeModeRef.current);
      const targetPR = isMobile ? Math.min(window.devicePixelRatio, 1.0) : Math.min(window.devicePixelRatio, 1.25);
      renderer.setPixelRatio(targetPR);
      renderer.setSize(w, h);
      bgUniforms.iResolution.value.set(renderer.domElement.width, renderer.domElement.height, 1);
      plexusFinaleUniforms.iResolution.value.set(renderer.domElement.width, renderer.domElement.height, 1);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Register API
    onRendererReadyRef.current?.({
      start: (mode?: 'bluten' | 'plexus' | string, expMode?: 'test' | 'souvenir') => {
        clock.start();
        isRunningRef.current = true;
        const targetMode = (mode === 'plexus' || mode === 'bluten') ? mode : 'bluten';
        handleSwitchMode(targetMode);
        if (expMode === 'souvenir') {
          setTimeout(() => {
            selectArtworkChoiceRef.current?.(targetMode);
          }, 100);
        }
        if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) {
          requestLandscapeOrientationRef.current?.();
        }
      },
      handlePeerMessage: (data) => {
        if (!data) return;
        const msg = data as unknown as Record<string, unknown>;
        if (msg.kind === 'MODE_SWITCH' && msg.mode) {
          handleSwitchMode(msg.mode as 'bluten' | 'plexus');
        } else if (msg.kind === 'COLOR_SELECT' && msg.color) {
          setSelectedColor(msg.color as BlossomColorId);
        } else if (msg.kind === 'PAUSE_TOGGLE' && typeof msg.isPaused === 'boolean') {
          setIsPaused(msg.isPaused as boolean);
        } else if (msg.kind === 'CREATION_READY' && typeof msg.ready === 'boolean') {
          setGuestCreationReady(msg.ready as boolean);
          if (msg.ready && hostCreationReady) {
            setIsLightboxOpen(true);
          }
        } else if (msg.kind === 'CREATION_RESET') {
          setHostCreationReady(false);
          setGuestCreationReady(false);
          setIsLightboxOpen(false);
        } else if (msg.kind === 'ARTWORK_SELECT' && msg.artwork) {
          setIsCreationMode(true);
          const art = msg.artwork as 'bluten' | 'plexus';
          setActiveMode(art);
          activeModeRef.current = art;
          restartTriggerRef.current();
          setIsLightboxOpen(false);
          setHostCreationReady(false);
          setGuestCreationReady(false);
        }
      }
    });

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      cancelAnimationFrame(animFrameId);
      renderer.dispose();
      bgMat.dispose();
      nodeMat.dispose();
      lineMat.dispose();
      lineGeo.dispose();
      nodeGeo.dispose();
      petalMat.dispose();
      petalGeo.dispose();
      trailMat.dispose();
      trailGeo.dispose();
      plexusFinaleGeo.dispose();
      plexusFinaleMat.dispose();
      noiseTex.dispose();
      floatingPlexusOrbs.forEach(orb => orb.destroy());
    };
  }, []);

  // Dynamic Instruction Text Calculation based on step-by-step phase
  const roundInfo = activeMode === 'bluten' && (currentPhase === 'BRANCH' || currentPhase === 'BLOSSOM')
    ? `Runde ${currentRound}/${maxRoundsPerPhase}`
    : null;

  const instructionBody = isTrunkGrowing
    ? 'Klicke auf einen Knotenpunkt, um einen weiteren Zweig am Ast wachsen zu lassen.'
    : activeMode === 'bluten'
      ? currentPhase === 'BRANCH'
        ? 'Klicke auf einen Knotenpunkt, um einen weiteren Zweig am Ast wachsen zu lassen.'
        : currentPhase === 'BLOSSOM'
          ? 'Wähle rechts deine Wunschfarbe und klicke auf die Knoten, Sakurablüten zu malen und vollende das Kunstwerk.'
          : currentPhase === 'VORTEX'
            ? 'Die meistgewählte Farbe entfesselt einen 10-sekündigen Blütensturm!'
            : 'Das Blütenkunstwerk ist vollendet!'
      : isPlexusFinale
        ? '6 Plexus angedockt! Das Kunstwerk ist vollendet.'
        : 'Halte deine Maus gedrückt, um einen Plexus zu erschaffen. Ziehe 6 verschiedene Plexus mit der Maus auf die Kerne, um das Kunstwerk zu vollenden.';

  return (
    <div ref={containerRef} className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#08000c] select-none z-0">
      {/* 16:9 Centered Artwork Wrapper on Mobile Portrait */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <canvas
          ref={canvasRef}
          className="pointer-events-auto block cursor-pointer portrait:w-screen portrait:h-[calc(100vw*9/16)] portrait:border-y portrait:border-white/15 portrait:shadow-[0_0_60px_rgba(0,0,0,0.95),0_0_25px_rgba(255,42,157,0.2)] landscape:w-full landscape:h-full"
        />
      </div>

      {/* HUD Layer, Modals & Controls are ONLY rendered when artwork session is running */}
      {isRunning && (
        <>
          {/* Toast Notification Message */}
          {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#120c1c]/90 text-white text-xs font-semibold tracking-wider px-6 py-2.5 rounded-full border border-[#4ee2ec]/60 backdrop-blur-md shadow-[0_8px_25px_rgba(0,0,0,0.5)] animate-pulse z-50 pointer-events-none uppercase">
          {toastMessage}
        </div>
      )}

      {/* RIGHT SIDEBAR: Color Palette (Smoothly shown during BLOSSOM phase in Landscape) */}
      {activeMode === 'bluten' && currentPhase === 'BLOSSOM' && !isPortraitMode && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-auto flex flex-col items-center gap-3.5 p-4 bg-[#120c1c]/90 backdrop-blur-xl border border-[#ff69b4]/40 rounded-3xl shadow-[0_12px_35px_rgba(0,0,0,0.6)] z-50 animate-in fade-in duration-300">
          <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-[#ffc8eb]/80 [writing-mode:vertical-lr] rotate-180 py-1">
            Farbpalette
          </div>
          <div className="w-6 h-px bg-white/20 my-0.5" />
          <div className="flex flex-col gap-3">
            {(Object.keys(BLOSSOM_PALETTES) as BlossomColorId[]).map((colorKey) => {
              const pal = BLOSSOM_PALETTES[colorKey];
              const isSelected = selectedColor === colorKey;
              return (
                <button
                  key={colorKey}
                  onClick={() => handleColorSelect(colorKey)}
                  title={`Farbe wählen: ${pal.name}`}
                  className={`relative group w-9 h-9 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'scale-120 ring-2 ring-white shadow-[0_0_18px_' + pal.uiColor + ']'
                      : 'opacity-70 hover:opacity-100 hover:scale-110'
                  }`}
                  style={{ backgroundColor: pal.uiColor }}
                >
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                  )}
                  {/* Tooltip on hover */}
                  <span className="absolute right-full mr-3 px-2.5 py-1 bg-[#180f24]/95 text-white text-[10px] font-semibold tracking-wider uppercase rounded-lg border border-white/20 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                    {pal.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Modern HUD Layer: Portrait Stacked on Smartphones vs 4-Corner Glassmorphic in Landscape */}
      {isPortraitMode ? (
        /* PORTRAIT STACKED HUD (iPhone & Portrait Smartphones) */
        <div className={`absolute inset-0 px-4 py-3 pt-[max(12px,var(--sat))] pb-[max(14px,var(--sab))] flex flex-col justify-between pointer-events-none z-40 transition-opacity duration-700 ${isHudDimmed ? 'opacity-20 hover:opacity-100' : 'opacity-100'}`}>
          {/* TOP SECTION: Cleanly stacked above the 16:9 canvas */}
          <div className="flex flex-col items-center gap-2.5 w-full">
            {/* Control Buttons Centered Row */}
            <div className="pointer-events-auto flex items-center justify-center gap-2 w-full flex-wrap">
              <button
                onClick={toggleAudio}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#120c1c]/85 backdrop-blur-md border border-[#ff69b4]/40 hover:border-[#ff2a9d] text-white text-[10px] font-semibold tracking-wider uppercase rounded-full shadow-lg transition-all"
              >
                <span>{isAudioMuted ? '🔇' : '🎵'}</span>
                <span>{isAudioMuted ? 'Mute' : 'Sound'}</span>
              </button>
              <button
                onClick={togglePause}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#120c1c]/85 backdrop-blur-md border border-[#ff69b4]/40 hover:border-[#ff2a9d] text-white text-[10px] font-semibold tracking-wider uppercase rounded-full shadow-lg transition-all"
              >
                <span>{isPaused ? '▶️' : '⏸️'}</span>
                <span>{isPaused ? 'Play' : 'Pause'}</span>
              </button>
              <button
                onClick={handleRestart}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#120c1c]/85 backdrop-blur-md border border-[#ff69b4]/40 hover:border-[#ff2a9d] text-white text-[10px] font-semibold tracking-wider uppercase rounded-full shadow-lg transition-all"
              >
                <span>🔄</span>
                <span>Restart</span>
              </button>
              <button
                onClick={handleExit}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-pink-500/80 to-rose-600/80 backdrop-blur-md border border-pink-400/60 text-white text-[10px] font-bold tracking-wider uppercase rounded-full shadow-[0_0_12px_rgba(255,42,157,0.4)] transition-all cursor-pointer"
                title="Zurück zur Startseite"
              >
                <span>🚪</span>
                <span>Exit</span>
              </button>
            </div>

            {/* Dynamic Instruction Box Centered */}
            <div className="pointer-events-auto flex flex-col items-center gap-1 p-2.5 bg-[#120c1c]/85 backdrop-blur-md border border-[#ff69b4]/40 rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.4)] w-full max-w-[380px] text-center">
              {(roundInfo || isPaused) && (
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ff2a9d] shadow-[0_0_8px_#ff2a9d] animate-ping" />
                  <span className="text-[10px] font-bold tracking-[2px] uppercase text-[#ffb4dc]/95">
                    {roundInfo ? `${roundInfo}${isPaused ? ' (Pausiert)' : ''}` : 'Pausiert'}
                  </span>
                </div>
              )}
              <p className="text-[11px] leading-tight text-white/90 font-normal">
                {instructionBody}
              </p>
            </div>
          </div>

          {/* MIDDLE SECTION: Horizontal Color Palette centered right below the 16:9 canvas */}
          {activeMode === 'bluten' && currentPhase === 'BLOSSOM' && (
            <div className="pointer-events-auto flex items-center justify-center gap-3 py-2 px-4 bg-[#120c1c]/90 backdrop-blur-xl border border-[#ff69b4]/40 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.6)] mx-auto my-1 z-50 animate-in fade-in duration-300">
              {(Object.keys(BLOSSOM_PALETTES) as BlossomColorId[]).map((colorKey) => {
                const pal = BLOSSOM_PALETTES[colorKey];
                const isSelected = selectedColor === colorKey;
                return (
                  <button
                    key={colorKey}
                    onClick={() => handleColorSelect(colorKey)}
                    title={`Farbe wählen: ${pal.name}`}
                    className={`relative w-7 h-7 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'scale-120 ring-2 ring-white shadow-[0_0_14px_' + pal.uiColor + ']'
                        : 'opacity-70 hover:opacity-100 hover:scale-110'
                    }`}
                    style={{ backgroundColor: pal.uiColor }}
                  >
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_white]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* BOTTOM SECTION: Mode Selector, Souvenir Button, Brand Title stacked below 16:9 canvas */}
          <div className="flex flex-col items-center gap-2.5 w-full">
            {/* Mode Selector */}
            <div className="pointer-events-auto flex items-center justify-center">
              {isCreationMode ? (
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#160e22]/90 backdrop-blur-md border border-[#ff69b4]/50 shadow-[0_0_15px_rgba(255,42,157,0.4)]">
                  <span className="w-2 h-2 rounded-full bg-[#ff2a9d] shadow-[0_0_8px_#ff2a9d] animate-pulse" />
                  <span className="text-[10px] font-bold tracking-[2px] uppercase text-white">
                    Souvenir Mode
                  </span>
                </div>
              ) : (
                <div className="flex gap-1.5 p-1 bg-[#120c1c]/85 backdrop-blur-md border border-[#ff69b4]/30 rounded-full shadow-lg">
                  <button
                    onClick={() => handleSwitchMode('bluten')}
                    className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wider uppercase transition-all ${
                      activeMode === 'bluten'
                        ? 'bg-gradient-to-r from-[#ff2a9d]/80 to-[#120c1c]/90 text-white border border-[#ffb4dc]/80 shadow-[0_0_12px_rgba(255,42,157,0.5)]'
                        : 'text-[#ffc8eb]/60 hover:text-white'
                    }`}
                  >
                    Blüten
                  </button>
                  <button
                    onClick={() => handleSwitchMode('plexus')}
                    className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wider uppercase transition-all ${
                      activeMode === 'plexus'
                        ? 'bg-gradient-to-r from-[#00f0ff]/80 to-[#120c1c]/90 text-white border border-[#4ee2ec]/80 shadow-[0_0_12px_rgba(0,240,255,0.5)]'
                        : 'text-[#ffc8eb]/60 hover:text-white'
                    }`}
                  >
                    Plexus
                  </button>
                </div>
              )}
            </div>

            {/* Souvenir Action Button & Badges */}
            <div className="pointer-events-auto flex flex-col items-center gap-1.5 w-full max-w-[280px]">
              {(hostCreationReady || guestCreationReady) && (
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1 text-[9px] font-bold uppercase text-white transition-opacity ${hostCreationReady ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="w-4 h-4 rounded-full bg-[#10e782] text-black flex items-center justify-center font-black">✓</span> Host
                  </div>
                  <div className={`flex items-center gap-1 text-[9px] font-bold uppercase text-white transition-opacity ${guestCreationReady ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="w-4 h-4 rounded-full bg-[#10e782] text-black flex items-center justify-center font-black">✓</span> Gast
                  </div>
                </div>
              )}
              <button
                onClick={toggleCreationReady}
                className="w-full py-2.5 px-5 rounded-full text-[11px] font-bold tracking-[1.5px] uppercase transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#ff2a9d] via-[#a855f7] to-[#4ee2ec] text-white border border-[#4ee2ec] shadow-[0_8px_25px_rgba(255,42,157,0.4)] cursor-pointer"
                title="In den Souvenirmodus wechseln"
              >
                <span>🎨</span>
                <span>Souvenirmodus starten</span>
              </button>
            </div>

            {/* Brand Title */}
            <div className="text-center select-none pt-0.5">
              <h1 className="text-lg font-bold tracking-[3px] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-[#ff80df] to-[#ff2a9d] drop-shadow-[0_0_12px_rgba(255,42,157,0.7)] leading-none">
                Sakuraverse
              </h1>
              <p className="text-[9px] font-medium tracking-[2px] uppercase text-[#ffc8eb]/70 mt-0.5">
                A Collaborative Artwork
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* LANDSCAPE 4-CORNER GLASSMORPHIC HUD (Desktop & Mobile Landscape) */
        <div className={`absolute inset-0 p-8 flex flex-col justify-between pointer-events-none z-40 transition-opacity duration-700 ${isHudDimmed ? 'opacity-20 hover:opacity-100' : 'opacity-100'}`}>

          {/* TOP BAR: Instruction Box (Left) & Control Buttons (Right) */}
          <div className="flex justify-between items-start w-full">
            {/* Top Left: Dynamic Instruction Box */}
            <div className="pointer-events-auto flex flex-col gap-1.5 p-4 bg-[#120c1c]/85 backdrop-blur-md border border-[#ff69b4]/40 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.4)] max-w-[440px]">
              {(roundInfo || isPaused) && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ff2a9d] shadow-[0_0_10px_#ff2a9d] animate-ping" />
                  <span className="text-[11px] font-bold tracking-[2px] uppercase text-[#ffb4dc]/95">
                    {roundInfo ? `${roundInfo}${isPaused ? ' (Pausiert)' : ''}` : 'Pausiert'}
                  </span>
                </div>
              )}
              <p className="text-xs leading-relaxed text-white/90 font-normal">
                {instructionBody}
              </p>
            </div>

            {/* Top Right: Sound, Pause, Restart & EXIT Control Buttons */}
            <div className="pointer-events-auto flex items-center gap-2.5">
              <button
                onClick={toggleAudio}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#120c1c]/85 backdrop-blur-md border border-[#ff69b4]/40 hover:border-[#ff2a9d] hover:bg-[#ff2a9d]/30 text-white text-[11px] font-semibold tracking-[1.5px] uppercase rounded-full shadow-lg transition-all"
              >
                <span>{isAudioMuted ? '🔇' : '🎵'}</span>
                <span>{isAudioMuted ? 'Sound OFF' : 'Sound ON'}</span>
              </button>

              <button
                onClick={togglePause}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#120c1c]/85 backdrop-blur-md border border-[#ff69b4]/40 hover:border-[#ff2a9d] hover:bg-[#ff2a9d]/30 text-white text-[11px] font-semibold tracking-[1.5px] uppercase rounded-full shadow-lg transition-all"
              >
                <span>{isPaused ? '▶️' : '⏸️'}</span>
                <span>{isPaused ? 'Play' : 'Pause'}</span>
              </button>

              <button
                onClick={handleRestart}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#120c1c]/85 backdrop-blur-md border border-[#ff69b4]/40 hover:border-[#ff2a9d] hover:bg-[#ff2a9d]/30 text-white text-[11px] font-semibold tracking-[1.5px] uppercase rounded-full shadow-lg transition-all"
              >
                <span>🔄</span>
                <span>Restart</span>
              </button>

              <button
                onClick={handleExit}
                className="inline-flex items-center gap-2 px-4.5 py-2 bg-gradient-to-r from-pink-500/80 to-rose-600/80 hover:from-pink-500 hover:to-rose-600 backdrop-blur-md border border-pink-400/60 text-white text-[11px] font-bold tracking-[1.5px] uppercase rounded-full shadow-[0_0_15px_rgba(255,42,157,0.4)] transition-all cursor-pointer"
                title="Zurück zur Startseite"
              >
                <span>🚪</span>
                <span>Exit</span>
              </button>
            </div>
          </div>

          {/* BOTTOM BAR: Brand Title (Left), Mode Selector (Center), Action Button (Right) */}
          <div className="flex justify-between items-end w-full">
            {/* Bottom Left: Brand Title */}
            <div className="flex flex-col gap-1 select-none">
              <h1 className="text-2xl font-bold tracking-[4px] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-[#ff80df] to-[#ff2a9d] drop-shadow-[0_0_20px_rgba(255,42,157,0.7)]">
                Sakuraverse
              </h1>
              <p className="text-[11px] font-medium tracking-[2.5px] uppercase text-[#ffc8eb]/75">
                A Collaborative Artwork
              </p>
            </div>

            {/* Bottom Center: Mode Selector / Creation Mode Badge */}
            <div className="pointer-events-auto flex flex-col gap-1.5 items-center">
              {isCreationMode ? (
                <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#160e22]/90 backdrop-blur-md border border-[#ff69b4]/50 shadow-[0_0_20px_rgba(255,42,157,0.4)]">
                  <span className="w-2 h-2 rounded-full bg-[#ff2a9d] shadow-[0_0_8px_#ff2a9d] animate-pulse" />
                  <span className="text-xs font-bold tracking-[2.5px] uppercase text-white">
                    Souvenir Mode
                  </span>
                </div>
              ) : (
                <div className="flex gap-2 p-1.5 bg-[#120c1c]/85 backdrop-blur-md border border-[#ff69b4]/30 rounded-full shadow-xl">
                  <button
                    onClick={() => handleSwitchMode('bluten')}
                    className={`px-4.5 py-2 rounded-full text-xs font-semibold tracking-[1.5px] uppercase transition-all ${activeMode === 'bluten'
                      ? 'bg-gradient-to-r from-[#ff2a9d]/80 to-[#120c1c]/90 text-white border border-[#ffb4dc]/80 shadow-[0_0_15px_rgba(255,42,157,0.5)]'
                      : 'text-[#ffc8eb]/60 hover:text-white hover:bg-[#ff69b4]/20'
                      }`}
                  >
                    Blüten
                  </button>

                  <button
                    onClick={() => handleSwitchMode('plexus')}
                    className={`px-4.5 py-2 rounded-full text-xs font-semibold tracking-[1.5px] uppercase transition-all ${activeMode === 'plexus'
                      ? 'bg-gradient-to-r from-[#00f0ff]/80 to-[#120c1c]/90 text-white border border-[#4ee2ec]/80 shadow-[0_0_15px_rgba(0,240,255,0.5)]'
                      : 'text-[#ffc8eb]/60 hover:text-white hover:bg-[#ff69b4]/20'
                      }`}
                  >
                    Plexus
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Right: Creation Button & Readiness Indicators */}
            <div className="pointer-events-auto flex flex-col items-center gap-2">
              {/* Ready Status Badges with Green Checkmarks */}
              <div className="flex items-center gap-4 min-h-[44px]">
                <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${hostCreationReady ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}>
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#10e782] to-[#00b045] text-[#051a0e] flex items-center justify-center text-xs font-black shadow-[0_0_14px_rgba(16,231,130,0.8)]">✓</span>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-white shadow-sm">Host</span>
                </div>
                <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${guestCreationReady ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}>
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#10e782] to-[#00b045] text-[#051a0e] flex items-center justify-center text-xs font-black shadow-[0_0_14px_rgba(16,231,130,0.8)]">✓</span>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-white shadow-sm">Gast</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={toggleCreationReady}
                  className="relative overflow-hidden px-8 py-3.5 rounded-full text-xs font-bold tracking-[2px] uppercase transition-all shadow-2xl flex items-center gap-2.5 bg-gradient-to-r from-[#ff2a9d] via-[#a855f7] to-[#4ee2ec] text-white border border-[#4ee2ec] shadow-[0_12px_35px_rgba(255,42,157,0.4)] hover:scale-105 active:scale-95 cursor-pointer"
                  title="In den Souvenirmodus wechseln"
                >
                  <span>🎨</span>
                  <span className="relative z-10">
                    Souvenirmodus starten
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Lightbox: Artwork Selection Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#06020c]/85 backdrop-blur-2xl animate-fade-in">
          <div className="relative w-full max-w-3xl bg-gradient-to-br from-[#1a0e26]/95 to-[#0e0816]/98 border border-[#ff69b4]/45 rounded-3xl p-10 text-center shadow-[0_30px_80px_rgba(0,0,0,0.85),0_0_50px_rgba(255,42,157,0.3)]">
            <button
              onClick={() => {
                setIsLightboxOpen(false);
                setHostCreationReady(false);
                setGuestCreationReady(false);
              }}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-[#ff2a9d]/40 border border-white/20 hover:border-[#ff2a9d] text-white flex items-center justify-center text-sm transition-all"
            >
              ✕
            </button>

            <h2 className="text-3xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-white via-[#ff80df] to-[#ff2a9d] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,42,157,0.6)] mb-8">
              Wähle dein Kunstwerk
            </h2>

            <div className="grid grid-cols-2 gap-8">
              {/* Sumi-e Card */}
              <button
                onClick={() => selectArtworkChoice('bluten')}
                className="group relative rounded-2xl overflow-hidden border-2 border-[#ff69b4]/30 hover:border-[#ff2a9d] bg-[#120c1c]/60 flex flex-col items-center transition-all hover:-translate-y-2 hover:scale-[1.025] hover:shadow-[0_20px_50px_rgba(255,42,157,0.5),0_0_35px_rgba(78,226,236,0.35)] cursor-pointer"
              >
                <div className="relative w-full aspect-square overflow-hidden bg-[#0d0614]">
                  <img src="/sumie_preview.jpg" alt="Sumi-e Blütenkunstwerk" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-[#120818]/40 to-[#0e0414]/95 pointer-events-none" />
                  <div className="absolute bottom-5 inset-x-0 text-center text-2xl font-extrabold tracking-widest text-white uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                    Sumi-e
                  </div>
                </div>
                <div className="w-full py-3.5 px-4 text-xs font-bold tracking-widest uppercase text-[#ffdcf5]/90 bg-white/5 group-hover:bg-[#ff2a9d]/20 group-hover:text-white border-t border-white/10 transition-colors">
                  🌸 Blüten & Äste
                </div>
              </button>

              {/* Plexus Card */}
              <button
                onClick={() => selectArtworkChoice('plexus')}
                className="group relative rounded-2xl overflow-hidden border-2 border-[#ff69b4]/30 hover:border-[#ff2a9d] bg-[#120c1c]/60 flex flex-col items-center transition-all hover:-translate-y-2 hover:scale-[1.025] hover:shadow-[0_20px_50px_rgba(255,42,157,0.5),0_0_35px_rgba(78,226,236,0.35)] cursor-pointer"
              >
                <div className="relative w-full aspect-square overflow-hidden bg-[#0d0614]">
                  <img src="/plexus_preview.jpg" alt="Plexus Konstellation" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-[#120818]/40 to-[#0e0414]/95 pointer-events-none" />
                  <div className="absolute bottom-5 inset-x-0 text-center text-2xl font-extrabold tracking-widest text-white uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                    Plexus
                  </div>
                </div>
                <div className="w-full py-3.5 px-4 text-xs font-bold tracking-widest uppercase text-[#ffdcf5]/90 bg-white/5 group-hover:bg-[#ff2a9d]/20 group-hover:text-white border-t border-white/10 transition-colors">
                  ✨ Orb & Konstellation
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox 2: 16:9 Souvenir Video Preview & NFT Modal */}
      {isSouvenirVideoOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6 bg-[#06020c]/90 backdrop-blur-2xl animate-fade-in pointer-events-auto">
          <div className="relative w-full max-w-2xl bg-gradient-to-br from-[#1a0e26]/95 to-[#0e0816]/98 border border-[#ff69b4]/50 rounded-3xl p-6 md:p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.9),0_0_50px_rgba(255,42,157,0.35)] flex flex-col items-center gap-5">
            <button
              onClick={() => setIsSouvenirVideoOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-[#ff2a9d]/40 border border-white/20 hover:border-[#ff2a9d] text-white flex items-center justify-center text-sm transition-all cursor-pointer"
            >
              ✕
            </button>
            <div className="flex flex-col items-center gap-1.5">
              <div className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#ff2a9d] bg-[#ff2a9d]/15 px-3 py-1 rounded-full border border-[#ff2a9d]/30">
                14s VIDEO SOUVENIR
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-wider text-white">
                Dein Kunstwerk ist fertig!
              </h2>
              <p className="text-xs text-white/70">
                Einzigartiges Unikat deiner Schöpfungs-Session
              </p>
            </div>

            {/* 16:9 Video Player */}
            <div className="w-full max-w-[560px] aspect-video bg-black/80 rounded-2xl overflow-hidden border border-white/20 shadow-2xl flex items-center justify-center">
              {souvenirVideoUrl ? (
                <video
                  src={souvenirVideoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-xs font-mono text-white/50 animate-pulse">Video wird vorbereitet...</div>
              )}
            </div>

            {/* Direct NFT Save Button */}
            <button
              type="button"
              onClick={handleSaveNFT}
              className={`w-full max-w-[320px] py-3.5 px-6 rounded-full font-extrabold text-sm tracking-wider uppercase transition-all duration-300 shadow-xl cursor-pointer flex items-center justify-center gap-2 ${
                isNftSaved
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/40 border border-emerald-300'
                  : 'bg-gradient-to-r from-[#ff2a9d] via-[#a855f7] to-[#4ee2ec] text-white hover:scale-103 hover:shadow-[0_0_25px_rgba(255,42,157,0.6)] border border-white/30'
              }`}
            >
              <span>{isNftSaved ? '✅ Video gesichert!' : '✨ Als NFT sichern'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Android Landscape Switch Prompt Overlay */}
      {isAndroidPortraitPrompt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#06020c]/94 backdrop-blur-3xl animate-fade-in pointer-events-auto">
          <div className="relative w-full max-w-sm bg-gradient-to-br from-[#201030]/95 to-[#0d0516]/98 border border-[#ff69b4]/45 rounded-3xl p-7 text-center shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_45px_rgba(255,42,157,0.3)] flex flex-col items-center gap-4">
            <div className="relative w-18 h-18 flex items-center justify-center">
              <div 
                className="w-8 h-14 border-2 border-[#ff2a9d] rounded-lg relative bg-[#ff2a9d]/10 shadow-[0_0_20px_rgba(255,42,157,0.55)] flex items-start justify-center pt-1"
                style={{ animation: 'phoneRotateAnim 2.4s ease-in-out infinite' }}
              >
                <div className="w-2.5 h-0.5 bg-white/70 rounded-full" />
              </div>
              <div 
                className="absolute top-1/2 left-1/2 text-2xl text-[#4ee2ec] font-bold pointer-events-none drop-shadow-[0_0_12px_rgba(78,226,236,0.85)]"
                style={{ animation: 'arrowPulse 2.4s ease-in-out infinite' }}
              >
                ↻
              </div>
            </div>

            <h3 className="text-xl font-bold tracking-widest uppercase bg-gradient-to-r from-white via-[#ff80df] to-[#ff2a9d] bg-clip-text text-transparent">
              Querformat
            </h3>

            <p className="text-xs leading-relaxed text-[#ffdcf5]/85">
              Host hat die Session gestartet! Tippe auf den Bildschirm oder drehe dein Smartphone ins Querformat für das Kunstwerk.
            </p>

            <button
              type="button"
              onClick={requestLandscapeOrientation}
              className="w-full py-3 px-6 bg-gradient-to-r from-[#ff2a9d] to-[#a855f7] border border-white/40 rounded-full text-white text-xs font-bold tracking-widest uppercase shadow-[0_8px_25px_rgba(255,42,157,0.55)] hover:scale-102 active:scale-98 transition-all cursor-pointer"
            >
              <span>🔄 Querformat starten</span>
            </button>
          </div>
        </div>
      )}

      {/* iOS Landscape Block Modal (Blocks rotation to landscape on iPhones) */}
      {isIOSLandscapeBlocked && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#06020c]/94 backdrop-blur-3xl animate-fade-in pointer-events-auto">
          <div className="relative w-full max-w-md bg-gradient-to-br from-[#201030]/95 to-[#0d0516]/98 border border-[#ff69b4]/45 rounded-3xl p-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_45px_rgba(255,42,157,0.3)] flex flex-col items-center gap-4">
            <div className="relative w-18 h-18 flex items-center justify-center">
              <div
                className="w-14 h-8 border-2 border-[#ff2a9d] rounded-lg relative bg-[#ff2a9d]/10 shadow-[0_0_22px_rgba(255,42,157,0.55)] flex items-center pl-1"
                style={{ animation: 'iosRotatePhoneBack 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
              >
                <div className="w-0.5 h-2.5 bg-white/70 rounded-full" />
              </div>
              <div
                className="absolute top-1/2 left-1/2 text-2xl text-[#4ee2ec] font-bold pointer-events-none drop-shadow-[0_0_16px_rgba(78,226,236,0.85)]"
                style={{ animation: 'arrowPulse 2.4s ease-in-out infinite' }}
              >
                ↻
              </div>
            </div>
            <div className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#4ee2ec] bg-[#4ee2ec]/15 px-3 py-1 rounded-full border border-[#4ee2ec]/40">
              HOCHFORMAT-MODUS
            </div>
            <h3 className="text-xl font-bold tracking-wider text-white">Bitte Gerät aufrecht halten</h3>
            <p className="text-xs leading-relaxed text-[#ffdcf5]/85">
              Auf dem iPhone ist dieses Kunstwerk für die vertikale Ansicht im Hochformat optimiert. Bitte drehe dein Smartphone wieder aufrecht, um fortzufahren.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[#ffc8eb]/70 tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#ff2a9d] shadow-[0_0_10px_#ff2a9d] animate-ping" />
              <span>Warte auf Drehung ins Hochformat...</span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Double-Back Notice Toast */}
      {backNoticeVisible && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[250] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#160a22]/90 backdrop-blur-xl border border-white/20 text-white text-xs font-semibold tracking-wide shadow-2xl">
            <span>↩️</span>
            <span>Nochmal „Zurück“ wischen, um die Session zu beenden</span>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
