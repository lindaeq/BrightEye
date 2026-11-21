import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { playSound, toggleAudioMute, isAudioMuted } from '../utils/audio';
import type { MissionTrace, RunTelemetry } from '../utils/runTelemetry';

export type StepId = 
  | 'start' 
  | 'profile' 
  | 'warmup' 
  | 'howto' 
  | 'mission1' 
  | 'mission2' 
  | 'results' 
  | 'operator';

export const STEP_IDS: StepId[] = [
  'start',
  'profile',
  'warmup',
  'howto',
  'mission1',
  'mission2',
  'results',
  'operator',
];

export const STEP_NAMES = [
  'START',
  'PROFILE',
  'WARM-UP',
  'HOW TO PLAY',
  'TARGET LOCK',
  'COMET TUNNEL',
  'PILOT CARD',
  'OPERATOR',
];

export interface PlayerProfile {
  nickname: string;
  ageGroup: string;
  writingHand: 'Left' | 'Right';
  glasses: 'No' | 'Yes';
  consentAdult: boolean;
  consentPrivacy: boolean;
}

interface ArcadeContextType {
  currentStep: number; // 1-indexed (1 to 9)
  stepId: StepId;
  goToStep: (step: number | StepId) => void;
  nextStep: () => void;
  prevStep: () => void;
  playerProfile: PlayerProfile;
  setPlayerProfile: React.Dispatch<React.SetStateAction<PlayerProfile>>;
  
  // Audio
  soundMuted: boolean;
  toggleMute: () => void;

  // Warm-up calibration
  calibrationPoint: number;
  advanceCalibration: () => void;
  isCalibrated: boolean;
  resetCalibration: () => void;

  m1Score: number;
  m1Hits: number;
  starsCaught: number;
  recordM1Hit: (type: 'Round' | 'Square') => void;
  resetMission1: () => void;
  resetMission2: () => void;
  completeTarget: (trace: MissionTrace) => void;
  completeComet: (trace: MissionTrace, captures: number) => void;
  recentRuns: RunTelemetry[];
}

const ArcadeContext = createContext<ArcadeContextType | undefined>(undefined);

export const ArcadeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [soundMuted, setSoundMuted] = useState<boolean>(isAudioMuted());

  // Player Profile
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>({
    nickname: '',
    ageGroup: '',
    writingHand: 'Right',
    glasses: 'No',
    consentAdult: false,
    consentPrivacy: false,
  });

  // Warmup Calibration (1 to 5)
  const [calibrationPoint, setCalibrationPoint] = useState<number>(1);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  const [m1Score, setM1Score] = useState(0);
  const [m1Streak, setM1Streak] = useState(1);
  const [m1Hits, setM1Hits] = useState(0);
  const [starsCaught, setStarsCaught] = useState(0);
  const [recentRuns, setRecentRuns] = useState<RunTelemetry[]>([]);
  const targetTrace = useRef<MissionTrace | null>(null);
  const nextRunId = useRef(1);

  const completeTarget = useCallback((trace: MissionTrace) => {
    targetTrace.current = trace;
  }, []);

  const completeComet = useCallback((trace: MissionTrace, captures: number) => {
    setStarsCaught(captures);
    const target = targetTrace.current;
    if (!target) return;
    targetTrace.current = null;
    const run = {
      id: nextRunId.current++,
      endedAt: new Date().toISOString(),
      ageGroup: playerProfile.ageGroup,
      target,
      comet: trace,
    };
    setRecentRuns((previous) => [run, ...previous].slice(0, 12));
  }, [playerProfile.ageGroup]);

  const toggleMute = () => {
    const next = toggleAudioMute();
    setSoundMuted(next);
  };

  const stepId = STEP_IDS[currentStep - 1] || 'start';

  const goToStep = (step: number | StepId) => {
    let target = 1;
    if (typeof step === 'string') {
      const idx = STEP_IDS.indexOf(step);
      target = idx >= 0 ? idx + 1 : 1;
    } else {
      target = Math.max(1, Math.min(STEP_IDS.length, step));
    }
    setCurrentStep(target);
    playSound('step');
  };

  const nextStep = useCallback(() => {
    setCurrentStep(previous => Math.min(STEP_IDS.length, previous + 1));
    playSound('step');
  }, []);

  const prevStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  // Calibration helpers
  const advanceCalibration = () => {
    playSound('blip');
    if (calibrationPoint < 5) {
      setCalibrationPoint(prev => prev + 1);
    } else {
      setIsCalibrated(true);
      playSound('win');
    }
  };

  const resetCalibration = () => {
    setCalibrationPoint(1);
    setIsCalibrated(false);
  };

  const recordM1Hit = (type: 'Round' | 'Square') => {
    if (type === 'Round') {
      playSound('hit');
      setM1Hits(previous => previous + 1);
      setM1Score(previous => previous + 100 * m1Streak);
      setM1Streak(previous => Math.min(10, previous + 1));
    } else {
      playSound('error');
      setM1Score(previous => Math.max(0, previous - 50));
      setM1Streak(1);
    }
  };

  const resetMission1 = () => {
    targetTrace.current = null;
    setM1Score(0);
    setM1Hits(0);
    setM1Streak(1);
  };

  const resetMission2 = () => setStarsCaught(0);

  return (
    <ArcadeContext.Provider
      value={{
        currentStep,
        stepId,
        goToStep,
        nextStep,
        prevStep,
        playerProfile,
        setPlayerProfile,
        soundMuted,
        toggleMute,
        calibrationPoint,
        advanceCalibration,
        isCalibrated,
        resetCalibration,
        m1Score,
        m1Hits,
        starsCaught,
        recordM1Hit,
        resetMission1,
        resetMission2,
        completeTarget,
        completeComet,
        recentRuns,
      }}
    >
      {children}
    </ArcadeContext.Provider>
  );
};

export const useArcade = () => {
  const context = useContext(ArcadeContext);
  if (!context) {
    throw new Error('useArcade must be used within an ArcadeProvider');
  }
  return context;
};
