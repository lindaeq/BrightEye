import { useState, useEffect } from 'react';
import { demoGaze, useGazeDemo, type GazeDemo } from './gazeDemo';

declare const __QNX_TRACKER_ENABLED__: boolean;
export const eyeTrackerEnabled = __QNX_TRACKER_ENABLED__;

export interface EyeTrackingData {
  demoMode?: GazeDemo;
  rawX?: number;
  rawY?: number;
  gazeX: number;             // Normalized 0.0 - 1.0 (0 = left, 1 = right)
  gazeY: number;             // Normalized 0.0 - 1.0 (0 = top, 1 = bottom)
  saccadeDetected: boolean;  // True when rapid eye snap occurs (<200ms)
  isBlinking: boolean;       // True during blink (coordinates hold steady)
  saccadicIntrusions: number; // Counter of erratic micro-jumps (DCD index)
  velocity: number;          // Gaze velocity
  timestampMs: number;       // Deterministic QNX RTOS timestamp
  receivedAt: number;        // Browser monotonic clock, shared with gameplay
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
  receivedAt: -Infinity,
  connected: false,
};

export function liveGaze(sample: EyeTrackingData) {
  if (!sample.connected || sample.isBlinking || performance.now() - sample.receivedAt > 150) return null;
  return { x: sample.gazeX, y: sample.gazeY };
}

export function useEyeTracking() {
  const [data, setData] = useState<EyeTrackingData>(cachedGaze);
  const demoMode = useGazeDemo();
  useEffect(() => {
    if (demoMode) {
      const start = performance.now();
      function sample() {
        if (!demoMode) return;
        const now = performance.now();
        setData({
          ...demoGaze(demoMode, now - start),
          demoMode,
          isBlinking: false,
          saccadicIntrusions: 0,
          velocity: 0,
          timestampMs: now,
          receivedAt: now,
          connected: true,
        });
      }
      sample();
      const timer = window.setInterval(sample, 28);
      return () => window.clearInterval(timer);
    }
    setData(cachedGaze);
    if (!eyeTrackerEnabled) return;
    const lifetime = new AbortController();
    let timer: number;
    let lastFrameAt = cachedGaze.receivedAt;
    let timestamp = cachedGaze.timestampMs;
    async function poll() {
      try {
        const signal = AbortSignal.any([lifetime.signal, AbortSignal.timeout(800)]);
        const res = await fetch('/qnx/telemetry', { signal, cache: 'no-store' });
        if (!res.ok) throw new Error('Eye tracking telemetry unavailable');
        const json = await res.json();
        if (lifetime.signal.aborted) return;
        if (!Number.isFinite(json.timestampMs) || json.timestampMs <= 0
          || !Number.isFinite(json.gazeX) || !Number.isFinite(json.gazeY)) {
          throw new Error('No camera sample yet');
        }
        if (json.timestampMs !== timestamp) lastFrameAt = performance.now();
        timestamp = json.timestampMs;
        if (performance.now() - lastFrameAt > 800) throw new Error('Eye tracking frames are stale');
        const nextData: EyeTrackingData = {
          rawX: Number.isFinite(json.rawX) ? json.rawX : undefined,
          rawY: Number.isFinite(json.rawY) ? json.rawY : undefined,
          gazeX: json.gazeX,
          gazeY: json.gazeY,
          saccadeDetected: Boolean(json.saccadeDetected),
          isBlinking: Boolean(json.isBlinking),
          saccadicIntrusions: typeof json.saccadicIntrusions === 'number' ? json.saccadicIntrusions : 0,
          velocity: typeof json.velocity === 'number' ? json.velocity : 0,
          timestampMs: timestamp,
          receivedAt: lastFrameAt,
          connected: true,
        };

        cachedGaze = nextData;
        setData(nextData);
      } catch {
        if (!lifetime.signal.aborted && cachedGaze.connected && performance.now() - lastFrameAt >= 800) {
          cachedGaze = { ...cachedGaze, connected: false };
          setData(cachedGaze);
        }
      } finally {
        if (!lifetime.signal.aborted) timer = window.setTimeout(poll, cachedGaze.connected ? 28 : 250);
      }
    }
    void poll();

    return () => {
      lifetime.abort();
      window.clearTimeout(timer);
    };
  }, [demoMode]);

  return data.demoMode === (demoMode ?? undefined) ? data : { ...cachedGaze, connected: false };
}

export async function sendEyeCalibration(points: { rawX: number; rawY: number }[]) {
  const response = await fetch('/qnx/calibrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points }),
    signal: AbortSignal.timeout(3000),
  });
  const result = await response.json();
  if (!response.ok || result.status !== 'calibrated') {
    throw new Error(result.message || 'The tracker could not save calibration.');
  }
}
