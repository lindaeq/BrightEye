// Types for QNX RTOS Vision & Arduino Arcade Deck Telemetry

export type ScreenState = 
  | 'ATTRACT' 
  | 'CALIBRATION' 
  | 'STAGE1_TARGET_LOCK' 
  | 'STAGE2_ASTEROID_TUNNEL' 
  | 'RESULTS_CARD';

export interface QNXGazePacket {
  timestampMs: number;       // Deterministic QNX RTOS real-time clock timestamp
  gazeX: number;             // Normalized 0.0 - 1.0 screen coordinates
  gazeY: number;             // Normalized 0.0 - 1.0 screen coordinates
  saccadeDetected: boolean;  // Rapid eye snap detected (<200ms)
  confidence: number;        // Landmark tracking confidence 0-1
}

export interface ArduinoControlPacket {
  timestampMs: number;       // Arduino Uno Q timestamp
  joystickX: number;         // -1.0 to 1.0
  joystickY: number;         // -1.0 to 1.0
  buttonPressed: boolean;    // Tactile arcade fire button
  jitterMagnitude: number;   // Calculated micro-tremor variance
}

export interface TargetEvent {
  id: string;
  spawnTimeMs: number;
  x: number;
  y: number;
  isDecoy: boolean;          // Red flash decoy (ADHD impulse test)
  tEyeHitMs?: number;        // Millisecond eye snapped to target
  tHandHitMs?: number;       // Millisecond joystick trigger pressed
  reactionGapMs?: number;    // t_hand - t_eye
  success: boolean;
}

export interface NeuroMetrics {
  stage1: {
    totalTargets: number;
    hits: number;
    decoyErrors: number;     // False positives (pressed during red decoy)
    avgReactionGapMs: number; // Eye-to-Hand latency
    lastReactionGapMs: number;
    rawGaps: number[];
  };
  stage2: {
    saccadicIntrusions: number; // Jerky catch-up jumps during smooth pursuit
    tremorVariance: number;    // High-frequency jitter index (DCD/Dyspraxia)
    corridorAccuracy: number;  // Path tracking deviation percentage
    smoothPursuitRatio: number;
  };
  finalCard: {
    visualFocusScore: number;    // e.g. 92/100
    eyeToHandLatencyMs: number;  // e.g. 235 ms
    motorSteadinessPct: number;  // e.g. 94%
    cadetRank: string;           // e.g. "Sonic Cadet Master"
    clinicalFlags: {
      impulseControl: 'Normal' | 'Elevated Impulsivity' | 'High Decoy Triggers';
      motorTremor: 'Low Jitter' | 'Mild Intention Tremor' | 'Elevated Jitter';
      visualLatency: 'Sub-200ms Reflex' | 'Typical' | 'Saccadic Delay';
    };
  };
}

export interface HardwareConnectionState {
  qnxConnected: boolean;
  qnxRtosLatencyMs: number;   // QNX deterministic timing jitter (<1ms)
  arduinoConnected: boolean;
  baudRate: number;
  mockMode: boolean;          // For testing without physical hardware
}
