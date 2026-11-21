import React, { createContext, useContext, useState, useEffect } from 'react';
import { playSound, toggleAudioMute, isAudioMuted } from '../utils/audio';

export type StepId = 
  | 'style' 
  | 'start' 
  | 'profile' 
  | 'warmup' 
  | 'howto' 
  | 'mission1' 
  | 'mission2' 
  | 'results' 
  | 'operator';

export const STEP_IDS: StepId[] = [
  'style',
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
  'STYLE',
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

export interface Mission1Log {
  id: number;
  label: string;
  type: 'Round' | 'Square';
  text: string;
  gapMs?: number;
  success: boolean;
}

export interface RecentRun {
  id: string;
  age: string;
  focusScore: number;
  gapMs: number;
  steadyPct: number;
  status: 'OK' | 'REVIEW';
  timestamp: string;
}

interface ArcadeContextType {
  themeId: number;
  setThemeId: (id: number) => void;
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

  // Mission 1 State
  m1Time: number;
  m1Score: number;
  m1Streak: number;
  m1GapMs: number;
  m1Logs: Mission1Log[];
  recordM1Hit: (type: 'Round' | 'Square', reactionMs: number) => void;
  resetMission1: () => void;

  // Mission 2 State
  m2Time: number;
  m2Steady: number;
  m2OnPath: number;
  m2EyesOnComet: number;
  m2TremorPoints: number[];
  m2CatchUpJumps: number;
  updateM2Tremor: (val: number, inPath: boolean, eyesLocked: boolean) => void;
  resetMission2: () => void;

  // Results & Operator Runs
  recentRuns: RecentRun[];
  exportRunsCSV: () => void;
  saveCurrentRun: () => void;
  savedToTigerData: boolean;
}

const INITIAL_RUNS: RecentRun[] = [
  { id: '#014', age: '8–10', focusScore: 92, gapMs: 235, steadyPct: 94, status: 'OK', timestamp: '2m ago' },
  { id: '#013', age: '5–7', focusScore: 71, gapMs: 318, steadyPct: 63, status: 'REVIEW', timestamp: '14m ago' },
  { id: '#012', age: '11–13', focusScore: 88, gapMs: 254, steadyPct: 90, status: 'OK', timestamp: '28m ago' },
  { id: '#011', age: '8–10', focusScore: 79, gapMs: 287, steadyPct: 81, status: 'OK', timestamp: '45m ago' },
];

const ArcadeContext = createContext<ArcadeContextType | undefined>(undefined);

export const ArcadeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<number>(1);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [soundMuted, setSoundMuted] = useState<boolean>(isAudioMuted());

  // Player Profile
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>({
    nickname: 'PILOT_042',
    ageGroup: '8–10',
    writingHand: 'Right',
    glasses: 'Yes',
    consentAdult: true,
    consentPrivacy: true,
  });

  // Warmup Calibration (1 to 5)
  const [calibrationPoint, setCalibrationPoint] = useState<number>(1);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  // Mission 1 State
  const [m1Time, setM1Time] = useState<number>(20);
  const [m1Score, setM1Score] = useState<number>(420);
  const [m1Streak, setM1Streak] = useState<number>(4);
  const [m1GapMs, setM1GapMs] = useState<number>(240);
  const [m1Logs, setM1Logs] = useState<Mission1Log[]>([
    { id: 7, label: '#7 Round', type: 'Round', text: '232 ms', gapMs: 232, success: true },
    { id: 6, label: '#6 Square', type: 'Square', text: 'Skipped', success: true },
    { id: 5, label: '#5 Round', type: 'Round', text: '251 ms', gapMs: 251, success: true },
    { id: 4, label: '#4 Square', type: 'Square', text: 'Pressed', success: false },
    { id: 3, label: '#3 Round', type: 'Round', text: '228 ms', gapMs: 228, success: true },
  ]);

  // Mission 2 State
  const [m2Time, setM2Time] = useState<number>(30);
  const [m2Steady, setM2Steady] = useState<number>(94);
  const [m2OnPath, setM2OnPath] = useState<number>(88);
  const [m2EyesOnComet, setM2EyesOnComet] = useState<number>(91);
  const [m2CatchUpJumps, setM2CatchUpJumps] = useState<number>(2);
  const [m2TremorPoints, setM2TremorPoints] = useState<number[]>([
    14, 10, 15, 9, 13, 8, 12, 16, 10, 13, 9, 14, 11, 15, 10, 12, 11
  ]);

  // Operator Runs & TigerData
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>(INITIAL_RUNS);
  const [savedToTigerData, setSavedToTigerData] = useState<boolean>(true);

  // Apply data-t attribute to document.body
  const setThemeId = (id: number) => {
    setThemeIdState(id);
    document.body.setAttribute('data-t', id.toString());
    playSound('step');
  };

  useEffect(() => {
    document.body.setAttribute('data-t', themeId.toString());
  }, [themeId]);

  const toggleMute = () => {
    const next = toggleAudioMute();
    setSoundMuted(next);
  };

  const stepId = STEP_IDS[currentStep - 1] || 'style';

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

  const nextStep = () => {
    if (currentStep < STEP_IDS.length) {
      goToStep(currentStep + 1);
    }
  };

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

  // Mission 1 helpers
  const recordM1Hit = (type: 'Round' | 'Square', reactionMs: number) => {
    if (type === 'Round') {
      playSound('hit');
      setM1Score(prev => prev + 100 * Math.max(1, m1Streak));
      setM1Streak(prev => Math.min(10, prev + 1));
      setM1GapMs(reactionMs);
      setM1Logs(prev => [
        {
          id: prev.length + 1,
          label: `#${prev.length + 1} Round`,
          type: 'Round',
          text: `${reactionMs} ms`,
          gapMs: reactionMs,
          success: true,
        },
        ...prev.slice(0, 7),
      ]);
    } else {
      // Trick square target hit (Impulse penalty)
      playSound('error');
      setM1Score(prev => Math.max(0, prev - 50));
      setM1Streak(1);
      setM1Logs(prev => [
        {
          id: prev.length + 1,
          label: `#${prev.length + 1} Square`,
          type: 'Square',
          text: 'Pressed',
          success: false,
        },
        ...prev.slice(0, 7),
      ]);
    }
  };

  const resetMission1 = () => {
    setM1Time(20);
    setM1Score(0);
    setM1Streak(1);
    setM1GapMs(240);
  };

  // Mission 2 helpers
  const updateM2Tremor = (jitterVal: number, inPath: boolean, eyesLocked: boolean) => {
    setM2TremorPoints(prev => [...prev.slice(1), Math.round(jitterVal)]);
    if (!inPath) {
      setM2OnPath(prev => Math.max(50, prev - 0.5));
      setM2Steady(prev => Math.max(60, prev - 0.3));
    }
    if (!eyesLocked) {
      setM2EyesOnComet(prev => Math.max(65, prev - 0.4));
      setM2CatchUpJumps(prev => prev + 1);
    }
  };

  const resetMission2 = () => {
    setM2Time(30);
    setM2Steady(94);
    setM2OnPath(88);
    setM2EyesOnComet(91);
    setM2CatchUpJumps(2);
  };

  // Operator CSV Export
  const exportRunsCSV = () => {
    playSound('coin');
    const headers = ['RunID', 'AgeGroup', 'WritingHand', 'Glasses', 'FocusScore', 'LatencyGapMs', 'MotorSteadinessPct', 'Status', 'Timestamp'];
    const rows = recentRuns.map(r => [
      r.id,
      r.age,
      playerProfile.writingHand,
      playerProfile.glasses,
      r.focusScore,
      r.gapMs,
      r.steadyPct,
      r.status,
      r.timestamp,
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AeroNeuro_Runs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveCurrentRun = () => {
    playSound('coin');
    setSavedToTigerData(true);
    const newRun: RecentRun = {
      id: `#0${recentRuns.length + 11}`,
      age: playerProfile.ageGroup,
      focusScore: Math.min(100, Math.round((m1Score / 600) * 100) || 92),
      gapMs: m1GapMs,
      steadyPct: Math.round(m2Steady),
      status: m2Steady >= 80 && m1GapMs < 290 ? 'OK' : 'REVIEW',
      timestamp: 'Just now',
    };
    setRecentRuns(prev => [newRun, ...prev]);
  };

  return (
    <ArcadeContext.Provider
      value={{
        themeId,
        setThemeId,
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
        m1Time,
        m1Score,
        m1Streak,
        m1GapMs,
        m1Logs,
        recordM1Hit,
        resetMission1,
        m2Time,
        m2Steady,
        m2OnPath,
        m2EyesOnComet,
        m2TremorPoints,
        m2CatchUpJumps,
        updateM2Tremor,
        resetMission2,
        recentRuns,
        exportRunsCSV,
        saveCurrentRun,
        savedToTigerData,
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
