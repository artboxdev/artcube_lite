import type { MutableRefObject, ComponentType } from 'react';
import type { PeerMessage } from './types';

export interface ExperienceRendererAPI {
  start: (mode?: 'bluten' | 'plexus' | string, expMode?: 'test' | 'souvenir') => void;
  handlePeerMessage?: (msg: PeerMessage) => void;
}

export interface ExperienceComponentProps {
  isRunning: boolean;
  elapsed: number;
  elapsedRef: MutableRefObject<number>;
  intensity: number;
  bass: number;
  mid: number;
  treble: number;
  lastBeatTime: number;
  isMobile: boolean;
  isRecording: boolean;
  isHost: boolean;
  myName: string;
  sessionId?: string;
  sendInteraction: (kind: string, data: Record<string, unknown>) => void;
  onCanvasesReady: (flare: HTMLCanvasElement, star: HTMLCanvasElement) => void;
  onRendererReady: (api: ExperienceRendererAPI) => void;
  onExit?: () => void;
  initialMode?: 'bluten' | 'plexus' | string;
}

export interface ExperienceDefinition {
  id: string;
  title: string;
  description: string;
  duration: number;
  Component: ComponentType<ExperienceComponentProps>;
  getHUDText?: (elapsed: number) => string | null;
}
