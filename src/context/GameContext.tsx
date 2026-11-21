import React, { createContext, useContext, useState } from 'react';
import { 
  ScreenState, 
  HardwareConnectionState, 
  NeuroMetrics, 
  QNXGazePacket, 
  ArduinoControlPacket 
} from '../types/telemetry';

interface GameContextType {
  currentScreen: ScreenState;
  setScreen: (screen: ScreenState) => void;
  hardware: HardwareConnectionState;
  setHardware: React.Dispatch<React.SetStateAction<HardwareConnectionState>>;
  latestGaze: QNXGazePacket;
  latestControl: ArduinoControlPacket;
  metrics: NeuroMetrics;
  startKioskSession: () => void;
  completeStage1: () => void;
  completeStage2: () => void;
  resetToAttract: () => void;
}

const initialMetrics: NeuroMetrics = {
  stage1: {
    totalTargets: 8,
    hits: 7,
    decoyErrors: 1,
    avgReactionGapMs: 235,
    lastReactionGapMs: 240,
    rawGaps: [260, 245, 230, 240, 225, 250, 235],
  },
  stage2: {
    saccadicIntrusions: 2,
    tremorVariance: 0.06,
    corridorAccuracy: 94,
    smoothPursuitRatio: 0.88,
  },
  finalCard: {
    visualFocusScore: 92,
    eyeToHandLatencyMs: 235,
    motorSteadinessPct: 94,
    cadetRank: 'Sonic Interceptor Specialist',
    clinicalFlags: {
      impulseControl: 'Normal',
      motorTremor: 'Low Jitter',
      visualLatency: 'Sub-200ms Reflex',
    },
  },
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('ATTRACT');
  
  const [hardware, setHardware] = useState<HardwareConnectionState>({
    qnxConnected: true,
    qnxRtosLatencyMs: 0.42, // Sub-millisecond deterministic QNX clock
    arduinoConnected: true,
    baudRate: 115200,
    mockMode: true,
  });

  const [latestGaze] = useState<QNXGazePacket>({
    timestampMs: Date.now(),
    gazeX: 0.5,
    gazeY: 0.5,
    saccadeDetected: false,
    confidence: 0.98,
  });

  const [latestControl] = useState<ArduinoControlPacket>({
    timestampMs: Date.now(),
    joystickX: 0,
    joystickY: 0,
    buttonPressed: false,
    jitterMagnitude: 0.04,
  });

  const [metrics, setMetrics] = useState<NeuroMetrics>(initialMetrics);

  const startKioskSession = () => {
    setCurrentScreen('STAGE1_TARGET_LOCK');
  };

  const completeStage1 = () => {
    setCurrentScreen('STAGE2_ASTEROID_TUNNEL');
  };

  const completeStage2 = () => {
    setCurrentScreen('RESULTS_CARD');
  };

  const resetToAttract = () => {
    setMetrics(initialMetrics);
    setCurrentScreen('ATTRACT');
  };

  return (
    <GameContext.Provider
      value={{
        currentScreen,
        setScreen: setCurrentScreen,
        hardware,
        setHardware,
        latestGaze,
        latestControl,
        metrics,
        startKioskSession,
        completeStage1,
        completeStage2,
        resetToAttract,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
