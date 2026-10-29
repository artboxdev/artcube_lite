'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  BLOSSOM_PALETTES,
  PALETTE_RGB_CACHE,
  BG_COLOR_PALETTES,
  type BlossomColorId,
} from '../../experiences/sakura/SakuraCanvas';
import { Language, translations } from './translations';

interface SakuraverseDualSliderProps {
  lang: Language;
}

// ============================================================================
// 1:1 TEXTURE GENERATORS & SHADERS FROM SakuraCanvas.tsx
// ============================================================================

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
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  if (ctx) {
    const cx = 64;
    const cy = 64;

    // Soft outer glow halo (matching Variant 3's shadowBlur = 8 / #ff2a9d glow)
    const aura = ctx.createRadialGradient(cx, cy, 4, cx, cy, 52);
    aura.addColorStop(0, 'rgba(255, 190, 240, 0.45)');
    aura.addColorStop(0.45, 'rgba(255, 42, 157, 0.22)');
    aura.addColorStop(1, 'rgba(255, 42, 157, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(cx, cy, 52, 0, Math.PI * 2);
    ctx.fill();

    // Delicate, fine Sakura petal silhouette with soft glow
    ctx.save();
    ctx.translate(cx, cy);
    ctx.shadowColor = '#ff2a9d';
    ctx.shadowBlur = 16;

    const grad = ctx.createLinearGradient(0, -28, 0, 28);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.45, '#ffe6f7');
    grad.addColorStop(1, '#ffb8eb');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.bezierCurveTo(15, -16, 20, 4, 12, 21);
    ctx.bezierCurveTo(6, 29, -6, 29, -12, 21);
    ctx.bezierCurveTo(-20, 4, -15, -16, 0, -26);
    ctx.closePath();
    ctx.fill();

    // Fine luminous central vein/highlight for delicate petal structure
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.quadraticCurveTo(2, 0, 0, 18);
    ctx.stroke();

    ctx.restore();
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
    const cx = 64,
      cy = 64;

    // 70% reduced white component: center uses color-tinted glow with only 30% white core
    const rad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 56);
    rad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
    rad.addColorStop(0.22, hexColorStr + 'cc');
    rad.addColorStop(0.55, hexColorStr + '44');
    rad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, 128, 128);

    const angles = [Math.PI / 4, -Math.PI / 4];
    const half = 50;

    for (let i = 0; i < angles.length; i++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angles[i]);

      const flareGrad = ctx.createLinearGradient(-half, 0, half, 0);
      flareGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      flareGrad.addColorStop(0.35, hexColorStr + 'aa');
      flareGrad.addColorStop(0.5, hexColorStr);
      flareGrad.addColorStop(0.65, hexColorStr + 'aa');
      flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.shadowColor = hexColorStr;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = flareGrad;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-half, 0);
      ctx.lineTo(half, 0);
      ctx.stroke();

      ctx.restore();
    }

    ctx.fillStyle = hexColorStr;
    ctx.beginPath();
    ctx.arc(cx, cy, 3.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.30)';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

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

    float noiseVal = pattern(fragCoord * vec2(0.004), iTime * 0.007, uv);

    vec3 baseC1 = vec3(0.05, 0.00, 0.02);
    vec3 baseC2 = vec3(0.74, 0.00, 0.36);
    vec3 baseC3 = vec3(0.80, 0.04, 0.44);

    vec3 col = mix(baseC1, baseC2, smoothstep(0.0, 1.0, noiseVal));
    col = mix(col, baseC1 * 2.2, noiseVal * 0.8);
    col = mix(col, baseC3, 0.35 * noiseVal);
    col = mix(col, baseC2 * 0.7, smoothstep(0.0, 0.6, 0.6 * noiseVal));
    col = mix(col, baseC3 * 1.1, 0.12 * noiseVal);
    
    col *= noiseVal * 1.68;

    float vignetteVal = max(0.0, 70.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y));
    col *= (0.80 * (0.70 + 0.65 * sqrt(vignetteVal))) * uBgDim;
    
    gl_FragColor = vec4(col, 1.0);
  }
