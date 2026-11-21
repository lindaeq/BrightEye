import type { RunTelemetry } from './runTelemetry';

export type OutlierLevel = 'unusual' | 'large';

export function flagRunOutliers(values: ReadonlyArray<number | null>): Array<OutlierLevel | null> {
  const samples = values.filter((value): value is number => value !== null && Number.isFinite(value)).sort((a, b) => a - b);
  if (samples.length < 8) return values.map(() => null);
  function quartile(fraction: number) {
    const index = (samples.length - 1) * fraction;
    const lower = Math.floor(index);
    return samples[lower] + (samples[Math.ceil(index)] - samples[lower]) * (index - lower);
  }
  const upper = quartile(0.75);
  const spread = upper - quartile(0.25);
  if (spread <= 0) return values.map(() => null);
  return values.map((value) => {
    if (value === null || !Number.isFinite(value)) return null;
    if (value > upper + 3 * spread) return 'large';
    return value > upper + 1.5 * spread ? 'unusual' : null;
  });
}

export function getRunReview(run: RunTelemetry) {
  const frames = run.comet.frames;
  const hits = run.target.events.filter(({ kind }) => kind === 'target-hit');
  const separation = frames.map(({ eye, player }) => eye
    ? Math.hypot(eye.x - player.x, eye.y - player.y) / Math.SQRT2 * 100 : null);
  const deviation = frames.map(({ trail }) => trail?.deviationPct ?? null);
  const response = hits.map(({ latencyMs }) => latencyMs ?? null);
  return {
    separation: { values: separation, flags: flagRunOutliers(separation) },
    deviation: { values: deviation, flags: flagRunOutliers(deviation) },
    response: { values: response, flags: flagRunOutliers(response) },
  };
}
