import { useState, useEffect, useRef } from 'react';

export interface EyeTrackingData {
  gazeX: number;             // Normalized 0.0 - 1.0 (0 = left, 1 = right)
  gazeY: number;             // Normalized 0.0 - 1.0 (0 = top, 1 = bottom)
  saccadeDetected: boolean;  // True when rapid eye snap occurs (<200ms)
  isBlinking: boolean;       // True during blink (coordinates hold steady)
  saccadicIntrusions: number; // Counter of erratic micro-jumps (DCD index)
  velocity: number;          // Gaze velocity
  timestampMs: number;       // Deterministic QNX RTOS timestamp
  connected: boolean;        // True when connected to Raspberry Pi 5 QNX engine
}

// Module-level persistent cache so coordinates NEVER get wiped on re-render
let cachedGaze: EyeTrackingData = {
  gazeX: 0.5,
  gazeY: 0.5,
  saccadeDetected: false,
  isBlinking: false,
  saccadicIntrusions: 0,
  velocity: 0,
  timestampMs: 0,
  connected: false,
};

export function useEyeTracking() {
  const [data, setData] = useState<EyeTrackingData>(cachedGaze);
  const activeRef = useRef(true);
  const failedStreak = useRef(0);

  useEffect(() => {
    activeRef.current = true;

    const interval = setInterval(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 800); // Generous 800ms timeout for network jitter

        let res = await fetch('http://localhost:8080/telemetry', { signal: controller.signal }).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch('/qnx/telemetry', { signal: controller.signal }).catch(() => null);
        }
        clearTimeout(timeoutId);

        if (!res || !res.ok) throw new Error('Bad response');
        const json = await res.json();

        failedStreak.current = 0;
        const nextData: EyeTrackingData = {
          gazeX: typeof json.gazeX === 'number' && Number.isFinite(json.gazeX) ? json.gazeX : cachedGaze.gazeX,
          gazeY: typeof json.gazeY === 'number' && Number.isFinite(json.gazeY) ? json.gazeY : cachedGaze.gazeY,
          saccadeDetected: Boolean(json.saccadeDetected),
          isBlinking: Boolean(json.isBlinking),
          saccadicIntrusions: typeof json.saccadicIntrusions === 'number' ? json.saccadicIntrusions : 0,
          velocity: typeof json.velocity === 'number' ? json.velocity : 0,
          timestampMs: typeof json.timestampMs === 'number' ? json.timestampMs : Date.now(),
          connected: true,
        };

        cachedGaze = nextData;
        if (activeRef.current) {
          setData(nextData);
        }
      } catch {
        failedStreak.current += 1;
        // Only mark disconnected after 10 consecutive dropped packets (>500ms outage)
        if (failedStreak.current > 10 && activeRef.current) {
          cachedGaze.connected = false;
          setData((prev) => ({ ...prev, connected: false }));
        }
      }
    }, 28); // ~35 Hz polling

    return () => {
      activeRef.current = false;
      clearInterval(interval);
    };
  }, []);

  return data;
}

export async function sendEyeCalibration(bounds: { minX: number; maxX: number; minY: number; maxY: number }) {
  try {
    await fetch('http://localhost:8080/calibrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bounds),
    });
  } catch {
    // If Pi offline, calibration holds locally
  }
}
