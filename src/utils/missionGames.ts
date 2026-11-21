import type { Point } from './runTelemetry';

export const missionSeconds = 15;

export const corners = [
  { x: 0.20, y: 0.22, label: 'Top left' },
  { x: 0.80, y: 0.22, label: 'Top right' },
  { x: 0.20, y: 0.78, label: 'Bottom left' },
  { x: 0.80, y: 0.78, label: 'Bottom right' },
] as const;

export function quadrant(point: Point, deadBand = 0) {
  if (Math.abs(point.x - 0.5) < deadBand || Math.abs(point.y - 0.5) < deadBand) return null;
  return Number(point.x >= 0.5) + 2 * Number(point.y >= 0.5);
}

export const clampUnit = (value: number) => Math.max(0, Math.min(1, value));

export function shipHeading(dx: number, dy: number, field: { width: number; height: number }) {
  return Math.atan2(dy * field.height, dx * field.width) * 180 / Math.PI;
}
export const trailWidth = 1000;
export const trailHeight = 500;
export const trailRadius = 30;
export const trail = Array.from({ length: 121 }, (_, index) => {
  const t = index / 120;
  return { x: 0.09 + 0.82 * t, y: 0.5 + 0.25 * Math.sin(2.8 * Math.PI * t) };
});
export const checkpoints = [15, 32, 50, 69, 87, 104, 120].map((index) => trail[index]);
export const trailPoints = trail.map(({ x, y }) => `${x * trailWidth},${y * trailHeight}`).join(' ');
const trailOffsets = [0];
for (let i = 1; i < trail.length; i++) {
  trailOffsets.push(trailOffsets[i - 1] + trailDistance(trail[i - 1], trail[i]));
}

export function trailDistance(a: Point, b: Point) {
  return Math.hypot((a.x - b.x) * trailWidth, (a.y - b.y) * trailHeight);
}

export function projectOntoTrail(point: Point) {
  let distance = Infinity;
  let along = 0;
  for (let i = 1; i < trail.length; i++) {
    const start = trail[i - 1];
    const end = trail[i];
    const dx = (end.x - start.x) * trailWidth;
    const dy = (end.y - start.y) * trailHeight;
    const x = (point.x - start.x) * trailWidth;
    const y = (point.y - start.y) * trailHeight;
    const fraction = clampUnit((x * dx + y * dy) / (dx * dx + dy * dy));
    const error = Math.hypot(x - fraction * dx, y - fraction * dy);
    if (error < distance) {
      distance = error;
      along = trailOffsets[i - 1] + fraction * Math.hypot(dx, dy);
    }
  }
  return { distance, progress: along / trailOffsets[trailOffsets.length - 1] };
}

export const distractorSpots = Array.from({ length: 63 }, (_, index) => ({
  x: 0.1 + (index % 9) * 0.1,
  y: 0.12 + Math.floor(index / 9) * 0.125,
})).filter((point) => projectOntoTrail(point).distance >= trailRadius + 40);
