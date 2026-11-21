type GazeSample = { ms: number; x: number; y: number; valid: boolean };
type StickSample = { t_us: number; x: number; y: number };
type Buzz = { n: number; t_buzz: number; acousticMs?: number };
type Region = { x: number; y: number; radiusX: number; radiusY: number };
type Capture = {
  syncErrorMs?: number;
  target: Region | null;
  buzzes: Buzz[];
  gaze: GazeSample[];
  stick: StickSample[];
};

const clockPeriod = 2 ** 32;
const baselineMs = 200;
const responseMs = 1200;
const maxGazeGap = 50;
const holdMs = 80;

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an object.');
  return value as Record<string, unknown>;
}

function number(value: unknown, label: string, min = -Infinity, max = Infinity) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error('Invalid ' + label + '.');
  }
  return value;
}

function boardTime(value: unknown, label: string) {
  const time = number(value, label, 0, clockPeriod - 1);
  if (!Number.isInteger(time)) throw new Error(label + ' must be an integer in microseconds.');
  return time;
}

function boardDelta(time: number, origin: number) {
  return ((time - origin + clockPeriod * 1.5) % clockPeriod - clockPeriod / 2) / 1000;
}

export function parseBuzzCapture(text: string): Capture {
  const file = record(JSON.parse(text));
  const target = file.target === undefined ? null : record(file.target);
  if (!Array.isArray(file.buzzes) || !file.buzzes.length || file.buzzes.length > 10) {
    throw new Error('Include the logged buzz records (1–10).');
  }
  if (file.gaze !== undefined && !Array.isArray(file.gaze)) throw new Error('Gaze must be an array.');
  if (file.stick !== undefined && !Array.isArray(file.stick)) throw new Error('Stick must be an array.');

  const buzzes: Buzz[] = file.buzzes.map((value) => {
    const item = record(value);
    const n = number(item.n, 'buzz number', 1, 10);
    if (!Number.isInteger(n)) throw new Error('Buzz number must be an integer.');
    return {
      n, t_buzz: boardTime(item.t_buzz, 't_buzz'),
      acousticMs: item.acousticMs === undefined ? undefined : number(item.acousticMs, 'acoustic onset'),
    };
  }).sort((a, b) => a.n - b.n);
  if (buzzes.some((buzz, index) => buzz.n !== index + 1)) throw new Error('Buzz numbers must be consecutive starting at 1.');
  const zero = buzzes[0].t_buzz;
  const times = buzzes.map((buzz) => buzz.acousticMs ?? boardDelta(buzz.t_buzz, zero));
  if (times.some((time, index) => index > 0 && time <= times[index - 1])) {
    throw new Error('Buzz onset times must be increasing.');
  }

  const gaze: GazeSample[] = (file.gaze ?? []).map((value) => {
    const item = record(value);
    if (typeof item.valid !== 'boolean') throw new Error('Each gaze sample needs a validity flag.');
    return {
      ms: number(item.ms, 'gaze time'), valid: item.valid,
      x: item.valid ? number(item.x, 'gaze x', 0, 1) : 0,
      y: item.valid ? number(item.y, 'gaze y', 0, 1) : 0,
    };
  }).sort((a: GazeSample, b: GazeSample) => a.ms - b.ms);
  if (gaze.some((sample, index) => index > 0 && sample.ms <= gaze[index - 1].ms)) {
    throw new Error('Gaze timestamps must be unique.');
  }
  if (gaze.length && (!target || file.syncErrorMs === undefined)) {
    throw new Error('Gaze data needs a fixed target and a measured syncErrorMs for the shared clock.');
  }

  return {
    buzzes, gaze,
    syncErrorMs: file.syncErrorMs === undefined ? undefined : number(file.syncErrorMs, 'sync uncertainty', 0, maxGazeGap),
    target: target && {
      x: number(target.x, 'target x', 0, 1), y: number(target.y, 'target y', 0, 1),
      radiusX: number(target.radiusX, 'target x radius', 0.001, 1),
      radiusY: number(target.radiusY, 'target y radius', 0.001, 1),
    },
    stick: (file.stick ?? []).map((value) => {
      const item = record(value);
      return { t_us: boardTime(item.t_us, 'stick timestamp'), x: number(item.x, 'stick x', -100, 100),
        y: number(item.y, 'stick y', -100, 100) };
    }),
  };
}