`;

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

const orbMeshVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

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
    float marchStep = (limits.y - limits.x) / 36.0;
    vec3 finalEnergy = vec3(0.0);
    float fieldVal = 0.0;
    float normScale = 2.0 / radius;
    
    for(int i = 0; i < 36; i++) {
      currentDepth += marchStep * exp(-1.5 * fieldVal);
      if(currentDepth > limits.y) break;
      
      vec3 samplePoint = origin + currentDepth * dir;
      vec3 normSample = samplePoint * normScale;
      fieldVal = evaluateStructure(normSample);
      
      float vSq = fieldVal * fieldVal;
      float gradientBlend = smoothstep(0.0, 0.4, fieldVal);
      vec3 currentGradient = mix(uSecondaryColor, uPrimaryColor, gradientBlend);
      
      vec3 emission = currentGradient * (fieldVal * 1.8 + vSq * 1.0);
      finalEnergy = 0.99 * finalEnergy + (0.095 * uDensity) * emission;
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
    finalColor = clamp(finalColor, 0.0, 1.0);

    float maxLuma = max(finalColor.r, max(finalColor.g, finalColor.b));
    float minWhite = min(finalColor.r, min(finalColor.g, finalColor.b));
    // Reduce white component by 70% so the Orb's primary color is deeply saturated and recognizable
    finalColor = max(vec3(0.0), finalColor - vec3(minWhite * 0.70));
    finalColor = mix(finalColor * 1.35, uPrimaryColor * maxLuma * 1.35, 0.42) * edgeAA;

    float alpha = clamp(maxLuma * 1.65, 0.0, 1.0) * edgeAA * uAlpha;
    
    if (alpha < 0.005) discard;
    gl_FragColor = vec4(finalColor, alpha);
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

const FRACTAL_ORB_PRESETS: Record<
  BlossomColorId,
  {
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
  }
> = {
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
    atmosphereScale: 1.03,
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
    atmosphereScale: 1.03,
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
    atmosphereScale: 1.03,
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
    atmosphereScale: 1.03,
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
    atmosphereScale: 1.03,
  },
};

// 1:1 ImmersiveStroke class from SakuraCanvas.tsx
class ImmersiveStroke {
  maxPoints = 600;
  pointCount = 0;
  points: THREE.Vector3[] = [];
  pathLength = 0;
  baseWidth: number;
  currentWidth: number;
  level: number;
  seed = Math.random();
  lengthUniform = { value: 0 };
  progressUniform = { value: 1.0 };
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
        uAlpha: this.alphaUniform,
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    sceneGroup.add(this.mesh);
  }

  addPoint(p: THREE.Vector3, widthScale = 1.0) {
    if (this.pointCount >= this.maxPoints - 1) return;

    const dir = new THREE.Vector3(0, 1, 0);
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
    const pressureMod =
      1.0 +
      0.32 * Math.sin(normDist * Math.PI * 4.5 + this.seed * 7.0) +
      0.12 * Math.cos(normDist * Math.PI * 9.0);
    const finalWidthScale = widthScale * Math.max(0.4, Math.min(1.4, pressureMod));

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

  setTime(t: number) {
    this.timeUniform.value = t;
  }
}

const SATURATED_PLEXUS_PALETTES: Record<
  BlossomColorId,
  { r: number; g: number; b: number }[]
> = {
  pink: [
    { r: 1.0, g: 0.05, b: 0.52 },
    { r: 0.95, g: 0.0, b: 0.45 },
    { r: 1.0, g: 0.12, b: 0.62 },
  ],
  red: [
    { r: 1.0, g: 0.04, b: 0.14 },
    { r: 0.96, g: 0.12, b: 0.02 },
    { r: 1.0, g: 0.0, b: 0.22 },
  ],
  blue: [
    { r: 0.0, g: 0.62, b: 1.0 },
    { r: 0.0, g: 0.42, b: 1.0 },
    { r: 0.05, g: 0.75, b: 1.0 },
  ],
  green: [
    { r: 0.0, g: 0.88, b: 0.38 },
    { r: 0.0, g: 0.76, b: 0.28 },
    { r: 0.06, g: 0.95, b: 0.45 },
  ],
  yellow: [
    { r: 1.0, g: 0.72, b: 0.0 },
    { r: 1.0, g: 0.6, b: 0.0 },
    { r: 1.0, g: 0.82, b: 0.02 },
  ],
};

interface AttachedPlexusNode3D {
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
  waveAmp: number;
  waveFreq: number;
  wavePhase: number;
}

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

  // Slider Handle Dragging (ONLY when the central handle button itself is grabbed)
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingHandleRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const nextRatio = Math.max(
        0.12,
        Math.min(0.88, (e.clientX - rect.left) / Math.max(1, rect.width))
      );
      splitRatioRef.current = nextRatio;
      setSplitRatio(nextRatio);
    };

    const onPointerUp = () => {
      isDraggingHandleRef.current = false;
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

  // Main 1:1 Three.js WebGL Engine for Dual Slider
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = Math.max(320, container.clientWidth);
    let height = Math.max(240, container.clientHeight);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    renderer.autoClear = false;

    // =========================================================================
    // 1. SHARED BACKGROUND SHADER SCENE (1:1 from SakuraCanvas.tsx)
    // =========================================================================
    const bgScene = new THREE.Scene();
    const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const noiseTex = createNoiseTexture();

    const bgUniforms = {
      iResolution: {
        value: new THREE.Vector3(renderer.domElement.width, renderer.domElement.height, 1),
      },
      iTime: { value: 0 },
      iChannel0: { value: noiseTex },
      uKaleidoscope: { value: 0.0 },
      uGridVibe: { value: 0.0 },
      uRippleActive: { value: 0.0 },
      uRippleTime: { value: 0.0 },
      uBgColor1: { value: BG_COLOR_PALETTES.default.c1.clone() },
      uBgColor2: { value: BG_COLOR_PALETTES.default.c2.clone() },
      uBgColor3: { value: BG_COLOR_PALETTES.default.c3.clone() },
      uRippleCrest: { value: BG_COLOR_PALETTES.default.crest.clone() },
      uBgBlend: { value: 0.0 },
      uBgDim: { value: 1.0 },
    };

    const bgMat = new THREE.ShaderMaterial({
      vertexShader: bgVertexShader,
      fragmentShader: bgFragmentShader,
      uniforms: bgUniforms,
      depthWrite: false,
      depthTest: false,
    });
    const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
    bgScene.add(bgMesh);

    // =========================================================================
    // 2. SUMI-E 3D SCENE (1:1 ImmersiveStroke Trunk, Sub-Branches, Pink Blossom Clusters & Instanced Petals)
    // =========================================================================
    const blutenScene = new THREE.Scene();
    const blutenCamera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);

    const updateCameras = (w: number, h: number) => {
      const aspect = w / h;
      blutenCamera.aspect = aspect;
      blutenCamera.fov = 45;
      blutenCamera.updateProjectionMatrix();
      const visibleWidth = 2 * Math.tan(THREE.MathUtils.degToRad(22.5)) * 16 * aspect;
      const targetCamX = -11.5 + visibleWidth * 0.48;
      blutenCamera.position.set(targetCamX, -0.3, 16);
      blutenCamera.lookAt(targetCamX, -0.3, 0);
    };

    const strokeGroup = new THREE.Group();
    const petalGroup = new THREE.Group();
    blutenScene.add(strokeGroup);
    blutenScene.add(petalGroup);

    const allSumieStrokes: ImmersiveStroke[] = [];

    // Main Trunk Curve positioned so it spans the left side of the slider
    const trunkCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-12.2, -2.8, 0.0),
        new THREE.Vector3(-10.2, -1.7, 0.25),
        new THREE.Vector3(-8.4, -2.0, -0.2),
        new THREE.Vector3(-6.6, -0.7, 0.3),
        new THREE.Vector3(-4.8, -0.1, -0.15),
        new THREE.Vector3(-3.1, 0.9, 0.2),
        new THREE.Vector3(-1.6, 0.4, -0.25),
        new THREE.Vector3(-0.2, 1.1, 0.15),
      ],
      false,
      'centripetal',
      0.5
    );

    const mainTrunkStroke = new ImmersiveStroke(strokeGroup, 0.58, 0, 0xf5e4cf);
    const trunkPts = trunkCurve.getSpacedPoints(140);
    for (let i = 0; i <= 140; i++) {
      const tVal = i / 140;
      mainTrunkStroke.addPoint(trunkPts[i], Math.max(0.18, 1.0 - tVal * 0.55));
    }
    allSumieStrokes.push(mainTrunkStroke);

    // Spawn 5 authentic Sub-Branches along the main trunk (using exact spawnSubBranchFromOrb math)
    const subBranchConfigs = [
      { t: 0.22, angleDeg: 32, len: 4.6, seed: 0.15 },
      { t: 0.38, angleDeg: -28, len: 4.2, seed: 0.42 },
      { t: 0.54, angleDeg: 30, len: 3.9, seed: 0.68 },
      { t: 0.7, angleDeg: -26, len: 3.4, seed: 0.81 },
      { t: 0.84, angleDeg: 25, len: 2.8, seed: 0.33 },
    ];

    const subBranchCurves: THREE.CatmullRomCurve3[] = [];

    subBranchConfigs.forEach((cfg) => {
      const startPos = trunkCurve.getPointAt(cfg.t);
      const angleRad = THREE.MathUtils.degToRad(cfg.angleDeg);
      const guideDir = new THREE.Vector3(Math.cos(angleRad), Math.sin(angleRad), 0).normalize();
      const normal = new THREE.Vector3(-guideDir.y, guideDir.x, 0).normalize();
      const numPts = 45;
      const pts = [startPos.clone()];

      for (let i = 1; i <= numPts; i++) {
        const frac = i / numPts;
        const currentDist = cfg.len * frac;
        const wave1 = Math.sin(frac * Math.PI * 4.0 + cfg.seed * 6.0) * 0.38;
        const wave2 = Math.cos(frac * Math.PI * 8.0 + cfg.seed * 3.0) * 0.16;
        const sideOffset = (wave1 + wave2) * (1.0 - frac * 0.35);

        const p = startPos
          .clone()
          .addScaledVector(guideDir, currentDist)
          .addScaledVector(normal, sideOffset);
        p.z += (Math.sin(frac * Math.PI * 2.0 + cfg.seed) - 0.5) * 0.25;
        pts.push(p);
      }

      const childCurve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
      subBranchCurves.push(childCurve);

      const childStroke = new ImmersiveStroke(strokeGroup, 0.32, 1, 0xf5e4cf);
      const spacedPts = childCurve.getSpacedPoints(70);
      for (let i = 0; i <= 70; i++) {
        const frac = i / 70;
        childStroke.addPoint(spacedPts[i], Math.max(0.15, 1.0 - frac * 0.6));
      }
      allSumieStrokes.push(childStroke);
    });

    // Spawn 1:1 Pink Sakura Blossom Clusters ("pinke Sakurablütenknollen") on trunk & sub-branches
    // (exact math from spawnBlossomClusterFromOrb in SakuraCanvas.tsx)
    const allCurves = [trunkCurve, ...subBranchCurves];
    const blossomPalette = BLOSSOM_PALETTES.pink;
    const clusterLocations = [
      { curveIdx: 0, t: 0.26 },
      { curveIdx: 0, t: 0.45 },
      { curveIdx: 0, t: 0.62 },
      { curveIdx: 0, t: 0.78 },
      { curveIdx: 0, t: 0.94 },
      { curveIdx: 1, t: 0.45 },
      { curveIdx: 1, t: 0.82 },
      { curveIdx: 2, t: 0.55 },
      { curveIdx: 2, t: 0.88 },
      { curveIdx: 3, t: 0.5 },
      { curveIdx: 3, t: 0.85 },
      { curveIdx: 4, t: 0.65 },
      { curveIdx: 5, t: 0.72 },
    ];

    clusterLocations.forEach((loc, cIdx) => {
      const curve = allCurves[loc.curveIdx % allCurves.length];
      const centerPos = curve.getPointAt(loc.t).clone();
      const numLayerStrokes = 3;

      for (let s = 0; s < numLayerStrokes; s++) {
        const strokeColor =
          blossomPalette.shades[(cIdx + s) % blossomPalette.shades.length];
        const clusterRadius = 0.22 + (s % 2) * 0.1;
        const baseAngle = s * 2.1 + cIdx;
        const pts: THREE.Vector3[] = [];

        for (let i = 0; i <= 20; i++) {
          const frac = i / 20;
          const angle = baseAngle + frac * Math.PI * 1.55;
          const r = clusterRadius * (0.65 + 0.35 * Math.sin(frac * Math.PI * 2.0 + s));
          pts.push(
            centerPos
              .clone()
              .add(
                new THREE.Vector3(
                  Math.cos(angle) * r,
                  Math.sin(angle) * r,
                  0.08 + s * 0.03
                )
              )
          );
        }

        const clusterCurve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
        const clusterStroke = new ImmersiveStroke(strokeGroup, 0.36, 3, strokeColor);
        const spacedPts = clusterCurve.getSpacedPoints(35);
        for (let i = 0; i <= 35; i++) {
          const frac = i / 35;
          clusterStroke.addPoint(spacedPts[i], 0.65 + 0.85 * Math.sin(frac * Math.PI));
        }
        allSumieStrokes.push(clusterStroke);
      }
    });

    // Instanced Sakura Petals with soft glow & fine structure (4x original size / doubled again, 70% slower vortex)
    const SLIDER_PETALS = 44;
    const VARIANT3_PETAL_SHADES = [0xff80df, 0xff2a9d, 0xffb3ec, 0xffaae6, 0xff77dd];
    const petalGeo = new THREE.PlaneGeometry(2.32, 2.32);
    const petalTex = generatePetalTexture();
    const petalMat = new THREE.MeshBasicMaterial({
      map: petalTex,
      color: new THREE.Color(0xffffff),
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const instancedPetalMesh = new THREE.InstancedMesh(petalGeo, petalMat, SLIDER_PETALS);
    instancedPetalMesh.matrixAutoUpdate = false;
    petalGroup.add(instancedPetalMesh);

    const petalPosX = new Float32Array(SLIDER_PETALS);
    const petalPosY = new Float32Array(SLIDER_PETALS);
    const petalPosZ = new Float32Array(SLIDER_PETALS);
    const petalSpeedX = new Float32Array(SLIDER_PETALS);
    const petalSpeedY = new Float32Array(SLIDER_PETALS);
    const petalAmpX = new Float32Array(SLIDER_PETALS);
    const petalAmpY = new Float32Array(SLIDER_PETALS);
    const petalAmpZ = new Float32Array(SLIDER_PETALS);
    const petalFreqX = new Float32Array(SLIDER_PETALS);
    const petalFreqY = new Float32Array(SLIDER_PETALS);
    const petalFreqZ = new Float32Array(SLIDER_PETALS);
    const petalPhaseX = new Float32Array(SLIDER_PETALS);
    const petalPhaseY = new Float32Array(SLIDER_PETALS);
    const petalPhaseZ = new Float32Array(SLIDER_PETALS);
    const petalSeed = new Float32Array(SLIDER_PETALS);
    const petalAge = new Float32Array(SLIDER_PETALS);
    const petalScales = new Float32Array(SLIDER_PETALS);
    const petalAngle = new Float32Array(SLIDER_PETALS);
    const petalSpeed = new Float32Array(SLIDER_PETALS);
    const petalRadiusX = new Float32Array(SLIDER_PETALS);
    const petalRadiusY = new Float32Array(SLIDER_PETALS);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < SLIDER_PETALS; i++) {
      const shadeHex = VARIANT3_PETAL_SHADES[i % VARIANT3_PETAL_SHADES.length];
      instancedPetalMesh.setColorAt(i, new THREE.Color(shadeHex));

      petalPosX[i] = -6.0 + (Math.random() - 0.5) * 14.0;
      petalPosY[i] = -0.3 + (Math.random() - 0.5) * 10.0;
      petalPosZ[i] = -2.2 - Math.random() * 1.2;
      // Diagonal flight (top-left to bottom-right)
      petalSpeedX[i] = 1.1 + Math.random() * 0.9;
      petalSpeedY[i] = -(0.55 + Math.random() * 0.65);
      petalAmpX[i] = 0.65 + Math.random() * 0.95;
      petalAmpY[i] = 0.5 + Math.random() * 0.85;
      petalAmpZ[i] = (0.4 + Math.random() * 0.6) * 0.4;
      petalFreqX[i] = 0.35 + Math.random() * 0.4;
      petalFreqY[i] = 0.3 + Math.random() * 0.35;
      petalFreqZ[i] = 0.4 + Math.random() * 0.5;
      petalPhaseX[i] = Math.random() * Math.PI * 2;
      petalPhaseY[i] = Math.random() * Math.PI * 2;
      petalPhaseZ[i] = Math.random() * Math.PI * 2;
      petalSeed[i] = Math.random() * 100.0;
      petalAge[i] = Math.random() * 4.0;
      petalScales[i] = 0.48 + Math.random() * 0.36;

      petalAngle[i] = Math.random() * Math.PI * 2;
      // Vortex angular speed reduced by 70% (factor 0.30)
      petalSpeed[i] = (1.6 + Math.random() * 1.4) * 0.30 * (i % 2 === 0 ? 1 : -1);
      petalRadiusX[i] = 2.2 + Math.random() * 3.8;
      petalRadiusY[i] = 1.8 + Math.random() * 3.0;
    }
    if (instancedPetalMesh.instanceColor) {
      instancedPetalMesh.instanceColor.needsUpdate = true;
    }

    let vortexRemaining = 0.0;
    let vortexBlend = 0.0;
    const mouseTrailHistory: { x: number; y: number; t: number }[] = [];

    // =========================================================================
    // 3. PLEXUS 3D SCENE (1:1 Volumetric Fractal Orbs + Finale-Style Plexus + 3s Network Impulse)
    // =========================================================================
    const plexusScene = new THREE.Scene();
    const plexusCamera = new THREE.PerspectiveCamera(60, width / height, 1, 3000);
    plexusCamera.position.set(0, 0, 540);
    plexusCamera.lookAt(0, 0, 0);

    // 1:1 Plexus Lines & Star-Core Points Meshes from SakuraCanvas.tsx
    const MAX_SLIDER_NODES = 600;
    const MAX_SLIDER_LINES = 4800;

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(MAX_SLIDER_LINES * 6), 3)
    );
    lineGeo.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(MAX_SLIDER_LINES * 6), 3)
    );
    lineGeo.setAttribute(
      'alpha',
      new THREE.BufferAttribute(new Float32Array(MAX_SLIDER_LINES * 2), 1)
    );
    const lineMat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        attribute vec3 color;
        attribute float alpha;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vAlpha = alpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          if (vAlpha < 0.01) discard;
          gl_FragColor = vec4(vColor, clamp(vAlpha, 0.0, 1.0));
        }
      `,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    const plexusLinesMesh = new THREE.LineSegments(lineGeo, lineMat);
    plexusScene.add(plexusLinesMesh);

    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(MAX_SLIDER_NODES * 3), 3)
    );
    nodeGeo.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(MAX_SLIDER_NODES * 3), 3)
    );
    nodeGeo.setAttribute(
      'size',
      new THREE.BufferAttribute(new Float32Array(MAX_SLIDER_NODES), 1)
    );
    const nodeMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAlpha: { value: 1.0 },
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
          vec3 brightColor = clamp(vColor * 1.15 + vec3(0.04) * starVal, 0.0, 1.0);
          gl_FragColor = vec4(brightColor, clamp(intensity * 1.15 * uAlpha, 0.0, 1.0));
        }
      `,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    const plexusPointsMesh = new THREE.Points(nodeGeo, nodeMat);
    plexusScene.add(plexusPointsMesh);

    // 4 Orbs: Red, Blue, Yellow, Green (1:1 FloatingPlexusOrbInstance visuals + attached Plexus)
    const ORB_RADIUS = 26.0;
    const sphereGeom = new THREE.SphereGeometry(ORB_RADIUS, 48, 48);

    class SliderPlexusOrb {
      id: BlossomColorId;
      name: string;
      homeX: number;
      homeY: number;
      orbitRx: number;
      orbitRy: number;
      orbitSpeed: number;
      orbitPhase: number;
      x: number;
      y: number;
      z = 0;
      vx = 0;
      vy = 0;
      internalTime = Math.random() * 10;
      hoverWobbleTimer = 999.0;
      dockWobbleTimer = 999.0;
      impulseTimer = 999.0;
      preset: (typeof FRACTAL_ORB_PRESETS)[BlossomColorId];
      mesh: THREE.Mesh;
      material: THREE.ShaderMaterial;
      atmosphereMesh: THREE.Mesh;
      atmosphereMaterial: THREE.ShaderMaterial;
      starSprite: THREE.Sprite;
      impulseMesh: THREE.Mesh;
      impulseMaterial: THREE.ShaderMaterial;
      attachedNodes: AttachedPlexusNode3D[] = [];

      constructor(
        id: BlossomColorId,
        homeX: number,
        homeY: number,
        orbitRx: number,
        orbitRy: number,
        orbitSpeed: number,
        orbitPhase: number
      ) {
        this.id = id;
        const config = BLOSSOM_PALETTES[id];
        this.name = config.name;
        this.homeX = homeX;
        this.homeY = homeY;
        this.orbitRx = orbitRx;
        this.orbitRy = orbitRy;
        this.orbitSpeed = orbitSpeed;
        this.orbitPhase = orbitPhase;
        this.x = homeX;
        this.y = homeY;

        const preset = FRACTAL_ORB_PRESETS[id];
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
            uAlpha: { value: 1.0 },
            uFractalIters: { value: preset.fractalIters },
            uFractalScale: { value: preset.fractalScale },
            uFractalDecay: { value: preset.fractalDecay },
            uInternalAnim: { value: 0.43 },
            uSmoothness: { value: preset.smoothness },
            uAsymmetry: { value: preset.asymmetry },
            uRadius: { value: ORB_RADIUS },
          },
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.NormalBlending,
        });

        this.mesh = new THREE.Mesh(sphereGeom, this.material);
        this.mesh.position.set(this.x, this.y, this.z);

        this.atmosphereMaterial = new THREE.ShaderMaterial({
          vertexShader: atmosphereVertexShader,
          fragmentShader: atmosphereFragmentShader,
          uniforms: {
            uColor: { value: new THREE.Color(preset.primary) },
            uGlow: { value: preset.atmosphereGlow * 0.85 },
            uLevel: { value: preset.atmosphereLevel },
            uAlpha: { value: 1.0 },
          },
          transparent: true,
          side: THREE.FrontSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        this.atmosphereMesh = new THREE.Mesh(sphereGeom, this.atmosphereMaterial);
        this.atmosphereMesh.scale.setScalar(preset.atmosphereScale);
        this.mesh.add(this.atmosphereMesh);

        // Starburst Glint Sprite (70% less white washout)
        const starTex = generateStarCrossTexture(config.uiColor || preset.primary);
        const spriteMat = new THREE.SpriteMaterial({
          map: starTex,
          color: 0xffffff,
          transparent: true,
          opacity: 0.55,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        this.starSprite = new THREE.Sprite(spriteMat);
        this.starSprite.scale.set(34, 34, 1);
        this.mesh.add(this.starSprite);

        plexusScene.add(this.mesh);

        // 1:1 Dock Impulse Shockwave Ring Mesh from SakuraCanvas.tsx
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
            uColor: { value: new THREE.Color(config.vortexTint) },
          },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        this.impulseMesh = new THREE.Mesh(impulseGeom, this.impulseMaterial);
        this.impulseMesh.position.set(this.x, this.y, this.z);
        this.impulseMesh.visible = false;
        plexusScene.add(this.impulseMesh);

        // Pre-attach 1:1 Local Orb Shell (exact attachCluster behavior outside finale in SakuraCanvas.tsx)
        const rgbList = SATURATED_PLEXUS_PALETTES[this.id];
        const nodeCount = 18;
        for (let i = 0; i < nodeCount; i++) {
          const tier = i < 10 ? 1 : 2;
          const layerRadius = 38.0 + (tier - 1) * 14.0;
          const speedMul = 1.0 + (tier % 2 === 0 ? 0.35 : -0.25);
          const angle = (i / nodeCount) * Math.PI * 2 + Math.random() * 0.4;
          const elevation = (Math.random() - 0.5) * Math.PI * 0.6;
          const rgb = rgbList[i % rgbList.length];
          this.attachedNodes.push({
            radius: layerRadius + (Math.random() - 0.5) * 6.0,
            angle,
            elevation,
            orbitSpeed: (0.45 + (i % 3) * 0.2) * (i % 2 === 0 ? 1 : -1) * speedMul,
            r: rgb.r,
            g: rgb.g,
            b: rgb.b,
            size: 16.0 + Math.random() * 8.0,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 3.0,
            waveAmp: tier === 1 ? 14.0 : 24.0,
            waveFreq: 0.8 + Math.random() * 1.1,
            wavePhase: Math.random() * Math.PI * 2,
          });
        }
      }

      triggerHoverWobble() {
        if (this.hoverWobbleTimer > 0.4) {
          this.hoverWobbleTimer = 0.0;
        }
      }

      triggerDockWobble() {
        this.dockWobbleTimer = 0.0;
        this.impulseTimer = 0.0;
      }

      update(delta: number, cam: THREE.Camera) {
        this.internalTime += delta * 0.55;
        this.material.uniforms.uTime.value = this.internalTime;

        this.mesh.rotation.y += delta * 0.55;
        this.mesh.rotation.x += delta * 0.28;
        this.mesh.updateMatrixWorld();

        const localCam = cam.position.clone();
        this.mesh.worldToLocal(localCam);
        this.material.uniforms.uLocalCamPos.value.copy(localCam);

        let scaleX = 1.0,
          scaleY = 1.0,
          scaleZ = 1.0;
        let wobbleDispX = 0.0,
          wobbleDispY = 0.0;

        if (this.hoverWobbleTimer < 0.7) {
          this.hoverWobbleTimer += delta;
          const wt = Math.min(1.0, this.hoverWobbleTimer / 0.7);
          const wobble = Math.sin(wt * Math.PI * 8.0) * Math.exp(-wt * 3.5);
          scaleX *= 1.0 + wobble * 0.22;
          scaleY *= 1.0 - wobble * 0.18;
          scaleZ *= 1.0 + wobble * 0.22;
        }

        if (this.dockWobbleTimer < 1.0) {
          this.dockWobbleTimer += delta;
          const dtW = Math.min(1.0, this.dockWobbleTimer / 1.0);
          const dockWobble = Math.sin(dtW * Math.PI * 10.0) * Math.exp(-dtW * 3.2);
          scaleX *= 1.0 + dockWobble * 0.36;
          scaleY *= 1.0 - dockWobble * 0.28;
          scaleZ *= 1.0 + dockWobble * 0.36;
          wobbleDispX += Math.sin(dtW * Math.PI * 12.0) * (1.0 - dtW) * 6.0;
          wobbleDispY += Math.cos(dtW * Math.PI * 12.0) * (1.0 - dtW) * 6.0;

          const glowBoost = 1.0 + Math.max(0.0, dockWobble * 2.0);
          this.atmosphereMaterial.uniforms.uGlow.value =
            this.preset.atmosphereGlow * glowBoost;
        } else {
          this.atmosphereMaterial.uniforms.uGlow.value = this.preset.atmosphereGlow;
        }

        this.mesh.scale.set(scaleX, scaleY, scaleZ);
        this.mesh.position.set(this.x + wobbleDispX, this.y + wobbleDispY, this.z);
        this.impulseMesh.visible = false;
      }
    }

    // Create the 4 requested Orbs (Red, Blue, Yellow, Green) in the right half of the 3D space
    const plexusOrbs: SliderPlexusOrb[] = [
      new SliderPlexusOrb('red', 105, 85, 34, 24, 0.72, 0.2),
      new SliderPlexusOrb('blue', 245, 78, 36, 26, -0.64, 1.8),
      new SliderPlexusOrb('yellow', 115, -82, 36, 24, 0.6, 3.3),
      new SliderPlexusOrb('green', 250, -78, 34, 26, -0.68, 4.7),
    ];

    interface ImpulseNetworkParticle {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      r: number;
      g: number;
      b: number;
      size: number;
    }

    interface Active3sImpulse {
      orbA: SliderPlexusOrb;
      orbB: SliderPlexusOrb;
      remaining: number;
      duration: number;
      midX: number;
      midY: number;
      particles: ImpulseNetworkParticle[];
    }

    const activeImpulses: Active3sImpulse[] = [];
    const pairCooldowns = new Map<string, number>();
    const getPairKey = (a: SliderPlexusOrb, b: SliderPlexusOrb) =>
      a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;

    const worldNodeX = new Float32Array(MAX_SLIDER_NODES);
    const worldNodeY = new Float32Array(MAX_SLIDER_NODES);
    const worldNodeZ = new Float32Array(MAX_SLIDER_NODES);
    const worldNodeR = new Float32Array(MAX_SLIDER_NODES);
    const worldNodeG = new Float32Array(MAX_SLIDER_NODES);
    const worldNodeB = new Float32Array(MAX_SLIDER_NODES);
    const worldNodeSize = new Float32Array(MAX_SLIDER_NODES);
    const worldNodeActivated = new Uint8Array(MAX_SLIDER_NODES);
    const worldNodeGroup = new Int16Array(MAX_SLIDER_NODES);

    // =========================================================================
    // POINTER INTERACTION (Sumi-e Circular Vortex & Plexus Orb Dragging)
    // =========================================================================
    let draggedOrb: SliderPlexusOrb | null = null;
    let hasActivelyDraggedOrb = false;
    const dragOffset = new THREE.Vector2();
    const unprojectVec = new THREE.Vector3();
    const rayDirVec = new THREE.Vector3();

    const screenToPlexusWorld = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const nx = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      const ny = -((clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
      unprojectVec.set(nx, ny, 0.5).unproject(plexusCamera);
      rayDirVec.copy(unprojectVec).sub(plexusCamera.position).normalize();
      const dist = -plexusCamera.position.z / rayDirVec.z;
      return plexusCamera.position.clone().add(rayDirVec.multiplyScalar(dist));
    };

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const splitPx = width * splitRatioRef.current;

      if (localX > splitPx) {
        const worldPos = screenToPlexusWorld(e.clientX, e.clientY);
        let closest: SliderPlexusOrb | null = null;
        let minDist = 68.0;

        for (const orb of plexusOrbs) {
          const d = Math.hypot(worldPos.x - orb.x, worldPos.y - orb.y);
          if (d < minDist) {
            minDist = d;
            closest = orb;
          }
        }

        if (closest) {
          draggedOrb = closest;
          hasActivelyDraggedOrb = false;
          dragOffset.set(closest.x - worldPos.x, closest.y - worldPos.y);
          closest.triggerHoverWobble();
          setCursorStyle('grabbing');
          canvas.setPointerCapture?.(e.pointerId);
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const splitPx = width * splitRatioRef.current;
      const now = performance.now();

      if (draggedOrb) {
        const worldPos = screenToPlexusWorld(e.clientX, e.clientY);
        const splitWorld = screenToPlexusWorld(rect.left + splitPx + 28, e.clientY);
        const rightEdgeWorld = screenToPlexusWorld(rect.right - 28, e.clientY);
        const topEdgeWorld = screenToPlexusWorld(e.clientX, rect.top + 28);
        const bottomEdgeWorld = screenToPlexusWorld(e.clientX, rect.bottom - 28);

        const nextX = Math.max(
          splitWorld.x,
          Math.min(rightEdgeWorld.x, worldPos.x + dragOffset.x)
        );
        const nextY = Math.max(
          bottomEdgeWorld.y,
          Math.min(topEdgeWorld.y, worldPos.y + dragOffset.y)
        );

        if (Math.hypot(nextX - draggedOrb.x, nextY - draggedOrb.y) > 0.5) {
          hasActivelyDraggedOrb = true;
        }

        draggedOrb.x = nextX;
        draggedOrb.y = nextY;
        draggedOrb.vx = 0;
        draggedOrb.vy = 0;
        draggedOrb.homeX = draggedOrb.x;
        draggedOrb.homeY = draggedOrb.y;

        for (const other of plexusOrbs) {
          if (other !== draggedOrb) {
            if (Math.hypot(other.x - draggedOrb.x, other.y - draggedOrb.y) < 110) {
              other.triggerHoverWobble();
            }
          }
        }
        return;
      }

      // Left side (Sumi-e): Strict circular mouse gesture detection -> 3s Vortex!
      if (localX < splitPx - 8) {
        setCursorStyle('default');
        mouseTrailHistory.push({ x: localX, y: localY, t: now });
        while (mouseTrailHistory.length > 0 && now - mouseTrailHistory[0].t > 1100) {
          mouseTrailHistory.shift();
        }

        if (mouseTrailHistory.length >= 12 && vortexRemaining <= 0.1) {
          const filtered: { x: number; y: number }[] = [mouseTrailHistory[0]];
          for (let i = 1; i < mouseTrailHistory.length; i++) {
            const prev = filtered[filtered.length - 1];
            const cur = mouseTrailHistory[i];
            if (Math.hypot(cur.x - prev.x, cur.y - prev.y) >= 10) {
              filtered.push({ x: cur.x, y: cur.y });
            }
          }

          if (filtered.length >= 10) {
            const n = filtered.length;
            let cx = 0;
            let cy = 0;
            for (let i = 0; i < n; i++) {
              cx += filtered[i].x;
              cy += filtered[i].y;
            }
            cx /= n;
            cy /= n;

            // 1. 2D PCA Covariance Check: reject flat/diagonal lines & back-and-forth strokes
            let sxx = 0;
            let syy = 0;
            let sxy = 0;
            let avgRadius = 0;
            const radii = new Float32Array(n);
            for (let i = 0; i < n; i++) {
              const dx = filtered[i].x - cx;
              const dy = filtered[i].y - cy;
              sxx += dx * dx;
              syy += dy * dy;
              sxy += dx * dy;
              const r = Math.hypot(dx, dy);
              radii[i] = r;
              avgRadius += r;
            }
            sxx /= n;
            syy /= n;
            sxy /= n;
            avgRadius /= n;

            const trace = sxx + syy;
            const det = sxx * syy - sxy * sxy;
            const disc = Math.sqrt(Math.max(0, trace * trace * 0.25 - det));
            const lambda1 = trace * 0.5 + disc; // Major axis variance
            const lambda2 = Math.max(0, trace * 0.5 - disc); // Minor axis variance
            const axisRatio = Math.sqrt(lambda2 / Math.max(1e-5, lambda1));

            // Require true 2D circular/oval spread (lines have axisRatio near 0)
            if (avgRadius >= 22 && Math.sqrt(lambda2) >= 14 && axisRatio >= 0.36) {
              // 2. Centroid Angular Sweep & Directional Consistency Check
              let netAngle = 0;
              let posSteps = 0;
              let negSteps = 0;
              let cutsThroughCenter = false;

              for (let i = 0; i < n; i++) {
                if (radii[i] < avgRadius * 0.35) {
                  cutsThroughCenter = true;
                  break;
                }
                if (i > 0) {
                  const a1 = Math.atan2(filtered[i - 1].y - cy, filtered[i - 1].x - cx);
                  const a2 = Math.atan2(filtered[i].y - cy, filtered[i].x - cx);
                  let da = a2 - a1;
                  while (da > Math.PI) da -= Math.PI * 2;
                  while (da < -Math.PI) da += Math.PI * 2;

                  // Single step cannot jump more than 110 deg in a smooth circle
                  if (Math.abs(da) > Math.PI * 0.62) {
                    cutsThroughCenter = true;
                    break;
                  }

                  netAngle += da;
                  if (da > 0.02) posSteps++;
                  else if (da < -0.02) negSteps++;
                }
              }

              const activeSteps = posSteps + negSteps;
              const directionalConsistency =
                activeSteps > 0 ? Math.max(posSteps, negSteps) / activeSteps : 0;

              // Require ~300 deg (1.65 * PI) continuous rotation around centroid in one direction
              if (
                !cutsThroughCenter &&
                Math.abs(netAngle) >= Math.PI * 1.65 &&
                directionalConsistency >= 0.78
              ) {
                vortexRemaining = 3.0; // 3 seconds Vortex!
                setIsVortexUI(true);
                mouseTrailHistory.length = 0;
              }
            }
          }
        }
      } else {
        // Right side (Plexus): Hover check on the 4 Orbs
        const worldPos = screenToPlexusWorld(e.clientX, e.clientY);
        let hovering = false;
        for (const orb of plexusOrbs) {
          if (Math.hypot(worldPos.x - orb.x, worldPos.y - orb.y) < 58) {
            hovering = true;
            orb.triggerHoverWobble();
            break;
          }
        }
        setCursorStyle(hovering ? 'grab' : 'default');
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (draggedOrb) {
        try {
          canvas.releasePointerCapture?.(e.pointerId);
        } catch {}
        draggedOrb = null;
        hasActivelyDraggedOrb = false;
        setCursorStyle('default');
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    const handleResize = () => {
      if (!container) return;
      width = Math.max(320, container.clientWidth);
      height = Math.max(240, container.clientHeight);
      renderer.setSize(width, height);
      bgUniforms.iResolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height,
        1
      );
      updateCameras(width, height);
      plexusCamera.aspect = width / height;
      plexusCamera.updateProjectionMatrix();
    };
    updateCameras(width, height);
    window.addEventListener('resize', handleResize);

    // =========================================================================
    // ANIMATION LOOP (Scissor Split Render: Left = Sumi-e, Right = Plexus)
    // =========================================================================
    let animId = 0;
    const clock = new THREE.Clock();
    let totalTime = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      totalTime += delta;

      bgUniforms.iTime.value = totalTime;

      // -----------------------------------------------------------------------
      // UPDATE 1: SUMI-E STROKES & INSTANCED PETALS (Diagonal vs. 3s Vortex)
      // -----------------------------------------------------------------------
      for (let i = 0; i < allSumieStrokes.length; i++) {
        allSumieStrokes[i].setTime(totalTime);
      }

      if (vortexRemaining > 0) {
        vortexRemaining = Math.max(0, vortexRemaining - delta);
        vortexBlend = Math.min(1, vortexBlend + delta * 3.8);
        if (vortexRemaining <= 0) {
          setIsVortexUI(false);
        }
      } else {
        vortexBlend = Math.max(0, vortexBlend - delta * 2.2);
      }

      const smoothPower = vortexBlend * vortexBlend * (3.0 - 2.0 * vortexBlend);
      const vortexCenterX = -5.2;
      const vortexCenterY = -0.2;
      const vortexCenterZ = -2.8;
      const sideTilt = 0.15;

      for (let i = 0; i < SLIDER_PETALS; i++) {
        petalAge[i] += delta * 0.85;
        petalPosX[i] += petalSpeedX[i] * delta;
        petalPosY[i] += petalSpeedY[i] * delta;

        if (petalPosX[i] > 2.5) petalPosX[i] = -13.5;
        if (petalPosX[i] < -14.0) petalPosX[i] = 2.0;
        if (petalPosY[i] < -6.5) petalPosY[i] = 6.5;
        if (petalPosY[i] > 6.8) petalPosY[i] = -6.2;

        const normalX =
          petalPosX[i] +
          Math.sin(petalAge[i] * petalFreqX[i] + petalPhaseX[i]) * petalAmpX[i];
        const normalY =
          petalPosY[i] +
          Math.cos(petalAge[i] * petalFreqY[i] + petalPhaseY[i]) * petalAmpY[i];
        const normalZ =
          petalPosZ[i] +
          Math.sin(petalAge[i] * petalFreqZ[i] + petalPhaseZ[i]) * petalAmpZ[i];

        let finalX = normalX;
        let finalY = normalY;
        let finalZ = normalZ;

        if (smoothPower > 0.001) {
          // 1:1 3D Tornado/Vortex math from SakuraCanvas.tsx (70% slower angular speed via petalSpeed)
          petalAngle[i] += petalSpeed[i] * delta * (1.2 + smoothPower * 1.6);
          const a = petalAngle[i];
          const normH = i / SLIDER_PETALS;
          const baseTubeRadius = 3.2 + (petalRadiusX[i] % 2.2);
          const radialWobble =
            Math.sin(a * 2.8 + petalPhaseZ[i] * 2.0 + totalTime * 0.6) * 0.55;
          const currentRadius = Math.max(1.2, baseTubeRadius + radialWobble);
          const rawY = (normH - 0.5) * 8.2 + Math.sin(a * 2.2 + totalTime * 0.5) * 0.6;
          const rawX = Math.cos(a) * (currentRadius * 1.25);
          const rawZ = Math.sin(a) * currentRadius * 0.5;

          const tornadoX = rawX + vortexCenterX;
          const tornadoY =
            vortexCenterY + rawY * Math.cos(sideTilt) - rawZ * Math.sin(sideTilt);
          const tornadoZ =
            vortexCenterZ + (rawY * Math.sin(sideTilt) + rawZ * Math.cos(sideTilt));

          finalX = THREE.MathUtils.lerp(normalX, tornadoX, smoothPower);
          finalY = THREE.MathUtils.lerp(normalY, tornadoY, smoothPower);
          finalZ = THREE.MathUtils.lerp(normalZ, tornadoZ, smoothPower);
        }

        dummy.position.set(finalX, finalY, finalZ);
        dummy.rotation.set(
          Math.sin(petalAge[i] * 0.55 + petalSeed[i]) * 0.25,
          Math.cos(petalAge[i] * 0.5 + petalSeed[i]) * 0.25,
          petalAge[i] * 0.65 +
            petalSeed[i] +
            (smoothPower > 0.01 ? petalAngle[i] : 0)
        );
        const zScale = Math.max(
          0.35,
          Math.min(0.85, (0.58 + (finalZ + 3.0) * 0.14) * 0.78)
        );
        dummy.scale.setScalar(petalScales[i] * zScale);
        dummy.updateMatrix();
        instancedPetalMesh.setMatrixAt(i, dummy.matrix);
      }
      instancedPetalMesh.instanceMatrix.needsUpdate = true;

      // -----------------------------------------------------------------------
      // UPDATE 2: PLEXUS ORBS, ATTACHED NODES & 3-SECOND DUAL-COLOR IMPULSES
      // -----------------------------------------------------------------------
      for (const [k, cd] of Array.from(pairCooldowns.entries())) {
        if (cd - delta <= 0) pairCooldowns.delete(k);
        else pairCooldowns.set(k, cd - delta);
      }

      for (const orb of plexusOrbs) {
        const activeImp = activeImpulses.find(
          (imp) => imp.orbA === orb || imp.orbB === orb
        );

        if (orb !== draggedOrb) {
          if (activeImp) {
            const isA = activeImp.orbA === orb;
            const pairAngle = totalTime * 2.4 + (isA ? 0 : Math.PI);
            const targetX = activeImp.midX + Math.cos(pairAngle) * 44.0;
            const targetY = activeImp.midY + Math.sin(pairAngle) * 34.0;
            orb.x = THREE.MathUtils.lerp(orb.x, targetX, 0.1);
            orb.y = THREE.MathUtils.lerp(orb.y, targetY, 0.1);
          } else {
            const targetX =
              orb.homeX +
              Math.cos(totalTime * orb.orbitSpeed + orb.orbitPhase) * orb.orbitRx;
            const targetY =
              orb.homeY +
              Math.sin(totalTime * orb.orbitSpeed * 1.15 + orb.orbitPhase) *
                orb.orbitRy;

            orb.x += orb.vx * delta + (targetX - orb.x) * 0.04;
            orb.y += orb.vy * delta + (targetY - orb.y) * 0.04;
            orb.vx *= 0.93;
            orb.vy *= 0.93;
          }
        }

        orb.update(delta, plexusCamera);
      }

      // Trigger 3-second Dual-Color Network Impulse ONLY when an Orb is actively pushed onto another Orb!
      if (draggedOrb && hasActivelyDraggedOrb) {
        for (let i = 0; i < plexusOrbs.length; i++) {
          const other = plexusOrbs[i];
          if (other === draggedOrb) continue;

          const a = draggedOrb;
          const b = other;
          const key = getPairKey(a, b);
          const alreadyActive = activeImpulses.some(
            (imp) =>
              (imp.orbA === a && imp.orbB === b) ||
              (imp.orbA === b && imp.orbB === a)
          );
          if (alreadyActive || pairCooldowns.has(key)) continue;

          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 78.0) {
            draggedOrb = null;
            hasActivelyDraggedOrb = false;
            setCursorStyle('default');

            a.triggerDockWobble();
            b.triggerDockWobble();

            const midX = (a.x + b.x) * 0.5;
            const midY = (a.y + b.y) * 0.5;

            // Spawn 72 dual-color network impulse nodes streaming between the two orbs (SakuraCanvas Finale behavior)
            const palA = SATURATED_PLEXUS_PALETTES[a.id];
            const palB = SATURATED_PLEXUS_PALETTES[b.id];
            const particles: ImpulseNetworkParticle[] = [];
            for (let p = 0; p < 72; p++) {
              const useA = p % 2 === 0;
              const pal = useA ? palA : palB;
              const col = pal[p % pal.length];
              const ang = (p / 72) * Math.PI * 2 + Math.random() * 0.4;
              const rSpread = 25 + Math.random() * 115;
              particles.push({
                x: midX + Math.cos(ang) * rSpread * 0.48,
                y: midY + Math.sin(ang) * rSpread * 0.48,
                z: (Math.random() - 0.5) * 52,
                vx: Math.cos(ang) * (28 + Math.random() * 48),
                vy: Math.sin(ang) * (28 + Math.random() * 48),
                vz: (Math.random() - 0.5) * 24,
                r: col.r,
                g: col.g,
                b: col.b,
                size: 18.0 + Math.random() * 9.0,
              });
            }

            activeImpulses.push({
              orbA: a,
              orbB: b,
              remaining: 3.0,
              duration: 3.0,
              midX,
              midY,
              particles,
            });
            setIsImpulseUI(true);
            break;
          }
        }
      }

      // Collect all 3D Plexus Nodes
      let worldNodeCount = 0;
      const linePosAttr = plexusLinesMesh.geometry.attributes.position;
      const lineColAttr = plexusLinesMesh.geometry.attributes.color;
      const lineAlphaAttr = plexusLinesMesh.geometry.attributes.alpha;
      const linePositions = linePosAttr.array as Float32Array;
      const lineColors = lineColAttr.array as Float32Array;
      const lineAlphas = lineAlphaAttr.array as Float32Array;

      const nodePosAttr = plexusPointsMesh.geometry.attributes.position;
      const nodeColAttr = plexusPointsMesh.geometry.attributes.color;
      const nodeSizeAttr = plexusPointsMesh.geometry.attributes.size;
      const nodePositions = nodePosAttr.array as Float32Array;
      const nodeColors = nodeColAttr.array as Float32Array;
      const nodeSizes = nodeSizeAttr.array as Float32Array;

      // 1. Attached Plexus Nodes around each of the 4 Orbs
      // Outside impulse: 1:1 non-finale Local Orb Shell from SakuraCanvas.tsx (lines 4357-4384)
      // During 3s impulse: Finale unfolding + Orb hub nodes (lines 4105-4144)
      for (let o = 0; o < plexusOrbs.length; o++) {
        const orb = plexusOrbs[o];
        const isOrbInImpulse = activeImpulses.some(
          (imp) => imp.orbA === orb || imp.orbB === orb
        );

        if (isOrbInImpulse && worldNodeCount < MAX_SLIDER_NODES) {
          const hubIdx = worldNodeCount++;
          const hubCol = SATURATED_PLEXUS_PALETTES[orb.id][0];
          worldNodeX[hubIdx] = orb.x;
          worldNodeY[hubIdx] = orb.y;
          worldNodeZ[hubIdx] = orb.z;
          worldNodeR[hubIdx] = hubCol.r;
          worldNodeG[hubIdx] = hubCol.g;
          worldNodeB[hubIdx] = hubCol.b;
          worldNodeSize[hubIdx] = 28.0;
          worldNodeActivated[hubIdx] = 1;
          worldNodeGroup[hubIdx] = -1;
        }

        const attNodes = orb.attachedNodes;
        for (let n = 0; n < attNodes.length; n++) {
          if (worldNodeCount >= MAX_SLIDER_NODES) break;
          const node = attNodes[n];
          node.angle += node.orbitSpeed * delta;
          node.rot += delta * node.rotSpeed;

          let localX: number;
          let localY: number;
          let localZ: number;
          let pointSize = node.size;

          if (isOrbInImpulse) {
            const waveOffX =
              Math.sin(totalTime * node.waveFreq + node.wavePhase) * node.waveAmp;
            const waveOffY =
              Math.cos(totalTime * (node.waveFreq * 0.85) + node.wavePhase * 1.3) *
              (node.waveAmp * 0.85);
            const waveOffZ =
              Math.sin(totalTime * (node.waveFreq * 1.15) + node.wavePhase * 2.1) *
              (node.waveAmp * 0.6);

            const expandedRadius = node.radius * 1.35;
            localX =
              orb.x +
              Math.cos(node.angle) * Math.cos(node.elevation) * expandedRadius +
              waveOffX;
            localY =
              orb.y +
              Math.sin(node.angle) * Math.cos(node.elevation) * expandedRadius * 0.85 +
              waveOffY;
            localZ =
              orb.z + Math.sin(node.elevation) * expandedRadius + waveOffZ;
            pointSize = node.size + Math.sin(totalTime * 3.2 + n) * 3.0;
          } else {
            // Exact non-finale Local Orb Shell from SakuraCanvas.tsx (lines 4369-4373)
            const localRadius = node.radius;
            localX =
              orb.x + Math.cos(node.angle) * Math.cos(node.elevation) * localRadius;
            localY =
              orb.y +
              Math.sin(node.angle) * Math.cos(node.elevation) * localRadius * 0.85;
            localZ = orb.z + Math.sin(node.elevation) * localRadius;
          }

          const idx = worldNodeCount++;
          worldNodeX[idx] = localX;
          worldNodeY[idx] = localY;
          worldNodeZ[idx] = localZ;
          worldNodeR[idx] = node.r;
          worldNodeG[idx] = node.g;
          worldNodeB[idx] = node.b;
          worldNodeSize[idx] = pointSize;
          worldNodeActivated[idx] = isOrbInImpulse ? 1 : 0;
          worldNodeGroup[idx] = isOrbInImpulse ? -1 : o;
        }
      }

      // 2. Active 3-Second Dual-Color Impulse Particles (Freestanding Finale Nodes) & Separation after 3.0s
      for (let idx = activeImpulses.length - 1; idx >= 0; idx--) {
        const imp = activeImpulses[idx];
        imp.remaining -= delta;
        imp.midX = (imp.orbA.x + imp.orbB.x) * 0.5;
        imp.midY = (imp.orbA.y + imp.orbB.y) * 0.5;

        const progress = 1.0 - Math.max(0, imp.remaining) / imp.duration;
        const env = Math.sin(Math.min(1.0, progress) * Math.PI);

        for (let p = 0; p < imp.particles.length; p++) {
          if (worldNodeCount >= MAX_SLIDER_NODES) break;
          const pt = imp.particles[p];
          pt.x += pt.vx * delta * 0.65;
          pt.y += pt.vy * delta * 0.65;
          pt.z += pt.vz * delta * 0.65;

          // Gentle orbital curl around midpoint
          const dx = pt.x - imp.midX;
          const dy = pt.y - imp.midY;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist > 145) {
            pt.vx -= (dx / dist) * 65 * delta;
            pt.vy -= (dy / dist) * 65 * delta;
          }

          const nIdx = worldNodeCount++;
          worldNodeX[nIdx] = pt.x;
          worldNodeY[nIdx] = pt.y;
          worldNodeZ[nIdx] = pt.z;
          worldNodeR[nIdx] = pt.r;
          worldNodeG[nIdx] = pt.g;
          worldNodeB[nIdx] = pt.b;
          worldNodeSize[nIdx] = pt.size * (0.48 + 0.62 * env);
          worldNodeActivated[nIdx] = 1;
          worldNodeGroup[nIdx] = -1;
        }

        // After 3 seconds: gently separate the two orbs so they drift apart into their own orbits!
        if (imp.remaining <= 0) {
          const dx = imp.orbB.x - imp.orbA.x;
          const dy = imp.orbB.y - imp.orbA.y;
          const d = Math.hypot(dx, dy) || 1;
          const nx = dx / d;
          const ny = dy / d;

          const sepImpulse = 165.0;
          imp.orbA.vx = -nx * sepImpulse;
          imp.orbA.vy = -ny * sepImpulse;
          imp.orbB.vx = nx * sepImpulse;
          imp.orbB.vy = ny * sepImpulse;

          // Nudge home centers slightly apart if user dragged them onto the exact same spot
          if (Math.hypot(imp.orbA.homeX - imp.orbB.homeX, imp.orbA.homeY - imp.orbB.homeY) < 95) {
            imp.orbA.homeX -= nx * 55;
            imp.orbA.homeY -= ny * 45;
            imp.orbB.homeX += nx * 55;
            imp.orbB.homeY += ny * 45;
          }

          pairCooldowns.set(getPairKey(imp.orbA, imp.orbB), 2.4);
          activeImpulses.splice(idx, 1);
          if (activeImpulses.length === 0) {
            setIsImpulseUI(false);
          }
        }
      }

      // Populate GPU Node Buffers (Pure saturated colors without white washout)
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

      // Populate GPU Line Buffers:
      // - Normal Orbs: 1:1 non-finale SakuraCanvas.tsx lines (steady, single line, maxDistCutoff = 85.0, zero white)
      // - Pushed-together Orbs (3s impulse): Finale flickering lines + 3-filament thickness + linkRadius = 112.0
      let lineVertexIdx = 0;
      let lineColorIdx = 0;
      let lineAlphaIdx = 0;
      const maxLineVertices = linePositions.length - 18;
      const nodeLinkCounts = new Uint8Array(worldNodeCount);

      for (let i = 0; i < worldNodeCount; i++) {
        const actA = worldNodeActivated[i];
        const maxLinksForA = actA === 1 ? 5 : 8;
        if (nodeLinkCounts[i] >= maxLinksForA) continue;

        const x1 = worldNodeX[i];
        const y1 = worldNodeY[i];
        const z1 = worldNodeZ[i];
        const ar = worldNodeR[i];
        const ag = worldNodeG[i];
        const ab = worldNodeB[i];
        const grpA = worldNodeGroup[i];

        for (let j = i + 1; j < worldNodeCount; j++) {
          if (lineVertexIdx >= maxLineVertices) break;
          if (nodeLinkCounts[i] >= maxLinksForA) break;
          if (worldNodeGroup[j] !== grpA) continue;

          const isActivatedLine = actA === 1 && worldNodeActivated[j] === 1;
          const maxLinksForB = isActivatedLine ? 5 : 8;
          if (nodeLinkCounts[j] >= maxLinksForB) continue;

          const cutoff = isActivatedLine ? 112.0 : 85.0;
          const cutoffSq = cutoff * cutoff;

          const x2 = worldNodeX[j];
          const y2 = worldNodeY[j];
          const z2 = worldNodeZ[j];

          const dx = x2 - x1;
          if (dx > cutoff || dx < -cutoff) continue;
          const dy = y2 - y1;
          if (dy > cutoff || dy < -cutoff) continue;
          const dz = z2 - z1;
          if (dz > cutoff || dz < -cutoff) continue;

          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq >= cutoffSq) continue;

          const distance = Math.sqrt(distSq);
          const opacity = 1.0 - distance / cutoff;
          if (opacity <= 0.01) continue;

          const r2 = worldNodeR[j];
          const g2 = worldNodeG[j];
          const b2 = worldNodeB[j];

          if (isActivatedLine) {
            // Finale flickering ONLY when Orbs are pushed together (SakuraCanvas.tsx lines 4189-4201)
            const lineSeed = (i * 137.5 + j * 269.3) % 1000.0;
            const flickerA = Math.sin(totalTime * 14.0 + lineSeed);
            const flickerB = Math.cos(totalTime * 25.0 + lineSeed * 1.7);
            const flickerNoise = flickerA * 0.6 + flickerB * 0.4;

            let flickerMul = 1.0;
            if (flickerNoise < -0.32) {
              flickerMul = (flickerNoise + 0.32) * -3.0 > 0.4 ? 0.0 : 0.35;
            } else if (flickerNoise > 0.68) {
              flickerMul = 1.65;
            }
            if (flickerMul <= 0.02) continue;

            nodeLinkCounts[i]++;
            nodeLinkCounts[j]++;

            const lineAlpha = Math.min(0.96, Math.pow(opacity, 0.55) * 1.15 * flickerMul);

            const pLen = Math.sqrt(dx * dx + dy * dy) || 1.0;
            const perpX = (-dy / pLen) * 0.85;
            const perpY = (dx / pLen) * 0.85;

            // 1. Center Line (zero white added)
            linePositions[lineVertexIdx++] = x1;
            linePositions[lineVertexIdx++] = y1;
            linePositions[lineVertexIdx++] = z1;
            linePositions[lineVertexIdx++] = x2;
            linePositions[lineVertexIdx++] = y2;
            linePositions[lineVertexIdx++] = z2;

            lineColors[lineColorIdx++] = ar;
            lineColors[lineColorIdx++] = ag;
            lineColors[lineColorIdx++] = ab;
            lineColors[lineColorIdx++] = r2;
            lineColors[lineColorIdx++] = g2;
            lineColors[lineColorIdx++] = b2;

            lineAlphas[lineAlphaIdx++] = lineAlpha;
            lineAlphas[lineAlphaIdx++] = lineAlpha;

            // 2. Positive Perpendicular Filament
            if (lineVertexIdx < maxLineVertices) {
              linePositions[lineVertexIdx++] = x1 + perpX;
              linePositions[lineVertexIdx++] = y1 + perpY;
              linePositions[lineVertexIdx++] = z1;
              linePositions[lineVertexIdx++] = x2 + perpX;
              linePositions[lineVertexIdx++] = y2 + perpY;
              linePositions[lineVertexIdx++] = z2;

              lineColors[lineColorIdx++] = ar;
              lineColors[lineColorIdx++] = ag;
              lineColors[lineColorIdx++] = ab;
              lineColors[lineColorIdx++] = r2;
              lineColors[lineColorIdx++] = g2;
              lineColors[lineColorIdx++] = b2;

              lineAlphas[lineAlphaIdx++] = lineAlpha * 0.78;
              lineAlphas[lineAlphaIdx++] = lineAlpha * 0.78;
            }

            // 3. Negative Perpendicular Filament
            if (lineVertexIdx < maxLineVertices) {
              linePositions[lineVertexIdx++] = x1 - perpX;
              linePositions[lineVertexIdx++] = y1 - perpY;
              linePositions[lineVertexIdx++] = z1;
              linePositions[lineVertexIdx++] = x2 - perpX;
              linePositions[lineVertexIdx++] = y2 - perpY;
              linePositions[lineVertexIdx++] = z2;

              lineColors[lineColorIdx++] = ar;
              lineColors[lineColorIdx++] = ag;
              lineColors[lineColorIdx++] = ab;
              lineColors[lineColorIdx++] = r2;
              lineColors[lineColorIdx++] = g2;
              lineColors[lineColorIdx++] = b2;

              lineAlphas[lineAlphaIdx++] = lineAlpha * 0.78;
              lineAlphas[lineAlphaIdx++] = lineAlpha * 0.78;
            }
          } else {
            // Outside Finale Animation (SakuraCanvas.tsx lines 4432-4454): steady single line, zero white
            nodeLinkCounts[i]++;
            nodeLinkCounts[j]++;

            const effAlpha = Math.min(0.92, Math.pow(opacity * 0.92, 0.72) * 1.15);

            linePositions[lineVertexIdx++] = x1;
            linePositions[lineVertexIdx++] = y1;
            linePositions[lineVertexIdx++] = z1;
            linePositions[lineVertexIdx++] = x2;
            linePositions[lineVertexIdx++] = y2;
            linePositions[lineVertexIdx++] = z2;

            lineColors[lineColorIdx++] = ar;
            lineColors[lineColorIdx++] = ag;
            lineColors[lineColorIdx++] = ab;
            lineColors[lineColorIdx++] = r2;
            lineColors[lineColorIdx++] = g2;
            lineColors[lineColorIdx++] = b2;

            lineAlphas[lineAlphaIdx++] = effAlpha;
            lineAlphas[lineAlphaIdx++] = effAlpha;
          }
        }
      }

      lineGeo.setDrawRange(0, lineVertexIdx / 3);
      nodeGeo.setDrawRange(0, worldNodeCount);
      linePosAttr.needsUpdate = true;
      lineColAttr.needsUpdate = true;
      lineAlphaAttr.needsUpdate = true;
      nodePosAttr.needsUpdate = true;
      nodeColAttr.needsUpdate = true;
      nodeSizeAttr.needsUpdate = true;

      // -----------------------------------------------------------------------
      // DUAL SCISSOR RENDER PASS
      // -----------------------------------------------------------------------
      const splitX = Math.round(width * splitRatioRef.current);

      renderer.setViewport(0, 0, width, height);
      renderer.setScissorTest(true);

      // 1. LEFT SCISSOR: Sumi-e (Background Shader + 3D Sumi-e Scene)
      if (splitX > 0) {
        renderer.setScissor(0, 0, splitX, height);
        renderer.clear();
        renderer.render(bgScene, bgCamera);
        renderer.render(blutenScene, blutenCamera);
      }

      // 2. RIGHT SCISSOR: Plexus (Background Shader + 3D Plexus Scene)
      if ( width - splitX > 0) {
        renderer.setScissor(splitX, 0, width - splitX, height);
        renderer.clear();
        renderer.render(bgScene, bgCamera);
        renderer.render(plexusScene, plexusCamera);
      }

      renderer.setScissorTest(false);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="mb-10 sm:mb-12">
      <div
        ref={containerRef}
        className="relative h-72 sm:h-96 w-full rounded-[28px] sm:rounded-[34px] overflow-hidden border border-pink-500/40 bg-[#0d0006] shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_45px_rgba(255,42,157,0.22)] select-none"
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
        <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 flex flex-col gap-1.5 pointer-events-none z-10">
          <div className="px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-pink-400/40 text-pink-200 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-lg">
            <span>{t.sliderSumieBadge}</span>
          </div>
          {isVortexUI && (
            <div className="px-3 py-1 rounded-full bg-pink-500/85 backdrop-blur-md text-white text-xs font-bold tracking-wide animate-pulse shadow-[0_0_15px_#ff2a9d]">
              {t.sliderVortexActive}
            </div>
          )}
        </div>

        {/* Top-Right Badge: Plexus */}
        <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 flex flex-col items-end gap-1.5 pointer-events-none z-10">
          <div className="px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-cyan-400/40 text-cyan-200 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-lg">
            <span>{t.sliderPlexusBadge}</span>
          </div>
          {isImpulseUI && (
            <div className="px-3 py-1 rounded-full bg-cyan-500/85 backdrop-blur-md text-white text-xs font-bold tracking-wide animate-pulse shadow-[0_0_15px_#00c3ff]">
              {t.sliderPulseActive}
            </div>
          )}
        </div>

        {/* Bottom Interaction Hints */}
        <div className="absolute bottom-3 left-3.5 right-3.5 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
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
          className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-[#ff80df] via-white to-[#4ee2ec] shadow-[0_0_15px_#ffffff] pointer-events-none z-10"
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
