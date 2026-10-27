'use client';

import { useState, useCallback, Suspense, useEffect, useRef } from 'react';
import { EXPERIENCES, DEFAULT_EXPERIENCE_ID } from './experiences';
import { OnepagerView } from './components/onepager/OnepagerView';
import type { ExperienceRendererAPI } from './lib/experience-types';

function ArtCubeApp() {
  const [selectedExperienceId, setSelectedExperienceId] = useState<string>(DEFAULT_EXPERIENCE_ID);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [myName, setMyName] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('session-' + Math.random().toString(36).substring(2, 8));
  const [isHost, setIsHost] = useState<boolean>(true);
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const elapsedRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState<number>(0);
  const rendererApiRef = useRef<ExperienceRendererAPI | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sid = params.get('sid') || params.get('room');
      if (sid) {
        setSessionId(sid);
        setIsHost(false);
      }
      const expParam = params.get('exp') || params.get('experience');
      if (expParam && EXPERIENCES.some((e) => e.id === expParam)) {
        setSelectedExperienceId(expParam);
      }

      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  const [activeArtworkMode, setActiveArtworkMode] = useState<'bluten' | 'plexus'>('bluten');

  const handleStart = useCallback((mode?: 'bluten' | 'plexus', expMode?: 'test' | 'souvenir') => {
    const targetMode = mode || 'bluten';
    setActiveArtworkMode(targetMode);
    setIsStarted(true);
    setElapsed(0);
    elapsedRef.current = 0;
    setTimeout(() => {
      rendererApiRef.current?.start?.(targetMode, expMode);
    }, 50);
  }, []);

  const handleExit = useCallback(() => {
    setIsStarted(false);
    setElapsed(0);
    elapsedRef.current = 0;
  }, []);

  const handleRendererReady = useCallback((api: ExperienceRendererAPI) => {
    rendererApiRef.current = api;
    if (isStarted) {
      api.start?.(activeArtworkMode);
    }
  }, [isStarted, activeArtworkMode]);

  const handleSendInteraction = useCallback(() => {}, []);
  const handleCanvasesReady = useCallback(() => {}, []);

  const selectedExperience = EXPERIENCES.find((e) => e.id === selectedExperienceId) || EXPERIENCES[0];
  const ExperienceComponent = selectedExperience.Component;

  return (
    <main className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#08000c]">
      {/* 1. EINGEBETTETES KUNSTWERK (Hintergrund-Shader & 3D-Szene laufen live hinter dem Onepager) */}
      <div className="absolute inset-0 w-full h-full z-0">
        <ExperienceComponent
          key={selectedExperienceId}
          isRunning={isStarted}
          initialMode={activeArtworkMode}
          elapsed={elapsed}
          elapsedRef={elapsedRef}
          intensity={0.5}
          bass={0.5}
          mid={0.5}
          treble={0.5}
          lastBeatTime={0}
          isMobile={isMobile}
          isRecording={false}
          isHost={isHost}
          myName={myName || (isHost ? 'Host' : 'Gast')}
          sessionId={sessionId}
          sendInteraction={handleSendInteraction}
          onCanvasesReady={handleCanvasesReady}
          onRendererReady={handleRendererReady}
          onExit={handleExit}
        />
      </div>

      {/* 2. ART.CUBE ONEPAGER (Transparente scrollbare Präsentations- und Erlebnisebene über dem flüssigen Shader) */}
      <OnepagerView
        isVisible={!isStarted}
        isHost={isHost}
        sessionId={sessionId}
        myName={myName}
        onNameChange={setMyName}
        onJoin={() => setIsJoined(true)}
        onStart={handleStart}
        isJoined={isJoined}
      />
    </main>
  );

}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-[#08000c] flex items-center justify-center text-white/60 font-mono text-sm tracking-widest">
          LADEN...
        </div>
      }
    >
      <ArtCubeApp />
    </Suspense>
  );
}