function analyzeGaze(samples: GazeSample[], target: Region | null, onset: number, end: number) {
  const missing = { outcome: 'Missing gaze', breakMs: null, refixationMs: null };
  if (!samples.length || !target) return missing;
  const onTarget = (sample: GazeSample) => Math.hypot(
    (sample.x - target.x) / target.radiusX, (sample.y - target.y) / target.radiusY,
  ) <= 1;
  const baseline = samples.filter(({ ms }) => ms >= onset - baselineMs && ms < onset);
  if (baseline.length === 0 || baseline[0].ms > onset - baselineMs + maxGazeGap ||
      onset - baseline[baseline.length - 1].ms > maxGazeGap ||
      baseline.some((s, i) => !s.valid || (i > 0 && s.ms - baseline[i - 1].ms > maxGazeGap))) {
    return { ...missing, outcome: 'Incomplete baseline' };
  }
  if (baseline.some((sample) => !onTarget(sample))) return { ...missing, outcome: 'Off target at baseline' };

  let previous = baseline[baseline.length - 1].ms;
  let firstAway: number | null = null;
  let departure: number | null = null;
  let returnStart: number | null = null;
  for (const sample of samples) {
    if (sample.ms < onset) continue;
    if (sample.ms >= end) break;
    if (!sample.valid || sample.ms - previous > maxGazeGap) {
      return { outcome: 'Gaze gap', breakMs: departure === null ? null : departure - onset, refixationMs: null };
    }
    previous = sample.ms;
    if (!onTarget(sample)) {
      if (firstAway !== null && departure === null) departure = firstAway;
      firstAway ??= sample.ms;
      returnStart = null;
    } else {
      firstAway = null;
      if (departure === null) continue;
      returnStart ??= sample.ms;
      if (sample.ms - returnStart >= holdMs) {
        return { outcome: 'Refixated', breakMs: departure - onset, refixationMs: returnStart - departure };
      }
    }
  }
  if (end - previous > maxGazeGap) {
    return { outcome: 'Gaze gap', breakMs: departure === null ? null : departure - onset, refixationMs: null };
  }
  return departure === null
    ? { outcome: 'No gaze break', breakMs: null, refixationMs: null }
    : { outcome: 'No return in window', breakMs: departure - onset, refixationMs: null };
}

function stickChange(samples: Array<StickSample & { ms: number }>, start: number, end: number) {
  let sum = 0;
  let pairs = 0;
  for (let index = 1; index < samples.length; index++) {
    const a = samples[index - 1];
    const b = samples[index];
    const gap = b.ms - a.ms;
    if (a.ms < start || b.ms >= end || gap < 12 || gap > 35) continue;
    sum += (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
    pairs++;
  }
  return pairs < 4 ? null : Math.sqrt(sum / pairs);
}

export function analyzeBuzzes(capture: Capture) {
  const zero = capture.buzzes[0].t_buzz;
  const stick = capture.stick.map((sample) => ({ ...sample, ms: boardDelta(sample.t_us, zero) }))
    .sort((a, b) => a.ms - b.ms);
  const onsets = capture.buzzes.map((buzz) => buzz.acousticMs ?? boardDelta(buzz.t_buzz, zero));
  return capture.buzzes.map((buzz, index) => {
    const onset = onsets[index];
    const end = Math.min(onset + responseMs, onsets[index + 1] ?? Infinity);
    return {
      ...buzz, ...analyzeGaze(capture.gaze, capture.target, onset, end),
      stickBefore: stickChange(stick, onset - baselineMs, onset),
      stickAfter: stickChange(stick, onset, Math.min(onset + baselineMs, end)),
    };
  });
}
