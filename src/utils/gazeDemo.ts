import { useSyncExternalStore } from 'react';

export type GazeDemo = 'darting' | 'steady';

let mode: GazeDemo | null = null;
const listeners = new Set<() => void>();

export function getGazeDemo() {
  return mode;
}

export function setGazeDemo(next: GazeDemo | null) {
  if (next === mode) return;
  mode = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useGazeDemo() {
  return useSyncExternalStore(subscribe, getGazeDemo);
}

const dartTargets = [
  [0.46, 0.44], [0.70, 0.52], [0.60, 0.30], [0.35, 0.57],
  [0.25, 0.43], [0.52, 0.70], [0.75, 0.62], [0.52, 0.38],
];

export function demoGaze(mode: GazeDemo, elapsed: number) {
  if (mode === 'steady') {
    return {
      gazeX: 0.5 + Math.sin(elapsed / 550) * 0.014,
      gazeY: 0.5 + Math.cos(elapsed / 710) * 0.012,
      saccadeDetected: false,
    };
  }

  const interval = 480;
  const [x, y] = dartTargets[Math.floor(elapsed / interval) % dartTargets.length];
  return {
    gazeX: x + Math.sin(elapsed / 65) * 0.012,
    gazeY: y + Math.cos(elapsed / 85) * 0.012,
    saccadeDetected: elapsed >= interval && elapsed % interval < 65,
  };
}
